import { Workspace } from "@yarnpkg/core";

class Graph {
  nodes: NodeGraph = {};
  size = 0;

  buildSize = 0;

  built: Set<string> = new Set();

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

  resetBuilds() {
    this.built = new Set();
  }

  async resolve(node: Node) {
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

  async build(nodes: Node[]): Promise<BuildLog> {
    const queue: Set<BuildQueueItem> = new Set<BuildQueueItem>();
    const progress: Set<Node> = new Set<Node>();

    const buildLog: BuildLog = {};

    for (const n of nodes) {
      // resolve the graph to allocate nodes to threads
      this.resolveQueue(n, queue, buildLog);
    }

    await new Promise((resolve) => {
      this.workLoop(queue, buildLog, progress, resolve);
    });

    return buildLog;
  }

  private workLoop(
    queue: Set<BuildQueueItem>,
    buildLog: BuildLog,
    progress: Set<Node>,
    resolve: () => void
  ) {
    if (queue.size !== 0) {
      queue.forEach((q) => {
        if (q.canStart(buildLog)) {
          if (q?.node?.buildCallback) {
            q?.node?.buildCallback(buildLog);

            progress.add(q.node);
          } else {
            buildLog[q.node.id] = { success: true, done: true };
          }

          queue.delete(q);
        }
      });
    }

    // need to wait for work to complete here
    progress.forEach((n, i) => {
      if (buildLog[n.id].done) {
        progress.delete(i);
      }
    });

    if (
      Object.keys(buildLog)
        .map((id) => buildLog[id]?.done ?? true)
        .every((v) => v === true)
    ) {
      resolve();
      return;
    }

    setTimeout(() => this.workLoop(queue, buildLog, progress, resolve), 30);
  }

  private resolveQueue(
    node: Node,
    queue: Set<BuildQueueItem>,
    buildLog: BuildLog
  ): string[] {
    const parentDependencies: string[] = [];
    for (const dep of node.dependencies) {
      parentDependencies.push(dep.id);
      if (!buildLog[dep.id] && dep.buildCallback) {
        buildLog[dep.id] = { ...Graph.BuildLogInit };
        const childDependencies = this.resolveQueue(dep, queue, buildLog);

        const queueItem: BuildQueueItem = {
          node: dep,
          canStart: Graph.QueueItemCanStart(childDependencies),
        };
        queue.add(queueItem);
      }
    }

    // parent item
    if (!buildLog[node.id] && node.buildCallback) {
      buildLog[node.id] = { ...Graph.BuildLogInit };

      const queueItem: BuildQueueItem = {
        node,
        canStart: Graph.QueueItemCanStart(parentDependencies),
      };

      queue.add(queueItem);
    }
    return parentDependencies;
  }

  private static BuildLogInit = { success: false, done: false };

  private static QueueItemCanStart = (dependencies: string[]) => (
    buildLog: BuildLog
  ): boolean => {
    return dependencies
      .map((id) => buildLog[id]?.done ?? true)
      .every((v) => v === true);
  };
}

type BuildThread = Promise<void>;

type BuildQueueItem = {
  node: Node;
  canStart: (buildLog: BuildLog) => boolean;
};

class Node {
  id: string;
  dependencies: Node[];
  graph: Graph;

  // metadata
  workspace?: Workspace;
  buildCallback?: BuildLogCallback;

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

  addBuildCallback(callback: BuildCallback): Node {
    if (this.buildCallback) {
      return this;
    }

    this.buildCallback = (buildLog: BuildLog) => {
      return callback().then((success) => {
        buildLog[this.id] = { done: true, success };
      });
    };
    this.graph.buildSize++;

    return this;
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

type BuildLog = { [id: string]: { success: boolean; done: boolean } };

type BuildSuccess = boolean;
type BuildCallback = () => Promise<BuildSuccess>;
type BuildLogCallback = (buildLog: BuildLog) => void;

type NodeGraph = {
  [id: string]: Node;
};

export { Graph, Node, CyclicDependencyError };
