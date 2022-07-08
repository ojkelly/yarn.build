import { Tracer, Context } from "@ojkelly/yarn-build-shared/src/tracing";

class Graph {
  tracer: Tracer = new Tracer("yarn.build");

  nodes: NodeGraph = {};

  size = 0;

  runSize = 0;

  ran: Set<string> = new Set();

  dryRunCallback: (node: Node, iteration: number) => void = () => {
    return;
  };

  // Create a new node with the ID, or retrieve the existing one
  addNode(id: string): Node {
    // If the Node already exists, return it
    if (this.nodes[id]) {
      return this.nodes[id];
    }

    // Otherwise make a new Node, store it, then return it
    const newNode = new Node(id);

    this.nodes[id] = newNode;

    this.size = Object.keys(this.nodes).length;

    this.checkCyclical(newNode);

    return newNode;
  }

  addRunCallback(node: Node, callback: RunCallback): void {
    let n = node;

    if (!this.nodes[node.id]) {
      n = this.addNode(node.id);
    }

    if (!n.runCallback) {
      n.addRunCallback(callback);
      this.runSize++;
    }
  }

  getNode(id: string): Node | void {
    if (this.nodes[id]) {
      return this.nodes[id];
    }
  }

  resetRuns(): void {
    this.ran = new Set();
  }

  checkCyclical(node: Node): void {
    // resolved and unresolved are local to this function
    // as they are only relevant to this resolution
    const resolved: Set<string> = new Set();
    const unresolved: Set<string> = new Set();

    this.resolveNode(node, resolved, unresolved);
  }

  private resolveNode(
    node: Node,
    resolved: Set<string>,
    unresolved: Set<string>
  ) {
    unresolved.add(node.id);

    Object.keys(node.dependencies).forEach((k) => {
      const dep = node.dependencies[k];

      if (!resolved.has(dep.id)) {
        if (unresolved.has(dep.id)) {
          throw new CyclicDependencyError(node.id, dep.id);
        }

        this.resolveNode(dep, resolved, unresolved);
      }
    });

    resolved.add(node.id);
    unresolved.delete(node.id);
  }

  async run(ctx: Context, nodes: Node[], dryRun = false): Promise<RunLog> {
    return await this.tracer.startSpan(
      { name: "run commands", ctx },
      async ({ ctx }) => {
        const queue: Set<RunQueueItem> = new Set<RunQueueItem>();
        const progress: Set<Node> = new Set<Node>();

        const runLog: RunLog = {};

        for (const n of nodes) {
          // resolve the graph to allocate nodes to threads
          this.resolveQueue(n, queue, runLog);
        }

        if (dryRun) {
          await this.dryRunLoop(queue, runLog, progress, 0);

          return runLog;
        }

        await new Promise<void>((resolve) => {
          this.workLoop(ctx, queue, runLog, progress, resolve);
        });

        return runLog;
      }
    );
  }

  private async dryRunLoop(
    queue: Set<RunQueueItem>,
    runLog: RunLog,
    progress: Set<Node>,
    iteration = 0
  ): Promise<void> {
    progress.forEach((n, i) => {
      this.dryRunCallback(n, iteration - 1); // this is always for the previous iteration
      runLog[n.id] = { success: true, done: true };

      progress.delete(i);
    });

    if (queue.size !== 0) {
      // Run everything that can be run now
      queue.forEach((q) => {
        if (q.canStart(runLog)) {
          if (q?.node?.runCallback) {
            progress.add(q.node);
            queue.delete(q);
          }
        }
      });
    }

    // Check if anything still needs to run
    if (progress.size != 0) {
      return await this.dryRunLoop(queue, runLog, progress, iteration + 1);
    }

    return;
  }

  private workLoop(
    ctx: Context,
    queue: Set<RunQueueItem>,
    runLog: RunLog,
    progress: Set<Node>,
    resolve: () => void
  ) {
    if (queue.size !== 0) {
      queue.forEach((q) => {
        if (q.canStart(runLog)) {
          if (q?.node?.runCallback) {
            q?.node?.runCallback(ctx, runLog);

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

    setTimeout(() => this.workLoop(ctx, queue, runLog, progress, resolve), 30);
  }

  private resolveQueue(
    node: Node,
    queue: Set<RunQueueItem>,
    runLog: RunLog
  ): string[] {
    const parentDependencies: string[] = [];

    Object.keys(node.dependencies).forEach((k) => {
      const dep = node.dependencies[k];

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
    });

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

  dependencies: NodeGraph;

  cancelled = false;

  skip = false;

  runCallback?: RunLogCallback;

  constructor(id: string) {
    this.id = id;
    this.dependencies = {};
  }

  addDependency(node: Node): Node {
    if (!this.dependencies[node.id]) {
      this.dependencies[node.id] = node;
    }

    return this;
  }

  addRunCallback(callback: RunCallback): Node {
    if (this.runCallback) {
      return this;
    }

    this.runCallback = (ctx: Context, runLog: RunLog) => {
      if (this.cancelled) {
        return;
      }

      return callback(ctx, Node.cancelDependentJobs(this)).then((success) => {
        runLog[this.id] = { done: true, success };
      });
    };

    return this;
  }

  static cancelDependentJobs(node: Node): () => void {
    return () => {
      if (typeof node.dependencies === `undefined`) {
        return;
      }

      Object.keys(node.dependencies).forEach((k) => {
        const v = node.dependencies[k];

        v.cancelled = true;
      });
    };
  }
}

class CyclicDependencyError extends Error {
  code: string;

  node: string;

  dep: string;

  constructor(_node: string, _dep: string) {
    super("");
    this.name = "CyclicDependencyError";
    this.code = "YN0003";
    this.node = _node;
    this.dep = _dep;
  }
}

type RunLog = { [id: string]: { success: boolean; done: boolean } };

type RunSuccess = boolean;
type RunCallback = (
  ctx: Context,
  cancelDependentJobs: () => void
) => Promise<RunSuccess>;
type RunLogCallback = (ctx: Context, runLog: RunLog) => void;

type NodeGraph = {
  [id: string]: Node;
};

export { Graph, Node, CyclicDependencyError, RunCallback };
