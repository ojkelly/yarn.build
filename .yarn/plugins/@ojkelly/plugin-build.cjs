/* eslint-disable */
module.exports = {
  name: "@yarnpkg/plugin-build",
  factory: function (require) {
    var plugin;
    plugin = (() => {
      var e = {
          103: (e, t, n) => {
            "use strict";
            n.r(t), n.d(t, { default: () => At });
            const r = require("@yarnpkg/cli"),
              i = require("@yarnpkg/core"),
              o = require("@yarnpkg/libzip"),
              s = require("@yarnpkg/fslib"),
              a = require("clipanion"),
              u = require("path");
            var c = n.n(u);
            class l extends r.BaseCommand {
              constructor() {
                super(...arguments),
                  (this.json = a.Option.Boolean("--json", !1, {
                    description:
                      "flag is set the output will follow a JSON-stream output also known as NDJSON (https://github.com/ndjson/ndjson-spec)",
                  })),
                  (this.outputDirectory = a.Option.String(
                    "-o,--output-directory",
                    {
                      description:
                        "sets the output directory, this should be outside your source input directory.",
                    }
                  )),
                  (this.archiveName = a.Option.String(
                    "-a,--archive-name",
                    "bundle.zip",
                    {
                      description:
                        "sets the name of the archive. Any files matching this, will be excluded from subsequent archives. Defaults to ./bundle.zip",
                    }
                  )),
                  (this.exclude = a.Option.Array("--exclude", {
                    arity: 1,
                    description:
                      "Exclude specific paths from the final bundle.",
                  }));
              }
              async removeUnusedPackages(e, t, n) {
                const { project: o, workspace: a } = await i.Project.find(n, t);
                if (!a) throw new r.WorkspaceRequiredError(o.cwd, t);
                const u = new Set([a]);
                for (const e of u)
                  for (const t of i.Manifest.hardDependencies)
                    for (const n of e.manifest.getForScope(t).values()) {
                      const e = o.tryWorkspaceByDescriptor(n);
                      null !== e && u.add(e);
                    }
                for (const t of o.workspaces)
                  u.has(t) ||
                    (t.cwd !== e && (await s.xfs.removePromise(t.cwd)));
              }
              async removeExcluded(e, t) {
                const n = e + "/.git";
                try {
                  (await s.xfs.lstatPromise(n)) &&
                    (await s.xfs.removePromise(n));
                } catch (e) {}
                await t.map(async (t) => {
                  t.startsWith(e) &&
                    (await s.xfs.lstatPromise(t)) &&
                    (await s.xfs.removePromise(t));
                });
              }
              async execute() {
                return await s.xfs.mktempPromise(async (e) => {
                  var t, n, a, u;
                  const l = "" + this.context.cwd,
                    d = s.ppath.join(l, this.archiveName),
                    h = await i.Configuration.find(
                      this.context.cwd,
                      this.context.plugins
                    );
                  if (null === h.projectCwd)
                    throw new Error("Can't find project directory");
                  const f = l.replace(h.projectCwd, ""),
                    g = new s.NodeFS();
                  await s.xfs.copyPromise(e, h.projectCwd, { baseFs: g });
                  const m = `${e}${f}`,
                    v = this.exclude || [],
                    b = `${m}/${this.archiveName}`;
                  try {
                    (await s.xfs.lstatPromise(b)) && v.push(b);
                  } catch (e) {}
                  await this.removeExcluded(e, v);
                  const y = await i.Configuration.find(m, this.context.plugins),
                    w = await i.Cache.find(y);
                  await this.removeUnusedPackages(e, m, y);
                  const { project: C, workspace: k } = await i.Project.find(
                    y,
                    m
                  );
                  if (!k) throw new r.WorkspaceRequiredError(C.cwd, m);
                  const x = new Set([k]);
                  for (const e of x)
                    for (const t of i.Manifest.hardDependencies)
                      for (const n of e.manifest.getForScope(t).values()) {
                        const e = C.tryWorkspaceByDescriptor(n);
                        null !== e && x.add(e);
                      }
                  for (const e of C.workspaces)
                    e.manifest.devDependencies.clear(),
                      x.has(e) ||
                        (e.manifest.dependencies.clear(),
                        e.manifest.peerDependencies.clear());
                  if (
                    null ===
                      (n =
                        null === (t = null == k ? void 0 : k.manifest) ||
                        void 0 === t
                          ? void 0
                          : t.raw) || void 0 === n
                      ? void 0
                      : n.main
                  ) {
                    const t =
                        k.relativeCwd +
                        c().sep +
                        (null ===
                          (u =
                            null === (a = null == k ? void 0 : k.manifest) ||
                            void 0 === a
                              ? void 0
                              : a.raw) || void 0 === u
                          ? void 0
                          : u.main),
                      n = "./.pnp.cjs";
                    s.xfs.writeFilePromise(
                      `${e}${c().sep}entrypoint.js`,
                      p(t, n)
                    );
                  }
                  return (
                    await i.StreamReport.start(
                      {
                        configuration: y,
                        json: this.json,
                        stdout: this.context.stdout,
                        includeLogs: !0,
                      },
                      async (t) => {
                        await C.install({ cache: w, report: t }),
                          t.reportInfo(null, "Getting libzip");
                        const n = await (0, o.getLibzipPromise)();
                        t.reportInfo(null, "Creating archive");
                        const r = new s.ZipFS(d, { create: !0, libzip: n });
                        t.reportInfo(null, "Copying files to archive"),
                          await r.copyPromise("bundle", e, { baseFs: g }),
                          r.saveAndClose(),
                          t.reportJson({
                            name: "ArchiveSuccess",
                            message: "Archive created successfuly at ",
                            outputArchive: d,
                          });
                      }
                    )
                  ).exitCode();
                });
              }
            }
            (l.paths = [["bundle"]]),
              (l.usage = a.Command.Usage({
                category: "Build commands",
                description:
                  "bundle a workspace package into a deployable archive",
                details:
                  "\n      This command will bundle up the source of the target package along with\n      its dependencies into an archive.\n\n      This is designed to be used for deployment, not for publishing, so\n      everything to run except for a runtime (ie node) is bundled into\n      the archive.\n\n      Call this after you have run your build step (if any).\n\n      This is designed to work best with zero-install configurations. If you\n      don't have that, run `yarn install` before this command.\n\n      Why not just compile like we do on the front-end?\n      Some dependencies may use require in interesting ways, or be or call\n      binaries. It's safest not to transpile them.\n    ",
              }));
            const p = (e, t) =>
                `\n"use strict";\n\nconst pnp = require("${t}").setup();\n\nconst index = require("./${e}");\n\nObject.defineProperty(exports, "__esModule", { value: true });\n\nexports.default = index;\n`,
              d = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
            function h({ test: e }) {
              return ((t = e), () => t)();
              var t;
            }
            function f(e) {
              return null === e
                ? "null"
                : void 0 === e
                ? "undefined"
                : "" === e
                ? "an empty string"
                : JSON.stringify(e);
            }
            function g(e, t) {
              var n, r, i;
              return "number" == typeof t
                ? `${
                    null !== (n = null == e ? void 0 : e.p) && void 0 !== n
                      ? n
                      : "."
                  }[${t}]`
                : d.test(t)
                ? `${
                    null !== (r = null == e ? void 0 : e.p) && void 0 !== r
                      ? r
                      : ""
                  }.${t}`
                : `${
                    null !== (i = null == e ? void 0 : e.p) && void 0 !== i
                      ? i
                      : "."
                  }[${JSON.stringify(t)}]`;
            }
            function m(e, t) {
              return (n) => {
                const r = e[t];
                return (e[t] = n), m(e, t).bind(null, r);
              };
            }
            function v(e, t) {
              return (n) => {
                e[t] = n;
              };
            }
            function b({ errors: e, p: t } = {}, n) {
              return null == e || e.push(`${null != t ? t : "."}: ${n}`), !1;
            }
            const y = () =>
              h({
                test: (e, t) =>
                  "string" == typeof e ||
                  b(t, `Expected a string (got ${f(e)})`),
              });
            new Map([
              ["true", !0],
              ["True", !0],
              ["1", !0],
              [1, !0],
              ["false", !1],
              ["False", !1],
              ["0", !1],
              [0, !1],
            ]);
            const w = (e, { extra: t = null } = {}) => {
              const n = Object.keys(e);
              return h({
                test: (r, i) => {
                  if ("object" != typeof r || null === r)
                    return b(i, `Expected an object (got ${f(r)})`);
                  const o = new Set([...n, ...Object.keys(r)]),
                    s = {};
                  let a = !0;
                  for (const n of o) {
                    if ("constructor" === n || "__proto__" === n)
                      a = b(
                        Object.assign(Object.assign({}, i), { p: g(i, n) }),
                        "Unsafe property name"
                      );
                    else {
                      const o = Object.prototype.hasOwnProperty.call(e, n)
                          ? e[n]
                          : void 0,
                        u = Object.prototype.hasOwnProperty.call(r, n)
                          ? r[n]
                          : void 0;
                      void 0 !== o
                        ? (a =
                            o(
                              u,
                              Object.assign(Object.assign({}, i), {
                                p: g(i, n),
                                coercion: m(r, n),
                              })
                            ) && a)
                        : null === t
                        ? (a = b(
                            Object.assign(Object.assign({}, i), { p: g(i, n) }),
                            `Extraneous property (got ${f(u)})`
                          ))
                        : Object.defineProperty(s, n, {
                            enumerable: !0,
                            get: () => u,
                            set: v(r, n),
                          });
                    }
                    if (!a && null == (null == i ? void 0 : i.errors)) break;
                  }
                  return (
                    null === t ||
                      (!a && null == (null == i ? void 0 : i.errors)) ||
                      (a = t(s, i) && a),
                    a
                  );
                },
              });
            };
            var C;
            !(function (e) {
              (e.Forbids = "Forbids"), (e.Requires = "Requires");
            })(C || (C = {}));
            C.Forbids, C.Requires;
            /*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
            function k(e) {
              return null == e;
            }
            var x = {
              isNothing: k,
              isObject: function (e) {
                return "object" == typeof e && null !== e;
              },
              toArray: function (e) {
                return Array.isArray(e) ? e : k(e) ? [] : [e];
              },
              repeat: function (e, t) {
                var n,
                  r = "";
                for (n = 0; n < t; n += 1) r += e;
                return r;
              },
              isNegativeZero: function (e) {
                return 0 === e && Number.NEGATIVE_INFINITY === 1 / e;
              },
              extend: function (e, t) {
                var n, r, i, o;
                if (t)
                  for (n = 0, r = (o = Object.keys(t)).length; n < r; n += 1)
                    e[(i = o[n])] = t[i];
                return e;
              },
            };
            function I(e, t) {
              var n = "",
                r = e.reason || "(unknown reason)";
              return e.mark
                ? (e.mark.name && (n += 'in "' + e.mark.name + '" '),
                  (n +=
                    "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")"),
                  !t && e.mark.snippet && (n += "\n\n" + e.mark.snippet),
                  r + " " + n)
                : r;
            }
            function _(e, t) {
              Error.call(this),
                (this.name = "YAMLException"),
                (this.reason = e),
                (this.mark = t),
                (this.message = I(this, !1)),
                Error.captureStackTrace
                  ? Error.captureStackTrace(this, this.constructor)
                  : (this.stack = new Error().stack || "");
            }
            (_.prototype = Object.create(Error.prototype)),
              (_.prototype.constructor = _),
              (_.prototype.toString = function (e) {
                return this.name + ": " + I(this, e);
              });
            var R = _;
            function S(e, t, n, r, i) {
              var o = "",
                s = "",
                a = Math.floor(i / 2) - 1;
              return (
                r - t > a && (t = r - a + (o = " ... ").length),
                n - r > a && (n = r + a - (s = " ...").length),
                {
                  str: o + e.slice(t, n).replace(/\t/g, "→") + s,
                  pos: r - t + o.length,
                }
              );
            }
            function A(e, t) {
              return x.repeat(" ", t - e.length) + e;
            }
            var E = function (e, t) {
                if (((t = Object.create(t || null)), !e.buffer)) return null;
                t.maxLength || (t.maxLength = 79),
                  "number" != typeof t.indent && (t.indent = 1),
                  "number" != typeof t.linesBefore && (t.linesBefore = 3),
                  "number" != typeof t.linesAfter && (t.linesAfter = 2);
                for (
                  var n, r = /\r?\n|\r|\0/g, i = [0], o = [], s = -1;
                  (n = r.exec(e.buffer));

                )
                  o.push(n.index),
                    i.push(n.index + n[0].length),
                    e.position <= n.index && s < 0 && (s = i.length - 2);
                s < 0 && (s = i.length - 1);
                var a,
                  u,
                  c = "",
                  l = Math.min(e.line + t.linesAfter, o.length).toString()
                    .length,
                  p = t.maxLength - (t.indent + l + 3);
                for (a = 1; a <= t.linesBefore && !(s - a < 0); a++)
                  (u = S(
                    e.buffer,
                    i[s - a],
                    o[s - a],
                    e.position - (i[s] - i[s - a]),
                    p
                  )),
                    (c =
                      x.repeat(" ", t.indent) +
                      A((e.line - a + 1).toString(), l) +
                      " | " +
                      u.str +
                      "\n" +
                      c);
                for (
                  u = S(e.buffer, i[s], o[s], e.position, p),
                    c +=
                      x.repeat(" ", t.indent) +
                      A((e.line + 1).toString(), l) +
                      " | " +
                      u.str +
                      "\n",
                    c += x.repeat("-", t.indent + l + 3 + u.pos) + "^\n",
                    a = 1;
                  a <= t.linesAfter && !(s + a >= o.length);
                  a++
                )
                  (u = S(
                    e.buffer,
                    i[s + a],
                    o[s + a],
                    e.position - (i[s] - i[s + a]),
                    p
                  )),
                    (c +=
                      x.repeat(" ", t.indent) +
                      A((e.line + a + 1).toString(), l) +
                      " | " +
                      u.str +
                      "\n");
                return c.replace(/\n$/, "");
              },
              O = [
                "kind",
                "multi",
                "resolve",
                "construct",
                "instanceOf",
                "predicate",
                "represent",
                "representName",
                "defaultStyle",
                "styleAliases",
              ],
              j = ["scalar", "sequence", "mapping"];
            var T = function (e, t) {
              if (
                ((t = t || {}),
                Object.keys(t).forEach(function (t) {
                  if (-1 === O.indexOf(t))
                    throw new R(
                      'Unknown option "' +
                        t +
                        '" is met in definition of "' +
                        e +
                        '" YAML type.'
                    );
                }),
                (this.options = t),
                (this.tag = e),
                (this.kind = t.kind || null),
                (this.resolve =
                  t.resolve ||
                  function () {
                    return !0;
                  }),
                (this.construct =
                  t.construct ||
                  function (e) {
                    return e;
                  }),
                (this.instanceOf = t.instanceOf || null),
                (this.predicate = t.predicate || null),
                (this.represent = t.represent || null),
                (this.representName = t.representName || null),
                (this.defaultStyle = t.defaultStyle || null),
                (this.multi = t.multi || !1),
                (this.styleAliases = (function (e) {
                  var t = {};
                  return (
                    null !== e &&
                      Object.keys(e).forEach(function (n) {
                        e[n].forEach(function (e) {
                          t[String(e)] = n;
                        });
                      }),
                    t
                  );
                })(t.styleAliases || null)),
                -1 === j.indexOf(this.kind))
              )
                throw new R(
                  'Unknown kind "' +
                    this.kind +
                    '" is specified for "' +
                    e +
                    '" YAML type.'
                );
            };
            function P(e, t) {
              var n = [];
              return (
                e[t].forEach(function (e) {
                  var t = n.length;
                  n.forEach(function (n, r) {
                    n.tag === e.tag &&
                      n.kind === e.kind &&
                      n.multi === e.multi &&
                      (t = r);
                  }),
                    (n[t] = e);
                }),
                n
              );
            }
            function $(e) {
              return this.extend(e);
            }
            $.prototype.extend = function (e) {
              var t = [],
                n = [];
              if (e instanceof T) n.push(e);
              else if (Array.isArray(e)) n = n.concat(e);
              else {
                if (
                  !e ||
                  (!Array.isArray(e.implicit) && !Array.isArray(e.explicit))
                )
                  throw new R(
                    "Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })"
                  );
                e.implicit && (t = t.concat(e.implicit)),
                  e.explicit && (n = n.concat(e.explicit));
              }
              t.forEach(function (e) {
                if (!(e instanceof T))
                  throw new R(
                    "Specified list of YAML types (or a single Type object) contains a non-Type object."
                  );
                if (e.loadKind && "scalar" !== e.loadKind)
                  throw new R(
                    "There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported."
                  );
                if (e.multi)
                  throw new R(
                    "There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit."
                  );
              }),
                n.forEach(function (e) {
                  if (!(e instanceof T))
                    throw new R(
                      "Specified list of YAML types (or a single Type object) contains a non-Type object."
                    );
                });
              var r = Object.create($.prototype);
              return (
                (r.implicit = (this.implicit || []).concat(t)),
                (r.explicit = (this.explicit || []).concat(n)),
                (r.compiledImplicit = P(r, "implicit")),
                (r.compiledExplicit = P(r, "explicit")),
                (r.compiledTypeMap = (function () {
                  var e,
                    t,
                    n = {
                      scalar: {},
                      sequence: {},
                      mapping: {},
                      fallback: {},
                      multi: {
                        scalar: [],
                        sequence: [],
                        mapping: [],
                        fallback: [],
                      },
                    };
                  function r(e) {
                    e.multi
                      ? (n.multi[e.kind].push(e), n.multi.fallback.push(e))
                      : (n[e.kind][e.tag] = n.fallback[e.tag] = e);
                  }
                  for (e = 0, t = arguments.length; e < t; e += 1)
                    arguments[e].forEach(r);
                  return n;
                })(r.compiledImplicit, r.compiledExplicit)),
                r
              );
            };
            var M = $,
              L = new T("tag:yaml.org,2002:str", {
                kind: "scalar",
                construct: function (e) {
                  return null !== e ? e : "";
                },
              }),
              N = new T("tag:yaml.org,2002:seq", {
                kind: "sequence",
                construct: function (e) {
                  return null !== e ? e : [];
                },
              }),
              U = new T("tag:yaml.org,2002:map", {
                kind: "mapping",
                construct: function (e) {
                  return null !== e ? e : {};
                },
              }),
              B = new M({ explicit: [L, N, U] });
            var D = new T("tag:yaml.org,2002:null", {
              kind: "scalar",
              resolve: function (e) {
                if (null === e) return !0;
                var t = e.length;
                return (
                  (1 === t && "~" === e) ||
                  (4 === t && ("null" === e || "Null" === e || "NULL" === e))
                );
              },
              construct: function () {
                return null;
              },
              predicate: function (e) {
                return null === e;
              },
              represent: {
                canonical: function () {
                  return "~";
                },
                lowercase: function () {
                  return "null";
                },
                uppercase: function () {
                  return "NULL";
                },
                camelcase: function () {
                  return "Null";
                },
                empty: function () {
                  return "";
                },
              },
              defaultStyle: "lowercase",
            });
            var q = new T("tag:yaml.org,2002:bool", {
              kind: "scalar",
              resolve: function (e) {
                if (null === e) return !1;
                var t = e.length;
                return (
                  (4 === t && ("true" === e || "True" === e || "TRUE" === e)) ||
                  (5 === t && ("false" === e || "False" === e || "FALSE" === e))
                );
              },
              construct: function (e) {
                return "true" === e || "True" === e || "TRUE" === e;
              },
              predicate: function (e) {
                return "[object Boolean]" === Object.prototype.toString.call(e);
              },
              represent: {
                lowercase: function (e) {
                  return e ? "true" : "false";
                },
                uppercase: function (e) {
                  return e ? "TRUE" : "FALSE";
                },
                camelcase: function (e) {
                  return e ? "True" : "False";
                },
              },
              defaultStyle: "lowercase",
            });
            function F(e) {
              return 48 <= e && e <= 55;
            }
            function z(e) {
              return 48 <= e && e <= 57;
            }
            var W = new T("tag:yaml.org,2002:int", {
                kind: "scalar",
                resolve: function (e) {
                  if (null === e) return !1;
                  var t,
                    n,
                    r = e.length,
                    i = 0,
                    o = !1;
                  if (!r) return !1;
                  if (
                    (("-" !== (t = e[i]) && "+" !== t) || (t = e[++i]),
                    "0" === t)
                  ) {
                    if (i + 1 === r) return !0;
                    if ("b" === (t = e[++i])) {
                      for (i++; i < r; i++)
                        if ("_" !== (t = e[i])) {
                          if ("0" !== t && "1" !== t) return !1;
                          o = !0;
                        }
                      return o && "_" !== t;
                    }
                    if ("x" === t) {
                      for (i++; i < r; i++)
                        if ("_" !== (t = e[i])) {
                          if (
                            !(
                              (48 <= (n = e.charCodeAt(i)) && n <= 57) ||
                              (65 <= n && n <= 70) ||
                              (97 <= n && n <= 102)
                            )
                          )
                            return !1;
                          o = !0;
                        }
                      return o && "_" !== t;
                    }
                    if ("o" === t) {
                      for (i++; i < r; i++)
                        if ("_" !== (t = e[i])) {
                          if (!F(e.charCodeAt(i))) return !1;
                          o = !0;
                        }
                      return o && "_" !== t;
                    }
                  }
                  if ("_" === t) return !1;
                  for (; i < r; i++)
                    if ("_" !== (t = e[i])) {
                      if (!z(e.charCodeAt(i))) return !1;
                      o = !0;
                    }
                  return !(!o || "_" === t);
                },
                construct: function (e) {
                  var t,
                    n = e,
                    r = 1;
                  if (
                    (-1 !== n.indexOf("_") && (n = n.replace(/_/g, "")),
                    ("-" !== (t = n[0]) && "+" !== t) ||
                      ("-" === t && (r = -1), (t = (n = n.slice(1))[0])),
                    "0" === n)
                  )
                    return 0;
                  if ("0" === t) {
                    if ("b" === n[1]) return r * parseInt(n.slice(2), 2);
                    if ("x" === n[1]) return r * parseInt(n.slice(2), 16);
                    if ("o" === n[1]) return r * parseInt(n.slice(2), 8);
                  }
                  return r * parseInt(n, 10);
                },
                predicate: function (e) {
                  return (
                    "[object Number]" === Object.prototype.toString.call(e) &&
                    e % 1 == 0 &&
                    !x.isNegativeZero(e)
                  );
                },
                represent: {
                  binary: function (e) {
                    return e >= 0
                      ? "0b" + e.toString(2)
                      : "-0b" + e.toString(2).slice(1);
                  },
                  octal: function (e) {
                    return e >= 0
                      ? "0o" + e.toString(8)
                      : "-0o" + e.toString(8).slice(1);
                  },
                  decimal: function (e) {
                    return e.toString(10);
                  },
                  hexadecimal: function (e) {
                    return e >= 0
                      ? "0x" + e.toString(16).toUpperCase()
                      : "-0x" + e.toString(16).toUpperCase().slice(1);
                  },
                },
                defaultStyle: "decimal",
                styleAliases: {
                  binary: [2, "bin"],
                  octal: [8, "oct"],
                  decimal: [10, "dec"],
                  hexadecimal: [16, "hex"],
                },
              }),
              Y = new RegExp(
                "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
              );
            var G = /^[-+]?[0-9]+e/;
            var Q = new T("tag:yaml.org,2002:float", {
                kind: "scalar",
                resolve: function (e) {
                  return null !== e && !(!Y.test(e) || "_" === e[e.length - 1]);
                },
                construct: function (e) {
                  var t, n;
                  return (
                    (n =
                      "-" === (t = e.replace(/_/g, "").toLowerCase())[0]
                        ? -1
                        : 1),
                    "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)),
                    ".inf" === t
                      ? 1 === n
                        ? Number.POSITIVE_INFINITY
                        : Number.NEGATIVE_INFINITY
                      : ".nan" === t
                      ? NaN
                      : n * parseFloat(t, 10)
                  );
                },
                predicate: function (e) {
                  return (
                    "[object Number]" === Object.prototype.toString.call(e) &&
                    (e % 1 != 0 || x.isNegativeZero(e))
                  );
                },
                represent: function (e, t) {
                  var n;
                  if (isNaN(e))
                    switch (t) {
                      case "lowercase":
                        return ".nan";
                      case "uppercase":
                        return ".NAN";
                      case "camelcase":
                        return ".NaN";
                    }
                  else if (Number.POSITIVE_INFINITY === e)
                    switch (t) {
                      case "lowercase":
                        return ".inf";
                      case "uppercase":
                        return ".INF";
                      case "camelcase":
                        return ".Inf";
                    }
                  else if (Number.NEGATIVE_INFINITY === e)
                    switch (t) {
                      case "lowercase":
                        return "-.inf";
                      case "uppercase":
                        return "-.INF";
                      case "camelcase":
                        return "-.Inf";
                    }
                  else if (x.isNegativeZero(e)) return "-0.0";
                  return (
                    (n = e.toString(10)), G.test(n) ? n.replace("e", ".e") : n
                  );
                },
                defaultStyle: "lowercase",
              }),
              H = B.extend({ implicit: [D, q, W, Q] }),
              J = H,
              K = new RegExp(
                "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
              ),
              V = new RegExp(
                "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
              );
            var Z = new T("tag:yaml.org,2002:timestamp", {
              kind: "scalar",
              resolve: function (e) {
                return null !== e && (null !== K.exec(e) || null !== V.exec(e));
              },
              construct: function (e) {
                var t,
                  n,
                  r,
                  i,
                  o,
                  s,
                  a,
                  u,
                  c = 0,
                  l = null;
                if ((null === (t = K.exec(e)) && (t = V.exec(e)), null === t))
                  throw new Error("Date resolve error");
                if (((n = +t[1]), (r = +t[2] - 1), (i = +t[3]), !t[4]))
                  return new Date(Date.UTC(n, r, i));
                if (((o = +t[4]), (s = +t[5]), (a = +t[6]), t[7])) {
                  for (c = t[7].slice(0, 3); c.length < 3; ) c += "0";
                  c = +c;
                }
                return (
                  t[9] &&
                    ((l = 6e4 * (60 * +t[10] + +(t[11] || 0))),
                    "-" === t[9] && (l = -l)),
                  (u = new Date(Date.UTC(n, r, i, o, s, a, c))),
                  l && u.setTime(u.getTime() - l),
                  u
                );
              },
              instanceOf: Date,
              represent: function (e) {
                return e.toISOString();
              },
            });
            var X = new T("tag:yaml.org,2002:merge", {
                kind: "scalar",
                resolve: function (e) {
                  return "<<" === e || null === e;
                },
              }),
              ee =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
            var te = new T("tag:yaml.org,2002:binary", {
                kind: "scalar",
                resolve: function (e) {
                  if (null === e) return !1;
                  var t,
                    n,
                    r = 0,
                    i = e.length,
                    o = ee;
                  for (n = 0; n < i; n++)
                    if (!((t = o.indexOf(e.charAt(n))) > 64)) {
                      if (t < 0) return !1;
                      r += 6;
                    }
                  return r % 8 == 0;
                },
                construct: function (e) {
                  var t,
                    n,
                    r = e.replace(/[\r\n=]/g, ""),
                    i = r.length,
                    o = ee,
                    s = 0,
                    a = [];
                  for (t = 0; t < i; t++)
                    t % 4 == 0 &&
                      t &&
                      (a.push((s >> 16) & 255),
                      a.push((s >> 8) & 255),
                      a.push(255 & s)),
                      (s = (s << 6) | o.indexOf(r.charAt(t)));
                  return (
                    0 === (n = (i % 4) * 6)
                      ? (a.push((s >> 16) & 255),
                        a.push((s >> 8) & 255),
                        a.push(255 & s))
                      : 18 === n
                      ? (a.push((s >> 10) & 255), a.push((s >> 2) & 255))
                      : 12 === n && a.push((s >> 4) & 255),
                    new Uint8Array(a)
                  );
                },
                predicate: function (e) {
                  return (
                    "[object Uint8Array]" === Object.prototype.toString.call(e)
                  );
                },
                represent: function (e) {
                  var t,
                    n,
                    r = "",
                    i = 0,
                    o = e.length,
                    s = ee;
                  for (t = 0; t < o; t++)
                    t % 3 == 0 &&
                      t &&
                      ((r += s[(i >> 18) & 63]),
                      (r += s[(i >> 12) & 63]),
                      (r += s[(i >> 6) & 63]),
                      (r += s[63 & i])),
                      (i = (i << 8) + e[t]);
                  return (
                    0 === (n = o % 3)
                      ? ((r += s[(i >> 18) & 63]),
                        (r += s[(i >> 12) & 63]),
                        (r += s[(i >> 6) & 63]),
                        (r += s[63 & i]))
                      : 2 === n
                      ? ((r += s[(i >> 10) & 63]),
                        (r += s[(i >> 4) & 63]),
                        (r += s[(i << 2) & 63]),
                        (r += s[64]))
                      : 1 === n &&
                        ((r += s[(i >> 2) & 63]),
                        (r += s[(i << 4) & 63]),
                        (r += s[64]),
                        (r += s[64])),
                    r
                  );
                },
              }),
              ne = Object.prototype.hasOwnProperty,
              re = Object.prototype.toString;
            var ie = new T("tag:yaml.org,2002:omap", {
                kind: "sequence",
                resolve: function (e) {
                  if (null === e) return !0;
                  var t,
                    n,
                    r,
                    i,
                    o,
                    s = [],
                    a = e;
                  for (t = 0, n = a.length; t < n; t += 1) {
                    if (
                      ((r = a[t]), (o = !1), "[object Object]" !== re.call(r))
                    )
                      return !1;
                    for (i in r)
                      if (ne.call(r, i)) {
                        if (o) return !1;
                        o = !0;
                      }
                    if (!o) return !1;
                    if (-1 !== s.indexOf(i)) return !1;
                    s.push(i);
                  }
                  return !0;
                },
                construct: function (e) {
                  return null !== e ? e : [];
                },
              }),
              oe = Object.prototype.toString;
            var se = new T("tag:yaml.org,2002:pairs", {
                kind: "sequence",
                resolve: function (e) {
                  if (null === e) return !0;
                  var t,
                    n,
                    r,
                    i,
                    o,
                    s = e;
                  for (
                    o = new Array(s.length), t = 0, n = s.length;
                    t < n;
                    t += 1
                  ) {
                    if (((r = s[t]), "[object Object]" !== oe.call(r)))
                      return !1;
                    if (1 !== (i = Object.keys(r)).length) return !1;
                    o[t] = [i[0], r[i[0]]];
                  }
                  return !0;
                },
                construct: function (e) {
                  if (null === e) return [];
                  var t,
                    n,
                    r,
                    i,
                    o,
                    s = e;
                  for (
                    o = new Array(s.length), t = 0, n = s.length;
                    t < n;
                    t += 1
                  )
                    (r = s[t]), (i = Object.keys(r)), (o[t] = [i[0], r[i[0]]]);
                  return o;
                },
              }),
              ae = Object.prototype.hasOwnProperty;
            var ue = new T("tag:yaml.org,2002:set", {
                kind: "mapping",
                resolve: function (e) {
                  if (null === e) return !0;
                  var t,
                    n = e;
                  for (t in n) if (ae.call(n, t) && null !== n[t]) return !1;
                  return !0;
                },
                construct: function (e) {
                  return null !== e ? e : {};
                },
              }),
              ce = J.extend({ implicit: [Z, X], explicit: [te, ie, se, ue] }),
              le = Object.prototype.hasOwnProperty,
              pe = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,
              de = /[\x85\u2028\u2029]/,
              he = /[,\[\]\{\}]/,
              fe = /^(?:!|!!|![a-z\-]+!)$/i,
              ge = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
            function me(e) {
              return Object.prototype.toString.call(e);
            }
            function ve(e) {
              return 10 === e || 13 === e;
            }
            function be(e) {
              return 9 === e || 32 === e;
            }
            function ye(e) {
              return 9 === e || 32 === e || 10 === e || 13 === e;
            }
            function we(e) {
              return 44 === e || 91 === e || 93 === e || 123 === e || 125 === e;
            }
            function Ce(e) {
              var t;
              return 48 <= e && e <= 57
                ? e - 48
                : 97 <= (t = 32 | e) && t <= 102
                ? t - 97 + 10
                : -1;
            }
            function ke(e) {
              return 48 === e
                ? "\0"
                : 97 === e
                ? ""
                : 98 === e
                ? "\b"
                : 116 === e || 9 === e
                ? "\t"
                : 110 === e
                ? "\n"
                : 118 === e
                ? "\v"
                : 102 === e
                ? "\f"
                : 114 === e
                ? "\r"
                : 101 === e
                ? ""
                : 32 === e
                ? " "
                : 34 === e
                ? '"'
                : 47 === e
                ? "/"
                : 92 === e
                ? "\\"
                : 78 === e
                ? ""
                : 95 === e
                ? " "
                : 76 === e
                ? "\u2028"
                : 80 === e
                ? "\u2029"
                : "";
            }
            function xe(e) {
              return e <= 65535
                ? String.fromCharCode(e)
                : String.fromCharCode(
                    55296 + ((e - 65536) >> 10),
                    56320 + ((e - 65536) & 1023)
                  );
            }
            for (
              var Ie = new Array(256), _e = new Array(256), Re = 0;
              Re < 256;
              Re++
            )
              (Ie[Re] = ke(Re) ? 1 : 0), (_e[Re] = ke(Re));
            function Se(e, t) {
              (this.input = e),
                (this.filename = t.filename || null),
                (this.schema = t.schema || ce),
                (this.onWarning = t.onWarning || null),
                (this.legacy = t.legacy || !1),
                (this.json = t.json || !1),
                (this.listener = t.listener || null),
                (this.implicitTypes = this.schema.compiledImplicit),
                (this.typeMap = this.schema.compiledTypeMap),
                (this.length = e.length),
                (this.position = 0),
                (this.line = 0),
                (this.lineStart = 0),
                (this.lineIndent = 0),
                (this.firstTabInLine = -1),
                (this.documents = []);
            }
            function Ae(e, t) {
              var n = {
                name: e.filename,
                buffer: e.input.slice(0, -1),
                position: e.position,
                line: e.line,
                column: e.position - e.lineStart,
              };
              return (n.snippet = E(n)), new R(t, n);
            }
            function Ee(e, t) {
              throw Ae(e, t);
            }
            function Oe(e, t) {
              e.onWarning && e.onWarning.call(null, Ae(e, t));
            }
            var je = {
              YAML: function (e, t, n) {
                var r, i, o;
                null !== e.version && Ee(e, "duplication of %YAML directive"),
                  1 !== n.length &&
                    Ee(e, "YAML directive accepts exactly one argument"),
                  null === (r = /^([0-9]+)\.([0-9]+)$/.exec(n[0])) &&
                    Ee(e, "ill-formed argument of the YAML directive"),
                  (i = parseInt(r[1], 10)),
                  (o = parseInt(r[2], 10)),
                  1 !== i && Ee(e, "unacceptable YAML version of the document"),
                  (e.version = n[0]),
                  (e.checkLineBreaks = o < 2),
                  1 !== o &&
                    2 !== o &&
                    Oe(e, "unsupported YAML version of the document");
              },
              TAG: function (e, t, n) {
                var r, i;
                2 !== n.length &&
                  Ee(e, "TAG directive accepts exactly two arguments"),
                  (r = n[0]),
                  (i = n[1]),
                  fe.test(r) ||
                    Ee(
                      e,
                      "ill-formed tag handle (first argument) of the TAG directive"
                    ),
                  le.call(e.tagMap, r) &&
                    Ee(
                      e,
                      'there is a previously declared suffix for "' +
                        r +
                        '" tag handle'
                    ),
                  ge.test(i) ||
                    Ee(
                      e,
                      "ill-formed tag prefix (second argument) of the TAG directive"
                    );
                try {
                  i = decodeURIComponent(i);
                } catch (t) {
                  Ee(e, "tag prefix is malformed: " + i);
                }
                e.tagMap[r] = i;
              },
            };
            function Te(e, t, n, r) {
              var i, o, s, a;
              if (t < n) {
                if (((a = e.input.slice(t, n)), r))
                  for (i = 0, o = a.length; i < o; i += 1)
                    9 === (s = a.charCodeAt(i)) ||
                      (32 <= s && s <= 1114111) ||
                      Ee(e, "expected valid JSON character");
                else
                  pe.test(a) &&
                    Ee(e, "the stream contains non-printable characters");
                e.result += a;
              }
            }
            function Pe(e, t, n, r) {
              var i, o, s, a;
              for (
                x.isObject(n) ||
                  Ee(
                    e,
                    "cannot merge mappings; the provided source object is unacceptable"
                  ),
                  s = 0,
                  a = (i = Object.keys(n)).length;
                s < a;
                s += 1
              )
                (o = i[s]), le.call(t, o) || ((t[o] = n[o]), (r[o] = !0));
            }
            function $e(e, t, n, r, i, o, s, a, u) {
              var c, l;
              if (Array.isArray(i))
                for (
                  c = 0, l = (i = Array.prototype.slice.call(i)).length;
                  c < l;
                  c += 1
                )
                  Array.isArray(i[c]) &&
                    Ee(e, "nested arrays are not supported inside keys"),
                    "object" == typeof i &&
                      "[object Object]" === me(i[c]) &&
                      (i[c] = "[object Object]");
              if (
                ("object" == typeof i &&
                  "[object Object]" === me(i) &&
                  (i = "[object Object]"),
                (i = String(i)),
                null === t && (t = {}),
                "tag:yaml.org,2002:merge" === r)
              )
                if (Array.isArray(o))
                  for (c = 0, l = o.length; c < l; c += 1) Pe(e, t, o[c], n);
                else Pe(e, t, o, n);
              else
                e.json ||
                  le.call(n, i) ||
                  !le.call(t, i) ||
                  ((e.line = s || e.line),
                  (e.lineStart = a || e.lineStart),
                  (e.position = u || e.position),
                  Ee(e, "duplicated mapping key")),
                  "__proto__" === i
                    ? Object.defineProperty(t, i, {
                        configurable: !0,
                        enumerable: !0,
                        writable: !0,
                        value: o,
                      })
                    : (t[i] = o),
                  delete n[i];
              return t;
            }
            function Me(e) {
              var t;
              10 === (t = e.input.charCodeAt(e.position))
                ? e.position++
                : 13 === t
                ? (e.position++,
                  10 === e.input.charCodeAt(e.position) && e.position++)
                : Ee(e, "a line break is expected"),
                (e.line += 1),
                (e.lineStart = e.position),
                (e.firstTabInLine = -1);
            }
            function Le(e, t, n) {
              for (var r = 0, i = e.input.charCodeAt(e.position); 0 !== i; ) {
                for (; be(i); )
                  9 === i &&
                    -1 === e.firstTabInLine &&
                    (e.firstTabInLine = e.position),
                    (i = e.input.charCodeAt(++e.position));
                if (t && 35 === i)
                  do {
                    i = e.input.charCodeAt(++e.position);
                  } while (10 !== i && 13 !== i && 0 !== i);
                if (!ve(i)) break;
                for (
                  Me(e),
                    i = e.input.charCodeAt(e.position),
                    r++,
                    e.lineIndent = 0;
                  32 === i;

                )
                  e.lineIndent++, (i = e.input.charCodeAt(++e.position));
              }
              return (
                -1 !== n &&
                  0 !== r &&
                  e.lineIndent < n &&
                  Oe(e, "deficient indentation"),
                r
              );
            }
            function Ne(e) {
              var t,
                n = e.position;
              return !(
                (45 !== (t = e.input.charCodeAt(n)) && 46 !== t) ||
                t !== e.input.charCodeAt(n + 1) ||
                t !== e.input.charCodeAt(n + 2) ||
                ((n += 3), 0 !== (t = e.input.charCodeAt(n)) && !ye(t))
              );
            }
            function Ue(e, t) {
              1 === t
                ? (e.result += " ")
                : t > 1 && (e.result += x.repeat("\n", t - 1));
            }
            function Be(e, t) {
              var n,
                r,
                i = e.tag,
                o = e.anchor,
                s = [],
                a = !1;
              if (-1 !== e.firstTabInLine) return !1;
              for (
                null !== e.anchor && (e.anchorMap[e.anchor] = s),
                  r = e.input.charCodeAt(e.position);
                0 !== r &&
                (-1 !== e.firstTabInLine &&
                  ((e.position = e.firstTabInLine),
                  Ee(e, "tab characters must not be used in indentation")),
                45 === r) &&
                ye(e.input.charCodeAt(e.position + 1));

              )
                if (
                  ((a = !0), e.position++, Le(e, !0, -1) && e.lineIndent <= t)
                )
                  s.push(null), (r = e.input.charCodeAt(e.position));
                else if (
                  ((n = e.line),
                  Fe(e, t, 3, !1, !0),
                  s.push(e.result),
                  Le(e, !0, -1),
                  (r = e.input.charCodeAt(e.position)),
                  (e.line === n || e.lineIndent > t) && 0 !== r)
                )
                  Ee(e, "bad indentation of a sequence entry");
                else if (e.lineIndent < t) break;
              return (
                !!a &&
                ((e.tag = i),
                (e.anchor = o),
                (e.kind = "sequence"),
                (e.result = s),
                !0)
              );
            }
            function De(e) {
              var t,
                n,
                r,
                i,
                o = !1,
                s = !1;
              if (33 !== (i = e.input.charCodeAt(e.position))) return !1;
              if (
                (null !== e.tag && Ee(e, "duplication of a tag property"),
                60 === (i = e.input.charCodeAt(++e.position))
                  ? ((o = !0), (i = e.input.charCodeAt(++e.position)))
                  : 33 === i
                  ? ((s = !0),
                    (n = "!!"),
                    (i = e.input.charCodeAt(++e.position)))
                  : (n = "!"),
                (t = e.position),
                o)
              ) {
                do {
                  i = e.input.charCodeAt(++e.position);
                } while (0 !== i && 62 !== i);
                e.position < e.length
                  ? ((r = e.input.slice(t, e.position)),
                    (i = e.input.charCodeAt(++e.position)))
                  : Ee(e, "unexpected end of the stream within a verbatim tag");
              } else {
                for (; 0 !== i && !ye(i); )
                  33 === i &&
                    (s
                      ? Ee(e, "tag suffix cannot contain exclamation marks")
                      : ((n = e.input.slice(t - 1, e.position + 1)),
                        fe.test(n) ||
                          Ee(
                            e,
                            "named tag handle cannot contain such characters"
                          ),
                        (s = !0),
                        (t = e.position + 1))),
                    (i = e.input.charCodeAt(++e.position));
                (r = e.input.slice(t, e.position)),
                  he.test(r) &&
                    Ee(
                      e,
                      "tag suffix cannot contain flow indicator characters"
                    );
              }
              r &&
                !ge.test(r) &&
                Ee(e, "tag name cannot contain such characters: " + r);
              try {
                r = decodeURIComponent(r);
              } catch (t) {
                Ee(e, "tag name is malformed: " + r);
              }
              return (
                o
                  ? (e.tag = r)
                  : le.call(e.tagMap, n)
                  ? (e.tag = e.tagMap[n] + r)
                  : "!" === n
                  ? (e.tag = "!" + r)
                  : "!!" === n
                  ? (e.tag = "tag:yaml.org,2002:" + r)
                  : Ee(e, 'undeclared tag handle "' + n + '"'),
                !0
              );
            }
            function qe(e) {
              var t, n;
              if (38 !== (n = e.input.charCodeAt(e.position))) return !1;
              for (
                null !== e.anchor && Ee(e, "duplication of an anchor property"),
                  n = e.input.charCodeAt(++e.position),
                  t = e.position;
                0 !== n && !ye(n) && !we(n);

              )
                n = e.input.charCodeAt(++e.position);
              return (
                e.position === t &&
                  Ee(
                    e,
                    "name of an anchor node must contain at least one character"
                  ),
                (e.anchor = e.input.slice(t, e.position)),
                !0
              );
            }
            function Fe(e, t, n, r, i) {
              var o,
                s,
                a,
                u,
                c,
                l,
                p,
                d,
                h,
                f = 1,
                g = !1,
                m = !1;
              if (
                (null !== e.listener && e.listener("open", e),
                (e.tag = null),
                (e.anchor = null),
                (e.kind = null),
                (e.result = null),
                (o = s = a = 4 === n || 3 === n),
                r &&
                  Le(e, !0, -1) &&
                  ((g = !0),
                  e.lineIndent > t
                    ? (f = 1)
                    : e.lineIndent === t
                    ? (f = 0)
                    : e.lineIndent < t && (f = -1)),
                1 === f)
              )
                for (; De(e) || qe(e); )
                  Le(e, !0, -1)
                    ? ((g = !0),
                      (a = o),
                      e.lineIndent > t
                        ? (f = 1)
                        : e.lineIndent === t
                        ? (f = 0)
                        : e.lineIndent < t && (f = -1))
                    : (a = !1);
              if (
                (a && (a = g || i),
                (1 !== f && 4 !== n) ||
                  ((d = 1 === n || 2 === n ? t : t + 1),
                  (h = e.position - e.lineStart),
                  1 === f
                    ? (a &&
                        (Be(e, h) ||
                          (function (e, t, n) {
                            var r,
                              i,
                              o,
                              s,
                              a,
                              u,
                              c,
                              l = e.tag,
                              p = e.anchor,
                              d = {},
                              h = Object.create(null),
                              f = null,
                              g = null,
                              m = null,
                              v = !1,
                              b = !1;
                            if (-1 !== e.firstTabInLine) return !1;
                            for (
                              null !== e.anchor && (e.anchorMap[e.anchor] = d),
                                c = e.input.charCodeAt(e.position);
                              0 !== c;

                            ) {
                              if (
                                (v ||
                                  -1 === e.firstTabInLine ||
                                  ((e.position = e.firstTabInLine),
                                  Ee(
                                    e,
                                    "tab characters must not be used in indentation"
                                  )),
                                (r = e.input.charCodeAt(e.position + 1)),
                                (o = e.line),
                                (63 !== c && 58 !== c) || !ye(r))
                              ) {
                                if (
                                  ((s = e.line),
                                  (a = e.lineStart),
                                  (u = e.position),
                                  !Fe(e, n, 2, !1, !0))
                                )
                                  break;
                                if (e.line === o) {
                                  for (
                                    c = e.input.charCodeAt(e.position);
                                    be(c);

                                  )
                                    c = e.input.charCodeAt(++e.position);
                                  if (58 === c)
                                    ye(
                                      (c = e.input.charCodeAt(++e.position))
                                    ) ||
                                      Ee(
                                        e,
                                        "a whitespace character is expected after the key-value separator within a block mapping"
                                      ),
                                      v &&
                                        ($e(e, d, h, f, g, null, s, a, u),
                                        (f = g = m = null)),
                                      (b = !0),
                                      (v = !1),
                                      (i = !1),
                                      (f = e.tag),
                                      (g = e.result);
                                  else {
                                    if (!b)
                                      return (e.tag = l), (e.anchor = p), !0;
                                    Ee(
                                      e,
                                      "can not read an implicit mapping pair; a colon is missed"
                                    );
                                  }
                                } else {
                                  if (!b)
                                    return (e.tag = l), (e.anchor = p), !0;
                                  Ee(
                                    e,
                                    "can not read a block mapping entry; a multiline key may not be an implicit key"
                                  );
                                }
                              } else
                                63 === c
                                  ? (v &&
                                      ($e(e, d, h, f, g, null, s, a, u),
                                      (f = g = m = null)),
                                    (b = !0),
                                    (v = !0),
                                    (i = !0))
                                  : v
                                  ? ((v = !1), (i = !0))
                                  : Ee(
                                      e,
                                      "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"
                                    ),
                                  (e.position += 1),
                                  (c = r);
                              if (
                                ((e.line === o || e.lineIndent > t) &&
                                  (v &&
                                    ((s = e.line),
                                    (a = e.lineStart),
                                    (u = e.position)),
                                  Fe(e, t, 4, !0, i) &&
                                    (v ? (g = e.result) : (m = e.result)),
                                  v ||
                                    ($e(e, d, h, f, g, m, s, a, u),
                                    (f = g = m = null)),
                                  Le(e, !0, -1),
                                  (c = e.input.charCodeAt(e.position))),
                                (e.line === o || e.lineIndent > t) && 0 !== c)
                              )
                                Ee(e, "bad indentation of a mapping entry");
                              else if (e.lineIndent < t) break;
                            }
                            return (
                              v && $e(e, d, h, f, g, null, s, a, u),
                              b &&
                                ((e.tag = l),
                                (e.anchor = p),
                                (e.kind = "mapping"),
                                (e.result = d)),
                              b
                            );
                          })(e, h, d))) ||
                      (function (e, t) {
                        var n,
                          r,
                          i,
                          o,
                          s,
                          a,
                          u,
                          c,
                          l,
                          p,
                          d,
                          h,
                          f = !0,
                          g = e.tag,
                          m = e.anchor,
                          v = Object.create(null);
                        if (91 === (h = e.input.charCodeAt(e.position)))
                          (s = 93), (c = !1), (o = []);
                        else {
                          if (123 !== h) return !1;
                          (s = 125), (c = !0), (o = {});
                        }
                        for (
                          null !== e.anchor && (e.anchorMap[e.anchor] = o),
                            h = e.input.charCodeAt(++e.position);
                          0 !== h;

                        ) {
                          if (
                            (Le(e, !0, t),
                            (h = e.input.charCodeAt(e.position)) === s)
                          )
                            return (
                              e.position++,
                              (e.tag = g),
                              (e.anchor = m),
                              (e.kind = c ? "mapping" : "sequence"),
                              (e.result = o),
                              !0
                            );
                          f
                            ? 44 === h &&
                              Ee(e, "expected the node content, but found ','")
                            : Ee(
                                e,
                                "missed comma between flow collection entries"
                              ),
                            (d = null),
                            (a = u = !1),
                            63 === h &&
                              ye(e.input.charCodeAt(e.position + 1)) &&
                              ((a = u = !0), e.position++, Le(e, !0, t)),
                            (n = e.line),
                            (r = e.lineStart),
                            (i = e.position),
                            Fe(e, t, 1, !1, !0),
                            (p = e.tag),
                            (l = e.result),
                            Le(e, !0, t),
                            (h = e.input.charCodeAt(e.position)),
                            (!u && e.line !== n) ||
                              58 !== h ||
                              ((a = !0),
                              (h = e.input.charCodeAt(++e.position)),
                              Le(e, !0, t),
                              Fe(e, t, 1, !1, !0),
                              (d = e.result)),
                            c
                              ? $e(e, o, v, p, l, d, n, r, i)
                              : a
                              ? o.push($e(e, null, v, p, l, d, n, r, i))
                              : o.push(l),
                            Le(e, !0, t),
                            44 === (h = e.input.charCodeAt(e.position))
                              ? ((f = !0),
                                (h = e.input.charCodeAt(++e.position)))
                              : (f = !1);
                        }
                        Ee(
                          e,
                          "unexpected end of the stream within a flow collection"
                        );
                      })(e, d)
                      ? (m = !0)
                      : ((s &&
                          (function (e, t) {
                            var n,
                              r,
                              i,
                              o,
                              s,
                              a = 1,
                              u = !1,
                              c = !1,
                              l = t,
                              p = 0,
                              d = !1;
                            if (124 === (o = e.input.charCodeAt(e.position)))
                              r = !1;
                            else {
                              if (62 !== o) return !1;
                              r = !0;
                            }
                            for (e.kind = "scalar", e.result = ""; 0 !== o; )
                              if (
                                43 === (o = e.input.charCodeAt(++e.position)) ||
                                45 === o
                              )
                                1 === a
                                  ? (a = 43 === o ? 3 : 2)
                                  : Ee(
                                      e,
                                      "repeat of a chomping mode identifier"
                                    );
                              else {
                                if (
                                  !(
                                    (i =
                                      48 <= (s = o) && s <= 57 ? s - 48 : -1) >=
                                    0
                                  )
                                )
                                  break;
                                0 === i
                                  ? Ee(
                                      e,
                                      "bad explicit indentation width of a block scalar; it cannot be less than one"
                                    )
                                  : c
                                  ? Ee(
                                      e,
                                      "repeat of an indentation width identifier"
                                    )
                                  : ((l = t + i - 1), (c = !0));
                              }
                            if (be(o)) {
                              do {
                                o = e.input.charCodeAt(++e.position);
                              } while (be(o));
                              if (35 === o)
                                do {
                                  o = e.input.charCodeAt(++e.position);
                                } while (!ve(o) && 0 !== o);
                            }
                            for (; 0 !== o; ) {
                              for (
                                Me(e),
                                  e.lineIndent = 0,
                                  o = e.input.charCodeAt(e.position);
                                (!c || e.lineIndent < l) && 32 === o;

                              )
                                e.lineIndent++,
                                  (o = e.input.charCodeAt(++e.position));
                              if (
                                (!c && e.lineIndent > l && (l = e.lineIndent),
                                ve(o))
                              )
                                p++;
                              else {
                                if (e.lineIndent < l) {
                                  3 === a
                                    ? (e.result += x.repeat(
                                        "\n",
                                        u ? 1 + p : p
                                      ))
                                    : 1 === a && u && (e.result += "\n");
                                  break;
                                }
                                for (
                                  r
                                    ? be(o)
                                      ? ((d = !0),
                                        (e.result += x.repeat(
                                          "\n",
                                          u ? 1 + p : p
                                        )))
                                      : d
                                      ? ((d = !1),
                                        (e.result += x.repeat("\n", p + 1)))
                                      : 0 === p
                                      ? u && (e.result += " ")
                                      : (e.result += x.repeat("\n", p))
                                    : (e.result += x.repeat(
                                        "\n",
                                        u ? 1 + p : p
                                      )),
                                    u = !0,
                                    c = !0,
                                    p = 0,
                                    n = e.position;
                                  !ve(o) && 0 !== o;

                                )
                                  o = e.input.charCodeAt(++e.position);
                                Te(e, n, e.position, !1);
                              }
                            }
                            return !0;
                          })(e, d)) ||
                        (function (e, t) {
                          var n, r, i;
                          if (39 !== (n = e.input.charCodeAt(e.position)))
                            return !1;
                          for (
                            e.kind = "scalar",
                              e.result = "",
                              e.position++,
                              r = i = e.position;
                            0 !== (n = e.input.charCodeAt(e.position));

                          )
                            if (39 === n) {
                              if (
                                (Te(e, r, e.position, !0),
                                39 !== (n = e.input.charCodeAt(++e.position)))
                              )
                                return !0;
                              (r = e.position), e.position++, (i = e.position);
                            } else
                              ve(n)
                                ? (Te(e, r, i, !0),
                                  Ue(e, Le(e, !1, t)),
                                  (r = i = e.position))
                                : e.position === e.lineStart && Ne(e)
                                ? Ee(
                                    e,
                                    "unexpected end of the document within a single quoted scalar"
                                  )
                                : (e.position++, (i = e.position));
                          Ee(
                            e,
                            "unexpected end of the stream within a single quoted scalar"
                          );
                        })(e, d) ||
                        (function (e, t) {
                          var n, r, i, o, s, a, u;
                          if (34 !== (a = e.input.charCodeAt(e.position)))
                            return !1;
                          for (
                            e.kind = "scalar",
                              e.result = "",
                              e.position++,
                              n = r = e.position;
                            0 !== (a = e.input.charCodeAt(e.position));

                          ) {
                            if (34 === a)
                              return Te(e, n, e.position, !0), e.position++, !0;
                            if (92 === a) {
                              if (
                                (Te(e, n, e.position, !0),
                                ve((a = e.input.charCodeAt(++e.position))))
                              )
                                Le(e, !1, t);
                              else if (a < 256 && Ie[a])
                                (e.result += _e[a]), e.position++;
                              else if (
                                (s =
                                  120 === (u = a)
                                    ? 2
                                    : 117 === u
                                    ? 4
                                    : 85 === u
                                    ? 8
                                    : 0) > 0
                              ) {
                                for (i = s, o = 0; i > 0; i--)
                                  (s = Ce(
                                    (a = e.input.charCodeAt(++e.position))
                                  )) >= 0
                                    ? (o = (o << 4) + s)
                                    : Ee(e, "expected hexadecimal character");
                                (e.result += xe(o)), e.position++;
                              } else Ee(e, "unknown escape sequence");
                              n = r = e.position;
                            } else
                              ve(a)
                                ? (Te(e, n, r, !0),
                                  Ue(e, Le(e, !1, t)),
                                  (n = r = e.position))
                                : e.position === e.lineStart && Ne(e)
                                ? Ee(
                                    e,
                                    "unexpected end of the document within a double quoted scalar"
                                  )
                                : (e.position++, (r = e.position));
                          }
                          Ee(
                            e,
                            "unexpected end of the stream within a double quoted scalar"
                          );
                        })(e, d)
                          ? (m = !0)
                          : !(function (e) {
                              var t, n, r;
                              if (42 !== (r = e.input.charCodeAt(e.position)))
                                return !1;
                              for (
                                r = e.input.charCodeAt(++e.position),
                                  t = e.position;
                                0 !== r && !ye(r) && !we(r);

                              )
                                r = e.input.charCodeAt(++e.position);
                              return (
                                e.position === t &&
                                  Ee(
                                    e,
                                    "name of an alias node must contain at least one character"
                                  ),
                                (n = e.input.slice(t, e.position)),
                                le.call(e.anchorMap, n) ||
                                  Ee(e, 'unidentified alias "' + n + '"'),
                                (e.result = e.anchorMap[n]),
                                Le(e, !0, -1),
                                !0
                              );
                            })(e)
                          ? (function (e, t, n) {
                              var r,
                                i,
                                o,
                                s,
                                a,
                                u,
                                c,
                                l,
                                p = e.kind,
                                d = e.result;
                              if (
                                ye((l = e.input.charCodeAt(e.position))) ||
                                we(l) ||
                                35 === l ||
                                38 === l ||
                                42 === l ||
                                33 === l ||
                                124 === l ||
                                62 === l ||
                                39 === l ||
                                34 === l ||
                                37 === l ||
                                64 === l ||
                                96 === l
                              )
                                return !1;
                              if (
                                (63 === l || 45 === l) &&
                                (ye((r = e.input.charCodeAt(e.position + 1))) ||
                                  (n && we(r)))
                              )
                                return !1;
                              for (
                                e.kind = "scalar",
                                  e.result = "",
                                  i = o = e.position,
                                  s = !1;
                                0 !== l;

                              ) {
                                if (58 === l) {
                                  if (
                                    ye(
                                      (r = e.input.charCodeAt(e.position + 1))
                                    ) ||
                                    (n && we(r))
                                  )
                                    break;
                                } else if (35 === l) {
                                  if (ye(e.input.charCodeAt(e.position - 1)))
                                    break;
                                } else {
                                  if (
                                    (e.position === e.lineStart && Ne(e)) ||
                                    (n && we(l))
                                  )
                                    break;
                                  if (ve(l)) {
                                    if (
                                      ((a = e.line),
                                      (u = e.lineStart),
                                      (c = e.lineIndent),
                                      Le(e, !1, -1),
                                      e.lineIndent >= t)
                                    ) {
                                      (s = !0),
                                        (l = e.input.charCodeAt(e.position));
                                      continue;
                                    }
                                    (e.position = o),
                                      (e.line = a),
                                      (e.lineStart = u),
                                      (e.lineIndent = c);
                                    break;
                                  }
                                }
                                s &&
                                  (Te(e, i, o, !1),
                                  Ue(e, e.line - a),
                                  (i = o = e.position),
                                  (s = !1)),
                                  be(l) || (o = e.position + 1),
                                  (l = e.input.charCodeAt(++e.position));
                              }
                              return (
                                Te(e, i, o, !1),
                                !!e.result || ((e.kind = p), (e.result = d), !1)
                              );
                            })(e, d, 1 === n) &&
                            ((m = !0), null === e.tag && (e.tag = "?"))
                          : ((m = !0),
                            (null === e.tag && null === e.anchor) ||
                              Ee(
                                e,
                                "alias node should not have any properties"
                              )),
                        null !== e.anchor && (e.anchorMap[e.anchor] = e.result))
                    : 0 === f && (m = a && Be(e, h))),
                null === e.tag)
              )
                null !== e.anchor && (e.anchorMap[e.anchor] = e.result);
              else if ("?" === e.tag) {
                for (
                  null !== e.result &&
                    "scalar" !== e.kind &&
                    Ee(
                      e,
                      'unacceptable node kind for !<?> tag; it should be "scalar", not "' +
                        e.kind +
                        '"'
                    ),
                    u = 0,
                    c = e.implicitTypes.length;
                  u < c;
                  u += 1
                )
                  if ((p = e.implicitTypes[u]).resolve(e.result)) {
                    (e.result = p.construct(e.result)),
                      (e.tag = p.tag),
                      null !== e.anchor && (e.anchorMap[e.anchor] = e.result);
                    break;
                  }
              } else if ("!" !== e.tag) {
                if (le.call(e.typeMap[e.kind || "fallback"], e.tag))
                  p = e.typeMap[e.kind || "fallback"][e.tag];
                else
                  for (
                    p = null,
                      u = 0,
                      c = (l = e.typeMap.multi[e.kind || "fallback"]).length;
                    u < c;
                    u += 1
                  )
                    if (e.tag.slice(0, l[u].tag.length) === l[u].tag) {
                      p = l[u];
                      break;
                    }
                p || Ee(e, "unknown tag !<" + e.tag + ">"),
                  null !== e.result &&
                    p.kind !== e.kind &&
                    Ee(
                      e,
                      "unacceptable node kind for !<" +
                        e.tag +
                        '> tag; it should be "' +
                        p.kind +
                        '", not "' +
                        e.kind +
                        '"'
                    ),
                  p.resolve(e.result, e.tag)
                    ? ((e.result = p.construct(e.result, e.tag)),
                      null !== e.anchor && (e.anchorMap[e.anchor] = e.result))
                    : Ee(
                        e,
                        "cannot resolve a node with !<" +
                          e.tag +
                          "> explicit tag"
                      );
              }
              return (
                null !== e.listener && e.listener("close", e),
                null !== e.tag || null !== e.anchor || m
              );
            }
            function ze(e) {
              var t,
                n,
                r,
                i,
                o = e.position,
                s = !1;
              for (
                e.version = null,
                  e.checkLineBreaks = e.legacy,
                  e.tagMap = Object.create(null),
                  e.anchorMap = Object.create(null);
                0 !== (i = e.input.charCodeAt(e.position)) &&
                (Le(e, !0, -1),
                (i = e.input.charCodeAt(e.position)),
                !(e.lineIndent > 0 || 37 !== i));

              ) {
                for (
                  s = !0, i = e.input.charCodeAt(++e.position), t = e.position;
                  0 !== i && !ye(i);

                )
                  i = e.input.charCodeAt(++e.position);
                for (
                  r = [],
                    (n = e.input.slice(t, e.position)).length < 1 &&
                      Ee(
                        e,
                        "directive name must not be less than one character in length"
                      );
                  0 !== i;

                ) {
                  for (; be(i); ) i = e.input.charCodeAt(++e.position);
                  if (35 === i) {
                    do {
                      i = e.input.charCodeAt(++e.position);
                    } while (0 !== i && !ve(i));
                    break;
                  }
                  if (ve(i)) break;
                  for (t = e.position; 0 !== i && !ye(i); )
                    i = e.input.charCodeAt(++e.position);
                  r.push(e.input.slice(t, e.position));
                }
                0 !== i && Me(e),
                  le.call(je, n)
                    ? je[n](e, n, r)
                    : Oe(e, 'unknown document directive "' + n + '"');
              }
              Le(e, !0, -1),
                0 === e.lineIndent &&
                45 === e.input.charCodeAt(e.position) &&
                45 === e.input.charCodeAt(e.position + 1) &&
                45 === e.input.charCodeAt(e.position + 2)
                  ? ((e.position += 3), Le(e, !0, -1))
                  : s && Ee(e, "directives end mark is expected"),
                Fe(e, e.lineIndent - 1, 4, !1, !0),
                Le(e, !0, -1),
                e.checkLineBreaks &&
                  de.test(e.input.slice(o, e.position)) &&
                  Oe(e, "non-ASCII line breaks are interpreted as content"),
                e.documents.push(e.result),
                e.position === e.lineStart && Ne(e)
                  ? 46 === e.input.charCodeAt(e.position) &&
                    ((e.position += 3), Le(e, !0, -1))
                  : e.position < e.length - 1 &&
                    Ee(
                      e,
                      "end of the stream or a document separator is expected"
                    );
            }
            function We(e, t) {
              (t = t || {}),
                0 !== (e = String(e)).length &&
                  (10 !== e.charCodeAt(e.length - 1) &&
                    13 !== e.charCodeAt(e.length - 1) &&
                    (e += "\n"),
                  65279 === e.charCodeAt(0) && (e = e.slice(1)));
              var n = new Se(e, t),
                r = e.indexOf("\0");
              for (
                -1 !== r &&
                  ((n.position = r),
                  Ee(n, "null byte is not allowed in input")),
                  n.input += "\0";
                32 === n.input.charCodeAt(n.position);

              )
                (n.lineIndent += 1), (n.position += 1);
              for (; n.position < n.length - 1; ) ze(n);
              return n.documents;
            }
            var Ye = {
              loadAll: function (e, t, n) {
                null !== t &&
                  "object" == typeof t &&
                  void 0 === n &&
                  ((n = t), (t = null));
                var r = We(e, n);
                if ("function" != typeof t) return r;
                for (var i = 0, o = r.length; i < o; i += 1) t(r[i]);
              },
              load: function (e, t) {
                var n = We(e, t);
                if (0 !== n.length) {
                  if (1 === n.length) return n[0];
                  throw new R(
                    "expected a single document in the stream, but found more"
                  );
                }
              },
            };
            Object.prototype.toString, Object.prototype.hasOwnProperty;
            function Ge(e, t) {
              return function () {
                throw new Error(
                  "Function yaml." +
                    e +
                    " is removed in js-yaml 4. Use yaml." +
                    t +
                    " instead, which is now safe by default."
                );
              };
            }
            var Qe = H,
              He = Ye.load;
            Ge("safeLoad", "load"),
              Ge("safeLoadAll", "loadAll"),
              Ge("safeDump", "dump");
            const Je = w({
              folders: w({ input: y(), output: y() }),
              maxConcurrency: ((e) =>
                h({ test: (t, n) => void 0 === t || e(t, n) }))(
                ((Ke = h({
                  test: (e, t) => {
                    var n;
                    if ("number" != typeof e) {
                      if (void 0 !== (null == t ? void 0 : t.coercions)) {
                        if (void 0 === (null == t ? void 0 : t.coercion))
                          return b(t, "Unbound coercion result");
                        let r;
                        if ("string" == typeof e) {
                          let n;
                          try {
                            n = JSON.parse(e);
                          } catch (e) {}
                          if ("number" == typeof n) {
                            if (JSON.stringify(n) !== e)
                              return b(
                                t,
                                `Received a number that can't be safely represented by the runtime (${e})`
                              );
                            r = n;
                          }
                        }
                        if (void 0 !== r)
                          return (
                            t.coercions.push([
                              null !== (n = t.p) && void 0 !== n ? n : ".",
                              t.coercion.bind(null, r),
                            ]),
                            !0
                          );
                      }
                      return b(t, `Expected a number (got ${f(e)})`);
                    }
                    return !0;
                  },
                })),
                (Ve = [
                  (({ unsafe: e = !1 } = {}) =>
                    h({
                      test: (e, t) =>
                        e !== Math.round(e)
                          ? b(t, `Expected to be an integer (got ${e})`)
                          : !!Number.isSafeInteger(e) ||
                            b(t, `Expected to be a safe integer (got ${e})`),
                    }))(),
                  ((Ze = 1),
                  (Xe = 128),
                  h({
                    test: (e, t) =>
                      (e >= Ze && e <= Xe) ||
                      b(
                        t,
                        `Expected to be in the [${Ze}; ${Xe}] range (got ${e})`
                      ),
                  })),
                ]),
                h({
                  test: (e, t) => {
                    var n, r;
                    const i = { value: e },
                      o =
                        void 0 !== (null == t ? void 0 : t.coercions)
                          ? m(i, "value")
                          : void 0,
                      s =
                        void 0 !== (null == t ? void 0 : t.coercions)
                          ? []
                          : void 0;
                    if (
                      !Ke(
                        e,
                        Object.assign(Object.assign({}, t), {
                          coercion: o,
                          coercions: s,
                        })
                      )
                    )
                      return !1;
                    const a = [];
                    if (void 0 !== s) for (const [, e] of s) a.push(e());
                    try {
                      if (void 0 !== (null == t ? void 0 : t.coercions)) {
                        if (i.value !== e) {
                          if (void 0 === (null == t ? void 0 : t.coercion))
                            return b(t, "Unbound coercion result");
                          t.coercions.push([
                            null !== (n = t.p) && void 0 !== n ? n : ".",
                            t.coercion.bind(null, i.value),
                          ]);
                        }
                        null === (r = null == t ? void 0 : t.coercions) ||
                          void 0 === r ||
                          r.push(...s);
                      }
                      return Ve.every((e) => e(i.value, t));
                    } finally {
                      for (const e of a) e();
                    }
                  },
                }))
              ),
            });
            var Ke, Ve, Ze, Xe;
            async function et(e) {
              return await (async function (e) {
                const t = s.ppath.join(
                  e.projectCwd || e.startingCwd,
                  ".yarnbuildrc.yml"
                );
                if (s.xfs.existsSync(t)) {
                  const e = await s.xfs.readFilePromise(t, "utf8"),
                    n = [];
                  try {
                    const t = He(e, { schema: Qe });
                    if (Je(t, { errors: n })) return t;
                    console.warn(n);
                  } catch (n) {
                    let r = "";
                    throw (
                      (e.match(/^\s+(?!-)[^:]+\s+\S+/m) &&
                        (r =
                          " (config is corrupted, please check it matches the shape in the yarn.build readme."),
                      new Error(
                        `Parse error when loading ${t}; please check it's proper Yaml${r}`
                      ))
                    );
                  }
                }
                return {
                  folders: { input: ".", output: "build" },
                  maxConcurrency: 8,
                };
              })(e);
            }
            var tt = n(76),
              nt = n.n(tt);
            const rt = require("os"),
              it = require("events");
            var ot = n(245),
              st = n(251),
              at = n.n(st),
              ut = n(626),
              ct = n(510),
              lt = n.n(ct),
              pt = n(52),
              dt = n.n(pt);
            class ht {
              constructor() {
                (this.nodes = {}),
                  (this.size = 0),
                  (this.runSize = 0),
                  (this.ran = new Set());
              }
              addNode(e) {
                if (this.nodes[e]) return this.nodes[e];
                const t = new ft(e, this);
                return (this.nodes[e] = t), this.size++, t;
              }
              getNode(e) {
                if (this.nodes[e]) return this.nodes[e];
              }
              resetRuns() {
                this.ran = new Set();
              }
              async resolve(e) {
                const t = new Set(),
                  n = new Set();
                await this.resolveNode(e, t, n);
              }
              async resolveNode(e, t, n) {
                n.add(e.id);
                for (const r of e.dependencies)
                  if (!t.has(r.id)) {
                    if (n.has(r.id))
                      throw new gt(
                        `${e.id} has a cyclic dependency on ${r.id}`
                      );
                    await this.resolveNode(r, t, n);
                  }
                t.add(e.id), n.delete(e.id);
              }
              async run(e) {
                const t = new Set(),
                  n = new Set(),
                  r = {};
                for (const n of e) this.resolveQueue(n, t, r);
                return (
                  await new Promise((e) => {
                    this.workLoop(t, r, n, e);
                  }),
                  r
                );
              }
              workLoop(e, t, n, r) {
                0 !== e.size &&
                  e.forEach((r) => {
                    var i, o;
                    r.canStart(t) &&
                      ((
                        null === (i = null == r ? void 0 : r.node) ||
                        void 0 === i
                          ? void 0
                          : i.runCallback
                      )
                        ? (null === (o = null == r ? void 0 : r.node) ||
                            void 0 === o ||
                            o.runCallback(t),
                          n.add(r.node))
                        : (t[r.node.id] = { success: !0, done: !0 }),
                      e.delete(r));
                  }),
                  n.forEach((e, r) => {
                    t[e.id].done && n.delete(r);
                  }),
                  Object.keys(t)
                    .map((e) => {
                      var n, r;
                      return (
                        null ===
                          (r =
                            null === (n = t[e]) || void 0 === n
                              ? void 0
                              : n.done) ||
                        void 0 === r ||
                        r
                      );
                    })
                    .every((e) => !0 === e)
                    ? r()
                    : setTimeout(() => this.workLoop(e, t, n, r), 30);
              }
              resolveQueue(e, t, n) {
                const r = [];
                for (const i of e.dependencies)
                  if ((r.push(i.id), !n[i.id] && i.runCallback)) {
                    n[i.id] = { ...ht.RunLogInit };
                    const e = this.resolveQueue(i, t, n),
                      r = { node: i, canStart: ht.QueueItemCanStart(e) };
                    t.add(r);
                  }
                if (!n[e.id] && e.runCallback) {
                  n[e.id] = { ...ht.RunLogInit };
                  const i = { node: e, canStart: ht.QueueItemCanStart(r) };
                  t.add(i);
                }
                return r;
              }
            }
            (ht.RunLogInit = { success: !1, done: !1 }),
              (ht.QueueItemCanStart = (e) => (t) =>
                e
                  .map((e) => {
                    var n, r;
                    return (
                      null ===
                        (r =
                          null === (n = t[e]) || void 0 === n
                            ? void 0
                            : n.done) ||
                      void 0 === r ||
                      r
                    );
                  })
                  .every((e) => !0 === e));
            class ft {
              constructor(e, t) {
                (this.id = e), (this.dependencies = []), (this.graph = t);
              }
              addDependency(e) {
                return this.dependencies.push(e), this;
              }
              addWorkSpace(e) {
                return (this.workspace = e), this;
              }
              addRunCallback(e) {
                return (
                  this.runCallback ||
                    ((this.runCallback = (t) =>
                      e().then((e) => {
                        t[this.id] = { done: !0, success: e };
                      })),
                    this.graph.runSize++),
                  this
                );
              }
            }
            class gt extends Error {
              constructor(e) {
                super(e),
                  (this.name = "CyclicDependencyError"),
                  (this.code = "YN0003");
              }
            }
            const mt = "[";
            class vt {
              static pad(e = 1) {
                for (let t = 0; t < e; t++) process.stdout.write("\n");
                vt.cursorUp(e);
              }
              static cursorUp(e = 1) {
                process.stdout.write(mt + (e + "A"));
              }
              static cursorSave() {
                process.stdout.write("[s");
              }
              static cursorRestore() {
                process.stdout.write("[u");
              }
              static autoWrap(e) {
                e ? process.stdout.write("[?7h") : process.stdout.write("[?7l");
              }
              static clearScreenDown() {
                process.stdout.write("[J");
              }
              static async cursorPositionReport() {
                return new Promise((e) => {
                  process.stdin.setRawMode(!0),
                    process.stdin.once("data", (t) => {
                      process.stdin.setRawMode(!1), process.stdin.pause();
                      const [n, r] = t
                        .slice(2, t.length - 1)
                        .toString()
                        .split(";")
                        .map(Number);
                      e({ x: r, y: n });
                    }),
                    process.stdout.write("[6n");
                });
              }
              static setScrollableRegion(e, t) {
                process.stdout.write(`[${e};${t}r`);
              }
              static resetScrollableRegion() {
                process.stdout.write("[r");
              }
              static moveTo(e) {
                process.stdout.write(`[${e.y};${e.x}H`);
              }
              static cursorHome() {
                process.stdout.write("[H");
              }
              static alternateScreen() {
                process.stdout.write("[?1049h");
              }
              static mainScreen() {
                process.stdout.write("[?1049l");
              }
              static linesRequired(e, t) {
                var n;
                const r = new RegExp(`([^\n]{0,${t}})(\n)?`, "gm");
                return (
                  (null !== (n = lt()(e).match(r)) && void 0 !== n ? n : [""])
                    .length - 1
                );
              }
            }
            (vt.row = 0), (vt.column = 0);
            const bt = "-".repeat(80);
            var yt, wt;
            !(function (e) {
              (e.pending = "pending"),
                (e.inProgress = "inProgress"),
                (e.failed = "failed"),
                (e.succeeded = "succeeded");
            })(yt || (yt = {})),
              (function (e) {
                (e.pending = "pending"),
                  (e.start = "start"),
                  (e.info = "info"),
                  (e.error = "error"),
                  (e.success = "success"),
                  (e.fail = "fail"),
                  (e.finish = "finish");
              })(wt || (wt = {}));
            const Ct = async (e, t) => {
                let n = 0;
                const r = await s.xfs.readdirPromise(e);
                return (
                  await Promise.all(
                    r.map(async (r) => {
                      const i = `${e}${c().sep}${r}`;
                      if (t && i.startsWith(t)) return;
                      const o = await s.xfs.statPromise(i);
                      if (
                        (o.isFile() && o.mtimeMs > n && (n = o.mtimeMs),
                        o.isDirectory())
                      ) {
                        const e = await Ct(i, t);
                        e > n && (n = e);
                      }
                    })
                  ),
                  n
                );
              },
              kt = (e, t) => {
                let n = Math.abs(t - e),
                  r = "";
                const i = Math.trunc(n / 6e4);
                return (
                  i && ((r += i + "m"), (n -= 6e4 * i)),
                  n && (i && (r += " "), (r += (n / 1e3).toFixed(2) + "s")),
                  r
                );
              };
            const xt = class {
                constructor({
                  project: e,
                  report: t,
                  runCommand: n,
                  cli: r,
                  configuration: o,
                  pluginConfiguration: a,
                  dryRun: u,
                  ignoreRunCache: c,
                  verbose: l,
                  concurrency: p,
                }) {
                  (this.runGraph = new ht()),
                    (this.runLength = 0),
                    (this.runTargets = []),
                    (this.runMutexes = {}),
                    (this.dryRun = !1),
                    (this.ignoreRunCache = !1),
                    (this.verbose = !1),
                    (this.entrypoints = []),
                    (this.runReporter = new it.EventEmitter()),
                    (this.runReport = {
                      mutex: new ut.W(),
                      totalJobs: 0,
                      previousOutput: "",
                      successCount: 0,
                      failCount: 0,
                      workspaces: {},
                      done: !1,
                    }),
                    (this.nextUnitOfWork = []),
                    (this.hasSetup = !1),
                    (this.setupRunReporter = () => {
                      this.runReporter.on(wt.pending, (e, t) => {
                        this.runReport.mutex.acquire().then((n) => {
                          (this.runReport.workspaces[e] = {
                            name: t,
                            stdout: [],
                            stderr: [],
                            done: !1,
                            fail: !1,
                          }),
                            n();
                        });
                      }),
                        this.runReporter.on(wt.start, (e, t, n) => {
                          this.runReport.mutex.acquire().then((r) => {
                            (this.runReport.workspaces[e] = {
                              ...this.runReport.workspaces[e],
                              start: Date.now(),
                              runScript: n,
                              name: t,
                            }),
                              r();
                          });
                        }),
                        this.runReporter.on(wt.info, (e, t) => {
                          this.runReport.mutex.acquire().then((n) => {
                            this.runReport.workspaces[e].stdout.push(t), n();
                          });
                        }),
                        this.runReporter.on(wt.error, (e, t) => {
                          this.runReport.mutex.acquire().then((n) => {
                            this.runReport.workspaces[e].stderr.push(t),
                              this.logError(`${e} ${t}`),
                              n();
                          });
                        }),
                        this.runReporter.on(wt.success, (e) => {
                          this.runReport.mutex.acquire().then((t) => {
                            (this.runReport.workspaces[e] = {
                              ...this.runReport.workspaces[e],
                              done: !0,
                            }),
                              this.runReport.successCount++,
                              t();
                          });
                        }),
                        this.runReporter.on(wt.fail, (e, t) => {
                          this.runReport.mutex.acquire().then((n) => {
                            this.runReport.workspaces[e].stderr.push(t),
                              (this.runReport.workspaces[e].done = !0),
                              (this.runReport.workspaces[e].fail = !0),
                              this.runReport.failCount++,
                              this.logError(`${e} ${t}`),
                              n();
                          });
                        });
                    }),
                    (this.plan = async (e) => {
                      var t, n, r, o, s;
                      const a = this.runGraph
                        .addNode(e.relativeCwd)
                        .addWorkSpace(e);
                      let u = !1;
                      this.runMutexes[e.relativeCwd] = new ut.W();
                      for (const t of i.Manifest.hardDependencies)
                        for (const n of e.manifest.getForScope(t).values()) {
                          const e = this.project.tryWorkspaceByDescriptor(n);
                          if (null === e) continue;
                          const t = this.runGraph
                            .addNode(e.relativeCwd)
                            .addWorkSpace(e);
                          a.addDependency(t);
                          const r = await this.plan(e);
                          let i = !1;
                          e !== this.project.topLevelWorkspace &&
                            (i = await this.checkIfRunIsRequired(e)),
                            (i || r) &&
                              ((u = !0),
                              t.addRunCallback(this.createRunItem(e)));
                        }
                      let c = !1;
                      if (
                        (e !== this.project.topLevelWorkspace &&
                          (c = await this.checkIfRunIsRequired(e)),
                        this.runReporter.emit(wt.pending, e.relativeCwd),
                        u || c)
                      )
                        return (
                          this.runReporter.emit(
                            wt.pending,
                            e.relativeCwd,
                            `${
                              (
                                null === (t = e.manifest.name) || void 0 === t
                                  ? void 0
                                  : t.scope
                              )
                                ? `@${
                                    null === (n = e.manifest.name) ||
                                    void 0 === n
                                      ? void 0
                                      : n.scope
                                  }/`
                                : ""
                            }${
                              null === (r = e.manifest.name) || void 0 === r
                                ? void 0
                                : r.name
                            }`
                          ),
                          a.addRunCallback(this.createRunItem(e)),
                          !0
                        );
                      {
                        const t =
                          null === (o = this.runLog) || void 0 === o
                            ? void 0
                            : o.get(`${e.relativeCwd}#${this.runCommand}`);
                        t &&
                          (null === (s = this.runLog) ||
                            void 0 === s ||
                            s.set(`${e.relativeCwd}#${this.runCommand}`, {
                              lastModified: t.lastModified,
                              status: yt.succeeded,
                              haveCheckedForRerun: !0,
                              rerun: !1,
                              command: this.runCommand,
                            }));
                      }
                      return !1;
                    }),
                    (this.run = async () => {
                      var e, t;
                      if (!1 === this.hasSetup)
                        throw new Error(
                          "RunSupervisor is not setup, you need to call await supervisor.setup()"
                        );
                      if (
                        ((this.runReport.runStart = Date.now()),
                        this.dryRun ||
                          nt() ||
                          (vt.pad(this.concurrency + 3),
                          this.raf(this.waitUntilDone)),
                        this.dryRun)
                      )
                        return !0;
                      (this.currentRunTarget =
                        this.runTargets.length > 1
                          ? "All"
                          : null !==
                              (t =
                                null === (e = this.runTargets[0]) ||
                                void 0 === e
                                  ? void 0
                                  : e.relativeCwd) && void 0 !== t
                          ? t
                          : "Nothing to run"),
                        nt() || process.stderr.write("\n");
                      const n = this.generateHeaderString();
                      await this.runGraph.run(this.entrypoints);
                      const r = await this.runReport.mutex.acquire();
                      if (
                        ((this.runReport.done = !0),
                        r(),
                        nt() ||
                          (vt.cursorUp(
                            vt.linesRequired(
                              this.runReport.previousOutput,
                              process.stdout.columns
                            )
                          ),
                          vt.clearScreenDown()),
                        0 !== this.runReport.failCount)
                      ) {
                        const e = [];
                        process.stdout.write(this.formatHeader(n) + "\n");
                        for (const t in this.runReport.workspaces) {
                          const n = this.runReport.workspaces[t];
                          n.fail && e.push(t);
                          let r = !1;
                          if (0 !== n.stdout.length) {
                            r = !0;
                            const e = this.formatHeader(
                              "Output: " +
                                i.formatUtils.pretty(
                                  this.configuration,
                                  t,
                                  i.FormatType.NAME
                                ),
                              2
                            );
                            process.stdout.write(e + "\n"),
                              n.stdout.forEach((e) => {
                                e.split("\n").forEach((e) => {
                                  0 !== e.length &&
                                    process.stdout.write(e + "\n");
                                });
                              });
                          }
                          if (0 !== n.stderr.length) {
                            r = !0;
                            const e = "[stderr]";
                            process.stderr.write(e + "\n"),
                              n.stderr.forEach((e) => {
                                (e instanceof Error ? e.toString() : "" + e)
                                  .split("\n")
                                  .forEach((e) => {
                                    0 !== e.length &&
                                      process.stderr.write(e + "\n");
                                  });
                              });
                          }
                          r && process.stdout.write(this.grey(bt) + "\n");
                        }
                        if (e.length > 0) {
                          const t = this.grey(
                            `ERROR for script ${n}\nThe following packages returned an error.\n`
                          );
                          process.stderr.write(t),
                            e.forEach((e) => {
                              const t =
                                "- " +
                                i.formatUtils.pretty(
                                  this.configuration,
                                  e,
                                  i.FormatType.NAME
                                );
                              process.stderr.write(t + "\n");
                            });
                        }
                        process.stderr.write(
                          this.grey(
                            "Search `Output: path` to find the start of the output.\n"
                          )
                        );
                      }
                      const o = this.generateFinalReport();
                      return (
                        process.stdout.write(o),
                        await this.saveRunLog(),
                        0 === this.runReport.failCount
                      );
                    }),
                    (this.raf = (e) => {
                      setImmediate(() => e(Date.now()));
                    }),
                    (this.waitUntilDone = (e) => {
                      if (this.runReport.done) return;
                      const t = this.generateProgressString(e);
                      var n;
                      vt.cursorUp(
                        vt.linesRequired(
                          this.runReport.previousOutput,
                          process.stdout.columns
                        )
                      ),
                        vt.clearScreenDown(),
                        process.stdout.write(t),
                        (this.runReport.previousOutput = t),
                        ((n = 90), new Promise((e) => setTimeout(e, n))).then(
                          () => {
                            this.raf(this.waitUntilDone);
                          }
                        );
                    }),
                    (this.grey = (e) =>
                      i.formatUtils.pretty(this.configuration, e, "grey")),
                    (this.generateRunCountString = (e) => {
                      let t = "";
                      if (this.runReport.runStart) {
                        const n = i.formatUtils.pretty(
                            this.configuration,
                            "" + this.runReport.successCount,
                            "green"
                          ),
                          r = i.formatUtils.pretty(
                            this.configuration,
                            "" + this.runReport.failCount,
                            "red"
                          ),
                          o = i.formatUtils.pretty(
                            this.configuration,
                            "" + this.runGraph.runSize,
                            "grey"
                          );
                        t +=
                          this.formatHeader(
                            `${n}${this.grey(":")}${r}${this.grey(
                              "/"
                            )}${o} ${kt(this.runReport.runStart, e)}`
                          ) + "\n";
                      }
                      return t;
                    }),
                    (this.generateFinalReport = () => {
                      var e;
                      const t =
                        this.formatHeader(
                          `${i.formatUtils.pretty(
                            this.configuration,
                            this.runCommand + " finished",
                            0 === this.runReport.failCount ? "green" : "red"
                          )}${
                            0 != this.runReport.failCount
                              ? i.formatUtils.pretty(
                                  this.configuration,
                                  ` with ${this.runReport.failCount} errors`,
                                  "red"
                                )
                              : ""
                          }`
                        ) + "\n";
                      let n = this.formatHeader("Summary") + "\n";
                      if (this.runReport.runStart) {
                        n +=
                          i.formatUtils.pretty(
                            this.configuration,
                            "Success: " + this.runReport.successCount,
                            "green"
                          ) +
                          "\n" +
                          i.formatUtils.pretty(
                            this.configuration,
                            "Fail:" + this.runReport.failCount,
                            "red"
                          ) +
                          "\n" +
                          i.formatUtils.pretty(
                            this.configuration,
                            "Total: " + this.runGraph.runSize,
                            "grey"
                          ) +
                          "\n" +
                          this.grey("---") +
                          "\n";
                      }
                      let r = 50;
                      for (const t in this.runReport.workspaces) {
                        r +=
                          null !==
                            (e = this.runReport.workspaces[t].runtimeSeconds) &&
                          void 0 !== e
                            ? e
                            : 0;
                      }
                      if (
                        this.runReport.runStart &&
                        this.runGraph.runSize > 1
                      ) {
                        const e = r,
                          t = Date.now() - this.runReport.runStart,
                          i = kt(t, e);
                        nt() ||
                          ((n += this.grey(`Cumulative: (cpu): ${kt(0, r)}\n`)),
                          (n += this.grey(`Saved: ${i}\n`)));
                      }
                      return (
                        this.runReport.runStart &&
                          (n +=
                            this.grey("Runtime (wall): ") +
                            kt(Date.now(), this.runReport.runStart) +
                            "\n"),
                        (n += t),
                        n
                      );
                    }),
                    (this.createRunItem = (e) => async () =>
                      await this.limit(async () => {
                        var t, n, r, i, o, s, a;
                        const u = e.relativeCwd,
                          c = e.manifest.scripts.get(this.runCommand),
                          l =
                            null === (t = this.runLog) || void 0 === t
                              ? void 0
                              : t.get(`${e.relativeCwd}#${this.runCommand}`);
                        if (
                          (this.runReporter.emit(
                            wt.start,
                            e.relativeCwd,
                            `${
                              (
                                null === (n = e.manifest.name) || void 0 === n
                                  ? void 0
                                  : n.scope
                              )
                                ? `@${
                                    null === (r = e.manifest.name) ||
                                    void 0 === r
                                      ? void 0
                                      : r.scope
                                  }/`
                                : ""
                            }${
                              null === (i = e.manifest.name) || void 0 === i
                                ? void 0
                                : i.name
                            }`,
                            c
                          ),
                          !c)
                        )
                          return (
                            this.verbose &&
                              this.runReporter.emit(
                                wt.info,
                                e.relativeCwd,
                                `Missing \`${this.runCommand}\` script in manifest.`
                              ),
                            this.runReporter.emit(wt.success, e.relativeCwd),
                            !0
                          );
                        try {
                          if (
                            0 !==
                            (await this.cli(
                              this.runCommand,
                              e.cwd,
                              this.runReporter,
                              u
                            ))
                          )
                            return (
                              this.runReporter.emit(wt.fail, e.relativeCwd),
                              null === (o = this.runLog) ||
                                void 0 === o ||
                                o.set(`${e.relativeCwd}#${this.runCommand}`, {
                                  lastModified:
                                    null == l ? void 0 : l.lastModified,
                                  status: yt.failed,
                                  haveCheckedForRerun: !0,
                                  rerun: !1,
                                  command: this.runCommand,
                                }),
                              !1
                            );
                          null === (s = this.runLog) ||
                            void 0 === s ||
                            s.set(`${e.relativeCwd}#${this.runCommand}`, {
                              lastModified: null == l ? void 0 : l.lastModified,
                              status: yt.succeeded,
                              haveCheckedForRerun: !0,
                              rerun: !1,
                              command: this.runCommand,
                            }),
                            this.runReporter.emit(wt.success, e.relativeCwd);
                        } catch (t) {
                          return (
                            this.runReporter.emit(wt.fail, e.relativeCwd, t),
                            null === (a = this.runLog) ||
                              void 0 === a ||
                              a.set(`${e.relativeCwd}#${this.runCommand}`, {
                                lastModified:
                                  null == l ? void 0 : l.lastModified,
                                status: yt.failed,
                                haveCheckedForRerun: !0,
                                rerun: !1,
                                command: this.runCommand,
                              }),
                            !1
                          );
                        }
                        return !0;
                      }));
                  const d = null != p ? p : Math.max(1, (0, rt.cpus)().length);
                  (this.configuration = o),
                    (this.pluginConfiguration = a),
                    (this.project = e),
                    (this.report = t),
                    (this.runCommand = n),
                    (this.cli = r),
                    (this.dryRun = u),
                    (this.ignoreRunCache = c),
                    (this.verbose = l),
                    (this.concurrency = d),
                    (this.limit = at()(d)),
                    (this.queue = new ot.Z({
                      concurrency: d,
                      carryoverConcurrencyCount: !0,
                      timeout: 5e4,
                      throwOnTimeout: !0,
                      autoStart: !0,
                    })),
                    this.verbose &&
                      (this.errorLogFile = s.xfs.createWriteStream(
                        this.getRunErrorPath(),
                        { flags: "a" }
                      ));
                }
                async setup() {
                  (this.runLog = await this.readRunLog()),
                    this.setupRunReporter(),
                    (this.hasSetup = !0);
                }
                getRunErrorPath() {
                  return s.ppath.resolve(
                    this.project.cwd,
                    "yarn.build-error.log"
                  );
                }
                getRunLogPath() {
                  return s.ppath.resolve(
                    this.project.cwd,
                    ".yarn",
                    "yarn.build.json"
                  );
                }
                async readRunLog() {
                  const e = new Map();
                  try {
                    const t = await s.xfs.readJsonPromise(this.getRunLogPath());
                    if (t && t.packages)
                      for (const n in t.packages)
                        e.set(n, {
                          lastModified: t.packages[n].lastModified,
                          status: t.packages[n].status,
                          haveCheckedForRerun: !1,
                          rerun: !0,
                          command: this.runCommand,
                        });
                  } catch (e) {}
                  return e;
                }
                async saveRunLog() {
                  if (!this.runLog) return;
                  let e;
                  try {
                    e = await s.xfs.readJsonPromise(this.getRunLogPath());
                  } catch (e) {}
                  const t = {
                    comment:
                      "This is an auto-generated file, it keeps track of whats been built. This is a local file, don't store this in version control.",
                    packages: { ...(e && e.packages) },
                  };
                  for (const [e, n] of this.runLog)
                    n.status === yt.succeeded &&
                      (t.packages[e] = {
                        ...t.packages[e],
                        ...this.runLog.get(e),
                      });
                  await s.xfs.writeJsonPromise(this.getRunLogPath(), t);
                }
                logError(e) {
                  this.verbose && process.stderr.write(lt()(e) + "\n");
                }
                async addRunTarget(e) {
                  this.entrypoints.push(this.runGraph.addNode(e.relativeCwd));
                  (await this.plan(e)) && this.runTargets.push(e);
                }
                async checkIfRunIsRequired(e) {
                  var t, n, r, i, o;
                  if (!0 === this.ignoreRunCache) return !0;
                  let a = !1;
                  const u = s.ppath.resolve(e.project.cwd, e.relativeCwd);
                  let l, p;
                  (null === (t = null == e ? void 0 : e.manifest) ||
                  void 0 === t
                    ? void 0
                    : t.raw["yarn.build"]) &&
                  "string" ==
                    typeof (null == e
                      ? void 0
                      : e.manifest.raw["yarn.build"].output)
                    ? (l = `${u}${c().sep}${
                        null == e ? void 0 : e.manifest.raw["yarn.build"].output
                      }`)
                    : this.pluginConfiguration.folders.output
                    ? (l = `${u}${c().sep}${
                        this.pluginConfiguration.folders.output
                      }`)
                    : (null == e ? void 0 : e.manifest.raw.main) &&
                      (l = `${u}${c().sep}${
                        null == e
                          ? void 0
                          : e.manifest.raw.main.substring(
                              0,
                              null == e
                                ? void 0
                                : e.manifest.raw.main.lastIndexOf(c().sep)
                            )
                      }`),
                    (null === (n = null == e ? void 0 : e.manifest) ||
                    void 0 === n
                      ? void 0
                      : n.raw["yarn.build"]) &&
                    "string" ==
                      typeof (null == e
                        ? void 0
                        : e.manifest.raw["yarn.build"].input)
                      ? (p = `${u}${c().sep}${
                          null == e
                            ? void 0
                            : e.manifest.raw["yarn.build"].input
                        }`)
                      : this.pluginConfiguration.folders.input &&
                        (p = `${u}${c().sep}${
                          this.pluginConfiguration.folders.input
                        }`),
                    (null == p ? void 0 : p.endsWith("/.")) &&
                      (p = p.substring(0, p.length - 2));
                  const d = await this.runReport.mutex.acquire();
                  try {
                    const t =
                      null === (r = this.runLog) || void 0 === r
                        ? void 0
                        : r.get(`${e.relativeCwd}#${this.runCommand}`);
                    if (null == t ? void 0 : t.haveCheckedForRerun)
                      return (
                        null === (i = null == t ? void 0 : t.rerun) ||
                        void 0 === i ||
                        i
                      );
                    const n = await Ct(null != p ? p : u, l);
                    (null == t ? void 0 : t.lastModified) !== n && (a = !0),
                      null === (o = this.runLog) ||
                        void 0 === o ||
                        o.set(`${e.relativeCwd}#${this.runCommand}`, {
                          lastModified: n,
                          status: a ? yt.succeeded : yt.pending,
                          haveCheckedForRerun: !0,
                          rerun: a,
                          command: this.runCommand,
                        });
                  } catch (t) {
                    this.logError(
                      `${e.relativeCwd}: failed to get lastModified (${t})`
                    );
                  } finally {
                    d();
                  }
                  return a;
                }
                formatHeader(e, t = 0) {
                  const n = `${this.grey("-".repeat(t) + "[")} ${e} ${this.grey(
                      "]"
                    )}`,
                    r = lt()(n).length;
                  return n + this.grey("-".repeat(80 - r));
                }
                generateHeaderString() {
                  return `${i.formatUtils.pretty(
                    this.configuration,
                    "" + this.runCommand,
                    i.FormatType.CODE
                  )} for ${i.formatUtils.pretty(
                    this.configuration,
                    this.currentRunTarget ? this.currentRunTarget : "",
                    i.FormatType.SCOPE
                  )}${
                    this.dryRun
                      ? i.formatUtils.pretty(
                          this.configuration,
                          " --dry-run",
                          i.FormatType.NAME
                        )
                      : ""
                  }`;
                }
                generateProgressString(e) {
                  let t = "";
                  const n = (e) => this.grey(`[${e}]`),
                    r = i.formatUtils.pretty(
                      this.configuration,
                      "IDLE",
                      "grey"
                    );
                  t += this.formatHeader(this.generateHeaderString()) + "\n";
                  let o = 1;
                  for (const r in this.runReport.workspaces) {
                    const s = this.runReport.workspaces[r];
                    if (!s || !s.start || s.done) continue;
                    this.runReport.runStart &&
                      (this.runReport.workspaces[r].runtimeSeconds =
                        e - this.runReport.runStart);
                    const a = i.formatUtils.pretty(
                        this.configuration,
                        r,
                        i.FormatType.NAME
                      ),
                      u = i.formatUtils.pretty(
                        this.configuration,
                        `(${s.runScript})`,
                        i.FormatType.REFERENCE
                      ),
                      c = s.start
                        ? i.formatUtils.pretty(
                            this.configuration,
                            kt(s.start, e),
                            i.FormatType.RANGE
                          )
                        : "",
                      l = n(o++),
                      p = " ".repeat(l.length - 1),
                      d = i.formatUtils.pretty(
                        this.configuration,
                        s.name,
                        i.FormatType.NAME
                      );
                    let h = `${l} ${a}${d} ${u} ${c}\n`,
                      f = "",
                      g = "",
                      m = "";
                    lt()(h).length >= process.stdout.columns &&
                      ((f = `${l} ${a}${d}\n`),
                      (g = `${p} ${u} ${c}\n`),
                      lt()(f).length >= process.stdout.columns &&
                        ((f = dt()(`${l} ${a}\n`, 0, process.stdout.columns)),
                        (g = dt()(`${p} ${d}\n`, 0, process.stdout.columns)),
                        (m = dt()(
                          `${p} ${u} ${c}\n`,
                          0,
                          process.stdout.columns
                        ))),
                      (h = f + g + m)),
                      (t += h);
                  }
                  for (; o < this.concurrency + 1; ) t += `${n(o++)} ${r}\n`;
                  return (
                    this.runReport.runStart &&
                      (t += this.generateRunCountString(e)),
                    t
                  );
                }
              },
              It = (e, t) => {
                const n = [];
                for (const r of e.workspacesCwds) {
                  const e = t.workspacesByCwd.get(r);
                  e && n.push(e, ...It(e, t));
                }
                return n;
              },
              _t = async ({
                targetWorkspace: e,
                project: t,
                supervisor: n,
              }) => {
                if (0 !== e.workspacesCwds.size) {
                  const r = It(e, t);
                  for (const e of r) {
                    for (const r of i.Manifest.hardDependencies)
                      for (const i of e.manifest.getForScope(r).values()) {
                        const e = t.tryWorkspaceByDescriptor(i);
                        null !== e && (await n.addRunTarget(e));
                      }
                    await n.addRunTarget(e);
                  }
                  await n.addRunTarget(e);
                } else await n.addRunTarget(e);
              };
            class Rt extends r.BaseCommand {
              constructor() {
                super(...arguments),
                  (this.json = a.Option.Boolean("--json", !1, {
                    description:
                      "flag is set the output will follow a JSON-stream output\n      also known as NDJSON (https://github.com/ndjson/ndjson-spec).",
                  })),
                  (this.buildCommand = a.Option.String(
                    "-c,--build-command",
                    "build",
                    {
                      description:
                        'the command to be run in each package (if available), defaults to "build"',
                    }
                  )),
                  (this.interlaced = a.Option.Boolean("-i,--interlaced", !0, {
                    description:
                      "If false it will instead buffer the output from each process and print the resulting buffers only after their source processes have exited. Defaults to false.",
                  })),
                  (this.verbose = a.Option.Boolean("-v,--verbose", !1, {
                    description:
                      "more information will be logged to stdout than normal.",
                  })),
                  (this.dryRun = a.Option.Boolean("-d,--dry-run", !1, {
                    description:
                      "simulate running a build, but not actually run it",
                  })),
                  (this.ignoreBuildCache = a.Option.Boolean(
                    "--ignore-cache",
                    !1,
                    {
                      description:
                        "every package will be built, regardless of whether is has changed or not.",
                    }
                  )),
                  (this.maxConcurrency = a.Option.String(
                    "-m,--max-concurrency",
                    {
                      description:
                        "is the maximum number of builds that can run at a time, defaults to the number of logical CPUs on the current machine. Will override the global config option.",
                    }
                  )),
                  (this.buildTarget = a.Option.Rest()),
                  (this.buildLog = {});
              }
              async execute() {
                const e = await i.Configuration.find(
                    this.context.cwd,
                    this.context.plugins
                  ),
                  t = await et(e),
                  n =
                    void 0 === this.maxConcurrency
                      ? t.maxConcurrency
                      : parseInt(this.maxConcurrency);
                return (
                  await i.StreamReport.start(
                    {
                      configuration: e,
                      json: this.json,
                      stdout: this.context.stdout,
                      includeLogs: !0,
                    },
                    async (r) => {
                      let o = this.context.cwd;
                      "string" == typeof this.buildTarget[0] &&
                        (o = `${e.projectCwd}${c().sep}${this.buildTarget[0]}`);
                      const { project: s, workspace: a } = await i.Project.find(
                          e,
                          o
                        ),
                        u = a || s.topLevelWorkspace,
                        l = new xt({
                          project: s,
                          configuration: e,
                          pluginConfiguration: t,
                          report: r,
                          runCommand: this.buildCommand,
                          cli: async (e, t, n, r) => {
                            const o = new i.miscUtils.BufferStream();
                            o.on("data", (e) =>
                              null == n
                                ? void 0
                                : n.emit(wt.info, r, e && e.toString())
                            );
                            const s = new i.miscUtils.BufferStream();
                            s.on("data", (e) =>
                              null == n
                                ? void 0
                                : n.emit(wt.error, r, e && e.toString())
                            );
                            try {
                              const n =
                                (await this.cli.run(["run", e], {
                                  cwd: t,
                                  stdout: o,
                                  stderr: s,
                                })) || 0;
                              return o.end(), s.end(), n;
                            } catch (e) {
                              o.end(), s.end();
                            }
                            return 2;
                          },
                          dryRun: this.dryRun,
                          ignoreRunCache: this.ignoreBuildCache,
                          verbose: this.verbose,
                          concurrency: n,
                        });
                      await l.setup(),
                        await _t({
                          targetWorkspace: u,
                          project: s,
                          supervisor: l,
                        });
                      !1 === (await l.run()) &&
                        r.reportError(
                          i.MessageName.BUILD_FAILED,
                          "Build failed"
                        );
                    }
                  )
                ).exitCode();
              }
            }
            (Rt.paths = [["build"]]),
              (Rt.usage = a.Command.Usage({
                category: "Build commands",
                description: "build a package and all its dependencies",
                details:
                  "\n      In a monorepo with internal packages that depend on others, this command\n      will traverse the dependency graph and efficiently ensure, the packages\n      are built in the right order.\n\n    ",
              }));
            class St extends r.BaseCommand {
              constructor() {
                super(...arguments),
                  (this.json = a.Option.Boolean("--json", !1, {
                    description:
                      "flag is set the output will follow a JSON-stream output\n      also known as NDJSON (https://github.com/ndjson/ndjson-spec).",
                  })),
                  (this.verbose = a.Option.Boolean("-v,--verbose", !1, {
                    description:
                      "more information will be logged to stdout than normal.",
                  })),
                  (this.ignoreTestCache = a.Option.Boolean(
                    "--ignore-cache",
                    !1,
                    {
                      description:
                        "every package will be tested, regardless of whether is has changed or not.",
                    }
                  )),
                  (this.maxConcurrency = a.Option.String(
                    "-m,--max-concurrency",
                    {
                      description:
                        "is the maximum number of tests that can run at a time, defaults to the number of logical CPUs on the current machine. Will override the global config option.",
                    }
                  )),
                  (this.runTarget = a.Option.Rest()),
                  (this.runLog = {});
              }
              async execute() {
                const e = await i.Configuration.find(
                    this.context.cwd,
                    this.context.plugins
                  ),
                  t = await et(e),
                  n =
                    void 0 === this.maxConcurrency
                      ? t.maxConcurrency
                      : parseInt(this.maxConcurrency);
                return (
                  await i.StreamReport.start(
                    {
                      configuration: e,
                      json: this.json,
                      stdout: this.context.stdout,
                      includeLogs: !0,
                    },
                    async (r) => {
                      let o = this.context.cwd;
                      "string" == typeof this.runTarget[0] &&
                        (o = `${e.projectCwd}${c().sep}${this.runTarget[0]}`);
                      const { project: s, workspace: a } = await i.Project.find(
                          e,
                          o
                        ),
                        u = a || s.topLevelWorkspace,
                        l = new xt({
                          project: s,
                          configuration: e,
                          pluginConfiguration: t,
                          report: r,
                          runCommand: "test",
                          cli: async (e, t, n, r) => {
                            const o = new i.miscUtils.BufferStream();
                            o.on("data", (e) =>
                              null == n
                                ? void 0
                                : n.emit(wt.info, r, e && e.toString())
                            );
                            const s = new i.miscUtils.BufferStream();
                            s.on("data", (e) =>
                              null == n
                                ? void 0
                                : n.emit(wt.error, r, e && e.toString())
                            );
                            try {
                              const n =
                                (await this.cli.run(["run", e], {
                                  cwd: t,
                                  stdout: o,
                                  stderr: s,
                                })) || 0;
                              return o.end(), s.end(), n;
                            } catch (e) {
                              o.end(), s.end();
                            }
                            return 2;
                          },
                          dryRun: !1,
                          ignoreRunCache: this.ignoreTestCache,
                          verbose: this.verbose,
                          concurrency: n,
                        });
                      await l.setup(),
                        await _t({
                          targetWorkspace: u,
                          project: s,
                          supervisor: l,
                        });
                      !1 === (await l.run()) &&
                        r.reportError(
                          i.MessageName.BUILD_FAILED,
                          "Test failed"
                        );
                    }
                  )
                ).exitCode();
              }
            }
            (St.paths = [["test"]]),
              (St.usage = a.Command.Usage({
                category: "Test commands",
                description: "test a package and all its dependencies",
                details:
                  "\n    In a monorepo with internal packages that depend on others, this command\n    will traverse the dependency graph and efficiently ensure, the packages\n    are tested in the right order.\n    ",
              }));
            const At = { commands: [l, Rt, St] };
          },
          379: (e) => {
            "use strict";
            e.exports = ({ onlyFirst: e = !1 } = {}) => {
              const t = [
                "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
                "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
              ].join("|");
              return new RegExp(t, e ? void 0 : "g");
            };
          },
          625: (e, t, n) => {
            "use strict";
            e = n.nmd(e);
            const r = (e, t) => (...n) => `[${e(...n) + t}m`,
              i = (e, t) => (...n) => {
                const r = e(...n);
                return `[${38 + t};5;${r}m`;
              },
              o = (e, t) => (...n) => {
                const r = e(...n);
                return `[${38 + t};2;${r[0]};${r[1]};${r[2]}m`;
              },
              s = (e) => e,
              a = (e, t, n) => [e, t, n],
              u = (e, t, n) => {
                Object.defineProperty(e, t, {
                  get: () => {
                    const r = n();
                    return (
                      Object.defineProperty(e, t, {
                        value: r,
                        enumerable: !0,
                        configurable: !0,
                      }),
                      r
                    );
                  },
                  enumerable: !0,
                  configurable: !0,
                });
              };
            let c;
            const l = (e, t, r, i) => {
              void 0 === c && (c = n(108));
              const o = i ? 10 : 0,
                s = {};
              for (const [n, i] of Object.entries(c)) {
                const a = "ansi16" === n ? "ansi" : n;
                n === t
                  ? (s[a] = e(r, o))
                  : "object" == typeof i && (s[a] = e(i[t], o));
              }
              return s;
            };
            Object.defineProperty(e, "exports", {
              enumerable: !0,
              get: function () {
                const e = new Map(),
                  t = {
                    modifier: {
                      reset: [0, 0],
                      bold: [1, 22],
                      dim: [2, 22],
                      italic: [3, 23],
                      underline: [4, 24],
                      inverse: [7, 27],
                      hidden: [8, 28],
                      strikethrough: [9, 29],
                    },
                    color: {
                      black: [30, 39],
                      red: [31, 39],
                      green: [32, 39],
                      yellow: [33, 39],
                      blue: [34, 39],
                      magenta: [35, 39],
                      cyan: [36, 39],
                      white: [37, 39],
                      blackBright: [90, 39],
                      redBright: [91, 39],
                      greenBright: [92, 39],
                      yellowBright: [93, 39],
                      blueBright: [94, 39],
                      magentaBright: [95, 39],
                      cyanBright: [96, 39],
                      whiteBright: [97, 39],
                    },
                    bgColor: {
                      bgBlack: [40, 49],
                      bgRed: [41, 49],
                      bgGreen: [42, 49],
                      bgYellow: [43, 49],
                      bgBlue: [44, 49],
                      bgMagenta: [45, 49],
                      bgCyan: [46, 49],
                      bgWhite: [47, 49],
                      bgBlackBright: [100, 49],
                      bgRedBright: [101, 49],
                      bgGreenBright: [102, 49],
                      bgYellowBright: [103, 49],
                      bgBlueBright: [104, 49],
                      bgMagentaBright: [105, 49],
                      bgCyanBright: [106, 49],
                      bgWhiteBright: [107, 49],
                    },
                  };
                (t.color.gray = t.color.blackBright),
                  (t.bgColor.bgGray = t.bgColor.bgBlackBright),
                  (t.color.grey = t.color.blackBright),
                  (t.bgColor.bgGrey = t.bgColor.bgBlackBright);
                for (const [n, r] of Object.entries(t)) {
                  for (const [n, i] of Object.entries(r))
                    (t[n] = { open: `[${i[0]}m`, close: `[${i[1]}m` }),
                      (r[n] = t[n]),
                      e.set(i[0], i[1]);
                  Object.defineProperty(t, n, { value: r, enumerable: !1 });
                }
                return (
                  Object.defineProperty(t, "codes", {
                    value: e,
                    enumerable: !1,
                  }),
                  (t.color.close = "[39m"),
                  (t.bgColor.close = "[49m"),
                  u(t.color, "ansi", () => l(r, "ansi16", s, !1)),
                  u(t.color, "ansi256", () => l(i, "ansi256", s, !1)),
                  u(t.color, "ansi16m", () => l(o, "rgb", a, !1)),
                  u(t.bgColor, "ansi", () => l(r, "ansi16", s, !0)),
                  u(t.bgColor, "ansi256", () => l(i, "ansi256", s, !0)),
                  u(t.bgColor, "ansi16m", () => l(o, "rgb", a, !0)),
                  t
                );
              },
            });
          },
          598: (e) => {
            "use strict";
            e.exports = (e) =>
              e && e.exact
                ? new RegExp("^[\ud800-\udbff][\udc00-\udfff]$")
                : new RegExp("[\ud800-\udbff][\udc00-\udfff]", "g");
          },
          626: (e, t) => {
            "use strict";
            class n {
              constructor(e) {
                (this.tasks = []), (this.count = e);
              }
              sched() {
                if (this.count > 0 && this.tasks.length > 0) {
                  this.count--;
                  let e = this.tasks.shift();
                  if (void 0 === e)
                    throw "Unexpected undefined value in tasks list";
                  e();
                }
              }
              acquire() {
                return new Promise((e, t) => {
                  this.tasks.push(() => {
                    var t = !1;
                    e(() => {
                      t || ((t = !0), this.count++, this.sched());
                    });
                  }),
                    process && process.nextTick
                      ? process.nextTick(this.sched.bind(this))
                      : setImmediate(this.sched.bind(this));
                });
              }
              use(e) {
                return this.acquire().then((t) =>
                  e()
                    .then((e) => (t(), e))
                    .catch((e) => {
                      throw (t(), e);
                    })
                );
              }
            }
            t.W = class extends n {
              constructor() {
                super(1);
              }
            };
          },
          168: (e, t, n) => {
            "use strict";
            var r = n(715),
              i = process.env;
            function o(e) {
              return "string" == typeof e
                ? !!i[e]
                : Object.keys(e).every(function (t) {
                    return i[t] === e[t];
                  });
            }
            Object.defineProperty(t, "_vendors", {
              value: r.map(function (e) {
                return e.constant;
              }),
            }),
              (t.name = null),
              (t.isPR = null),
              r.forEach(function (e) {
                var n = (Array.isArray(e.env) ? e.env : [e.env]).every(
                  function (e) {
                    return o(e);
                  }
                );
                if (((t[e.constant] = n), n))
                  switch (((t.name = e.name), typeof e.pr)) {
                    case "string":
                      t.isPR = !!i[e.pr];
                      break;
                    case "object":
                      "env" in e.pr
                        ? (t.isPR = e.pr.env in i && i[e.pr.env] !== e.pr.ne)
                        : "any" in e.pr
                        ? (t.isPR = e.pr.any.some(function (e) {
                            return !!i[e];
                          }))
                        : (t.isPR = o(e.pr));
                      break;
                    default:
                      t.isPR = null;
                  }
              }),
              (t.isCI = !!(
                i.CI ||
                i.CONTINUOUS_INTEGRATION ||
                i.BUILD_NUMBER ||
                i.RUN_ID ||
                t.name
              ));
          },
          715: (e) => {
            "use strict";
            e.exports = JSON.parse(
              '[{"name":"AppVeyor","constant":"APPVEYOR","env":"APPVEYOR","pr":"APPVEYOR_PULL_REQUEST_NUMBER"},{"name":"Azure Pipelines","constant":"AZURE_PIPELINES","env":"SYSTEM_TEAMFOUNDATIONCOLLECTIONURI","pr":"SYSTEM_PULLREQUEST_PULLREQUESTID"},{"name":"Bamboo","constant":"BAMBOO","env":"bamboo_planKey"},{"name":"Bitbucket Pipelines","constant":"BITBUCKET","env":"BITBUCKET_COMMIT","pr":"BITBUCKET_PR_ID"},{"name":"Bitrise","constant":"BITRISE","env":"BITRISE_IO","pr":"BITRISE_PULL_REQUEST"},{"name":"Buddy","constant":"BUDDY","env":"BUDDY_WORKSPACE_ID","pr":"BUDDY_EXECUTION_PULL_REQUEST_ID"},{"name":"Buildkite","constant":"BUILDKITE","env":"BUILDKITE","pr":{"env":"BUILDKITE_PULL_REQUEST","ne":"false"}},{"name":"CircleCI","constant":"CIRCLE","env":"CIRCLECI","pr":"CIRCLE_PULL_REQUEST"},{"name":"Cirrus CI","constant":"CIRRUS","env":"CIRRUS_CI","pr":"CIRRUS_PR"},{"name":"AWS CodeBuild","constant":"CODEBUILD","env":"CODEBUILD_BUILD_ARN"},{"name":"Codeship","constant":"CODESHIP","env":{"CI_NAME":"codeship"}},{"name":"Drone","constant":"DRONE","env":"DRONE","pr":{"DRONE_BUILD_EVENT":"pull_request"}},{"name":"dsari","constant":"DSARI","env":"DSARI"},{"name":"GitLab CI","constant":"GITLAB","env":"GITLAB_CI"},{"name":"GoCD","constant":"GOCD","env":"GO_PIPELINE_LABEL"},{"name":"Hudson","constant":"HUDSON","env":"HUDSON_URL"},{"name":"Jenkins","constant":"JENKINS","env":["JENKINS_URL","BUILD_ID"],"pr":{"any":["ghprbPullId","CHANGE_ID"]}},{"name":"Magnum CI","constant":"MAGNUM","env":"MAGNUM"},{"name":"Netlify CI","constant":"NETLIFY","env":"NETLIFY_BUILD_BASE","pr":{"env":"PULL_REQUEST","ne":"false"}},{"name":"Sail CI","constant":"SAIL","env":"SAILCI","pr":"SAIL_PULL_REQUEST_NUMBER"},{"name":"Semaphore","constant":"SEMAPHORE","env":"SEMAPHORE","pr":"PULL_REQUEST_NUMBER"},{"name":"Shippable","constant":"SHIPPABLE","env":"SHIPPABLE","pr":{"IS_PULL_REQUEST":"true"}},{"name":"Solano CI","constant":"SOLANO","env":"TDDIUM","pr":"TDDIUM_PR_ID"},{"name":"Strider CD","constant":"STRIDER","env":"STRIDER"},{"name":"TaskCluster","constant":"TASKCLUSTER","env":["TASK_ID","RUN_ID"]},{"name":"TeamCity","constant":"TEAMCITY","env":"TEAMCITY_VERSION"},{"name":"Travis CI","constant":"TRAVIS","env":"TRAVIS","pr":{"env":"TRAVIS_PULL_REQUEST","ne":"false"}}]'
            );
          },
          801: (e, t, n) => {
            const r = n(454),
              i = {};
            for (const e of Object.keys(r)) i[r[e]] = e;
            const o = {
              rgb: { channels: 3, labels: "rgb" },
              hsl: { channels: 3, labels: "hsl" },
              hsv: { channels: 3, labels: "hsv" },
              hwb: { channels: 3, labels: "hwb" },
              cmyk: { channels: 4, labels: "cmyk" },
              xyz: { channels: 3, labels: "xyz" },
              lab: { channels: 3, labels: "lab" },
              lch: { channels: 3, labels: "lch" },
              hex: { channels: 1, labels: ["hex"] },
              keyword: { channels: 1, labels: ["keyword"] },
              ansi16: { channels: 1, labels: ["ansi16"] },
              ansi256: { channels: 1, labels: ["ansi256"] },
              hcg: { channels: 3, labels: ["h", "c", "g"] },
              apple: { channels: 3, labels: ["r16", "g16", "b16"] },
              gray: { channels: 1, labels: ["gray"] },
            };
            e.exports = o;
            for (const e of Object.keys(o)) {
              if (!("channels" in o[e]))
                throw new Error("missing channels property: " + e);
              if (!("labels" in o[e]))
                throw new Error("missing channel labels property: " + e);
              if (o[e].labels.length !== o[e].channels)
                throw new Error("channel and label counts mismatch: " + e);
              const { channels: t, labels: n } = o[e];
              delete o[e].channels,
                delete o[e].labels,
                Object.defineProperty(o[e], "channels", { value: t }),
                Object.defineProperty(o[e], "labels", { value: n });
            }
            (o.rgb.hsl = function (e) {
              const t = e[0] / 255,
                n = e[1] / 255,
                r = e[2] / 255,
                i = Math.min(t, n, r),
                o = Math.max(t, n, r),
                s = o - i;
              let a, u;
              o === i
                ? (a = 0)
                : t === o
                ? (a = (n - r) / s)
                : n === o
                ? (a = 2 + (r - t) / s)
                : r === o && (a = 4 + (t - n) / s),
                (a = Math.min(60 * a, 360)),
                a < 0 && (a += 360);
              const c = (i + o) / 2;
              return (
                (u = o === i ? 0 : c <= 0.5 ? s / (o + i) : s / (2 - o - i)),
                [a, 100 * u, 100 * c]
              );
            }),
              (o.rgb.hsv = function (e) {
                let t, n, r, i, o;
                const s = e[0] / 255,
                  a = e[1] / 255,
                  u = e[2] / 255,
                  c = Math.max(s, a, u),
                  l = c - Math.min(s, a, u),
                  p = function (e) {
                    return (c - e) / 6 / l + 0.5;
                  };
                return (
                  0 === l
                    ? ((i = 0), (o = 0))
                    : ((o = l / c),
                      (t = p(s)),
                      (n = p(a)),
                      (r = p(u)),
                      s === c
                        ? (i = r - n)
                        : a === c
                        ? (i = 1 / 3 + t - r)
                        : u === c && (i = 2 / 3 + n - t),
                      i < 0 ? (i += 1) : i > 1 && (i -= 1)),
                  [360 * i, 100 * o, 100 * c]
                );
              }),
              (o.rgb.hwb = function (e) {
                const t = e[0],
                  n = e[1];
                let r = e[2];
                const i = o.rgb.hsl(e)[0],
                  s = (1 / 255) * Math.min(t, Math.min(n, r));
                return (
                  (r = 1 - (1 / 255) * Math.max(t, Math.max(n, r))),
                  [i, 100 * s, 100 * r]
                );
              }),
              (o.rgb.cmyk = function (e) {
                const t = e[0] / 255,
                  n = e[1] / 255,
                  r = e[2] / 255,
                  i = Math.min(1 - t, 1 - n, 1 - r);
                return [
                  100 * ((1 - t - i) / (1 - i) || 0),
                  100 * ((1 - n - i) / (1 - i) || 0),
                  100 * ((1 - r - i) / (1 - i) || 0),
                  100 * i,
                ];
              }),
              (o.rgb.keyword = function (e) {
                const t = i[e];
                if (t) return t;
                let n,
                  o = 1 / 0;
                for (const t of Object.keys(r)) {
                  const i = r[t],
                    u =
                      ((a = i),
                      ((s = e)[0] - a[0]) ** 2 +
                        (s[1] - a[1]) ** 2 +
                        (s[2] - a[2]) ** 2);
                  u < o && ((o = u), (n = t));
                }
                var s, a;
                return n;
              }),
              (o.keyword.rgb = function (e) {
                return r[e];
              }),
              (o.rgb.xyz = function (e) {
                let t = e[0] / 255,
                  n = e[1] / 255,
                  r = e[2] / 255;
                (t = t > 0.04045 ? ((t + 0.055) / 1.055) ** 2.4 : t / 12.92),
                  (n = n > 0.04045 ? ((n + 0.055) / 1.055) ** 2.4 : n / 12.92),
                  (r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92);
                return [
                  100 * (0.4124 * t + 0.3576 * n + 0.1805 * r),
                  100 * (0.2126 * t + 0.7152 * n + 0.0722 * r),
                  100 * (0.0193 * t + 0.1192 * n + 0.9505 * r),
                ];
              }),
              (o.rgb.lab = function (e) {
                const t = o.rgb.xyz(e);
                let n = t[0],
                  r = t[1],
                  i = t[2];
                (n /= 95.047),
                  (r /= 100),
                  (i /= 108.883),
                  (n = n > 0.008856 ? n ** (1 / 3) : 7.787 * n + 16 / 116),
                  (r = r > 0.008856 ? r ** (1 / 3) : 7.787 * r + 16 / 116),
                  (i = i > 0.008856 ? i ** (1 / 3) : 7.787 * i + 16 / 116);
                return [116 * r - 16, 500 * (n - r), 200 * (r - i)];
              }),
              (o.hsl.rgb = function (e) {
                const t = e[0] / 360,
                  n = e[1] / 100,
                  r = e[2] / 100;
                let i, o, s;
                if (0 === n) return (s = 255 * r), [s, s, s];
                i = r < 0.5 ? r * (1 + n) : r + n - r * n;
                const a = 2 * r - i,
                  u = [0, 0, 0];
                for (let e = 0; e < 3; e++)
                  (o = t + (1 / 3) * -(e - 1)),
                    o < 0 && o++,
                    o > 1 && o--,
                    (s =
                      6 * o < 1
                        ? a + 6 * (i - a) * o
                        : 2 * o < 1
                        ? i
                        : 3 * o < 2
                        ? a + (i - a) * (2 / 3 - o) * 6
                        : a),
                    (u[e] = 255 * s);
                return u;
              }),
              (o.hsl.hsv = function (e) {
                const t = e[0];
                let n = e[1] / 100,
                  r = e[2] / 100,
                  i = n;
                const o = Math.max(r, 0.01);
                (r *= 2), (n *= r <= 1 ? r : 2 - r), (i *= o <= 1 ? o : 2 - o);
                return [
                  t,
                  100 * (0 === r ? (2 * i) / (o + i) : (2 * n) / (r + n)),
                  100 * ((r + n) / 2),
                ];
              }),
              (o.hsv.rgb = function (e) {
                const t = e[0] / 60,
                  n = e[1] / 100;
                let r = e[2] / 100;
                const i = Math.floor(t) % 6,
                  o = t - Math.floor(t),
                  s = 255 * r * (1 - n),
                  a = 255 * r * (1 - n * o),
                  u = 255 * r * (1 - n * (1 - o));
                switch (((r *= 255), i)) {
                  case 0:
                    return [r, u, s];
                  case 1:
                    return [a, r, s];
                  case 2:
                    return [s, r, u];
                  case 3:
                    return [s, a, r];
                  case 4:
                    return [u, s, r];
                  case 5:
                    return [r, s, a];
                }
              }),
              (o.hsv.hsl = function (e) {
                const t = e[0],
                  n = e[1] / 100,
                  r = e[2] / 100,
                  i = Math.max(r, 0.01);
                let o, s;
                s = (2 - n) * r;
                const a = (2 - n) * i;
                return (
                  (o = n * i),
                  (o /= a <= 1 ? a : 2 - a),
                  (o = o || 0),
                  (s /= 2),
                  [t, 100 * o, 100 * s]
                );
              }),
              (o.hwb.rgb = function (e) {
                const t = e[0] / 360;
                let n = e[1] / 100,
                  r = e[2] / 100;
                const i = n + r;
                let o;
                i > 1 && ((n /= i), (r /= i));
                const s = Math.floor(6 * t),
                  a = 1 - r;
                (o = 6 * t - s), 0 != (1 & s) && (o = 1 - o);
                const u = n + o * (a - n);
                let c, l, p;
                switch (s) {
                  default:
                  case 6:
                  case 0:
                    (c = a), (l = u), (p = n);
                    break;
                  case 1:
                    (c = u), (l = a), (p = n);
                    break;
                  case 2:
                    (c = n), (l = a), (p = u);
                    break;
                  case 3:
                    (c = n), (l = u), (p = a);
                    break;
                  case 4:
                    (c = u), (l = n), (p = a);
                    break;
                  case 5:
                    (c = a), (l = n), (p = u);
                }
                return [255 * c, 255 * l, 255 * p];
              }),
              (o.cmyk.rgb = function (e) {
                const t = e[0] / 100,
                  n = e[1] / 100,
                  r = e[2] / 100,
                  i = e[3] / 100;
                return [
                  255 * (1 - Math.min(1, t * (1 - i) + i)),
                  255 * (1 - Math.min(1, n * (1 - i) + i)),
                  255 * (1 - Math.min(1, r * (1 - i) + i)),
                ];
              }),
              (o.xyz.rgb = function (e) {
                const t = e[0] / 100,
                  n = e[1] / 100,
                  r = e[2] / 100;
                let i, o, s;
                return (
                  (i = 3.2406 * t + -1.5372 * n + -0.4986 * r),
                  (o = -0.9689 * t + 1.8758 * n + 0.0415 * r),
                  (s = 0.0557 * t + -0.204 * n + 1.057 * r),
                  (i =
                    i > 0.0031308 ? 1.055 * i ** (1 / 2.4) - 0.055 : 12.92 * i),
                  (o =
                    o > 0.0031308 ? 1.055 * o ** (1 / 2.4) - 0.055 : 12.92 * o),
                  (s =
                    s > 0.0031308 ? 1.055 * s ** (1 / 2.4) - 0.055 : 12.92 * s),
                  (i = Math.min(Math.max(0, i), 1)),
                  (o = Math.min(Math.max(0, o), 1)),
                  (s = Math.min(Math.max(0, s), 1)),
                  [255 * i, 255 * o, 255 * s]
                );
              }),
              (o.xyz.lab = function (e) {
                let t = e[0],
                  n = e[1],
                  r = e[2];
                (t /= 95.047),
                  (n /= 100),
                  (r /= 108.883),
                  (t = t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116),
                  (n = n > 0.008856 ? n ** (1 / 3) : 7.787 * n + 16 / 116),
                  (r = r > 0.008856 ? r ** (1 / 3) : 7.787 * r + 16 / 116);
                return [116 * n - 16, 500 * (t - n), 200 * (n - r)];
              }),
              (o.lab.xyz = function (e) {
                let t, n, r;
                (n = (e[0] + 16) / 116),
                  (t = e[1] / 500 + n),
                  (r = n - e[2] / 200);
                const i = n ** 3,
                  o = t ** 3,
                  s = r ** 3;
                return (
                  (n = i > 0.008856 ? i : (n - 16 / 116) / 7.787),
                  (t = o > 0.008856 ? o : (t - 16 / 116) / 7.787),
                  (r = s > 0.008856 ? s : (r - 16 / 116) / 7.787),
                  (t *= 95.047),
                  (n *= 100),
                  (r *= 108.883),
                  [t, n, r]
                );
              }),
              (o.lab.lch = function (e) {
                const t = e[0],
                  n = e[1],
                  r = e[2];
                let i;
                (i = (360 * Math.atan2(r, n)) / 2 / Math.PI),
                  i < 0 && (i += 360);
                return [t, Math.sqrt(n * n + r * r), i];
              }),
              (o.lch.lab = function (e) {
                const t = e[0],
                  n = e[1],
                  r = (e[2] / 360) * 2 * Math.PI;
                return [t, n * Math.cos(r), n * Math.sin(r)];
              }),
              (o.rgb.ansi16 = function (e, t = null) {
                const [n, r, i] = e;
                let s = null === t ? o.rgb.hsv(e)[2] : t;
                if (((s = Math.round(s / 50)), 0 === s)) return 30;
                let a =
                  30 +
                  ((Math.round(i / 255) << 2) |
                    (Math.round(r / 255) << 1) |
                    Math.round(n / 255));
                return 2 === s && (a += 60), a;
              }),
              (o.hsv.ansi16 = function (e) {
                return o.rgb.ansi16(o.hsv.rgb(e), e[2]);
              }),
              (o.rgb.ansi256 = function (e) {
                const t = e[0],
                  n = e[1],
                  r = e[2];
                if (t === n && n === r)
                  return t < 8
                    ? 16
                    : t > 248
                    ? 231
                    : Math.round(((t - 8) / 247) * 24) + 232;
                return (
                  16 +
                  36 * Math.round((t / 255) * 5) +
                  6 * Math.round((n / 255) * 5) +
                  Math.round((r / 255) * 5)
                );
              }),
              (o.ansi16.rgb = function (e) {
                let t = e % 10;
                if (0 === t || 7 === t)
                  return (
                    e > 50 && (t += 3.5), (t = (t / 10.5) * 255), [t, t, t]
                  );
                const n = 0.5 * (1 + ~~(e > 50));
                return [
                  (1 & t) * n * 255,
                  ((t >> 1) & 1) * n * 255,
                  ((t >> 2) & 1) * n * 255,
                ];
              }),
              (o.ansi256.rgb = function (e) {
                if (e >= 232) {
                  const t = 10 * (e - 232) + 8;
                  return [t, t, t];
                }
                let t;
                e -= 16;
                return [
                  (Math.floor(e / 36) / 5) * 255,
                  (Math.floor((t = e % 36) / 6) / 5) * 255,
                  ((t % 6) / 5) * 255,
                ];
              }),
              (o.rgb.hex = function (e) {
                const t = (
                  ((255 & Math.round(e[0])) << 16) +
                  ((255 & Math.round(e[1])) << 8) +
                  (255 & Math.round(e[2]))
                )
                  .toString(16)
                  .toUpperCase();
                return "000000".substring(t.length) + t;
              }),
              (o.hex.rgb = function (e) {
                const t = e.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
                if (!t) return [0, 0, 0];
                let n = t[0];
                3 === t[0].length &&
                  (n = n
                    .split("")
                    .map((e) => e + e)
                    .join(""));
                const r = parseInt(n, 16);
                return [(r >> 16) & 255, (r >> 8) & 255, 255 & r];
              }),
              (o.rgb.hcg = function (e) {
                const t = e[0] / 255,
                  n = e[1] / 255,
                  r = e[2] / 255,
                  i = Math.max(Math.max(t, n), r),
                  o = Math.min(Math.min(t, n), r),
                  s = i - o;
                let a, u;
                return (
                  (a = s < 1 ? o / (1 - s) : 0),
                  (u =
                    s <= 0
                      ? 0
                      : i === t
                      ? ((n - r) / s) % 6
                      : i === n
                      ? 2 + (r - t) / s
                      : 4 + (t - n) / s),
                  (u /= 6),
                  (u %= 1),
                  [360 * u, 100 * s, 100 * a]
                );
              }),
              (o.hsl.hcg = function (e) {
                const t = e[1] / 100,
                  n = e[2] / 100,
                  r = n < 0.5 ? 2 * t * n : 2 * t * (1 - n);
                let i = 0;
                return (
                  r < 1 && (i = (n - 0.5 * r) / (1 - r)),
                  [e[0], 100 * r, 100 * i]
                );
              }),
              (o.hsv.hcg = function (e) {
                const t = e[1] / 100,
                  n = e[2] / 100,
                  r = t * n;
                let i = 0;
                return (
                  r < 1 && (i = (n - r) / (1 - r)), [e[0], 100 * r, 100 * i]
                );
              }),
              (o.hcg.rgb = function (e) {
                const t = e[0] / 360,
                  n = e[1] / 100,
                  r = e[2] / 100;
                if (0 === n) return [255 * r, 255 * r, 255 * r];
                const i = [0, 0, 0],
                  o = (t % 1) * 6,
                  s = o % 1,
                  a = 1 - s;
                let u = 0;
                switch (Math.floor(o)) {
                  case 0:
                    (i[0] = 1), (i[1] = s), (i[2] = 0);
                    break;
                  case 1:
                    (i[0] = a), (i[1] = 1), (i[2] = 0);
                    break;
                  case 2:
                    (i[0] = 0), (i[1] = 1), (i[2] = s);
                    break;
                  case 3:
                    (i[0] = 0), (i[1] = a), (i[2] = 1);
                    break;
                  case 4:
                    (i[0] = s), (i[1] = 0), (i[2] = 1);
                    break;
                  default:
                    (i[0] = 1), (i[1] = 0), (i[2] = a);
                }
                return (
                  (u = (1 - n) * r),
                  [
                    255 * (n * i[0] + u),
                    255 * (n * i[1] + u),
                    255 * (n * i[2] + u),
                  ]
                );
              }),
              (o.hcg.hsv = function (e) {
                const t = e[1] / 100,
                  n = t + (e[2] / 100) * (1 - t);
                let r = 0;
                return n > 0 && (r = t / n), [e[0], 100 * r, 100 * n];
              }),
              (o.hcg.hsl = function (e) {
                const t = e[1] / 100,
                  n = (e[2] / 100) * (1 - t) + 0.5 * t;
                let r = 0;
                return (
                  n > 0 && n < 0.5
                    ? (r = t / (2 * n))
                    : n >= 0.5 && n < 1 && (r = t / (2 * (1 - n))),
                  [e[0], 100 * r, 100 * n]
                );
              }),
              (o.hcg.hwb = function (e) {
                const t = e[1] / 100,
                  n = t + (e[2] / 100) * (1 - t);
                return [e[0], 100 * (n - t), 100 * (1 - n)];
              }),
              (o.hwb.hcg = function (e) {
                const t = e[1] / 100,
                  n = 1 - e[2] / 100,
                  r = n - t;
                let i = 0;
                return (
                  r < 1 && (i = (n - r) / (1 - r)), [e[0], 100 * r, 100 * i]
                );
              }),
              (o.apple.rgb = function (e) {
                return [
                  (e[0] / 65535) * 255,
                  (e[1] / 65535) * 255,
                  (e[2] / 65535) * 255,
                ];
              }),
              (o.rgb.apple = function (e) {
                return [
                  (e[0] / 255) * 65535,
                  (e[1] / 255) * 65535,
                  (e[2] / 255) * 65535,
                ];
              }),
              (o.gray.rgb = function (e) {
                return [
                  (e[0] / 100) * 255,
                  (e[0] / 100) * 255,
                  (e[0] / 100) * 255,
                ];
              }),
              (o.gray.hsl = function (e) {
                return [0, 0, e[0]];
              }),
              (o.gray.hsv = o.gray.hsl),
              (o.gray.hwb = function (e) {
                return [0, 100, e[0]];
              }),
              (o.gray.cmyk = function (e) {
                return [0, 0, 0, e[0]];
              }),
              (o.gray.lab = function (e) {
                return [e[0], 0, 0];
              }),
              (o.gray.hex = function (e) {
                const t = 255 & Math.round((e[0] / 100) * 255),
                  n = ((t << 16) + (t << 8) + t).toString(16).toUpperCase();
                return "000000".substring(n.length) + n;
              }),
              (o.rgb.gray = function (e) {
                return [((e[0] + e[1] + e[2]) / 3 / 255) * 100];
              });
          },
          108: (e, t, n) => {
            const r = n(801),
              i = n(525),
              o = {};
            Object.keys(r).forEach((e) => {
              (o[e] = {}),
                Object.defineProperty(o[e], "channels", {
                  value: r[e].channels,
                }),
                Object.defineProperty(o[e], "labels", { value: r[e].labels });
              const t = i(e);
              Object.keys(t).forEach((n) => {
                const r = t[n];
                (o[e][n] = (function (e) {
                  const t = function (...t) {
                    const n = t[0];
                    if (null == n) return n;
                    n.length > 1 && (t = n);
                    const r = e(t);
                    if ("object" == typeof r)
                      for (let e = r.length, t = 0; t < e; t++)
                        r[t] = Math.round(r[t]);
                    return r;
                  };
                  return "conversion" in e && (t.conversion = e.conversion), t;
                })(r)),
                  (o[e][n].raw = (function (e) {
                    const t = function (...t) {
                      const n = t[0];
                      return null == n ? n : (n.length > 1 && (t = n), e(t));
                    };
                    return (
                      "conversion" in e && (t.conversion = e.conversion), t
                    );
                  })(r));
              });
            }),
              (e.exports = o);
          },
          525: (e, t, n) => {
            const r = n(801);
            function i(e) {
              const t = (function () {
                  const e = {},
                    t = Object.keys(r);
                  for (let n = t.length, r = 0; r < n; r++)
                    e[t[r]] = { distance: -1, parent: null };
                  return e;
                })(),
                n = [e];
              for (t[e].distance = 0; n.length; ) {
                const e = n.pop(),
                  i = Object.keys(r[e]);
                for (let r = i.length, o = 0; o < r; o++) {
                  const r = i[o],
                    s = t[r];
                  -1 === s.distance &&
                    ((s.distance = t[e].distance + 1),
                    (s.parent = e),
                    n.unshift(r));
                }
              }
              return t;
            }
            function o(e, t) {
              return function (n) {
                return t(e(n));
              };
            }
            function s(e, t) {
              const n = [t[e].parent, e];
              let i = r[t[e].parent][e],
                s = t[e].parent;
              for (; t[s].parent; )
                n.unshift(t[s].parent),
                  (i = o(r[t[s].parent][s], i)),
                  (s = t[s].parent);
              return (i.conversion = n), i;
            }
            e.exports = function (e) {
              const t = i(e),
                n = {},
                r = Object.keys(t);
              for (let e = r.length, i = 0; i < e; i++) {
                const e = r[i];
                null !== t[e].parent && (n[e] = s(e, t));
              }
              return n;
            };
          },
          454: (e) => {
            "use strict";
            e.exports = {
              aliceblue: [240, 248, 255],
              antiquewhite: [250, 235, 215],
              aqua: [0, 255, 255],
              aquamarine: [127, 255, 212],
              azure: [240, 255, 255],
              beige: [245, 245, 220],
              bisque: [255, 228, 196],
              black: [0, 0, 0],
              blanchedalmond: [255, 235, 205],
              blue: [0, 0, 255],
              blueviolet: [138, 43, 226],
              brown: [165, 42, 42],
              burlywood: [222, 184, 135],
              cadetblue: [95, 158, 160],
              chartreuse: [127, 255, 0],
              chocolate: [210, 105, 30],
              coral: [255, 127, 80],
              cornflowerblue: [100, 149, 237],
              cornsilk: [255, 248, 220],
              crimson: [220, 20, 60],
              cyan: [0, 255, 255],
              darkblue: [0, 0, 139],
              darkcyan: [0, 139, 139],
              darkgoldenrod: [184, 134, 11],
              darkgray: [169, 169, 169],
              darkgreen: [0, 100, 0],
              darkgrey: [169, 169, 169],
              darkkhaki: [189, 183, 107],
              darkmagenta: [139, 0, 139],
              darkolivegreen: [85, 107, 47],
              darkorange: [255, 140, 0],
              darkorchid: [153, 50, 204],
              darkred: [139, 0, 0],
              darksalmon: [233, 150, 122],
              darkseagreen: [143, 188, 143],
              darkslateblue: [72, 61, 139],
              darkslategray: [47, 79, 79],
              darkslategrey: [47, 79, 79],
              darkturquoise: [0, 206, 209],
              darkviolet: [148, 0, 211],
              deeppink: [255, 20, 147],
              deepskyblue: [0, 191, 255],
              dimgray: [105, 105, 105],
              dimgrey: [105, 105, 105],
              dodgerblue: [30, 144, 255],
              firebrick: [178, 34, 34],
              floralwhite: [255, 250, 240],
              forestgreen: [34, 139, 34],
              fuchsia: [255, 0, 255],
              gainsboro: [220, 220, 220],
              ghostwhite: [248, 248, 255],
              gold: [255, 215, 0],
              goldenrod: [218, 165, 32],
              gray: [128, 128, 128],
              green: [0, 128, 0],
              greenyellow: [173, 255, 47],
              grey: [128, 128, 128],
              honeydew: [240, 255, 240],
              hotpink: [255, 105, 180],
              indianred: [205, 92, 92],
              indigo: [75, 0, 130],
              ivory: [255, 255, 240],
              khaki: [240, 230, 140],
              lavender: [230, 230, 250],
              lavenderblush: [255, 240, 245],
              lawngreen: [124, 252, 0],
              lemonchiffon: [255, 250, 205],
              lightblue: [173, 216, 230],
              lightcoral: [240, 128, 128],
              lightcyan: [224, 255, 255],
              lightgoldenrodyellow: [250, 250, 210],
              lightgray: [211, 211, 211],
              lightgreen: [144, 238, 144],
              lightgrey: [211, 211, 211],
              lightpink: [255, 182, 193],
              lightsalmon: [255, 160, 122],
              lightseagreen: [32, 178, 170],
              lightskyblue: [135, 206, 250],
              lightslategray: [119, 136, 153],
              lightslategrey: [119, 136, 153],
              lightsteelblue: [176, 196, 222],
              lightyellow: [255, 255, 224],
              lime: [0, 255, 0],
              limegreen: [50, 205, 50],
              linen: [250, 240, 230],
              magenta: [255, 0, 255],
              maroon: [128, 0, 0],
              mediumaquamarine: [102, 205, 170],
              mediumblue: [0, 0, 205],
              mediumorchid: [186, 85, 211],
              mediumpurple: [147, 112, 219],
              mediumseagreen: [60, 179, 113],
              mediumslateblue: [123, 104, 238],
              mediumspringgreen: [0, 250, 154],
              mediumturquoise: [72, 209, 204],
              mediumvioletred: [199, 21, 133],
              midnightblue: [25, 25, 112],
              mintcream: [245, 255, 250],
              mistyrose: [255, 228, 225],
              moccasin: [255, 228, 181],
              navajowhite: [255, 222, 173],
              navy: [0, 0, 128],
              oldlace: [253, 245, 230],
              olive: [128, 128, 0],
              olivedrab: [107, 142, 35],
              orange: [255, 165, 0],
              orangered: [255, 69, 0],
              orchid: [218, 112, 214],
              palegoldenrod: [238, 232, 170],
              palegreen: [152, 251, 152],
              paleturquoise: [175, 238, 238],
              palevioletred: [219, 112, 147],
              papayawhip: [255, 239, 213],
              peachpuff: [255, 218, 185],
              peru: [205, 133, 63],
              pink: [255, 192, 203],
              plum: [221, 160, 221],
              powderblue: [176, 224, 230],
              purple: [128, 0, 128],
              rebeccapurple: [102, 51, 153],
              red: [255, 0, 0],
              rosybrown: [188, 143, 143],
              royalblue: [65, 105, 225],
              saddlebrown: [139, 69, 19],
              salmon: [250, 128, 114],
              sandybrown: [244, 164, 96],
              seagreen: [46, 139, 87],
              seashell: [255, 245, 238],
              sienna: [160, 82, 45],
              silver: [192, 192, 192],
              skyblue: [135, 206, 235],
              slateblue: [106, 90, 205],
              slategray: [112, 128, 144],
              slategrey: [112, 128, 144],
              snow: [255, 250, 250],
              springgreen: [0, 255, 127],
              steelblue: [70, 130, 180],
              tan: [210, 180, 140],
              teal: [0, 128, 128],
              thistle: [216, 191, 216],
              tomato: [255, 99, 71],
              turquoise: [64, 224, 208],
              violet: [238, 130, 238],
              wheat: [245, 222, 179],
              white: [255, 255, 255],
              whitesmoke: [245, 245, 245],
              yellow: [255, 255, 0],
              yellowgreen: [154, 205, 50],
            };
          },
          188: (e) => {
            "use strict";
            var t = Object.prototype.hasOwnProperty,
              n = "~";
            function r() {}
            function i(e, t, n) {
              (this.fn = e), (this.context = t), (this.once = n || !1);
            }
            function o(e, t, r, o, s) {
              if ("function" != typeof r)
                throw new TypeError("The listener must be a function");
              var a = new i(r, o || e, s),
                u = n ? n + t : t;
              return (
                e._events[u]
                  ? e._events[u].fn
                    ? (e._events[u] = [e._events[u], a])
                    : e._events[u].push(a)
                  : ((e._events[u] = a), e._eventsCount++),
                e
              );
            }
            function s(e, t) {
              0 == --e._eventsCount
                ? (e._events = new r())
                : delete e._events[t];
            }
            function a() {
              (this._events = new r()), (this._eventsCount = 0);
            }
            Object.create &&
              ((r.prototype = Object.create(null)),
              new r().__proto__ || (n = !1)),
              (a.prototype.eventNames = function () {
                var e,
                  r,
                  i = [];
                if (0 === this._eventsCount) return i;
                for (r in (e = this._events))
                  t.call(e, r) && i.push(n ? r.slice(1) : r);
                return Object.getOwnPropertySymbols
                  ? i.concat(Object.getOwnPropertySymbols(e))
                  : i;
              }),
              (a.prototype.listeners = function (e) {
                var t = n ? n + e : e,
                  r = this._events[t];
                if (!r) return [];
                if (r.fn) return [r.fn];
                for (var i = 0, o = r.length, s = new Array(o); i < o; i++)
                  s[i] = r[i].fn;
                return s;
              }),
              (a.prototype.listenerCount = function (e) {
                var t = n ? n + e : e,
                  r = this._events[t];
                return r ? (r.fn ? 1 : r.length) : 0;
              }),
              (a.prototype.emit = function (e, t, r, i, o, s) {
                var a = n ? n + e : e;
                if (!this._events[a]) return !1;
                var u,
                  c,
                  l = this._events[a],
                  p = arguments.length;
                if (l.fn) {
                  switch (
                    (l.once && this.removeListener(e, l.fn, void 0, !0), p)
                  ) {
                    case 1:
                      return l.fn.call(l.context), !0;
                    case 2:
                      return l.fn.call(l.context, t), !0;
                    case 3:
                      return l.fn.call(l.context, t, r), !0;
                    case 4:
                      return l.fn.call(l.context, t, r, i), !0;
                    case 5:
                      return l.fn.call(l.context, t, r, i, o), !0;
                    case 6:
                      return l.fn.call(l.context, t, r, i, o, s), !0;
                  }
                  for (c = 1, u = new Array(p - 1); c < p; c++)
                    u[c - 1] = arguments[c];
                  l.fn.apply(l.context, u);
                } else {
                  var d,
                    h = l.length;
                  for (c = 0; c < h; c++)
                    switch (
                      (l[c].once && this.removeListener(e, l[c].fn, void 0, !0),
                      p)
                    ) {
                      case 1:
                        l[c].fn.call(l[c].context);
                        break;
                      case 2:
                        l[c].fn.call(l[c].context, t);
                        break;
                      case 3:
                        l[c].fn.call(l[c].context, t, r);
                        break;
                      case 4:
                        l[c].fn.call(l[c].context, t, r, i);
                        break;
                      default:
                        if (!u)
                          for (d = 1, u = new Array(p - 1); d < p; d++)
                            u[d - 1] = arguments[d];
                        l[c].fn.apply(l[c].context, u);
                    }
                }
                return !0;
              }),
              (a.prototype.on = function (e, t, n) {
                return o(this, e, t, n, !1);
              }),
              (a.prototype.once = function (e, t, n) {
                return o(this, e, t, n, !0);
              }),
              (a.prototype.removeListener = function (e, t, r, i) {
                var o = n ? n + e : e;
                if (!this._events[o]) return this;
                if (!t) return s(this, o), this;
                var a = this._events[o];
                if (a.fn)
                  a.fn !== t ||
                    (i && !a.once) ||
                    (r && a.context !== r) ||
                    s(this, o);
                else {
                  for (var u = 0, c = [], l = a.length; u < l; u++)
                    (a[u].fn !== t ||
                      (i && !a[u].once) ||
                      (r && a[u].context !== r)) &&
                      c.push(a[u]);
                  c.length
                    ? (this._events[o] = 1 === c.length ? c[0] : c)
                    : s(this, o);
                }
                return this;
              }),
              (a.prototype.removeAllListeners = function (e) {
                var t;
                return (
                  e
                    ? ((t = n ? n + e : e), this._events[t] && s(this, t))
                    : ((this._events = new r()), (this._eventsCount = 0)),
                  this
                );
              }),
              (a.prototype.off = a.prototype.removeListener),
              (a.prototype.addListener = a.prototype.on),
              (a.prefixed = n),
              (a.EventEmitter = a),
              (e.exports = a);
          },
          76: (e, t, n) => {
            "use strict";
            e.exports = n(168).isCI;
          },
          917: (e) => {
            "use strict";
            const t = (e) =>
              !Number.isNaN(e) &&
              e >= 4352 &&
              (e <= 4447 ||
                9001 === e ||
                9002 === e ||
                (11904 <= e && e <= 12871 && 12351 !== e) ||
                (12880 <= e && e <= 19903) ||
                (19968 <= e && e <= 42182) ||
                (43360 <= e && e <= 43388) ||
                (44032 <= e && e <= 55203) ||
                (63744 <= e && e <= 64255) ||
                (65040 <= e && e <= 65049) ||
                (65072 <= e && e <= 65131) ||
                (65281 <= e && e <= 65376) ||
                (65504 <= e && e <= 65510) ||
                (110592 <= e && e <= 110593) ||
                (127488 <= e && e <= 127569) ||
                (131072 <= e && e <= 262141));
            (e.exports = t), (e.exports.default = t);
          },
          82: (e) => {
            "use strict";
            e.exports = (e, t) => (
              (t = t || (() => {})),
              e.then(
                (e) =>
                  new Promise((e) => {
                    e(t());
                  }).then(() => e),
                (e) =>
                  new Promise((e) => {
                    e(t());
                  }).then(() => {
                    throw e;
                  })
              )
            );
          },
          251: (e, t, n) => {
            "use strict";
            const r = n(504),
              i = (e) => {
                if ((!Number.isInteger(e) && e !== 1 / 0) || !(e > 0))
                  return Promise.reject(
                    new TypeError(
                      "Expected `concurrency` to be a number from 1 and up"
                    )
                  );
                const t = [];
                let n = 0;
                const i = () => {
                    n--, t.length > 0 && t.shift()();
                  },
                  o = (e, t, ...o) => {
                    n++;
                    const s = r(e, ...o);
                    t(s), s.then(i, i);
                  },
                  s = (r, ...i) =>
                    new Promise((s) =>
                      ((r, i, ...s) => {
                        n < e
                          ? o(r, i, ...s)
                          : t.push(o.bind(null, r, i, ...s));
                      })(r, s, ...i)
                    );
                return (
                  Object.defineProperties(s, {
                    activeCount: { get: () => n },
                    pendingCount: { get: () => t.length },
                    clearQueue: {
                      value: () => {
                        t.length = 0;
                      },
                    },
                  }),
                  s
                );
              };
            (e.exports = i), (e.exports.default = i);
          },
          245: (e, t, n) => {
            "use strict";
            const r = n(188),
              i = n(839),
              o = n(806),
              s = () => {},
              a = new i.TimeoutError();
            t.Z = class extends r {
              constructor(e) {
                if (
                  (super(),
                  Object.defineProperty(this, "_carryoverConcurrencyCount", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_isIntervalIgnored", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_intervalCount", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: 0,
                  }),
                  Object.defineProperty(this, "_intervalCap", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_interval", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_intervalEnd", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: 0,
                  }),
                  Object.defineProperty(this, "_intervalId", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_timeoutId", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_queue", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_queueClass", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_pendingCount", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: 0,
                  }),
                  Object.defineProperty(this, "_concurrency", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_isPaused", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_resolveEmpty", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: s,
                  }),
                  Object.defineProperty(this, "_resolveIdle", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: s,
                  }),
                  Object.defineProperty(this, "_timeout", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  Object.defineProperty(this, "_throwOnTimeout", {
                    enumerable: !0,
                    configurable: !0,
                    writable: !0,
                    value: void 0,
                  }),
                  !(
                    "number" ==
                      typeof (e = Object.assign(
                        {
                          carryoverConcurrencyCount: !1,
                          intervalCap: 1 / 0,
                          interval: 0,
                          concurrency: 1 / 0,
                          autoStart: !0,
                          queueClass: o.default,
                        },
                        e
                      )).intervalCap && e.intervalCap >= 1
                  ))
                )
                  throw new TypeError(
                    `Expected \`intervalCap\` to be a number from 1 and up, got \`${
                      e.intervalCap
                    }\` (${typeof e.intervalCap})`
                  );
                if (
                  void 0 === e.interval ||
                  !(Number.isFinite(e.interval) && e.interval >= 0)
                )
                  throw new TypeError(
                    `Expected \`interval\` to be a finite number >= 0, got \`${
                      e.interval
                    }\` (${typeof e.interval})`
                  );
                (this._carryoverConcurrencyCount = e.carryoverConcurrencyCount),
                  (this._isIntervalIgnored =
                    e.intervalCap === 1 / 0 || 0 === e.interval),
                  (this._intervalCap = e.intervalCap),
                  (this._interval = e.interval),
                  (this._queue = new e.queueClass()),
                  (this._queueClass = e.queueClass),
                  (this.concurrency = e.concurrency),
                  (this._timeout = e.timeout),
                  (this._throwOnTimeout = !0 === e.throwOnTimeout),
                  (this._isPaused = !1 === e.autoStart);
              }
              get _doesIntervalAllowAnother() {
                return (
                  this._isIntervalIgnored ||
                  this._intervalCount < this._intervalCap
                );
              }
              get _doesConcurrentAllowAnother() {
                return this._pendingCount < this._concurrency;
              }
              _next() {
                this._pendingCount--, this._tryToStartAnother();
              }
              _resolvePromises() {
                this._resolveEmpty(),
                  (this._resolveEmpty = s),
                  0 === this._pendingCount &&
                    (this._resolveIdle(), (this._resolveIdle = s));
              }
              _onResumeInterval() {
                this._onInterval(),
                  this._initializeIntervalIfNeeded(),
                  (this._timeoutId = void 0);
              }
              _isIntervalPaused() {
                const e = Date.now();
                if (void 0 === this._intervalId) {
                  const t = this._intervalEnd - e;
                  if (!(t < 0))
                    return (
                      void 0 === this._timeoutId &&
                        (this._timeoutId = setTimeout(() => {
                          this._onResumeInterval();
                        }, t)),
                      !0
                    );
                  this._intervalCount = this._carryoverConcurrencyCount
                    ? this._pendingCount
                    : 0;
                }
                return !1;
              }
              _tryToStartAnother() {
                if (0 === this._queue.size)
                  return (
                    this._intervalId && clearInterval(this._intervalId),
                    (this._intervalId = void 0),
                    this._resolvePromises(),
                    !1
                  );
                if (!this._isPaused) {
                  const e = !this._isIntervalPaused();
                  if (
                    this._doesIntervalAllowAnother &&
                    this._doesConcurrentAllowAnother
                  )
                    return (
                      this.emit("active"),
                      this._queue.dequeue()(),
                      e && this._initializeIntervalIfNeeded(),
                      !0
                    );
                }
                return !1;
              }
              _initializeIntervalIfNeeded() {
                this._isIntervalIgnored ||
                  void 0 !== this._intervalId ||
                  ((this._intervalId = setInterval(() => {
                    this._onInterval();
                  }, this._interval)),
                  (this._intervalEnd = Date.now() + this._interval));
              }
              _onInterval() {
                0 === this._intervalCount &&
                  0 === this._pendingCount &&
                  this._intervalId &&
                  (clearInterval(this._intervalId),
                  (this._intervalId = void 0)),
                  (this._intervalCount = this._carryoverConcurrencyCount
                    ? this._pendingCount
                    : 0),
                  this._processQueue();
              }
              _processQueue() {
                for (; this._tryToStartAnother(); );
              }
              get concurrency() {
                return this._concurrency;
              }
              set concurrency(e) {
                if (!("number" == typeof e && e >= 1))
                  throw new TypeError(
                    `Expected \`concurrency\` to be a number from 1 and up, got \`${e}\` (${typeof e})`
                  );
                (this._concurrency = e), this._processQueue();
              }
              async add(e, t = {}) {
                return new Promise((n, r) => {
                  this._queue.enqueue(async () => {
                    this._pendingCount++, this._intervalCount++;
                    try {
                      const o =
                        void 0 === this._timeout && void 0 === t.timeout
                          ? e()
                          : i.default(
                              Promise.resolve(e()),
                              void 0 === t.timeout ? this._timeout : t.timeout,
                              () => {
                                (void 0 === t.throwOnTimeout
                                  ? this._throwOnTimeout
                                  : t.throwOnTimeout) && r(a);
                              }
                            );
                      n(await o);
                    } catch (e) {
                      r(e);
                    }
                    this._next();
                  }, t),
                    this._tryToStartAnother();
                });
              }
              async addAll(e, t) {
                return Promise.all(e.map(async (e) => this.add(e, t)));
              }
              start() {
                return this._isPaused
                  ? ((this._isPaused = !1), this._processQueue(), this)
                  : this;
              }
              pause() {
                this._isPaused = !0;
              }
              clear() {
                this._queue = new this._queueClass();
              }
              async onEmpty() {
                if (0 !== this._queue.size)
                  return new Promise((e) => {
                    const t = this._resolveEmpty;
                    this._resolveEmpty = () => {
                      t(), e();
                    };
                  });
              }
              async onIdle() {
                if (0 !== this._pendingCount || 0 !== this._queue.size)
                  return new Promise((e) => {
                    const t = this._resolveIdle;
                    this._resolveIdle = () => {
                      t(), e();
                    };
                  });
              }
              get size() {
                return this._queue.size;
              }
              sizeBy(e) {
                return this._queue.filter(e).length;
              }
              get pending() {
                return this._pendingCount;
              }
              get isPaused() {
                return this._isPaused;
              }
              set timeout(e) {
                this._timeout = e;
              }
              get timeout() {
                return this._timeout;
              }
            };
          },
          866: (e, t) => {
            "use strict";
            Object.defineProperty(t, "__esModule", { value: !0 }),
              (t.default = function (e, t, n) {
                let r = 0,
                  i = e.length;
                for (; i > 0; ) {
                  const o = (i / 2) | 0;
                  let s = r + o;
                  n(e[s], t) <= 0 ? ((r = ++s), (i -= o + 1)) : (i = o);
                }
                return r;
              });
          },
          806: (e, t, n) => {
            "use strict";
            Object.defineProperty(t, "__esModule", { value: !0 });
            const r = n(866);
            t.default = class {
              constructor() {
                Object.defineProperty(this, "_queue", {
                  enumerable: !0,
                  configurable: !0,
                  writable: !0,
                  value: [],
                });
              }
              enqueue(e, t) {
                const n = {
                  priority: (t = Object.assign({ priority: 0 }, t)).priority,
                  run: e,
                };
                if (
                  this.size &&
                  this._queue[this.size - 1].priority >= t.priority
                )
                  return void this._queue.push(n);
                const i = r.default(
                  this._queue,
                  n,
                  (e, t) => t.priority - e.priority
                );
                this._queue.splice(i, 0, n);
              }
              dequeue() {
                const e = this._queue.shift();
                return e && e.run;
              }
              filter(e) {
                return this._queue
                  .filter((t) => t.priority === e.priority)
                  .map((e) => e.run);
              }
              get size() {
                return this._queue.length;
              }
            };
          },
          839: (e, t, n) => {
            "use strict";
            const r = n(82);
            class i extends Error {
              constructor(e) {
                super(e), (this.name = "TimeoutError");
              }
            }
            const o = (e, t, n) =>
              new Promise((o, s) => {
                if ("number" != typeof t || t < 0)
                  throw new TypeError(
                    "Expected `milliseconds` to be a positive number"
                  );
                if (t === 1 / 0) return void o(e);
                const a = setTimeout(() => {
                  if ("function" == typeof n) {
                    try {
                      o(n());
                    } catch (e) {
                      s(e);
                    }
                    return;
                  }
                  const r =
                    n instanceof Error
                      ? n
                      : new i(
                          "string" == typeof n
                            ? n
                            : `Promise timed out after ${t} milliseconds`
                        );
                  "function" == typeof e.cancel && e.cancel(), s(r);
                }, t);
                r(e.then(o, s), () => {
                  clearTimeout(a);
                });
              });
            (e.exports = o),
              (e.exports.default = o),
              (e.exports.TimeoutError = i);
          },
          504: (e) => {
            "use strict";
            const t = (e, ...t) =>
              new Promise((n) => {
                n(e(...t));
              });
            (e.exports = t), (e.exports.default = t);
          },
          52: (e, t, n) => {
            "use strict";
            const r = n(917),
              i = n(598),
              o = n(625),
              s = ["", ""],
              a = (e) => `${s[0]}[${e}m`,
              u = (e, t, n) => {
                let r = [];
                e = [...e];
                for (let n of e) {
                  const i = n;
                  n.includes(";") && (n = n.split(";")[0][0] + "0");
                  const s = o.codes.get(Number.parseInt(n, 10));
                  if (s) {
                    const n = e.indexOf(s.toString());
                    -1 === n ? r.push(a(t ? s : i)) : e.splice(n, 1);
                  } else {
                    if (t) {
                      r.push(a(0));
                      break;
                    }
                    r.push(a(i));
                  }
                }
                if (
                  t &&
                  ((r = r.filter((e, t) => r.indexOf(e) === t)), void 0 !== n)
                ) {
                  const e = a(o.codes.get(Number.parseInt(n, 10)));
                  r = r.reduce((t, n) => (n === e ? [n, ...t] : [...t, n]), []);
                }
                return r.join("");
              };
            e.exports = (e, t, n) => {
              const o = [...e],
                a = [];
              let c,
                l = "number" == typeof n ? n : o.length,
                p = !1,
                d = 0,
                h = "";
              for (const [f, g] of o.entries()) {
                let o = !1;
                if (s.includes(g)) {
                  const t = /\d[^m]*/.exec(e.slice(f, f + 18));
                  (c = t && t.length > 0 ? t[0] : void 0),
                    d < l && ((p = !0), void 0 !== c && a.push(c));
                } else p && "m" === g && ((p = !1), (o = !0));
                if (
                  (p || o || d++,
                  !i({ exact: !0 }).test(g) &&
                    r(g.codePointAt()) &&
                    (d++, "number" != typeof n && l++),
                  d > t && d <= l)
                )
                  h += g;
                else if (d !== t || p || void 0 === c) {
                  if (d >= l) {
                    h += u(a, !0, c);
                    break;
                  }
                } else h = u(a);
              }
              return h;
            };
          },
          510: (e, t, n) => {
            "use strict";
            const r = n(379);
            e.exports = (e) => ("string" == typeof e ? e.replace(r(), "") : e);
          },
        },
        t = {};
      function n(r) {
        if (t[r]) return t[r].exports;
        var i = (t[r] = { id: r, loaded: !1, exports: {} });
        return e[r](i, i.exports, n), (i.loaded = !0), i.exports;
      }
      return (
        (n.n = (e) => {
          var t = e && e.__esModule ? () => e.default : () => e;
          return n.d(t, { a: t }), t;
        }),
        (n.d = (e, t) => {
          for (var r in t)
            n.o(t, r) &&
              !n.o(e, r) &&
              Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
        }),
        (n.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
        (n.r = (e) => {
          "undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(e, "__esModule", { value: !0 });
        }),
        (n.nmd = (e) => ((e.paths = []), e.children || (e.children = []), e)),
        n(103)
      );
    })();
    return plugin;
  },
};
