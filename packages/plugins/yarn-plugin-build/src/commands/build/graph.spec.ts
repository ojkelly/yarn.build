import { Graph } from "./graph";

describe("Simple dependency graph", () => {
  it("resolves the graph correctly", async () => {
    const graph = new Graph();

    const A = graph.addNode("A");
    const B = graph.addNode("B");
    const C = graph.addNode("C");
    const D = graph.addNode("D");
    const E = graph.addNode("E");

    A.addDependency(B);
    A.addDependency(D);
    B.addDependency(C);
    B.addDependency(E);
    C.addDependency(D);
    C.addDependency(E);

    await graph.resolve(A);
  });

  it("can detect cyclic dependencies", async () => {
    const graph = new Graph();

    const A = graph.addNode("A");
    const B = graph.addNode("B");
    const C = graph.addNode("C");
    const D = graph.addNode("D");
    const E = graph.addNode("E");

    A.addDependency(B);
    A.addDependency(D);
    B.addDependency(C);
    B.addDependency(E);
    C.addDependency(D);
    C.addDependency(E);

    // Circular
    D.addDependency(B);

    expect.assertions(2);

    try {
      await graph.resolve(A);
    } catch (err) {
      expect(err.message).toMatch("D has a cyclic dependency on B");
      expect(err.code).toMatch("YN0003");
    }
  });

  it("can find the optimal resolution path for a single target", async () => {
    const buildOrder: string[] = [];

    const graph = new Graph();

    const A = graph.addNode("A").addBuildCallback(async () => {
      buildOrder.push("A");
      return true;
    });
    const B = graph.addNode("B").addBuildCallback(async () => {
      buildOrder.push("B");
      return true;
    });
    const C = graph.addNode("C").addBuildCallback(async () => {
      buildOrder.push("C");
      return true;
    });
    const D = graph.addNode("D").addBuildCallback(async () => {
      buildOrder.push("D");
      return true;
    });
    const E = graph.addNode("E").addBuildCallback(async () => {
      buildOrder.push("E");
      return true;
    });

    A.addDependency(B);
    A.addDependency(D);
    B.addDependency(C);
    B.addDependency(E);
    C.addDependency(D);
    C.addDependency(E);

    await graph.build([A]);

    expect(buildOrder).toStrictEqual(["D", "E", "C", "B", "A"]);
  });

  it("can find the optimal resolution path for multiple root nodes", async () => {
    const buildOrder: string[] = [];

    const graph = new Graph();

    const nodes = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ].map((id) =>
      graph.addNode(id).addBuildCallback(async () => {
        buildOrder.push(id);
        return true;
      })
    );

    const [
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I,
      J,
      K,
      L,
      M,
      N,
      O,
      P,
      Q,
      R,
      S,
      T,
      U,
      V,
      W,
      X,
      Y,
      Z,
    ] = nodes;

    // root A
    A.addDependency(B);
    A.addDependency(D);
    B.addDependency(C);
    B.addDependency(E);
    C.addDependency(D);
    C.addDependency(E);

    // root F
    F.addDependency(G);
    F.addDependency(I);
    G.addDependency(H);
    G.addDependency(I);

    // root J
    J.addDependency(K);
    J.addDependency(M);
    K.addDependency(L);
    K.addDependency(M);

    // root N
    N.addDependency(O);
    N.addDependency(Q);
    O.addDependency(P);
    O.addDependency(Q);

    // root R
    R.addDependency(S);
    R.addDependency(U);
    S.addDependency(T);
    S.addDependency(U);
    U.addDependency(V);
    U.addDependency(X);
    V.addDependency(W);
    V.addDependency(Y);
    W.addDependency(X);
    W.addDependency(Y);
    W.addDependency(Z);

    await graph.build([A, F, J, N, R]);

    expect(buildOrder.sort()).toStrictEqual([
      ...new Set(nodes.map((n) => n.id)),
    ]);
  });
});
