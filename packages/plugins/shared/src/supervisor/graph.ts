import { Workspace } from "@yarnpkg/core";

class Graph {
  nodes: NodeGraph = {};

  size = 0;

  runSize = 0;

  ran: Set<string> = new Set();

  // Create a new node with the ID, or retrieve the existing one
  addNode(id: string): Node {
    // If the Node already exists, return it
    if (this.nodes[id]) {
      return this.nodes[id];
    }

    // Otherwise make a new Node, store it, then return it
    const newNode = new Node(id, this);

    this.nodes[id] = newNode;

    this.size++;

    return newNode;
  }

  getNode(id: string): Node | void {
    if (this.nodes[id]) {
      return this.nodes[id];
    }
  }

  resetRuns(): void {
    this.ran = new Set();
  }

  async resolve(node: Node): Promise<void> {
    // resolved and unresolved are local to this function
    // as they are only relevant to this resolution
    const resolved: Set<string> = new Set();
    const unresolved: Set<string> = new Set();

    await this.resolveNode(node, resolved, unresolved);
  }

  private async resolveNode(
    node: Node,
    resolved: Set<string>,
    unresolved: Set<string>
  ) {
    unresolved.add(node.id);

    for (const dep of node.dependencies) {
      if (!resolved.has(dep.id)) {
        if (unresolved.has(dep.id)) {
          throw new CyclicDependencyError(
            `${node.id} has a cyclic dependency on ${dep.id}`
          );
        }

        await this.resolveNode(dep, resolved, unresolved);
      }
    }

    resolved.add(node.id);
    unresolved.delete(node.id);
  }

  async run(nodes: Node[]): Promise<RunLog> {
    const queue: Set<RunQueueItem> = new Set<RunQueueItem>();
    const progress: Set<Node> = new Set<Node>();

    const runLog: RunLog = {};

    for (const n of nodes) {
      // resolve the graph to allocate nodes to threads
      this.resolveQueue(n, queue, runLog);
    }

    await new Promise<void>((resolve) => {
      this.workLoop(queue, runLog, progress, resolve);
    });

    return runLog;
  }

  private workLoop(
    queue: Set<RunQueueItem>,
    runLog: RunLog,
    progress: Set<Node>,
    resolve: () => void
  ) {
    if (queue.size !== 0) {
      queue.forEach((q) => {
        if (q.canStart(runLog)) {
          if (q?.node?.runCallback) {
            q?.node?.runCallback(runLog);

            progress.add(q.node);
          } else {
            runLog[q.node.id] = { success: true, done: true };
          }

          queue.delete(q);
        }
      });
    }

    // need to wait for work to complete here
    progress.forEach((n, i) => {
      if (runLog[n.id].done) {
        progress.delete(i);
      }
    });

    if (
      Object.keys(runLog)
        .map((id) => runLog[id]?.done ?? true)
        .every((v) => v === true)
    ) {
      resolve();

      return;
    }

    setTimeout(() => this.workLoop(queue, runLog, progress, resolve), 30);
  }

  private resolveQueue(
    node: Node,
    queue: Set<RunQueueItem>,
    runLog: RunLog
  ): string[] {
    const parentDependencies: string[] = [];

    for (const dep of node.dependencies) {
      parentDependencies.push(dep.id);
      if (!runLog[dep.id] && dep.runCallback) {
        runLog[dep.id] = { ...Graph.RunLogInit };
        const childDependencies = this.resolveQueue(dep, queue, runLog);

        const queueItem: RunQueueItem = {
          node: dep,
          canStart: Graph.QueueItemCanStart(childDependencies),
        };

        queue.add(queueItem);
      }
    }

    // parent item
    if (!runLog[node.id] && node.runCallback) {
      runLog[node.id] = { ...Graph.RunLogInit };

      const queueItem: RunQueueItem = {
        node,
        canStart: Graph.QueueItemCanStart(parentDependencies),
      };

      queue.add(queueItem);
    }

    return parentDependencies;
  }

  private static RunLogInit = { success: false, done: false };

  private static QueueItemCanStart =
    (dependencies: string[]) =>
    (runLog: RunLog): boolean => {
      return dependencies
        .map((id) => runLog[id]?.done ?? true)
        .every((v) => v === true);
    };
}

type RunQueueItem = {
  node: Node;
  canStart: (runLog: RunLog) => boolean;
};

class Node {
  id: string;

  dependencies: Node[] = [];

  graph: Graph;

  // metadata
  workspace?: Workspace;

  cancelled = false;

  runCallback?: RunLogCallback;

  constructor(id: string, graph: Graph) {
    this.id = id;
    this.dependencies = [];
    this.graph = graph;
  }

  addDependency(node: Node): Node {
    this.dependencies.push(node);

    return this;
  }

  addWorkSpace(workspace: Workspace): Node {
    this.workspace = workspace;

    return this;
  }

  addRunCallback(callback: RunCallback): Node {
    if (this.runCallback) {
      return this;
    }

    this.runCallback = (runLog: RunLog) => {
      if (this.cancelled) {
        return;
      }

      return callback(Node.cancelDependentJobs(this)).then((success) => {
        runLog[this.id] = { done: true, success };
      });
    };
    this.graph.runSize++;

    return this;
  }

  static cancelDependentJobs(node: Node): () => void {
    return () => {
      if (typeof node.dependencies === `undefined`) {
        return;
      }
      for (const n of node.dependencies) {
        n.cancelled = true;
      }
    };
  }
}

class CyclicDependencyError extends Error {
  code: string;

  constructor(message: string) {
    super(message);
    this.name = "CyclicDependencyError";
    this.code = "YN0003";
  }
}

type RunLog = { [id: string]: { success: boolean; done: boolean } };

type RunSuccess = boolean;
type RunCallback = (cancelDependentJobs: () => void) => Promise<RunSuccess>;
type RunLogCallback = (runLog: RunLog) => void;

type NodeGraph = {
  [id: string]: Node;
};

export { Graph, Node, CyclicDependencyError, RunCallback };
