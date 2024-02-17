/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-package-yaml",
factory: function (require) {
"use strict";
var plugin = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/identity.js
  var require_identity = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/identity.js"(exports) {
      "use strict";
      var ALIAS = Symbol.for("yaml.alias");
      var DOC = Symbol.for("yaml.document");
      var MAP = Symbol.for("yaml.map");
      var PAIR = Symbol.for("yaml.pair");
      var SCALAR = Symbol.for("yaml.scalar");
      var SEQ = Symbol.for("yaml.seq");
      var NODE_TYPE = Symbol.for("yaml.node.type");
      var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
      var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
      var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
      var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
      var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
      var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
      function isCollection(node) {
        if (node && typeof node === "object")
          switch (node[NODE_TYPE]) {
            case MAP:
            case SEQ:
              return true;
          }
        return false;
      }
      function isNode(node) {
        if (node && typeof node === "object")
          switch (node[NODE_TYPE]) {
            case ALIAS:
            case MAP:
            case SCALAR:
            case SEQ:
              return true;
          }
        return false;
      }
      var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
      exports.ALIAS = ALIAS;
      exports.DOC = DOC;
      exports.MAP = MAP;
      exports.NODE_TYPE = NODE_TYPE;
      exports.PAIR = PAIR;
      exports.SCALAR = SCALAR;
      exports.SEQ = SEQ;
      exports.hasAnchor = hasAnchor;
      exports.isAlias = isAlias;
      exports.isCollection = isCollection;
      exports.isDocument = isDocument;
      exports.isMap = isMap;
      exports.isNode = isNode;
      exports.isPair = isPair;
      exports.isScalar = isScalar;
      exports.isSeq = isSeq;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/visit.js
  var require_visit = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/visit.js"(exports) {
      "use strict";
      var identity = require_identity();
      var BREAK = Symbol("break visit");
      var SKIP = Symbol("skip children");
      var REMOVE = Symbol("remove node");
      function visit(node, visitor) {
        const visitor_ = initVisitor(visitor);
        if (identity.isDocument(node)) {
          const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
          if (cd === REMOVE)
            node.contents = null;
        } else
          visit_(null, node, visitor_, Object.freeze([]));
      }
      visit.BREAK = BREAK;
      visit.SKIP = SKIP;
      visit.REMOVE = REMOVE;
      function visit_(key, node, visitor, path) {
        const ctrl = callVisitor(key, node, visitor, path);
        if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
          replaceNode(key, path, ctrl);
          return visit_(key, ctrl, visitor, path);
        }
        if (typeof ctrl !== "symbol") {
          if (identity.isCollection(node)) {
            path = Object.freeze(path.concat(node));
            for (let i = 0; i < node.items.length; ++i) {
              const ci = visit_(i, node.items[i], visitor, path);
              if (typeof ci === "number")
                i = ci - 1;
              else if (ci === BREAK)
                return BREAK;
              else if (ci === REMOVE) {
                node.items.splice(i, 1);
                i -= 1;
              }
            }
          } else if (identity.isPair(node)) {
            path = Object.freeze(path.concat(node));
            const ck = visit_("key", node.key, visitor, path);
            if (ck === BREAK)
              return BREAK;
            else if (ck === REMOVE)
              node.key = null;
            const cv = visit_("value", node.value, visitor, path);
            if (cv === BREAK)
              return BREAK;
            else if (cv === REMOVE)
              node.value = null;
          }
        }
        return ctrl;
      }
      async function visitAsync(node, visitor) {
        const visitor_ = initVisitor(visitor);
        if (identity.isDocument(node)) {
          const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
          if (cd === REMOVE)
            node.contents = null;
        } else
          await visitAsync_(null, node, visitor_, Object.freeze([]));
      }
      visitAsync.BREAK = BREAK;
      visitAsync.SKIP = SKIP;
      visitAsync.REMOVE = REMOVE;
      async function visitAsync_(key, node, visitor, path) {
        const ctrl = await callVisitor(key, node, visitor, path);
        if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
          replaceNode(key, path, ctrl);
          return visitAsync_(key, ctrl, visitor, path);
        }
        if (typeof ctrl !== "symbol") {
          if (identity.isCollection(node)) {
            path = Object.freeze(path.concat(node));
            for (let i = 0; i < node.items.length; ++i) {
              const ci = await visitAsync_(i, node.items[i], visitor, path);
              if (typeof ci === "number")
                i = ci - 1;
              else if (ci === BREAK)
                return BREAK;
              else if (ci === REMOVE) {
                node.items.splice(i, 1);
                i -= 1;
              }
            }
          } else if (identity.isPair(node)) {
            path = Object.freeze(path.concat(node));
            const ck = await visitAsync_("key", node.key, visitor, path);
            if (ck === BREAK)
              return BREAK;
            else if (ck === REMOVE)
              node.key = null;
            const cv = await visitAsync_("value", node.value, visitor, path);
            if (cv === BREAK)
              return BREAK;
            else if (cv === REMOVE)
              node.value = null;
          }
        }
        return ctrl;
      }
      function initVisitor(visitor) {
        if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
          return Object.assign({
            Alias: visitor.Node,
            Map: visitor.Node,
            Scalar: visitor.Node,
            Seq: visitor.Node
          }, visitor.Value && {
            Map: visitor.Value,
            Scalar: visitor.Value,
            Seq: visitor.Value
          }, visitor.Collection && {
            Map: visitor.Collection,
            Seq: visitor.Collection
          }, visitor);
        }
        return visitor;
      }
      function callVisitor(key, node, visitor, path) {
        if (typeof visitor === "function")
          return visitor(key, node, path);
        if (identity.isMap(node))
          return visitor.Map?.(key, node, path);
        if (identity.isSeq(node))
          return visitor.Seq?.(key, node, path);
        if (identity.isPair(node))
          return visitor.Pair?.(key, node, path);
        if (identity.isScalar(node))
          return visitor.Scalar?.(key, node, path);
        if (identity.isAlias(node))
          return visitor.Alias?.(key, node, path);
        return void 0;
      }
      function replaceNode(key, path, node) {
        const parent = path[path.length - 1];
        if (identity.isCollection(parent)) {
          parent.items[key] = node;
        } else if (identity.isPair(parent)) {
          if (key === "key")
            parent.key = node;
          else
            parent.value = node;
        } else if (identity.isDocument(parent)) {
          parent.contents = node;
        } else {
          const pt = identity.isAlias(parent) ? "alias" : "scalar";
          throw new Error(`Cannot replace node with ${pt} parent`);
        }
      }
      exports.visit = visit;
      exports.visitAsync = visitAsync;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/directives.js
  var require_directives = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/directives.js"(exports) {
      "use strict";
      var identity = require_identity();
      var visit = require_visit();
      var escapeChars = {
        "!": "%21",
        ",": "%2C",
        "[": "%5B",
        "]": "%5D",
        "{": "%7B",
        "}": "%7D"
      };
      var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
      var Directives = class _Directives {
        constructor(yaml, tags) {
          this.docStart = null;
          this.docEnd = false;
          this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
          this.tags = Object.assign({}, _Directives.defaultTags, tags);
        }
        clone() {
          const copy = new _Directives(this.yaml, this.tags);
          copy.docStart = this.docStart;
          return copy;
        }
        /**
         * During parsing, get a Directives instance for the current document and
         * update the stream state according to the current version's spec.
         */
        atDocument() {
          const res = new _Directives(this.yaml, this.tags);
          switch (this.yaml.version) {
            case "1.1":
              this.atNextDocument = true;
              break;
            case "1.2":
              this.atNextDocument = false;
              this.yaml = {
                explicit: _Directives.defaultYaml.explicit,
                version: "1.2"
              };
              this.tags = Object.assign({}, _Directives.defaultTags);
              break;
          }
          return res;
        }
        /**
         * @param onError - May be called even if the action was successful
         * @returns `true` on success
         */
        add(line, onError) {
          if (this.atNextDocument) {
            this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
            this.tags = Object.assign({}, _Directives.defaultTags);
            this.atNextDocument = false;
          }
          const parts = line.trim().split(/[ \t]+/);
          const name = parts.shift();
          switch (name) {
            case "%TAG": {
              if (parts.length !== 2) {
                onError(0, "%TAG directive should contain exactly two parts");
                if (parts.length < 2)
                  return false;
              }
              const [handle, prefix] = parts;
              this.tags[handle] = prefix;
              return true;
            }
            case "%YAML": {
              this.yaml.explicit = true;
              if (parts.length !== 1) {
                onError(0, "%YAML directive should contain exactly one part");
                return false;
              }
              const [version] = parts;
              if (version === "1.1" || version === "1.2") {
                this.yaml.version = version;
                return true;
              } else {
                const isValid = /^\d+\.\d+$/.test(version);
                onError(6, `Unsupported YAML version ${version}`, isValid);
                return false;
              }
            }
            default:
              onError(0, `Unknown directive ${name}`, true);
              return false;
          }
        }
        /**
         * Resolves a tag, matching handles to those defined in %TAG directives.
         *
         * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
         *   `'!local'` tag, or `null` if unresolvable.
         */
        tagName(source, onError) {
          if (source === "!")
            return "!";
          if (source[0] !== "!") {
            onError(`Not a valid tag: ${source}`);
            return null;
          }
          if (source[1] === "<") {
            const verbatim = source.slice(2, -1);
            if (verbatim === "!" || verbatim === "!!") {
              onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
              return null;
            }
            if (source[source.length - 1] !== ">")
              onError("Verbatim tags must end with a >");
            return verbatim;
          }
          const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
          if (!suffix)
            onError(`The ${source} tag has no suffix`);
          const prefix = this.tags[handle];
          if (prefix) {
            try {
              return prefix + decodeURIComponent(suffix);
            } catch (error) {
              onError(String(error));
              return null;
            }
          }
          if (handle === "!")
            return source;
          onError(`Could not resolve tag: ${source}`);
          return null;
        }
        /**
         * Given a fully resolved tag, returns its printable string form,
         * taking into account current tag prefixes and defaults.
         */
        tagString(tag) {
          for (const [handle, prefix] of Object.entries(this.tags)) {
            if (tag.startsWith(prefix))
              return handle + escapeTagName(tag.substring(prefix.length));
          }
          return tag[0] === "!" ? tag : `!<${tag}>`;
        }
        toString(doc) {
          const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
          const tagEntries = Object.entries(this.tags);
          let tagNames;
          if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
            const tags = {};
            visit.visit(doc.contents, (_key, node) => {
              if (identity.isNode(node) && node.tag)
                tags[node.tag] = true;
            });
            tagNames = Object.keys(tags);
          } else
            tagNames = [];
          for (const [handle, prefix] of tagEntries) {
            if (handle === "!!" && prefix === "tag:yaml.org,2002:")
              continue;
            if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
              lines.push(`%TAG ${handle} ${prefix}`);
          }
          return lines.join("\n");
        }
      };
      Directives.defaultYaml = { explicit: false, version: "1.2" };
      Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
      exports.Directives = Directives;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/anchors.js
  var require_anchors = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/anchors.js"(exports) {
      "use strict";
      var identity = require_identity();
      var visit = require_visit();
      function anchorIsValid(anchor) {
        if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
          const sa = JSON.stringify(anchor);
          const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
          throw new Error(msg);
        }
        return true;
      }
      function anchorNames(root) {
        const anchors = /* @__PURE__ */ new Set();
        visit.visit(root, {
          Value(_key, node) {
            if (node.anchor)
              anchors.add(node.anchor);
          }
        });
        return anchors;
      }
      function findNewAnchor(prefix, exclude) {
        for (let i = 1; true; ++i) {
          const name = `${prefix}${i}`;
          if (!exclude.has(name))
            return name;
        }
      }
      function createNodeAnchors(doc, prefix) {
        const aliasObjects = [];
        const sourceObjects = /* @__PURE__ */ new Map();
        let prevAnchors = null;
        return {
          onAnchor: (source) => {
            aliasObjects.push(source);
            if (!prevAnchors)
              prevAnchors = anchorNames(doc);
            const anchor = findNewAnchor(prefix, prevAnchors);
            prevAnchors.add(anchor);
            return anchor;
          },
          /**
           * With circular references, the source node is only resolved after all
           * of its child nodes are. This is why anchors are set only after all of
           * the nodes have been created.
           */
          setAnchors: () => {
            for (const source of aliasObjects) {
              const ref = sourceObjects.get(source);
              if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
                ref.node.anchor = ref.anchor;
              } else {
                const error = new Error("Failed to resolve repeated object (this should not happen)");
                error.source = source;
                throw error;
              }
            }
          },
          sourceObjects
        };
      }
      exports.anchorIsValid = anchorIsValid;
      exports.anchorNames = anchorNames;
      exports.createNodeAnchors = createNodeAnchors;
      exports.findNewAnchor = findNewAnchor;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/applyReviver.js
  var require_applyReviver = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/applyReviver.js"(exports) {
      "use strict";
      function applyReviver(reviver, obj, key, val) {
        if (val && typeof val === "object") {
          if (Array.isArray(val)) {
            for (let i = 0, len = val.length; i < len; ++i) {
              const v0 = val[i];
              const v1 = applyReviver(reviver, val, String(i), v0);
              if (v1 === void 0)
                delete val[i];
              else if (v1 !== v0)
                val[i] = v1;
            }
          } else if (val instanceof Map) {
            for (const k of Array.from(val.keys())) {
              const v0 = val.get(k);
              const v1 = applyReviver(reviver, val, k, v0);
              if (v1 === void 0)
                val.delete(k);
              else if (v1 !== v0)
                val.set(k, v1);
            }
          } else if (val instanceof Set) {
            for (const v0 of Array.from(val)) {
              const v1 = applyReviver(reviver, val, v0, v0);
              if (v1 === void 0)
                val.delete(v0);
              else if (v1 !== v0) {
                val.delete(v0);
                val.add(v1);
              }
            }
          } else {
            for (const [k, v0] of Object.entries(val)) {
              const v1 = applyReviver(reviver, val, k, v0);
              if (v1 === void 0)
                delete val[k];
              else if (v1 !== v0)
                val[k] = v1;
            }
          }
        }
        return reviver.call(obj, key, val);
      }
      exports.applyReviver = applyReviver;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/toJS.js
  var require_toJS = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/toJS.js"(exports) {
      "use strict";
      var identity = require_identity();
      function toJS(value, arg, ctx) {
        if (Array.isArray(value))
          return value.map((v, i) => toJS(v, String(i), ctx));
        if (value && typeof value.toJSON === "function") {
          if (!ctx || !identity.hasAnchor(value))
            return value.toJSON(arg, ctx);
          const data = { aliasCount: 0, count: 1, res: void 0 };
          ctx.anchors.set(value, data);
          ctx.onCreate = (res2) => {
            data.res = res2;
            delete ctx.onCreate;
          };
          const res = value.toJSON(arg, ctx);
          if (ctx.onCreate)
            ctx.onCreate(res);
          return res;
        }
        if (typeof value === "bigint" && !ctx?.keep)
          return Number(value);
        return value;
      }
      exports.toJS = toJS;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Node.js
  var require_Node = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Node.js"(exports) {
      "use strict";
      var applyReviver = require_applyReviver();
      var identity = require_identity();
      var toJS = require_toJS();
      var NodeBase = class {
        constructor(type2) {
          Object.defineProperty(this, identity.NODE_TYPE, { value: type2 });
        }
        /** Create a copy of this node.  */
        clone() {
          const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
          if (this.range)
            copy.range = this.range.slice();
          return copy;
        }
        /** A plain JavaScript representation of this node. */
        toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
          if (!identity.isDocument(doc))
            throw new TypeError("A document argument is required");
          const ctx = {
            anchors: /* @__PURE__ */ new Map(),
            doc,
            keep: true,
            mapAsMap: mapAsMap === true,
            mapKeyWarned: false,
            maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
          };
          const res = toJS.toJS(this, "", ctx);
          if (typeof onAnchor === "function")
            for (const { count, res: res2 } of ctx.anchors.values())
              onAnchor(res2, count);
          return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
        }
      };
      exports.NodeBase = NodeBase;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Alias.js
  var require_Alias = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Alias.js"(exports) {
      "use strict";
      var anchors = require_anchors();
      var visit = require_visit();
      var identity = require_identity();
      var Node = require_Node();
      var toJS = require_toJS();
      var Alias = class extends Node.NodeBase {
        constructor(source) {
          super(identity.ALIAS);
          this.source = source;
          Object.defineProperty(this, "tag", {
            set() {
              throw new Error("Alias nodes cannot have tags");
            }
          });
        }
        /**
         * Resolve the value of this alias within `doc`, finding the last
         * instance of the `source` anchor before this node.
         */
        resolve(doc) {
          let found = void 0;
          visit.visit(doc, {
            Node: (_key, node) => {
              if (node === this)
                return visit.visit.BREAK;
              if (node.anchor === this.source)
                found = node;
            }
          });
          return found;
        }
        toJSON(_arg, ctx) {
          if (!ctx)
            return { source: this.source };
          const { anchors: anchors2, doc, maxAliasCount } = ctx;
          const source = this.resolve(doc);
          if (!source) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new ReferenceError(msg);
          }
          let data = anchors2.get(source);
          if (!data) {
            toJS.toJS(source, null, ctx);
            data = anchors2.get(source);
          }
          if (!data || data.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc, source, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
          return data.res;
        }
        toString(ctx, _onComment, _onChompKeep) {
          const src = `*${this.source}`;
          if (ctx) {
            anchors.anchorIsValid(this.source);
            if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
              const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
              throw new Error(msg);
            }
            if (ctx.implicitKey)
              return `${src} `;
          }
          return src;
        }
      };
      function getAliasCount(doc, node, anchors2) {
        if (identity.isAlias(node)) {
          const source = node.resolve(doc);
          const anchor = anchors2 && source && anchors2.get(source);
          return anchor ? anchor.count * anchor.aliasCount : 0;
        } else if (identity.isCollection(node)) {
          let count = 0;
          for (const item of node.items) {
            const c = getAliasCount(doc, item, anchors2);
            if (c > count)
              count = c;
          }
          return count;
        } else if (identity.isPair(node)) {
          const kc = getAliasCount(doc, node.key, anchors2);
          const vc = getAliasCount(doc, node.value, anchors2);
          return Math.max(kc, vc);
        }
        return 1;
      }
      exports.Alias = Alias;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Scalar.js
  var require_Scalar = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Scalar.js"(exports) {
      "use strict";
      var identity = require_identity();
      var Node = require_Node();
      var toJS = require_toJS();
      var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
      var Scalar = class extends Node.NodeBase {
        constructor(value) {
          super(identity.SCALAR);
          this.value = value;
        }
        toJSON(arg, ctx) {
          return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
        }
        toString() {
          return String(this.value);
        }
      };
      Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
      Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
      Scalar.PLAIN = "PLAIN";
      Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
      Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
      exports.Scalar = Scalar;
      exports.isScalarValue = isScalarValue;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/createNode.js
  var require_createNode = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/createNode.js"(exports) {
      "use strict";
      var Alias = require_Alias();
      var identity = require_identity();
      var Scalar = require_Scalar();
      var defaultTagPrefix = "tag:yaml.org,2002:";
      function findTagObject(value, tagName, tags) {
        if (tagName) {
          const match = tags.filter((t) => t.tag === tagName);
          const tagObj = match.find((t) => !t.format) ?? match[0];
          if (!tagObj)
            throw new Error(`Tag ${tagName} not found`);
          return tagObj;
        }
        return tags.find((t) => t.identify?.(value) && !t.format);
      }
      function createNode(value, tagName, ctx) {
        if (identity.isDocument(value))
          value = value.contents;
        if (identity.isNode(value))
          return value;
        if (identity.isPair(value)) {
          const map2 = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
          map2.items.push(value);
          return map2;
        }
        if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
          value = value.valueOf();
        }
        const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema2, sourceObjects } = ctx;
        let ref = void 0;
        if (aliasDuplicateObjects && value && typeof value === "object") {
          ref = sourceObjects.get(value);
          if (ref) {
            if (!ref.anchor)
              ref.anchor = onAnchor(value);
            return new Alias.Alias(ref.anchor);
          } else {
            ref = { anchor: null,  null };
            sourceObjects.set(value, ref);
          }
        }
        if (tagName?.startsWith("!!"))
          tagName = defaultTagPrefix + tagName.slice(2);
        let tagObj = findTagObject(value, tagName, schema2.tags);
        if (!tagObj) {
          if (value && typeof value.toJSON === "function") {
            value = value.toJSON();
          }
          if (!value || typeof value !== "object") {
            const node2 = new Scalar.Scalar(value);
            if (ref)
              ref.node = node2;
            return node2;
          }
          tagObj = value instanceof Map ? schema2[identity.MAP] : Symbol.iterator in Object(value) ? schema2[identity.SEQ] : schema2[identity.MAP];
        }
        if (onTagObj) {
          onTagObj(tagObj);
          delete ctx.onTagObj;
        }
        const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
        if (tagName)
          node.tag = tagName;
        else if (!tagObj.default)
          node.tag = tagObj.tag;
        if (ref)
          ref.node = node;
        return node;
      }
      exports.createNode = createNode;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Collection.js
  var require_Collection = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Collection.js"(exports) {
      "use strict";
      var createNode = require_createNode();
      var identity = require_identity();
      var Node = require_Node();
      function collectionFromPath(schema2, path, value) {
        let v = value;
        for (let i = path.length - 1; i >= 0; --i) {
          const k = path[i];
          if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
            const a = [];
            a[k] = v;
            v = a;
          } else {
            v = /* @__PURE__ */ new Map([[k, v]]);
          }
        }
        return createNode.createNode(v, void 0, {
          aliasDuplicateObjects: false,
          keepUndefined: false,
          onAnchor: () => {
            throw new Error("This should not happen, please report a bug.");
          },
          schema: schema2,
          sourceObjects: /* @__PURE__ */ new Map()
        });
      }
      var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
      var Collection = class extends Node.NodeBase {
        constructor(type2, schema2) {
          super(type2);
          Object.defineProperty(this, "schema", {
            value: schema2,
            configurable: true,
            enumerable: false,
            writable: true
          });
        }
        /**
         * Create a copy of this collection.
         *
         * @param schema - If defined, overwrites the original's schema
         */
        clone(schema2) {
          const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
          if (schema2)
            copy.schema = schema2;
          copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema2) : it);
          if (this.range)
            copy.range = this.range.slice();
          return copy;
        }
        /**
         * Adds a value to the collection. For `!!map` and `!!omap` the value must
         * be a Pair instance or a `{ key, value }` object, which may not have a key
         * that already exists in the map.
         */
        addIn(path, value) {
          if (isEmptyPath(path))
            this.add(value);
          else {
            const [key, ...rest] = path;
            const node = this.get(key, true);
            if (identity.isCollection(node))
              node.addIn(rest, value);
            else if (node === void 0 && this.schema)
              this.set(key, collectionFromPath(this.schema, rest, value));
            else
              throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
          }
        }
        /**
         * Removes a value from the collection.
         * @returns `true` if the item was found and removed.
         */
        deleteIn(path) {
          const [key, ...rest] = path;
          if (rest.length === 0)
            return this.delete(key);
          const node = this.get(key, true);
          if (identity.isCollection(node))
            return node.deleteIn(rest);
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
        /**
         * Returns item at `key`, or `undefined` if not found. By default unwraps
         * scalar values from their surrounding node; to disable set `keepScalar` to
         * `true` (collections are always returned intact).
         */
        getIn(path, keepScalar) {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (rest.length === 0)
            return !keepScalar && identity.isScalar(node) ? node.value : node;
          else
            return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
        }
        hasAllNullValues(allowScalar) {
          return this.items.every((node) => {
            if (!identity.isPair(node))
              return false;
            const n = node.value;
            return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
          });
        }
        /**
         * Checks if the collection includes a value with the key `key`.
         */
        hasIn(path) {
          const [key, ...rest] = path;
          if (rest.length === 0)
            return this.has(key);
          const node = this.get(key, true);
          return identity.isCollection(node) ? node.hasIn(rest) : false;
        }
        /**
         * Sets a value in this collection. For `!!set`, `value` needs to be a
         * boolean to add/remove the item from the set.
         */
        setIn(path, value) {
          const [key, ...rest] = path;
          if (rest.length === 0) {
            this.set(key, value);
          } else {
            const node = this.get(key, true);
            if (identity.isCollection(node))
              node.setIn(rest, value);
            else if (node === void 0 && this.schema)
              this.set(key, collectionFromPath(this.schema, rest, value));
            else
              throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
          }
        }
      };
      Collection.maxFlowStringSingleLineLength = 60;
      exports.Collection = Collection;
      exports.collectionFromPath = collectionFromPath;
      exports.isEmptyPath = isEmptyPath;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyComment.js
  var require_stringifyComment = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
      "use strict";
      var stringifyComment = (str2) => str2.replace(/^(?!$)(?: $)?/gm, "#");
      function indentComment(comment, indent) {
        if (/^\n+$/.test(comment))
          return comment.substring(1);
        return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
      }
      var lineComment = (str2, indent, comment) => str2.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str2.endsWith(" ") ? "" : " ") + comment;
      exports.indentComment = indentComment;
      exports.lineComment = lineComment;
      exports.stringifyComment = stringifyComment;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/foldFlowLines.js
  var require_foldFlowLines = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
      "use strict";
      var FOLD_FLOW = "flow";
      var FOLD_BLOCK = "block";
      var FOLD_QUOTED = "quoted";
      function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
        if (!lineWidth || lineWidth < 0)
          return text;
        const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
        if (text.length <= endStep)
          return text;
        const folds = [];
        const escapedFolds = {};
        let end = lineWidth - indent.length;
        if (typeof indentAtStart === "number") {
          if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
            folds.push(0);
          else
            end = lineWidth - indentAtStart;
        }
        let split = void 0;
        let prev = void 0;
        let overflow = false;
        let i = -1;
        let escStart = -1;
        let escEnd = -1;
        if (mode === FOLD_BLOCK) {
          i = consumeMoreIndentedLines(text, i);
          if (i !== -1)
            end = i + endStep;
        }
        for (let ch; ch = text[i += 1]; ) {
          if (mode === FOLD_QUOTED && ch === "\\") {
            escStart = i;
            switch (text[i + 1]) {
              case "x":
                i += 3;
                break;
              case "u":
                i += 5;
                break;
              case "U":
                i += 9;
                break;
              default:
                i += 1;
            }
            escEnd = i;
          }
          if (ch === "\n") {
            if (mode === FOLD_BLOCK)
              i = consumeMoreIndentedLines(text, i);
            end = i + endStep;
            split = void 0;
          } else {
            if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
              const next = text[i + 1];
              if (next && next !== " " && next !== "\n" && next !== "	")
                split = i;
            }
            if (i >= end) {
              if (split) {
                folds.push(split);
                end = split + endStep;
                split = void 0;
              } else if (mode === FOLD_QUOTED) {
                while (prev === " " || prev === "	") {
                  prev = ch;
                  ch = text[i += 1];
                  overflow = true;
                }
                const j = i > escEnd + 1 ? i - 2 : escStart - 1;
                if (escapedFolds[j])
                  return text;
                folds.push(j);
                escapedFolds[j] = true;
                end = j + endStep;
                split = void 0;
              } else {
                overflow = true;
              }
            }
          }
          prev = ch;
        }
        if (overflow && onOverflow)
          onOverflow();
        if (folds.length === 0)
          return text;
        if (onFold)
          onFold();
        let res = text.slice(0, folds[0]);
        for (let i2 = 0; i2 < folds.length; ++i2) {
          const fold = folds[i2];
          const end2 = folds[i2 + 1] || text.length;
          if (fold === 0)
            res = `
${indent}${text.slice(0, end2)}`;
          else {
            if (mode === FOLD_QUOTED && escapedFolds[fold])
              res += `${text[fold]}\\`;
            res += `
${indent}${text.slice(fold + 1, end2)}`;
          }
        }
        return res;
      }
      function consumeMoreIndentedLines(text, i) {
        let ch = text[i + 1];
        while (ch === " " || ch === "	") {
          do {
            ch = text[i += 1];
          } while (ch && ch !== "\n");
          ch = text[i + 1];
        }
        return i;
      }
      exports.FOLD_BLOCK = FOLD_BLOCK;
      exports.FOLD_FLOW = FOLD_FLOW;
      exports.FOLD_QUOTED = FOLD_QUOTED;
      exports.foldFlowLines = foldFlowLines;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyString.js
  var require_stringifyString = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var foldFlowLines = require_foldFlowLines();
      var getFoldOptions = (ctx, isBlock) => ({
        indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
        lineWidth: ctx.options.lineWidth,
        minContentWidth: ctx.options.minContentWidth
      });
      var containsDocumentMarker = (str2) => /^(%|---|\.\.\.)/m.test(str2);
      function lineLengthOverLimit(str2, lineWidth, indentLength) {
        if (!lineWidth || lineWidth < 0)
          return false;
        const limit = lineWidth - indentLength;
        const strLen = str2.length;
        if (strLen <= limit)
          return false;
        for (let i = 0, start = 0; i < strLen; ++i) {
          if (str2[i] === "\n") {
            if (i - start > limit)
              return true;
            start = i + 1;
            if (strLen - start <= limit)
              return false;
          }
        }
        return true;
      }
      function doubleQuotedString(value, ctx) {
        const json2 = JSON.stringify(value);
        if (ctx.options.doubleQuotedAsJSON)
          return json2;
        const { implicitKey } = ctx;
        const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
        const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
        let str2 = "";
        let start = 0;
        for (let i = 0, ch = json2[i]; ch; ch = json2[++i]) {
          if (ch === " " && json2[i + 1] === "\\" && json2[i + 2] === "n") {
            str2 += json2.slice(start, i) + "\\ ";
            i += 1;
            start = i;
            ch = "\\";
          }
          if (ch === "\\")
            switch (json2[i + 1]) {
              case "u":
                {
                  str2 += json2.slice(start, i);
                  const code = json2.substr(i + 2, 4);
                  switch (code) {
                    case "0000":
                      str2 += "\\0";
                      break;
                    case "0007":
                      str2 += "\\a";
                      break;
                    case "000b":
                      str2 += "\\v";
                      break;
                    case "001b":
                      str2 += "\\e";
                      break;
                    case "0085":
                      str2 += "\\N";
                      break;
                    case "00a0":
                      str2 += "\\_";
                      break;
                    case "2028":
                      str2 += "\\L";
                      break;
                    case "2029":
                      str2 += "\\P";
                      break;
                    default:
                      if (code.substr(0, 2) === "00")
                        str2 += "\\x" + code.substr(2);
                      else
                        str2 += json2.substr(i, 6);
                  }
                  i += 5;
                  start = i + 1;
                }
                break;
              case "n":
                if (implicitKey || json2[i + 2] === '"' || json2.length < minMultiLineLength) {
                  i += 1;
                } else {
                  str2 += json2.slice(start, i) + "\n\n";
                  while (json2[i + 2] === "\\" && json2[i + 3] === "n" && json2[i + 4] !== '"') {
                    str2 += "\n";
                    i += 2;
                  }
                  str2 += indent;
                  if (json2[i + 2] === " ")
                    str2 += "\\";
                  i += 1;
                  start = i + 1;
                }
                break;
              default:
                i += 1;
            }
        }
        str2 = start ? str2 + json2.slice(start) : json2;
        return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
      }
      function singleQuotedString(value, ctx) {
        if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
          return doubleQuotedString(value, ctx);
        const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
        const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
        return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
      }
      function quotedString(value, ctx) {
        const { singleQuote } = ctx.options;
        let qs;
        if (singleQuote === false)
          qs = doubleQuotedString;
        else {
          const hasDouble = value.includes('"');
          const hasSingle = value.includes("'");
          if (hasDouble && !hasSingle)
            qs = singleQuotedString;
          else if (hasSingle && !hasDouble)
            qs = doubleQuotedString;
          else
            qs = singleQuote ? singleQuotedString : doubleQuotedString;
        }
        return qs(value, ctx);
      }
      var blockEndNewlines;
      try {
        blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
      } catch {
        blockEndNewlines = /\n+(?!\n|$)/g;
      }
      function blockString({ comment, type: type2, value }, ctx, onComment, onChompKeep) {
        const { blockQuote, commentString, lineWidth } = ctx.options;
        if (!blockQuote || /\n[\t ]+$/.test(value) || /^\s*$/.test(value)) {
          return quotedString(value, ctx);
        }
        const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
        const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type2 === Scalar.Scalar.BLOCK_FOLDED ? false : type2 === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
        if (!value)
          return literal ? "|\n" : ">\n";
        let chomp;
        let endStart;
        for (endStart = value.length; endStart > 0; --endStart) {
          const ch = value[endStart - 1];
          if (ch !== "\n" && ch !== "	" && ch !== " ")
            break;
        }
        let end = value.substring(endStart);
        const endNlPos = end.indexOf("\n");
        if (endNlPos === -1) {
          chomp = "-";
        } else if (value === end || endNlPos !== end.length - 1) {
          chomp = "+";
          if (onChompKeep)
            onChompKeep();
        } else {
          chomp = "";
        }
        if (end) {
          value = value.slice(0, -end.length);
          if (end[end.length - 1] === "\n")
            end = end.slice(0, -1);
          end = end.replace(blockEndNewlines, `$&${indent}`);
        }
        let startWithSpace = false;
        let startEnd;
        let startNlPos = -1;
        for (startEnd = 0; startEnd < value.length; ++startEnd) {
          const ch = value[startEnd];
          if (ch === " ")
            startWithSpace = true;
          else if (ch === "\n")
            startNlPos = startEnd;
          else
            break;
        }
        let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
        if (start) {
          value = value.substring(start.length);
          start = start.replace(/\n+/g, `$&${indent}`);
        }
        const indentSize = indent ? "2" : "1";
        let header = (literal ? "|" : ">") + (startWithSpace ? indentSize : "") + chomp;
        if (comment) {
          header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
          if (onComment)
            onComment();
        }
        if (literal) {
          value = value.replace(/\n+/g, `$&${indent}`);
          return `${header}
${indent}${start}${value}${end}`;
        }
        value = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        const body = foldFlowLines.foldFlowLines(`${start}${value}${end}`, indent, foldFlowLines.FOLD_BLOCK, getFoldOptions(ctx, true));
        return `${header}
${indent}${body}`;
      }
      function plainString(item, ctx, onComment, onChompKeep) {
        const { type: type2, value } = item;
        const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
        if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
          return quotedString(value, ctx);
        }
        if (!value || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
          return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
        }
        if (!implicitKey && !inFlow && type2 !== Scalar.Scalar.PLAIN && value.includes("\n")) {
          return blockString(item, ctx, onComment, onChompKeep);
        }
        if (containsDocumentMarker(value)) {
          if (indent === "") {
            ctx.forceBlockIndent = true;
            return blockString(item, ctx, onComment, onChompKeep);
          } else if (implicitKey && indent === indentStep) {
            return quotedString(value, ctx);
          }
        }
        const str2 = value.replace(/\n+/g, `$&
${indent}`);
        if (actualString) {
          const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str2);
          const { compat, tags } = ctx.doc.schema;
          if (tags.some(test) || compat?.some(test))
            return quotedString(value, ctx);
        }
        return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
      }
      function stringifyString(item, ctx, onComment, onChompKeep) {
        const { implicitKey, inFlow } = ctx;
        const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
        let { type: type2 } = item;
        if (type2 !== Scalar.Scalar.QUOTE_DOUBLE) {
          if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
            type2 = Scalar.Scalar.QUOTE_DOUBLE;
        }
        const _stringify = (_type) => {
          switch (_type) {
            case Scalar.Scalar.BLOCK_FOLDED:
            case Scalar.Scalar.BLOCK_LITERAL:
              return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
            case Scalar.Scalar.QUOTE_DOUBLE:
              return doubleQuotedString(ss.value, ctx);
            case Scalar.Scalar.QUOTE_SINGLE:
              return singleQuotedString(ss.value, ctx);
            case Scalar.Scalar.PLAIN:
              return plainString(ss, ctx, onComment, onChompKeep);
            default:
              return null;
          }
        };
        let res = _stringify(type2);
        if (res === null) {
          const { defaultKeyType, defaultStringType } = ctx.options;
          const t = implicitKey && defaultKeyType || defaultStringType;
          res = _stringify(t);
          if (res === null)
            throw new Error(`Unsupported default string type ${t}`);
        }
        return res;
      }
      exports.stringifyString = stringifyString;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringify.js
  var require_stringify = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringify.js"(exports) {
      "use strict";
      var anchors = require_anchors();
      var identity = require_identity();
      var stringifyComment = require_stringifyComment();
      var stringifyString = require_stringifyString();
      function createStringifyContext(doc, options) {
        const opt = Object.assign({
          blockQuote: true,
          commentString: stringifyComment.stringifyComment,
          defaultKeyType: null,
          defaultStringType: "PLAIN",
          directives: null,
          doubleQuotedAsJSON: false,
          doubleQuotedMinMultiLineLength: 40,
          falseStr: "false",
          flowCollectionPadding: true,
          indentSeq: true,
          lineWidth: 80,
          minContentWidth: 20,
          nullStr: "null",
          simpleKeys: false,
          singleQuote: null,
          trueStr: "true",
          verifyAliasOrder: true
        }, doc.schema.toStringOptions, options);
        let inFlow;
        switch (opt.collectionStyle) {
          case "block":
            inFlow = false;
            break;
          case "flow":
            inFlow = true;
            break;
          default:
            inFlow = null;
        }
        return {
          anchors: /* @__PURE__ */ new Set(),
          doc,
          flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
          indent: "",
          indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
          inFlow,
          options: opt
        };
      }
      function getTagObject(tags, item) {
        if (item.tag) {
          const match = tags.filter((t) => t.tag === item.tag);
          if (match.length > 0)
            return match.find((t) => t.format === item.format) ?? match[0];
        }
        let tagObj = void 0;
        let obj;
        if (identity.isScalar(item)) {
          obj = item.value;
          const match = tags.filter((t) => t.identify?.(obj));
          tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
        } else {
          obj = item;
          tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
        }
        if (!tagObj) {
          const name = obj?.constructor?.name ?? typeof obj;
          throw new Error(`Tag not resolved for ${name} value`);
        }
        return tagObj;
      }
      function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
        if (!doc.directives)
          return "";
        const props = [];
        const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
        if (anchor && anchors.anchorIsValid(anchor)) {
          anchors$1.add(anchor);
          props.push(`&${anchor}`);
        }
        const tag = node.tag ? node.tag : tagObj.default ? null : tagObj.tag;
        if (tag)
          props.push(doc.directives.tagString(tag));
        return props.join(" ");
      }
      function stringify2(item, ctx, onComment, onChompKeep) {
        if (identity.isPair(item))
          return item.toString(ctx, onComment, onChompKeep);
        if (identity.isAlias(item)) {
          if (ctx.doc.directives)
            return item.toString(ctx);
          if (ctx.resolvedAliases?.has(item)) {
            throw new TypeError(`Cannot stringify circular structure without alias nodes`);
          } else {
            if (ctx.resolvedAliases)
              ctx.resolvedAliases.add(item);
            else
              ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
            item = item.resolve(ctx.doc);
          }
        }
        let tagObj = void 0;
        const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
        if (!tagObj)
          tagObj = getTagObject(ctx.doc.schema.tags, node);
        const props = stringifyProps(node, tagObj, ctx);
        if (props.length > 0)
          ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
        const str2 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
        if (!props)
          return str2;
        return identity.isScalar(node) || str2[0] === "{" || str2[0] === "[" ? `${props} ${str2}` : `${props}
${ctx.indent}${str2}`;
      }
      exports.createStringifyContext = createStringifyContext;
      exports.stringify = stringify2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyPair.js
  var require_stringifyPair = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
      "use strict";
      var identity = require_identity();
      var Scalar = require_Scalar();
      var stringify2 = require_stringify();
      var stringifyComment = require_stringifyComment();
      function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
        const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
        let keyComment = identity.isNode(key) && key.comment || null;
        if (simpleKeys) {
          if (keyComment) {
            throw new Error("With simple keys, key nodes cannot have comments");
          }
          if (identity.isCollection(key)) {
            const msg = "With simple keys, collection cannot be used as a key value";
            throw new Error(msg);
          }
        }
        let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
        ctx = Object.assign({}, ctx, {
          allNullValues: false,
          implicitKey: !explicitKey && (simpleKeys || !allNullValues),
          indent: indent + indentStep
        });
        let keyCommentDone = false;
        let chompKeep = false;
        let str2 = stringify2.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
        if (!explicitKey && !ctx.inFlow && str2.length > 1024) {
          if (simpleKeys)
            throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
          explicitKey = true;
        }
        if (ctx.inFlow) {
          if (allNullValues || value == null) {
            if (keyCommentDone && onComment)
              onComment();
            return str2 === "" ? "?" : explicitKey ? `? ${str2}` : str2;
          }
        } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
          str2 = `? ${str2}`;
          if (keyComment && !keyCommentDone) {
            str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
          } else if (chompKeep && onChompKeep)
            onChompKeep();
          return str2;
        }
        if (keyCommentDone)
          keyComment = null;
        if (explicitKey) {
          if (keyComment)
            str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
          str2 = `? ${str2}
${indent}:`;
        } else {
          str2 = `${str2}:`;
          if (keyComment)
            str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        }
        let vsb, vcb, valueComment;
        if (identity.isNode(value)) {
          vsb = !!value.spaceBefore;
          vcb = value.commentBefore;
          valueComment = value.comment;
        } else {
          vsb = false;
          vcb = null;
          valueComment = null;
          if (value && typeof value === "object")
            value = doc.createNode(value);
        }
        ctx.implicitKey = false;
        if (!explicitKey && !keyComment && identity.isScalar(value))
          ctx.indentAtStart = str2.length + 1;
        chompKeep = false;
        if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
          ctx.indent = ctx.indent.substring(2);
        }
        let valueCommentDone = false;
        const valueStr = stringify2.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
        let ws = " ";
        if (keyComment || vsb || vcb) {
          ws = vsb ? "\n" : "";
          if (vcb) {
            const cs = commentString(vcb);
            ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
          }
          if (valueStr === "" && !ctx.inFlow) {
            if (ws === "\n")
              ws = "\n\n";
          } else {
            ws += `
${ctx.indent}`;
          }
        } else if (!explicitKey && identity.isCollection(value)) {
          const vs0 = valueStr[0];
          const nl0 = valueStr.indexOf("\n");
          const hasNewline = nl0 !== -1;
          const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
          if (hasNewline || !flow) {
            let hasPropsLine = false;
            if (hasNewline && (vs0 === "&" || vs0 === "!")) {
              let sp0 = valueStr.indexOf(" ");
              if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
                sp0 = valueStr.indexOf(" ", sp0 + 1);
              }
              if (sp0 === -1 || nl0 < sp0)
                hasPropsLine = true;
            }
            if (!hasPropsLine)
              ws = `
${ctx.indent}`;
          }
        } else if (valueStr === "" || valueStr[0] === "\n") {
          ws = "";
        }
        str2 += ws + valueStr;
        if (ctx.inFlow) {
          if (valueCommentDone && onComment)
            onComment();
        } else if (valueComment && !valueCommentDone) {
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(valueComment));
        } else if (chompKeep && onChompKeep) {
          onChompKeep();
        }
        return str2;
      }
      exports.stringifyPair = stringifyPair;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/log.js
  var require_log = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/log.js"(exports) {
      "use strict";
      function debug(logLevel, ...messages) {
        if (logLevel === "debug")
          console.log(...messages);
      }
      function warn(logLevel, warning) {
        if (logLevel === "debug" || logLevel === "warn") {
          if (typeof process !== "undefined" && process.emitWarning)
            process.emitWarning(warning);
          else
            console.warn(warning);
        }
      }
      exports.debug = debug;
      exports.warn = warn;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/addPairToJSMap.js
  var require_addPairToJSMap = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
      "use strict";
      var log = require_log();
      var stringify2 = require_stringify();
      var identity = require_identity();
      var Scalar = require_Scalar();
      var toJS = require_toJS();
      var MERGE_KEY = "<<";
      function addPairToJSMap(ctx, map2, { key, value }) {
        if (ctx?.doc.schema.merge && isMergeKey(key)) {
          value = identity.isAlias(value) ? value.resolve(ctx.doc) : value;
          if (identity.isSeq(value))
            for (const it of value.items)
              mergeToJSMap(ctx, map2, it);
          else if (Array.isArray(value))
            for (const it of value)
              mergeToJSMap(ctx, map2, it);
          else
            mergeToJSMap(ctx, map2, value);
        } else {
          const jsKey = toJS.toJS(key, "", ctx);
          if (map2 instanceof Map) {
            map2.set(jsKey, toJS.toJS(value, jsKey, ctx));
          } else if (map2 instanceof Set) {
            map2.add(jsKey);
          } else {
            const stringKey = stringifyKey(key, jsKey, ctx);
            const jsValue = toJS.toJS(value, stringKey, ctx);
            if (stringKey in map2)
              Object.defineProperty(map2, stringKey, {
                value: jsValue,
                writable: true,
                enumerable: true,
                configurable: true
              });
            else
              map2[stringKey] = jsValue;
          }
        }
        return map2;
      }
      var isMergeKey = (key) => key === MERGE_KEY || identity.isScalar(key) && key.value === MERGE_KEY && (!key.type || key.type === Scalar.Scalar.PLAIN);
      function mergeToJSMap(ctx, map2, value) {
        const source = ctx && identity.isAlias(value) ? value.resolve(ctx.doc) : value;
        if (!identity.isMap(source))
          throw new Error("Merge sources must be maps or map aliases");
        const srcMap = source.toJSON(null, ctx, Map);
        for (const [key, value2] of srcMap) {
          if (map2 instanceof Map) {
            if (!map2.has(key))
              map2.set(key, value2);
          } else if (map2 instanceof Set) {
            map2.add(key);
          } else if (!Object.prototype.hasOwnProperty.call(map2, key)) {
            Object.defineProperty(map2, key, {
              value: value2,
              writable: true,
              enumerable: true,
              configurable: true
            });
          }
        }
        return map2;
      }
      function stringifyKey(key, jsKey, ctx) {
        if (jsKey === null)
          return "";
        if (typeof jsKey !== "object")
          return String(jsKey);
        if (identity.isNode(key) && ctx?.doc) {
          const strCtx = stringify2.createStringifyContext(ctx.doc, {});
          strCtx.anchors = /* @__PURE__ */ new Set();
          for (const node of ctx.anchors.keys())
            strCtx.anchors.add(node.anchor);
          strCtx.inFlow = true;
          strCtx.inStringifyKey = true;
          const strKey = key.toString(strCtx);
          if (!ctx.mapKeyWarned) {
            let jsonStr = JSON.stringify(strKey);
            if (jsonStr.length > 40)
              jsonStr = jsonStr.substring(0, 36) + '..."';
            log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
            ctx.mapKeyWarned = true;
          }
          return strKey;
        }
        return JSON.stringify(jsKey);
      }
      exports.addPairToJSMap = addPairToJSMap;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Pair.js
  var require_Pair = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/Pair.js"(exports) {
      "use strict";
      var createNode = require_createNode();
      var stringifyPair = require_stringifyPair();
      var addPairToJSMap = require_addPairToJSMap();
      var identity = require_identity();
      function createPair(key, value, ctx) {
        const k = createNode.createNode(key, void 0, ctx);
        const v = createNode.createNode(value, void 0, ctx);
        return new Pair(k, v);
      }
      var Pair = class _Pair {
        constructor(key, value = null) {
          Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
          this.key = key;
          this.value = value;
        }
        clone(schema2) {
          let { key, value } = this;
          if (identity.isNode(key))
            key = key.clone(schema2);
          if (identity.isNode(value))
            value = value.clone(schema2);
          return new _Pair(key, value);
        }
        toJSON(_, ctx) {
          const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
          return addPairToJSMap.addPairToJSMap(ctx, pair, this);
        }
        toString(ctx, onComment, onChompKeep) {
          return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
        }
      };
      exports.Pair = Pair;
      exports.createPair = createPair;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyCollection.js
  var require_stringifyCollection = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
      "use strict";
      var Collection = require_Collection();
      var identity = require_identity();
      var stringify2 = require_stringify();
      var stringifyComment = require_stringifyComment();
      function stringifyCollection(collection, ctx, options) {
        const flow = ctx.inFlow ?? collection.flow;
        const stringify3 = flow ? stringifyFlowCollection : stringifyBlockCollection;
        return stringify3(collection, ctx, options);
      }
      function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
        const { indent, options: { commentString } } = ctx;
        const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
        let chompKeep = false;
        const lines = [];
        for (let i = 0; i < items.length; ++i) {
          const item = items[i];
          let comment2 = null;
          if (identity.isNode(item)) {
            if (!chompKeep && item.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
            if (item.comment)
              comment2 = item.comment;
          } else if (identity.isPair(item)) {
            const ik = identity.isNode(item.key) ? item.key : null;
            if (ik) {
              if (!chompKeep && ik.spaceBefore)
                lines.push("");
              addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
            }
          }
          chompKeep = false;
          let str3 = stringify2.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
          if (comment2)
            str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
          if (chompKeep && comment2)
            chompKeep = false;
          lines.push(blockItemPrefix + str3);
        }
        let str2;
        if (lines.length === 0) {
          str2 = flowChars.start + flowChars.end;
        } else {
          str2 = lines[0];
          for (let i = 1; i < lines.length; ++i) {
            const line = lines[i];
            str2 += line ? `
${indent}${line}` : "\n";
          }
        }
        if (comment) {
          str2 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
          if (onComment)
            onComment();
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str2;
      }
      function stringifyFlowCollection({ comment, items }, ctx, { flowChars, itemIndent, onComment }) {
        const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
        itemIndent += indentStep;
        const itemCtx = Object.assign({}, ctx, {
          indent: itemIndent,
          inFlow: true,
          type: null
        });
        let reqNewline = false;
        let linesAtValue = 0;
        const lines = [];
        for (let i = 0; i < items.length; ++i) {
          const item = items[i];
          let comment2 = null;
          if (identity.isNode(item)) {
            if (item.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, item.commentBefore, false);
            if (item.comment)
              comment2 = item.comment;
          } else if (identity.isPair(item)) {
            const ik = identity.isNode(item.key) ? item.key : null;
            if (ik) {
              if (ik.spaceBefore)
                lines.push("");
              addCommentBefore(ctx, lines, ik.commentBefore, false);
              if (ik.comment)
                reqNewline = true;
            }
            const iv = identity.isNode(item.value) ? item.value : null;
            if (iv) {
              if (iv.comment)
                comment2 = iv.comment;
              if (iv.commentBefore)
                reqNewline = true;
            } else if (item.value == null && ik?.comment) {
              comment2 = ik.comment;
            }
          }
          if (comment2)
            reqNewline = true;
          let str3 = stringify2.stringify(item, itemCtx, () => comment2 = null);
          if (i < items.length - 1)
            str3 += ",";
          if (comment2)
            str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
          if (!reqNewline && (lines.length > linesAtValue || str3.includes("\n")))
            reqNewline = true;
          lines.push(str3);
          linesAtValue = lines.length;
        }
        let str2;
        const { start, end } = flowChars;
        if (lines.length === 0) {
          str2 = start + end;
        } else {
          if (!reqNewline) {
            const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
            reqNewline = len > Collection.Collection.maxFlowStringSingleLineLength;
          }
          if (reqNewline) {
            str2 = start;
            for (const line of lines)
              str2 += line ? `
${indentStep}${indent}${line}` : "\n";
            str2 += `
${indent}${end}`;
          } else {
            str2 = `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
          }
        }
        if (comment) {
          str2 += stringifyComment.lineComment(str2, indent, commentString(comment));
          if (onComment)
            onComment();
        }
        return str2;
      }
      function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
        if (comment && chompKeep)
          comment = comment.replace(/^\n+/, "");
        if (comment) {
          const ic = stringifyComment.indentComment(commentString(comment), indent);
          lines.push(ic.trimStart());
        }
      }
      exports.stringifyCollection = stringifyCollection;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/YAMLMap.js
  var require_YAMLMap = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
      "use strict";
      var stringifyCollection = require_stringifyCollection();
      var addPairToJSMap = require_addPairToJSMap();
      var Collection = require_Collection();
      var identity = require_identity();
      var Pair = require_Pair();
      var Scalar = require_Scalar();
      function findPair(items, key) {
        const k = identity.isScalar(key) ? key.value : key;
        for (const it of items) {
          if (identity.isPair(it)) {
            if (it.key === key || it.key === k)
              return it;
            if (identity.isScalar(it.key) && it.key.value === k)
              return it;
          }
        }
        return void 0;
      }
      var YAMLMap = class extends Collection.Collection {
        static get tagName() {
          return "tag:yaml.org,2002:map";
        }
        constructor(schema2) {
          super(identity.MAP, schema2);
          this.items = [];
        }
        /**
         * A generic collection parsing method that can be extended
         * to other node classes that inherit from YAMLMap
         */
        static from(schema2, obj, ctx) {
          const { keepUndefined, replacer } = ctx;
          const map2 = new this(schema2);
          const add = (key, value) => {
            if (typeof replacer === "function")
              value = replacer.call(obj, key, value);
            else if (Array.isArray(replacer) && !replacer.includes(key))
              return;
            if (value !== void 0 || keepUndefined)
              map2.items.push(Pair.createPair(key, value, ctx));
          };
          if (obj instanceof Map) {
            for (const [key, value] of obj)
              add(key, value);
          } else if (obj && typeof obj === "object") {
            for (const key of Object.keys(obj))
              add(key, obj[key]);
          }
          if (typeof schema2.sortMapEntries === "function") {
            map2.items.sort(schema2.sortMapEntries);
          }
          return map2;
        }
        /**
         * Adds a value to the collection.
         *
         * @param overwrite - If not set `true`, using a key that is already in the
         *   collection will throw. Otherwise, overwrites the previous value.
         */
        add(pair, overwrite) {
          let _pair;
          if (identity.isPair(pair))
            _pair = pair;
          else if (!pair || typeof pair !== "object" || !("key" in pair)) {
            _pair = new Pair.Pair(pair, pair?.value);
          } else
            _pair = new Pair.Pair(pair.key, pair.value);
          const prev = findPair(this.items, _pair.key);
          const sortEntries = this.schema?.sortMapEntries;
          if (prev) {
            if (!overwrite)
              throw new Error(`Key ${_pair.key} already set`);
            if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
              prev.value.value = _pair.value;
            else
              prev.value = _pair.value;
          } else if (sortEntries) {
            const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
            if (i === -1)
              this.items.push(_pair);
            else
              this.items.splice(i, 0, _pair);
          } else {
            this.items.push(_pair);
          }
        }
        delete(key) {
          const it = findPair(this.items, key);
          if (!it)
            return false;
          const del = this.items.splice(this.items.indexOf(it), 1);
          return del.length > 0;
        }
        get(key, keepScalar) {
          const it = findPair(this.items, key);
          const node = it?.value;
          return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
        }
        has(key) {
          return !!findPair(this.items, key);
        }
        set(key, value) {
          this.add(new Pair.Pair(key, value), true);
        }
        /**
         * @param ctx - Conversion context, originally set in Document#toJS()
         * @param {Class} Type - If set, forces the returned collection type
         * @returns Instance of Type, Map, or Object
         */
        toJSON(_, ctx, Type) {
          const map2 = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
          if (ctx?.onCreate)
            ctx.onCreate(map2);
          for (const item of this.items)
            addPairToJSMap.addPairToJSMap(ctx, map2, item);
          return map2;
        }
        toString(ctx, onComment, onChompKeep) {
          if (!ctx)
            return JSON.stringify(this);
          for (const item of this.items) {
            if (!identity.isPair(item))
              throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
          }
          if (!ctx.allNullValues && this.hasAllNullValues(false))
            ctx = Object.assign({}, ctx, { allNullValues: true });
          return stringifyCollection.stringifyCollection(this, ctx, {
            blockItemPrefix: "",
            flowChars: { start: "{", end: "}" },
            itemIndent: ctx.indent || "",
            onChompKeep,
            onComment
          });
        }
      };
      exports.YAMLMap = YAMLMap;
      exports.findPair = findPair;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/map.js
  var require_map = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/map.js"(exports) {
      "use strict";
      var identity = require_identity();
      var YAMLMap = require_YAMLMap();
      var map2 = {
        collection: "map",
        default: true,
        nodeClass: YAMLMap.YAMLMap,
        tag: "tag:yaml.org,2002:map",
        resolve(map3, onError) {
          if (!identity.isMap(map3))
            onError("Expected a mapping for this tag");
          return map3;
        },
        createNode: (schema2, obj, ctx) => YAMLMap.YAMLMap.from(schema2, obj, ctx)
      };
      exports.map = map2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/YAMLSeq.js
  var require_YAMLSeq = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
      "use strict";
      var createNode = require_createNode();
      var stringifyCollection = require_stringifyCollection();
      var Collection = require_Collection();
      var identity = require_identity();
      var Scalar = require_Scalar();
      var toJS = require_toJS();
      var YAMLSeq = class extends Collection.Collection {
        static get tagName() {
          return "tag:yaml.org,2002:seq";
        }
        constructor(schema2) {
          super(identity.SEQ, schema2);
          this.items = [];
        }
        add(value) {
          this.items.push(value);
        }
        /**
         * Removes a value from the collection.
         *
         * `key` must contain a representation of an integer for this to succeed.
         * It may be wrapped in a `Scalar`.
         *
         * @returns `true` if the item was found and removed.
         */
        delete(key) {
          const idx = asItemIndex(key);
          if (typeof idx !== "number")
            return false;
          const del = this.items.splice(idx, 1);
          return del.length > 0;
        }
        get(key, keepScalar) {
          const idx = asItemIndex(key);
          if (typeof idx !== "number")
            return void 0;
          const it = this.items[idx];
          return !keepScalar && identity.isScalar(it) ? it.value : it;
        }
        /**
         * Checks if the collection includes a value with the key `key`.
         *
         * `key` must contain a representation of an integer for this to succeed.
         * It may be wrapped in a `Scalar`.
         */
        has(key) {
          const idx = asItemIndex(key);
          return typeof idx === "number" && idx < this.items.length;
        }
        /**
         * Sets a value in this collection. For `!!set`, `value` needs to be a
         * boolean to add/remove the item from the set.
         *
         * If `key` does not contain a representation of an integer, this will throw.
         * It may be wrapped in a `Scalar`.
         */
        set(key, value) {
          const idx = asItemIndex(key);
          if (typeof idx !== "number")
            throw new Error(`Expected a valid index, not ${key}.`);
          const prev = this.items[idx];
          if (identity.isScalar(prev) && Scalar.isScalarValue(value))
            prev.value = value;
          else
            this.items[idx] = value;
        }
        toJSON(_, ctx) {
          const seq2 = [];
          if (ctx?.onCreate)
            ctx.onCreate(seq2);
          let i = 0;
          for (const item of this.items)
            seq2.push(toJS.toJS(item, String(i++), ctx));
          return seq2;
        }
        toString(ctx, onComment, onChompKeep) {
          if (!ctx)
            return JSON.stringify(this);
          return stringifyCollection.stringifyCollection(this, ctx, {
            blockItemPrefix: "- ",
            flowChars: { start: "[", end: "]" },
            itemIndent: (ctx.indent || "") + "  ",
            onChompKeep,
            onComment
          });
        }
        static from(schema2, obj, ctx) {
          const { replacer } = ctx;
          const seq2 = new this(schema2);
          if (obj && Symbol.iterator in Object(obj)) {
            let i = 0;
            for (let it of obj) {
              if (typeof replacer === "function") {
                const key = obj instanceof Set ? it : String(i++);
                it = replacer.call(obj, key, it);
              }
              seq2.items.push(createNode.createNode(it, void 0, ctx));
            }
          }
          return seq2;
        }
      };
      function asItemIndex(key) {
        let idx = identity.isScalar(key) ? key.value : key;
        if (idx && typeof idx === "string")
          idx = Number(idx);
        return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
      }
      exports.YAMLSeq = YAMLSeq;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/seq.js
  var require_seq = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/seq.js"(exports) {
      "use strict";
      var identity = require_identity();
      var YAMLSeq = require_YAMLSeq();
      var seq2 = {
        collection: "seq",
        default: true,
        nodeClass: YAMLSeq.YAMLSeq,
        tag: "tag:yaml.org,2002:seq",
        resolve(seq3, onError) {
          if (!identity.isSeq(seq3))
            onError("Expected a sequence for this tag");
          return seq3;
        },
        createNode: (schema2, obj, ctx) => YAMLSeq.YAMLSeq.from(schema2, obj, ctx)
      };
      exports.seq = seq2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/string.js
  var require_string = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/string.js"(exports) {
      "use strict";
      var stringifyString = require_stringifyString();
      var string = {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str2) => str2,
        stringify(item, ctx, onComment, onChompKeep) {
          ctx = Object.assign({ actualString: true }, ctx);
          return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
        }
      };
      exports.string = string;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/null.js
  var require_null = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/common/null.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var nullTag = {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^(?:~|[Nn]ull|NULL)?$/,
        resolve: () => new Scalar.Scalar(null),
        stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
      };
      exports.nullTag = nullTag;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/bool.js
  var require_bool = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/bool.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var boolTag = {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
        resolve: (str2) => new Scalar.Scalar(str2[0] === "t" || str2[0] === "T"),
        stringify({ source, value }, ctx) {
          if (source && boolTag.test.test(source)) {
            const sv = source[0] === "t" || source[0] === "T";
            if (value === sv)
              return source;
          }
          return value ? ctx.options.trueStr : ctx.options.falseStr;
        }
      };
      exports.boolTag = boolTag;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyNumber.js
  var require_stringifyNumber = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
      "use strict";
      function stringifyNumber({ format, minFractionDigits, tag, value }) {
        if (typeof value === "bigint")
          return String(value);
        const num = typeof value === "number" ? value : Number(value);
        if (!isFinite(num))
          return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
        let n = JSON.stringify(value);
        if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^\d/.test(n)) {
          let i = n.indexOf(".");
          if (i < 0) {
            i = n.length;
            n += ".";
          }
          let d = minFractionDigits - (n.length - i - 1);
          while (d-- > 0)
            n += "0";
        }
        return n;
      }
      exports.stringifyNumber = stringifyNumber;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/float.js
  var require_float = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/float.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var stringifyNumber = require_stringifyNumber();
      var floatNaN = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^(?:[-+]?\.(?:inf|Inf|INF|nan|NaN|NAN))$/,
        resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        stringify: stringifyNumber.stringifyNumber
      };
      var floatExp = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        format: "EXP",
        test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
        resolve: (str2) => parseFloat(str2),
        stringify(node) {
          const num = Number(node.value);
          return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
        }
      };
      var float2 = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
        resolve(str2) {
          const node = new Scalar.Scalar(parseFloat(str2));
          const dot = str2.indexOf(".");
          if (dot !== -1 && str2[str2.length - 1] === "0")
            node.minFractionDigits = str2.length - dot - 1;
          return node;
        },
        stringify: stringifyNumber.stringifyNumber
      };
      exports.float = float2;
      exports.floatExp = floatExp;
      exports.floatNaN = floatNaN;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/int.js
  var require_int = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/int.js"(exports) {
      "use strict";
      var stringifyNumber = require_stringifyNumber();
      var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
      var intResolve = (str2, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2.substring(offset), radix);
      function intStringify(node, radix, prefix) {
        const { value } = node;
        if (intIdentify(value) && value >= 0)
          return prefix + value.toString(radix);
        return stringifyNumber.stringifyNumber(node);
      }
      var intOct = {
        identify: (value) => intIdentify(value) && value >= 0,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "OCT",
        test: /^0o[0-7]+$/,
        resolve: (str2, _onError, opt) => intResolve(str2, 2, 8, opt),
        stringify: (node) => intStringify(node, 8, "0o")
      };
      var int2 = {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^[-+]?[0-9]+$/,
        resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
        stringify: stringifyNumber.stringifyNumber
      };
      var intHex = {
        identify: (value) => intIdentify(value) && value >= 0,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "HEX",
        test: /^0x[0-9a-fA-F]+$/,
        resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
        stringify: (node) => intStringify(node, 16, "0x")
      };
      exports.int = int2;
      exports.intHex = intHex;
      exports.intOct = intOct;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/schema.js
  var require_schema = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/core/schema.js"(exports) {
      "use strict";
      var map2 = require_map();
      var _null2 = require_null();
      var seq2 = require_seq();
      var string = require_string();
      var bool2 = require_bool();
      var float2 = require_float();
      var int2 = require_int();
      var schema2 = [
        map2.map,
        seq2.seq,
        string.string,
        _null2.nullTag,
        bool2.boolTag,
        int2.intOct,
        int2.int,
        int2.intHex,
        float2.floatNaN,
        float2.floatExp,
        float2.float
      ];
      exports.schema = schema2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/json/schema.js
  var require_schema2 = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/json/schema.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var map2 = require_map();
      var seq2 = require_seq();
      function intIdentify(value) {
        return typeof value === "bigint" || Number.isInteger(value);
      }
      var stringifyJSON = ({ value }) => JSON.stringify(value);
      var jsonScalars = [
        {
          identify: (value) => typeof value === "string",
          default: true,
          tag: "tag:yaml.org,2002:str",
          resolve: (str2) => str2,
          stringify: stringifyJSON
        },
        {
          identify: (value) => value == null,
          createNode: () => new Scalar.Scalar(null),
          default: true,
          tag: "tag:yaml.org,2002:null",
          test: /^null$/,
          resolve: () => null,
          stringify: stringifyJSON
        },
        {
          identify: (value) => typeof value === "boolean",
          default: true,
          tag: "tag:yaml.org,2002:bool",
          test: /^true|false$/,
          resolve: (str2) => str2 === "true",
          stringify: stringifyJSON
        },
        {
          identify: intIdentify,
          default: true,
          tag: "tag:yaml.org,2002:int",
          test: /^-?(?:0|[1-9][0-9]*)$/,
          resolve: (str2, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2, 10),
          stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
        },
        {
          identify: (value) => typeof value === "number",
          default: true,
          tag: "tag:yaml.org,2002:float",
          test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
          resolve: (str2) => parseFloat(str2),
          stringify: stringifyJSON
        }
      ];
      var jsonError = {
        default: true,
        tag: "",
        test: /^/,
        resolve(str2, onError) {
          onError(`Unresolved plain scalar ${JSON.stringify(str2)}`);
          return str2;
        }
      };
      var schema2 = [map2.map, seq2.seq].concat(jsonScalars, jsonError);
      exports.schema = schema2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/binary.js
  var require_binary = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var stringifyString = require_stringifyString();
      var binary2 = {
        identify: (value) => value instanceof Uint8Array,
        default: false,
        tag: "tag:yaml.org,2002:binary",
        /**
         * Returns a Buffer in node and an Uint8Array in browsers
         *
         * To use the resulting buffer as an image, you'll want to do something like:
         *
         *   const blob = new Blob([buffer], { type: 'image/jpeg' })
         *   document.querySelector('#photo').src = URL.createObjectURL(blob)
         */
        resolve(src, onError) {
          if (typeof Buffer === "function") {
            return Buffer.from(src, "base64");
          } else if (typeof atob === "function") {
            const str2 = atob(src.replace(/[\n\r]/g, ""));
            const buffer = new Uint8Array(str2.length);
            for (let i = 0; i < str2.length; ++i)
              buffer[i] = str2.charCodeAt(i);
            return buffer;
          } else {
            onError("This environment does not support reading binary tags; either Buffer or atob is required");
            return src;
          }
        },
        stringify({ comment, type: type2, value }, ctx, onComment, onChompKeep) {
          const buf = value;
          let str2;
          if (typeof Buffer === "function") {
            str2 = buf instanceof Buffer ? buf.toString("base64") : Buffer.from(buf.buffer).toString("base64");
          } else if (typeof btoa === "function") {
            let s = "";
            for (let i = 0; i < buf.length; ++i)
              s += String.fromCharCode(buf[i]);
            str2 = btoa(s);
          } else {
            throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
          }
          if (!type2)
            type2 = Scalar.Scalar.BLOCK_LITERAL;
          if (type2 !== Scalar.Scalar.QUOTE_DOUBLE) {
            const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
            const n = Math.ceil(str2.length / lineWidth);
            const lines = new Array(n);
            for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
              lines[i] = str2.substr(o, lineWidth);
            }
            str2 = lines.join(type2 === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
          }
          return stringifyString.stringifyString({ comment, type: type2, value: str2 }, ctx, onComment, onChompKeep);
        }
      };
      exports.binary = binary2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
  var require_pairs = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
      "use strict";
      var identity = require_identity();
      var Pair = require_Pair();
      var Scalar = require_Scalar();
      var YAMLSeq = require_YAMLSeq();
      function resolvePairs(seq2, onError) {
        if (identity.isSeq(seq2)) {
          for (let i = 0; i < seq2.items.length; ++i) {
            let item = seq2.items[i];
            if (identity.isPair(item))
              continue;
            else if (identity.isMap(item)) {
              if (item.items.length > 1)
                onError("Each pair must have its own sequence indicator");
              const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
              if (item.commentBefore)
                pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
              if (item.comment) {
                const cn = pair.value ?? pair.key;
                cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
              }
              item = pair;
            }
            seq2.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
          }
        } else
          onError("Expected a sequence for this tag");
        return seq2;
      }
      function createPairs(schema2, iterable, ctx) {
        const { replacer } = ctx;
        const pairs3 = new YAMLSeq.YAMLSeq(schema2);
        pairs3.tag = "tag:yaml.org,2002:pairs";
        let i = 0;
        if (iterable && Symbol.iterator in Object(iterable))
          for (let it of iterable) {
            if (typeof replacer === "function")
              it = replacer.call(iterable, String(i++), it);
            let key, value;
            if (Array.isArray(it)) {
              if (it.length === 2) {
                key = it[0];
                value = it[1];
              } else
                throw new TypeError(`Expected [key, value] tuple: ${it}`);
            } else if (it && it instanceof Object) {
              const keys = Object.keys(it);
              if (keys.length === 1) {
                key = keys[0];
                value = it[key];
              } else {
                throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
              }
            } else {
              key = it;
            }
            pairs3.items.push(Pair.createPair(key, value, ctx));
          }
        return pairs3;
      }
      var pairs2 = {
        collection: "seq",
        default: false,
        tag: "tag:yaml.org,2002:pairs",
        resolve: resolvePairs,
        createNode: createPairs
      };
      exports.createPairs = createPairs;
      exports.pairs = pairs2;
      exports.resolvePairs = resolvePairs;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/omap.js
  var require_omap = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
      "use strict";
      var identity = require_identity();
      var toJS = require_toJS();
      var YAMLMap = require_YAMLMap();
      var YAMLSeq = require_YAMLSeq();
      var pairs2 = require_pairs();
      var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
        constructor() {
          super();
          this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
          this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
          this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
          this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
          this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
          this.tag = _YAMLOMap.tag;
        }
        /**
         * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
         * but TypeScript won't allow widening the signature of a child method.
         */
        toJSON(_, ctx) {
          if (!ctx)
            return super.toJSON(_);
          const map2 = /* @__PURE__ */ new Map();
          if (ctx?.onCreate)
            ctx.onCreate(map2);
          for (const pair of this.items) {
            let key, value;
            if (identity.isPair(pair)) {
              key = toJS.toJS(pair.key, "", ctx);
              value = toJS.toJS(pair.value, key, ctx);
            } else {
              key = toJS.toJS(pair, "", ctx);
            }
            if (map2.has(key))
              throw new Error("Ordered maps must not include duplicate keys");
            map2.set(key, value);
          }
          return map2;
        }
        static from(schema2, iterable, ctx) {
          const pairs$1 = pairs2.createPairs(schema2, iterable, ctx);
          const omap3 = new this();
          omap3.items = pairs$1.items;
          return omap3;
        }
      };
      YAMLOMap.tag = "tag:yaml.org,2002:omap";
      var omap2 = {
        collection: "seq",
        identify: (value) => value instanceof Map,
        nodeClass: YAMLOMap,
        default: false,
        tag: "tag:yaml.org,2002:omap",
        resolve(seq2, onError) {
          const pairs$1 = pairs2.resolvePairs(seq2, onError);
          const seenKeys = [];
          for (const { key } of pairs$1.items) {
            if (identity.isScalar(key)) {
              if (seenKeys.includes(key.value)) {
                onError(`Ordered maps must not include duplicate keys: ${key.value}`);
              } else {
                seenKeys.push(key.value);
              }
            }
          }
          return Object.assign(new YAMLOMap(), pairs$1);
        },
        createNode: (schema2, iterable, ctx) => YAMLOMap.from(schema2, iterable, ctx)
      };
      exports.YAMLOMap = YAMLOMap;
      exports.omap = omap2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/bool.js
  var require_bool2 = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      function boolStringify({ value, source }, ctx) {
        const boolObj = value ? trueTag : falseTag;
        if (source && boolObj.test.test(source))
          return source;
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
      var trueTag = {
        identify: (value) => value === true,
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
        resolve: () => new Scalar.Scalar(true),
        stringify: boolStringify
      };
      var falseTag = {
        identify: (value) => value === false,
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,
        resolve: () => new Scalar.Scalar(false),
        stringify: boolStringify
      };
      exports.falseTag = falseTag;
      exports.trueTag = trueTag;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/float.js
  var require_float2 = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var stringifyNumber = require_stringifyNumber();
      var floatNaN = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^[-+]?\.(?:inf|Inf|INF|nan|NaN|NAN)$/,
        resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        stringify: stringifyNumber.stringifyNumber
      };
      var floatExp = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        format: "EXP",
        test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
        resolve: (str2) => parseFloat(str2.replace(/_/g, "")),
        stringify(node) {
          const num = Number(node.value);
          return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
        }
      };
      var float2 = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
        resolve(str2) {
          const node = new Scalar.Scalar(parseFloat(str2.replace(/_/g, "")));
          const dot = str2.indexOf(".");
          if (dot !== -1) {
            const f = str2.substring(dot + 1).replace(/_/g, "");
            if (f[f.length - 1] === "0")
              node.minFractionDigits = f.length;
          }
          return node;
        },
        stringify: stringifyNumber.stringifyNumber
      };
      exports.float = float2;
      exports.floatExp = floatExp;
      exports.floatNaN = floatNaN;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/int.js
  var require_int2 = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
      "use strict";
      var stringifyNumber = require_stringifyNumber();
      var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
      function intResolve(str2, offset, radix, { intAsBigInt }) {
        const sign = str2[0];
        if (sign === "-" || sign === "+")
          offset += 1;
        str2 = str2.substring(offset).replace(/_/g, "");
        if (intAsBigInt) {
          switch (radix) {
            case 2:
              str2 = `0b${str2}`;
              break;
            case 8:
              str2 = `0o${str2}`;
              break;
            case 16:
              str2 = `0x${str2}`;
              break;
          }
          const n2 = BigInt(str2);
          return sign === "-" ? BigInt(-1) * n2 : n2;
        }
        const n = parseInt(str2, radix);
        return sign === "-" ? -1 * n : n;
      }
      function intStringify(node, radix, prefix) {
        const { value } = node;
        if (intIdentify(value)) {
          const str2 = value.toString(radix);
          return value < 0 ? "-" + prefix + str2.substr(1) : prefix + str2;
        }
        return stringifyNumber.stringifyNumber(node);
      }
      var intBin = {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "BIN",
        test: /^[-+]?0b[0-1_]+$/,
        resolve: (str2, _onError, opt) => intResolve(str2, 2, 2, opt),
        stringify: (node) => intStringify(node, 2, "0b")
      };
      var intOct = {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "OCT",
        test: /^[-+]?0[0-7_]+$/,
        resolve: (str2, _onError, opt) => intResolve(str2, 1, 8, opt),
        stringify: (node) => intStringify(node, 8, "0")
      };
      var int2 = {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^[-+]?[0-9][0-9_]*$/,
        resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
        stringify: stringifyNumber.stringifyNumber
      };
      var intHex = {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "HEX",
        test: /^[-+]?0x[0-9a-fA-F_]+$/,
        resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
        stringify: (node) => intStringify(node, 16, "0x")
      };
      exports.int = int2;
      exports.intBin = intBin;
      exports.intHex = intHex;
      exports.intOct = intOct;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/set.js
  var require_set = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
      "use strict";
      var identity = require_identity();
      var Pair = require_Pair();
      var YAMLMap = require_YAMLMap();
      var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
        constructor(schema2) {
          super(schema2);
          this.tag = _YAMLSet.tag;
        }
        add(key) {
          let pair;
          if (identity.isPair(key))
            pair = key;
          else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
            pair = new Pair.Pair(key.key, null);
          else
            pair = new Pair.Pair(key, null);
          const prev = YAMLMap.findPair(this.items, pair.key);
          if (!prev)
            this.items.push(pair);
        }
        /**
         * If `keepPair` is `true`, returns the Pair matching `key`.
         * Otherwise, returns the value of that Pair's key.
         */
        get(key, keepPair) {
          const pair = YAMLMap.findPair(this.items, key);
          return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
        }
        set(key, value) {
          if (typeof value !== "boolean")
            throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
          const prev = YAMLMap.findPair(this.items, key);
          if (prev && !value) {
            this.items.splice(this.items.indexOf(prev), 1);
          } else if (!prev && value) {
            this.items.push(new Pair.Pair(key));
          }
        }
        toJSON(_, ctx) {
          return super.toJSON(_, ctx, Set);
        }
        toString(ctx, onComment, onChompKeep) {
          if (!ctx)
            return JSON.stringify(this);
          if (this.hasAllNullValues(true))
            return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
          else
            throw new Error("Set items must all have null values");
        }
        static from(schema2, iterable, ctx) {
          const { replacer } = ctx;
          const set3 = new this(schema2);
          if (iterable && Symbol.iterator in Object(iterable))
            for (let value of iterable) {
              if (typeof replacer === "function")
                value = replacer.call(iterable, value, value);
              set3.items.push(Pair.createPair(value, null, ctx));
            }
          return set3;
        }
      };
      YAMLSet.tag = "tag:yaml.org,2002:set";
      var set2 = {
        collection: "map",
        identify: (value) => value instanceof Set,
        nodeClass: YAMLSet,
        default: false,
        tag: "tag:yaml.org,2002:set",
        createNode: (schema2, iterable, ctx) => YAMLSet.from(schema2, iterable, ctx),
        resolve(map2, onError) {
          if (identity.isMap(map2)) {
            if (map2.hasAllNullValues(true))
              return Object.assign(new YAMLSet(), map2);
            else
              onError("Set items must all have null values");
          } else
            onError("Expected a mapping for this tag");
          return map2;
        }
      };
      exports.YAMLSet = YAMLSet;
      exports.set = set2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
  var require_timestamp = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
      "use strict";
      var stringifyNumber = require_stringifyNumber();
      function parseSexagesimal(str2, asBigInt) {
        const sign = str2[0];
        const parts = sign === "-" || sign === "+" ? str2.substring(1) : str2;
        const num = (n) => asBigInt ? BigInt(n) : Number(n);
        const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
        return sign === "-" ? num(-1) * res : res;
      }
      function stringifySexagesimal(node) {
        let { value } = node;
        let num = (n) => n;
        if (typeof value === "bigint")
          num = (n) => BigInt(n);
        else if (isNaN(value) || !isFinite(value))
          return stringifyNumber.stringifyNumber(node);
        let sign = "";
        if (value < 0) {
          sign = "-";
          value *= num(-1);
        }
        const _60 = num(60);
        const parts = [value % _60];
        if (value < 60) {
          parts.unshift(0);
        } else {
          value = (value - parts[0]) / _60;
          parts.unshift(value % _60);
          if (value >= 60) {
            value = (value - parts[0]) / _60;
            parts.unshift(value);
          }
        }
        return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
      }
      var intTime = {
        identify: (value) => typeof value === "bigint" || Number.isInteger(value),
        default: true,
        tag: "tag:yaml.org,2002:int",
        format: "TIME",
        test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
        resolve: (str2, _onError, { intAsBigInt }) => parseSexagesimal(str2, intAsBigInt),
        stringify: stringifySexagesimal
      };
      var floatTime = {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        format: "TIME",
        test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
        resolve: (str2) => parseSexagesimal(str2, false),
        stringify: stringifySexagesimal
      };
      var timestamp2 = {
        identify: (value) => value instanceof Date,
        default: true,
        tag: "tag:yaml.org,2002:timestamp",
        // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
        // may be omitted altogether, resulting in a date format. In such a case, the time part is
        // assumed to be 00:00:00Z (start of day, UTC).
        test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
        resolve(str2) {
          const match = str2.match(timestamp2.test);
          if (!match)
            throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
          const [, year, month, day, hour, minute, second] = match.map(Number);
          const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
          let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
          const tz = match[8];
          if (tz && tz !== "Z") {
            let d = parseSexagesimal(tz, false);
            if (Math.abs(d) < 30)
              d *= 60;
            date -= 6e4 * d;
          }
          return new Date(date);
        },
        stringify: ({ value }) => value.toISOString().replace(/((T00:00)?:00)?\.000Z$/, "")
      };
      exports.floatTime = floatTime;
      exports.intTime = intTime;
      exports.timestamp = timestamp2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/schema.js
  var require_schema3 = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
      "use strict";
      var map2 = require_map();
      var _null2 = require_null();
      var seq2 = require_seq();
      var string = require_string();
      var binary2 = require_binary();
      var bool2 = require_bool2();
      var float2 = require_float2();
      var int2 = require_int2();
      var omap2 = require_omap();
      var pairs2 = require_pairs();
      var set2 = require_set();
      var timestamp2 = require_timestamp();
      var schema2 = [
        map2.map,
        seq2.seq,
        string.string,
        _null2.nullTag,
        bool2.trueTag,
        bool2.falseTag,
        int2.intBin,
        int2.intOct,
        int2.int,
        int2.intHex,
        float2.floatNaN,
        float2.floatExp,
        float2.float,
        binary2.binary,
        omap2.omap,
        pairs2.pairs,
        set2.set,
        timestamp2.intTime,
        timestamp2.floatTime,
        timestamp2.timestamp
      ];
      exports.schema = schema2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/tags.js
  var require_tags = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/tags.js"(exports) {
      "use strict";
      var map2 = require_map();
      var _null2 = require_null();
      var seq2 = require_seq();
      var string = require_string();
      var bool2 = require_bool();
      var float2 = require_float();
      var int2 = require_int();
      var schema2 = require_schema();
      var schema$1 = require_schema2();
      var binary2 = require_binary();
      var omap2 = require_omap();
      var pairs2 = require_pairs();
      var schema$2 = require_schema3();
      var set2 = require_set();
      var timestamp2 = require_timestamp();
      var schemas = /* @__PURE__ */ new Map([
        ["core", schema2.schema],
        ["failsafe", [map2.map, seq2.seq, string.string]],
        ["json", schema$1.schema],
        ["yaml11", schema$2.schema],
        ["yaml-1.1", schema$2.schema]
      ]);
      var tagsByName = {
        binary: binary2.binary,
        bool: bool2.boolTag,
        float: float2.float,
        floatExp: float2.floatExp,
        floatNaN: float2.floatNaN,
        floatTime: timestamp2.floatTime,
        int: int2.int,
        intHex: int2.intHex,
        intOct: int2.intOct,
        intTime: timestamp2.intTime,
        map: map2.map,
        null: _null2.nullTag,
        omap: omap2.omap,
        pairs: pairs2.pairs,
        seq: seq2.seq,
        set: set2.set,
        timestamp: timestamp2.timestamp
      };
      var coreKnownTags = {
        "tag:yaml.org,2002:binary": binary2.binary,
        "tag:yaml.org,2002:omap": omap2.omap,
        "tag:yaml.org,2002:pairs": pairs2.pairs,
        "tag:yaml.org,2002:set": set2.set,
        "tag:yaml.org,2002:timestamp": timestamp2.timestamp
      };
      function getTags(customTags, schemaName) {
        let tags = schemas.get(schemaName);
        if (!tags) {
          if (Array.isArray(customTags))
            tags = [];
          else {
            const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
            throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
          }
        }
        if (Array.isArray(customTags)) {
          for (const tag of customTags)
            tags = tags.concat(tag);
        } else if (typeof customTags === "function") {
          tags = customTags(tags.slice());
        }
        return tags.map((tag) => {
          if (typeof tag !== "string")
            return tag;
          const tagObj = tagsByName[tag];
          if (tagObj)
            return tagObj;
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag "${tag}"; use one of ${keys}`);
        });
      }
      exports.coreKnownTags = coreKnownTags;
      exports.getTags = getTags;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/Schema.js
  var require_Schema = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/schema/Schema.js"(exports) {
      "use strict";
      var identity = require_identity();
      var map2 = require_map();
      var seq2 = require_seq();
      var string = require_string();
      var tags = require_tags();
      var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
      var Schema = class _Schema {
        constructor({ compat, customTags, merge: merge2, resolveKnownTags, schema: schema2, sortMapEntries, toStringDefaults }) {
          this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
          this.merge = !!merge2;
          this.name = typeof schema2 === "string" && schema2 || "core";
          this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
          this.tags = tags.getTags(customTags, this.name);
          this.toStringOptions = toStringDefaults ?? null;
          Object.defineProperty(this, identity.MAP, { value: map2.map });
          Object.defineProperty(this, identity.SCALAR, { value: string.string });
          Object.defineProperty(this, identity.SEQ, { value: seq2.seq });
          this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
        }
        clone() {
          const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
          copy.tags = this.tags.slice();
          return copy;
        }
      };
      exports.Schema = Schema;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyDocument.js
  var require_stringifyDocument = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
      "use strict";
      var identity = require_identity();
      var stringify2 = require_stringify();
      var stringifyComment = require_stringifyComment();
      function stringifyDocument(doc, options) {
        const lines = [];
        let hasDirectives = options.directives === true;
        if (options.directives !== false && doc.directives) {
          const dir = doc.directives.toString(doc);
          if (dir) {
            lines.push(dir);
            hasDirectives = true;
          } else if (doc.directives.docStart)
            hasDirectives = true;
        }
        if (hasDirectives)
          lines.push("---");
        const ctx = stringify2.createStringifyContext(doc, options);
        const { commentString } = ctx.options;
        if (doc.commentBefore) {
          if (lines.length !== 1)
            lines.unshift("");
          const cs = commentString(doc.commentBefore);
          lines.unshift(stringifyComment.indentComment(cs, ""));
        }
        let chompKeep = false;
        let contentComment = null;
        if (doc.contents) {
          if (identity.isNode(doc.contents)) {
            if (doc.contents.spaceBefore && hasDirectives)
              lines.push("");
            if (doc.contents.commentBefore) {
              const cs = commentString(doc.contents.commentBefore);
              lines.push(stringifyComment.indentComment(cs, ""));
            }
            ctx.forceBlockIndent = !!doc.comment;
            contentComment = doc.contents.comment;
          }
          const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
          let body = stringify2.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
          if (contentComment)
            body += stringifyComment.lineComment(body, "", commentString(contentComment));
          if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
            lines[lines.length - 1] = `--- ${body}`;
          } else
            lines.push(body);
        } else {
          lines.push(stringify2.stringify(doc.contents, ctx));
        }
        if (doc.directives?.docEnd) {
          if (doc.comment) {
            const cs = commentString(doc.comment);
            if (cs.includes("\n")) {
              lines.push("...");
              lines.push(stringifyComment.indentComment(cs, ""));
            } else {
              lines.push(`... ${cs}`);
            }
          } else {
            lines.push("...");
          }
        } else {
          let dc = doc.comment;
          if (dc && chompKeep)
            dc = dc.replace(/^\n+/, "");
          if (dc) {
            if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
              lines.push("");
            lines.push(stringifyComment.indentComment(commentString(dc), ""));
          }
        }
        return lines.join("\n") + "\n";
      }
      exports.stringifyDocument = stringifyDocument;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/Document.js
  var require_Document = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/doc/Document.js"(exports) {
      "use strict";
      var Alias = require_Alias();
      var Collection = require_Collection();
      var identity = require_identity();
      var Pair = require_Pair();
      var toJS = require_toJS();
      var Schema = require_Schema();
      var stringifyDocument = require_stringifyDocument();
      var anchors = require_anchors();
      var applyReviver = require_applyReviver();
      var createNode = require_createNode();
      var directives = require_directives();
      var Document = class _Document {
        constructor(value, replacer, options) {
          this.commentBefore = null;
          this.comment = null;
          this.errors = [];
          this.warnings = [];
          Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
          let _replacer = null;
          if (typeof replacer === "function" || Array.isArray(replacer)) {
            _replacer = replacer;
          } else if (options === void 0 && replacer) {
            options = replacer;
            replacer = void 0;
          }
          const opt = Object.assign({
            intAsBigInt: false,
            keepSourceTokens: false,
            logLevel: "warn",
            prettyErrors: true,
            strict: true,
            uniqueKeys: true,
            version: "1.2"
          }, options);
          this.options = opt;
          let { version } = opt;
          if (options?._directives) {
            this.directives = options._directives.atDocument();
            if (this.directives.yaml.explicit)
              version = this.directives.yaml.version;
          } else
            this.directives = new directives.Directives({ version });
          this.setSchema(version, options);
          this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
        }
        /**
         * Create a deep copy of this Document and its contents.
         *
         * Custom Node values that inherit from `Object` still refer to their original instances.
         */
        clone() {
          const copy = Object.create(_Document.prototype, {
            [identity.NODE_TYPE]: { value: identity.DOC }
          });
          copy.commentBefore = this.commentBefore;
          copy.comment = this.comment;
          copy.errors = this.errors.slice();
          copy.warnings = this.warnings.slice();
          copy.options = Object.assign({}, this.options);
          if (this.directives)
            copy.directives = this.directives.clone();
          copy.schema = this.schema.clone();
          copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
          if (this.range)
            copy.range = this.range.slice();
          return copy;
        }
        /** Adds a value to the document. */
        add(value) {
          if (assertCollection(this.contents))
            this.contents.add(value);
        }
        /** Adds a value to the document. */
        addIn(path, value) {
          if (assertCollection(this.contents))
            this.contents.addIn(path, value);
        }
        /**
         * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
         *
         * If `node` already has an anchor, `name` is ignored.
         * Otherwise, the `node.anchor` value will be set to `name`,
         * or if an anchor with that name is already present in the document,
         * `name` will be used as a prefix for a new unique anchor.
         * If `name` is undefined, the generated anchor will use 'a' as a prefix.
         */
        createAlias(node, name) {
          if (!node.anchor) {
            const prev = anchors.anchorNames(this);
            node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
          }
          return new Alias.Alias(node.anchor);
        }
        createNode(value, replacer, options) {
          let _replacer = void 0;
          if (typeof replacer === "function") {
            value = replacer.call({ "": value }, "", value);
            _replacer = replacer;
          } else if (Array.isArray(replacer)) {
            const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
            const asStr = replacer.filter(keyToStr).map(String);
            if (asStr.length > 0)
              replacer = replacer.concat(asStr);
            _replacer = replacer;
          } else if (options === void 0 && replacer) {
            options = replacer;
            replacer = void 0;
          }
          const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
          const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
            this,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            anchorPrefix || "a"
          );
          const ctx = {
            aliasDuplicateObjects: aliasDuplicateObjects ?? true,
            keepUndefined: keepUndefined ?? false,
            onAnchor,
            onTagObj,
            replacer: _replacer,
            schema: this.schema,
            sourceObjects
          };
          const node = createNode.createNode(value, tag, ctx);
          if (flow && identity.isCollection(node))
            node.flow = true;
          setAnchors();
          return node;
        }
        /**
         * Convert a key and a value into a `Pair` using the current schema,
         * recursively wrapping all values as `Scalar` or `Collection` nodes.
         */
        createPair(key, value, options = {}) {
          const k = this.createNode(key, null, options);
          const v = this.createNode(value, null, options);
          return new Pair.Pair(k, v);
        }
        /**
         * Removes a value from the document.
         * @returns `true` if the item was found and removed.
         */
        delete(key) {
          return assertCollection(this.contents) ? this.contents.delete(key) : false;
        }
        /**
         * Removes a value from the document.
         * @returns `true` if the item was found and removed.
         */
        deleteIn(path) {
          if (Collection.isEmptyPath(path)) {
            if (this.contents == null)
              return false;
            this.contents = null;
            return true;
          }
          return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
        }
        /**
         * Returns item at `key`, or `undefined` if not found. By default unwraps
         * scalar values from their surrounding node; to disable set `keepScalar` to
         * `true` (collections are always returned intact).
         */
        get(key, keepScalar) {
          return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
        }
        /**
         * Returns item at `path`, or `undefined` if not found. By default unwraps
         * scalar values from their surrounding node; to disable set `keepScalar` to
         * `true` (collections are always returned intact).
         */
        getIn(path, keepScalar) {
          if (Collection.isEmptyPath(path))
            return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
          return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
        }
        /**
         * Checks if the document includes a value with the key `key`.
         */
        has(key) {
          return identity.isCollection(this.contents) ? this.contents.has(key) : false;
        }
        /**
         * Checks if the document includes a value at `path`.
         */
        hasIn(path) {
          if (Collection.isEmptyPath(path))
            return this.contents !== void 0;
          return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
        }
        /**
         * Sets a value in this document. For `!!set`, `value` needs to be a
         * boolean to add/remove the item from the set.
         */
        set(key, value) {
          if (this.contents == null) {
            this.contents = Collection.collectionFromPath(this.schema, [key], value);
          } else if (assertCollection(this.contents)) {
            this.contents.set(key, value);
          }
        }
        /**
         * Sets a value in this document. For `!!set`, `value` needs to be a
         * boolean to add/remove the item from the set.
         */
        setIn(path, value) {
          if (Collection.isEmptyPath(path)) {
            this.contents = value;
          } else if (this.contents == null) {
            this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
          } else if (assertCollection(this.contents)) {
            this.contents.setIn(path, value);
          }
        }
        /**
         * Change the YAML version and schema used by the document.
         * A `null` version disables support for directives, explicit tags, anchors, and aliases.
         * It also requires the `schema` option to be given as a `Schema` instance value.
         *
         * Overrides all previously set schema options.
         */
        setSchema(version, options = {}) {
          if (typeof version === "number")
            version = String(version);
          let opt;
          switch (version) {
            case "1.1":
              if (this.directives)
                this.directives.yaml.version = "1.1";
              else
                this.directives = new directives.Directives({ version: "1.1" });
              opt = { merge: true, resolveKnownTags: false, schema: "yaml-1.1" };
              break;
            case "1.2":
            case "next":
              if (this.directives)
                this.directives.yaml.version = version;
              else
                this.directives = new directives.Directives({ version });
              opt = { merge: false, resolveKnownTags: true, schema: "core" };
              break;
            case null:
              if (this.directives)
                delete this.directives;
              opt = null;
              break;
            default: {
              const sv = JSON.stringify(version);
              throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
            }
          }
          if (options.schema instanceof Object)
            this.schema = options.schema;
          else if (opt)
            this.schema = new Schema.Schema(Object.assign(opt, options));
          else
            throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
        }
        // json & jsonArg are only used from toJSON()
        toJS({ json: json2, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
          const ctx = {
            anchors: /* @__PURE__ */ new Map(),
            doc: this,
            keep: !json2,
            mapAsMap: mapAsMap === true,
            mapKeyWarned: false,
            maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
          };
          const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
          if (typeof onAnchor === "function")
            for (const { count, res: res2 } of ctx.anchors.values())
              onAnchor(res2, count);
          return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
        }
        /**
         * A JSON representation of the document `contents`.
         *
         * @param jsonArg Used by `JSON.stringify` to indicate the array index or
         *   property name.
         */
        toJSON(jsonArg, onAnchor) {
          return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
        }
        /** A YAML representation of the document. */
        toString(options = {}) {
          if (this.errors.length > 0)
            throw new Error("Document with errors cannot be stringified");
          if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
            const s = JSON.stringify(options.indent);
            throw new Error(`"indent" option must be a positive integer, not ${s}`);
          }
          return stringifyDocument.stringifyDocument(this, options);
        }
      };
      function assertCollection(contents) {
        if (identity.isCollection(contents))
          return true;
        throw new Error("Expected a YAML collection as document contents");
      }
      exports.Document = Document;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/errors.js
  var require_errors = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/errors.js"(exports) {
      "use strict";
      var YAMLError = class extends Error {
        constructor(name, pos, code, message) {
          super();
          this.name = name;
          this.code = code;
          this.message = message;
          this.pos = pos;
        }
      };
      var YAMLParseError = class extends YAMLError {
        constructor(pos, code, message) {
          super("YAMLParseError", pos, code, message);
        }
      };
      var YAMLWarning = class extends YAMLError {
        constructor(pos, code, message) {
          super("YAMLWarning", pos, code, message);
        }
      };
      var prettifyError = (src, lc) => (error) => {
        if (error.pos[0] === -1)
          return;
        error.linePos = error.pos.map((pos) => lc.linePos(pos));
        const { line, col } = error.linePos[0];
        error.message += ` at line ${line}, column ${col}`;
        let ci = col - 1;
        let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
        if (ci >= 60 && lineStr.length > 80) {
          const trimStart = Math.min(ci - 39, lineStr.length - 79);
          lineStr = "\u2026" + lineStr.substring(trimStart);
          ci -= trimStart - 1;
        }
        if (lineStr.length > 80)
          lineStr = lineStr.substring(0, 79) + "\u2026";
        if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
          let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
          if (prev.length > 80)
            prev = prev.substring(0, 79) + "\u2026\n";
          lineStr = prev + lineStr;
        }
        if (/[^ ]/.test(lineStr)) {
          let count = 1;
          const end = error.linePos[1];
          if (end && end.line === line && end.col > col) {
            count = Math.max(1, Math.min(end.col - col, 80 - ci));
          }
          const pointer = " ".repeat(ci) + "^".repeat(count);
          error.message += `:

${lineStr}
${pointer}
`;
        }
      };
      exports.YAMLError = YAMLError;
      exports.YAMLParseError = YAMLParseError;
      exports.YAMLWarning = YAMLWarning;
      exports.prettifyError = prettifyError;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-props.js
  var require_resolve_props = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-props.js"(exports) {
      "use strict";
      function resolveProps(tokens, { flow, indicator, next, offset, onError, startOnNewline }) {
        let spaceBefore = false;
        let atNewline = startOnNewline;
        let hasSpace = startOnNewline;
        let comment = "";
        let commentSep = "";
        let hasNewline = false;
        let hasNewlineAfterProp = false;
        let reqSpace = false;
        let anchor = null;
        let tag = null;
        let comma = null;
        let found = null;
        let start = null;
        for (const token of tokens) {
          if (reqSpace) {
            if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
              onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
            reqSpace = false;
          }
          switch (token.type) {
            case "space":
              if (!flow && atNewline && indicator !== "doc-start" && token.source[0] === "	")
                onError(token, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
              hasSpace = true;
              break;
            case "comment": {
              if (!hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = token.source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += commentSep + cb;
              commentSep = "";
              atNewline = false;
              break;
            }
            case "newline":
              if (atNewline) {
                if (comment)
                  comment += token.source;
                else
                  spaceBefore = true;
              } else
                commentSep += token.source;
              atNewline = true;
              hasNewline = true;
              if (anchor || tag)
                hasNewlineAfterProp = true;
              hasSpace = true;
              break;
            case "anchor":
              if (anchor)
                onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
              if (token.source.endsWith(":"))
                onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
              anchor = token;
              if (start === null)
                start = token.offset;
              atNewline = false;
              hasSpace = false;
              reqSpace = true;
              break;
            case "tag": {
              if (tag)
                onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
              tag = token;
              if (start === null)
                start = token.offset;
              atNewline = false;
              hasSpace = false;
              reqSpace = true;
              break;
            }
            case indicator:
              if (anchor || tag)
                onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
              if (found)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
              found = token;
              atNewline = false;
              hasSpace = false;
              break;
            case "comma":
              if (flow) {
                if (comma)
                  onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
                comma = token;
                atNewline = false;
                hasSpace = false;
                break;
              }
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
              atNewline = false;
              hasSpace = false;
          }
        }
        const last = tokens[tokens.length - 1];
        const end = last ? last.offset + last.source.length : offset;
        if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== ""))
          onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        return {
          comma,
          found,
          spaceBefore,
          comment,
          hasNewline,
          hasNewlineAfterProp,
          anchor,
          tag,
          end,
          start: start ?? end
        };
      }
      exports.resolveProps = resolveProps;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-contains-newline.js
  var require_util_contains_newline = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
      "use strict";
      function containsNewline(key) {
        if (!key)
          return null;
        switch (key.type) {
          case "alias":
          case "scalar":
          case "double-quoted-scalar":
          case "single-quoted-scalar":
            if (key.source.includes("\n"))
              return true;
            if (key.end) {
              for (const st of key.end)
                if (st.type === "newline")
                  return true;
            }
            return false;
          case "flow-collection":
            for (const it of key.items) {
              for (const st of it.start)
                if (st.type === "newline")
                  return true;
              if (it.sep) {
                for (const st of it.sep)
                  if (st.type === "newline")
                    return true;
              }
              if (containsNewline(it.key) || containsNewline(it.value))
                return true;
            }
            return false;
          default:
            return true;
        }
      }
      exports.containsNewline = containsNewline;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-flow-indent-check.js
  var require_util_flow_indent_check = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
      "use strict";
      var utilContainsNewline = require_util_contains_newline();
      function flowIndentCheck(indent, fc, onError) {
        if (fc?.type === "flow-collection") {
          const end = fc.end[0];
          if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
            const msg = "Flow end indicator should be more indented than parent";
            onError(end, "BAD_INDENT", msg, true);
          }
        }
      }
      exports.flowIndentCheck = flowIndentCheck;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-map-includes.js
  var require_util_map_includes = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
      "use strict";
      var identity = require_identity();
      function mapIncludes(ctx, items, search) {
        const { uniqueKeys } = ctx.options;
        if (uniqueKeys === false)
          return false;
        const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value && !(a.value === "<<" && ctx.schema.merge);
        return items.some((pair) => isEqual(pair.key, search));
      }
      exports.mapIncludes = mapIncludes;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-block-map.js
  var require_resolve_block_map = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
      "use strict";
      var Pair = require_Pair();
      var YAMLMap = require_YAMLMap();
      var resolveProps = require_resolve_props();
      var utilContainsNewline = require_util_contains_newline();
      var utilFlowIndentCheck = require_util_flow_indent_check();
      var utilMapIncludes = require_util_map_includes();
      var startColMsg = "All mapping items must start at the same column";
      function resolveBlockMap({ composeNode: composeNode2, composeEmptyNode }, ctx, bm, onError, tag) {
        const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
        const map2 = new NodeClass(ctx.schema);
        if (ctx.atRoot)
          ctx.atRoot = false;
        let offset = bm.offset;
        let commentEnd = null;
        for (const collItem of bm.items) {
          const { start, key, sep, value } = collItem;
          const keyProps = resolveProps.resolveProps(start, {
            indicator: "explicit-key-ind",
            next: key ?? sep?.[0],
            offset,
            onError,
            startOnNewline: true
          });
          const implicitKey = !keyProps.found;
          if (implicitKey) {
            if (key) {
              if (key.type === "block-seq")
                onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
              else if ("indent" in key && key.indent !== bm.indent)
                onError(offset, "BAD_INDENT", startColMsg);
            }
            if (!keyProps.anchor && !keyProps.tag && !sep) {
              commentEnd = keyProps.end;
              if (keyProps.comment) {
                if (map2.comment)
                  map2.comment += "\n" + keyProps.comment;
                else
                  map2.comment = keyProps.comment;
              }
              continue;
            }
            if (keyProps.hasNewlineAfterProp || utilContainsNewline.containsNewline(key)) {
              onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
            }
          } else if (keyProps.found?.indent !== bm.indent) {
            onError(offset, "BAD_INDENT", startColMsg);
          }
          const keyStart = keyProps.end;
          const keyNode = key ? composeNode2(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
          if (utilMapIncludes.mapIncludes(ctx, map2.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            startOnNewline: !key || key.type === "block-scalar"
          });
          offset = valueProps.end;
          if (valueProps.found) {
            if (implicitKey) {
              if (value?.type === "block-map" && !valueProps.hasNewline)
                onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
              if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
                onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
            }
            const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
            if (ctx.schema.compat)
              utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
            offset = valueNode.range[2];
            const pair = new Pair.Pair(keyNode, valueNode);
            if (ctx.options.keepSourceTokens)
              pair.srcToken = collItem;
            map2.items.push(pair);
          } else {
            if (implicitKey)
              onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
            if (valueProps.comment) {
              if (keyNode.comment)
                keyNode.comment += "\n" + valueProps.comment;
              else
                keyNode.comment = valueProps.comment;
            }
            const pair = new Pair.Pair(keyNode);
            if (ctx.options.keepSourceTokens)
              pair.srcToken = collItem;
            map2.items.push(pair);
          }
        }
        if (commentEnd && commentEnd < offset)
          onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
        map2.range = [bm.offset, offset, commentEnd ?? offset];
        return map2;
      }
      exports.resolveBlockMap = resolveBlockMap;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-block-seq.js
  var require_resolve_block_seq = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
      "use strict";
      var YAMLSeq = require_YAMLSeq();
      var resolveProps = require_resolve_props();
      var utilFlowIndentCheck = require_util_flow_indent_check();
      function resolveBlockSeq({ composeNode: composeNode2, composeEmptyNode }, ctx, bs, onError, tag) {
        const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
        const seq2 = new NodeClass(ctx.schema);
        if (ctx.atRoot)
          ctx.atRoot = false;
        let offset = bs.offset;
        let commentEnd = null;
        for (const { start, value } of bs.items) {
          const props = resolveProps.resolveProps(start, {
            indicator: "seq-item-ind",
            next: value,
            offset,
            onError,
            startOnNewline: true
          });
          if (!props.found) {
            if (props.anchor || props.tag || value) {
              if (value && value.type === "block-seq")
                onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
              else
                onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
            } else {
              commentEnd = props.end;
              if (props.comment)
                seq2.comment = props.comment;
              continue;
            }
          }
          const node = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
          offset = node.range[2];
          seq2.items.push(node);
        }
        seq2.range = [bs.offset, offset, commentEnd ?? offset];
        return seq2;
      }
      exports.resolveBlockSeq = resolveBlockSeq;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-end.js
  var require_resolve_end = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-end.js"(exports) {
      "use strict";
      function resolveEnd(end, offset, reqSpace, onError) {
        let comment = "";
        if (end) {
          let hasSpace = false;
          let sep = "";
          for (const token of end) {
            const { source, type: type2 } = token;
            switch (type2) {
              case "space":
                hasSpace = true;
                break;
              case "comment": {
                if (reqSpace && !hasSpace)
                  onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
                const cb = source.substring(1) || " ";
                if (!comment)
                  comment = cb;
                else
                  comment += sep + cb;
                sep = "";
                break;
              }
              case "newline":
                if (comment)
                  sep += source;
                hasSpace = true;
                break;
              default:
                onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type2} at node end`);
            }
            offset += source.length;
          }
        }
        return { comment, offset };
      }
      exports.resolveEnd = resolveEnd;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-flow-collection.js
  var require_resolve_flow_collection = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
      "use strict";
      var identity = require_identity();
      var Pair = require_Pair();
      var YAMLMap = require_YAMLMap();
      var YAMLSeq = require_YAMLSeq();
      var resolveEnd = require_resolve_end();
      var resolveProps = require_resolve_props();
      var utilContainsNewline = require_util_contains_newline();
      var utilMapIncludes = require_util_map_includes();
      var blockMsg = "Block collections are not allowed within flow collections";
      var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
      function resolveFlowCollection({ composeNode: composeNode2, composeEmptyNode }, ctx, fc, onError, tag) {
        const isMap = fc.start.source === "{";
        const fcName = isMap ? "flow map" : "flow sequence";
        const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
        const coll = new NodeClass(ctx.schema);
        coll.flow = true;
        const atRoot = ctx.atRoot;
        if (atRoot)
          ctx.atRoot = false;
        let offset = fc.offset + fc.start.source.length;
        for (let i = 0; i < fc.items.length; ++i) {
          const collItem = fc.items[i];
          const { start, key, sep, value } = collItem;
          const props = resolveProps.resolveProps(start, {
            flow: fcName,
            indicator: "explicit-key-ind",
            next: key ?? sep?.[0],
            offset,
            onError,
            startOnNewline: false
          });
          if (!props.found) {
            if (!props.anchor && !props.tag && !sep && !value) {
              if (i === 0 && props.comma)
                onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
              else if (i < fc.items.length - 1)
                onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
              if (props.comment) {
                if (coll.comment)
                  coll.comment += "\n" + props.comment;
                else
                  coll.comment = props.comment;
              }
              offset = props.end;
              continue;
            }
            if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
              onError(
                key,
                // checked by containsNewline()
                "MULTILINE_IMPLICIT_KEY",
                "Implicit keys of flow sequence pairs need to be on a single line"
              );
          }
          if (i === 0) {
            if (props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          } else {
            if (!props.comma)
              onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
            if (props.comment) {
              let prevItemComment = "";
              loop:
                for (const st of start) {
                  switch (st.type) {
                    case "comma":
                    case "space":
                      break;
                    case "comment":
                      prevItemComment = st.source.substring(1);
                      break loop;
                    default:
                      break loop;
                  }
                }
              if (prevItemComment) {
                let prev = coll.items[coll.items.length - 1];
                if (identity.isPair(prev))
                  prev = prev.value ?? prev.key;
                if (prev.comment)
                  prev.comment += "\n" + prevItemComment;
                else
                  prev.comment = prevItemComment;
                props.comment = props.comment.substring(prevItemComment.length + 1);
              }
            }
          }
          if (!isMap && !sep && !props.found) {
            const valueNode = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
            coll.items.push(valueNode);
            offset = valueNode.range[2];
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else {
            const keyStart = props.end;
            const keyNode = key ? composeNode2(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
            if (isBlock(key))
              onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
            const valueProps = resolveProps.resolveProps(sep ?? [], {
              flow: fcName,
              indicator: "map-value-ind",
              next: value,
              offset: keyNode.range[2],
              onError,
              startOnNewline: false
            });
            if (valueProps.found) {
              if (!isMap && !props.found && ctx.options.strict) {
                if (sep)
                  for (const st of sep) {
                    if (st === valueProps.found)
                      break;
                    if (st.type === "newline") {
                      onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                      break;
                    }
                  }
                if (props.start < valueProps.found.offset - 1024)
                  onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
              }
            } else if (value) {
              if ("source" in value && value.source && value.source[0] === ":")
                onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
              else
                onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
            }
            const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
            if (valueNode) {
              if (isBlock(value))
                onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
            } else if (valueProps.comment) {
              if (keyNode.comment)
                keyNode.comment += "\n" + valueProps.comment;
              else
                keyNode.comment = valueProps.comment;
            }
            const pair = new Pair.Pair(keyNode, valueNode);
            if (ctx.options.keepSourceTokens)
              pair.srcToken = collItem;
            if (isMap) {
              const map2 = coll;
              if (utilMapIncludes.mapIncludes(ctx, map2.items, keyNode))
                onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
              map2.items.push(pair);
            } else {
              const map2 = new YAMLMap.YAMLMap(ctx.schema);
              map2.flow = true;
              map2.items.push(pair);
              coll.items.push(map2);
            }
            offset = valueNode ? valueNode.range[2] : valueProps.end;
          }
        }
        const expectedEnd = isMap ? "}" : "]";
        const [ce, ...ee] = fc.end;
        let cePos = offset;
        if (ce && ce.source === expectedEnd)
          cePos = ce.offset + ce.source.length;
        else {
          const name = fcName[0].toUpperCase() + fcName.substring(1);
          const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
          onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
          if (ce && ce.source.length !== 1)
            ee.unshift(ce);
        }
        if (ee.length > 0) {
          const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
          if (end.comment) {
            if (coll.comment)
              coll.comment += "\n" + end.comment;
            else
              coll.comment = end.comment;
          }
          coll.range = [fc.offset, cePos, end.offset];
        } else {
          coll.range = [fc.offset, cePos, cePos];
        }
        return coll;
      }
      exports.resolveFlowCollection = resolveFlowCollection;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-collection.js
  var require_compose_collection = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-collection.js"(exports) {
      "use strict";
      var identity = require_identity();
      var Scalar = require_Scalar();
      var YAMLMap = require_YAMLMap();
      var YAMLSeq = require_YAMLSeq();
      var resolveBlockMap = require_resolve_block_map();
      var resolveBlockSeq = require_resolve_block_seq();
      var resolveFlowCollection = require_resolve_flow_collection();
      function resolveCollection(CN, ctx, token, onError, tagName, tag) {
        const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
        const Coll = coll.constructor;
        if (tagName === "!" || tagName === Coll.tagName) {
          coll.tag = Coll.tagName;
          return coll;
        }
        if (tagName)
          coll.tag = tagName;
        return coll;
      }
      function composeCollection(CN, ctx, token, tagToken, onError) {
        const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
        const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
        if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq" || !expType) {
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
        let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
        if (!tag) {
          const kt = ctx.schema.knownTags[tagName];
          if (kt && kt.collection === expType) {
            ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
            tag = kt;
          } else {
            if (kt?.collection) {
              onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection}`, true);
            } else {
              onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
            }
            return resolveCollection(CN, ctx, token, onError, tagName);
          }
        }
        const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
        const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
        const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
        node.range = coll.range;
        node.tag = tagName;
        if (tag?.format)
          node.format = tag.format;
        return node;
      }
      exports.composeCollection = composeCollection;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-block-scalar.js
  var require_resolve_block_scalar = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      function resolveBlockScalar(scalar, strict, onError) {
        const start = scalar.offset;
        const header = parseBlockScalarHeader(scalar, strict, onError);
        if (!header)
          return { value: "", type: null, comment: "", range: [start, start, start] };
        const type2 = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
        const lines = scalar.source ? splitLines(scalar.source) : [];
        let chompStart = lines.length;
        for (let i = lines.length - 1; i >= 0; --i) {
          const content = lines[i][1];
          if (content === "" || content === "\r")
            chompStart = i;
          else
            break;
        }
        if (chompStart === 0) {
          const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
          let end2 = start + header.length;
          if (scalar.source)
            end2 += scalar.source.length;
          return { value: value2, type: type2, comment: header.comment, range: [start, end2, end2] };
        }
        let trimIndent = scalar.indent + header.indent;
        let offset = scalar.offset + header.length;
        let contentStart = 0;
        for (let i = 0; i < chompStart; ++i) {
          const [indent, content] = lines[i];
          if (content === "" || content === "\r") {
            if (header.indent === 0 && indent.length > trimIndent)
              trimIndent = indent.length;
          } else {
            if (indent.length < trimIndent) {
              const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
              onError(offset + indent.length, "MISSING_CHAR", message);
            }
            if (header.indent === 0)
              trimIndent = indent.length;
            contentStart = i;
            break;
          }
          offset += indent.length + content.length + 1;
        }
        for (let i = lines.length - 1; i >= chompStart; --i) {
          if (lines[i][0].length > trimIndent)
            chompStart = i + 1;
        }
        let value = "";
        let sep = "";
        let prevMoreIndented = false;
        for (let i = 0; i < contentStart; ++i)
          value += lines[i][0].slice(trimIndent) + "\n";
        for (let i = contentStart; i < chompStart; ++i) {
          let [indent, content] = lines[i];
          offset += indent.length + content.length + 1;
          const crlf = content[content.length - 1] === "\r";
          if (crlf)
            content = content.slice(0, -1);
          if (content && indent.length < trimIndent) {
            const src = header.indent ? "explicit indentation indicator" : "first line";
            const message = `Block scalar lines must not be less indented than their ${src}`;
            onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
            indent = "";
          }
          if (type2 === Scalar.Scalar.BLOCK_LITERAL) {
            value += sep + indent.slice(trimIndent) + content;
            sep = "\n";
          } else if (indent.length > trimIndent || content[0] === "	") {
            if (sep === " ")
              sep = "\n";
            else if (!prevMoreIndented && sep === "\n")
              sep = "\n\n";
            value += sep + indent.slice(trimIndent) + content;
            sep = "\n";
            prevMoreIndented = true;
          } else if (content === "") {
            if (sep === "\n")
              value += "\n";
            else
              sep = "\n";
          } else {
            value += sep + content;
            sep = " ";
            prevMoreIndented = false;
          }
        }
        switch (header.chomp) {
          case "-":
            break;
          case "+":
            for (let i = chompStart; i < lines.length; ++i)
              value += "\n" + lines[i][0].slice(trimIndent);
            if (value[value.length - 1] !== "\n")
              value += "\n";
            break;
          default:
            value += "\n";
        }
        const end = start + header.length + scalar.source.length;
        return { value, type: type2, comment: header.comment, range: [start, end, end] };
      }
      function parseBlockScalarHeader({ offset, props }, strict, onError) {
        if (props[0].type !== "block-scalar-header") {
          onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
          return null;
        }
        const { source } = props[0];
        const mode = source[0];
        let indent = 0;
        let chomp = "";
        let error = -1;
        for (let i = 1; i < source.length; ++i) {
          const ch = source[i];
          if (!chomp && (ch === "-" || ch === "+"))
            chomp = ch;
          else {
            const n = Number(ch);
            if (!indent && n)
              indent = n;
            else if (error === -1)
              error = offset + i;
          }
        }
        if (error !== -1)
          onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
        let hasSpace = false;
        let comment = "";
        let length = source.length;
        for (let i = 1; i < props.length; ++i) {
          const token = props[i];
          switch (token.type) {
            case "space":
              hasSpace = true;
            case "newline":
              length += token.source.length;
              break;
            case "comment":
              if (strict && !hasSpace) {
                const message = "Comments must be separated from other tokens by white space characters";
                onError(token, "MISSING_CHAR", message);
              }
              length += token.source.length;
              comment = token.source.substring(1);
              break;
            case "error":
              onError(token, "UNEXPECTED_TOKEN", token.message);
              length += token.source.length;
              break;
            default: {
              const message = `Unexpected token in block scalar header: ${token.type}`;
              onError(token, "UNEXPECTED_TOKEN", message);
              const ts = token.source;
              if (ts && typeof ts === "string")
                length += ts.length;
            }
          }
        }
        return { mode, indent, chomp, comment, length };
      }
      function splitLines(source) {
        const split = source.split(/\n( *)/);
        const first = split[0];
        const m = first.match(/^( *)/);
        const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
        const lines = [line0];
        for (let i = 1; i < split.length; i += 2)
          lines.push([split[i], split[i + 1]]);
        return lines;
      }
      exports.resolveBlockScalar = resolveBlockScalar;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-flow-scalar.js
  var require_resolve_flow_scalar = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
      "use strict";
      var Scalar = require_Scalar();
      var resolveEnd = require_resolve_end();
      function resolveFlowScalar(scalar, strict, onError) {
        const { offset, type: type2, source, end } = scalar;
        let _type;
        let value;
        const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
        switch (type2) {
          case "scalar":
            _type = Scalar.Scalar.PLAIN;
            value = plainValue(source, _onError);
            break;
          case "single-quoted-scalar":
            _type = Scalar.Scalar.QUOTE_SINGLE;
            value = singleQuotedValue(source, _onError);
            break;
          case "double-quoted-scalar":
            _type = Scalar.Scalar.QUOTE_DOUBLE;
            value = doubleQuotedValue(source, _onError);
            break;
          default:
            onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type2}`);
            return {
              value: "",
              type: null,
              comment: "",
              range: [offset, offset + source.length, offset + source.length]
            };
        }
        const valueEnd = offset + source.length;
        const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
        return {
          value,
          type: _type,
          comment: re.comment,
          range: [offset, valueEnd, re.offset]
        };
      }
      function plainValue(source, onError) {
        let badChar = "";
        switch (source[0]) {
          case "	":
            badChar = "a tab character";
            break;
          case ",":
            badChar = "flow indicator character ,";
            break;
          case "%":
            badChar = "directive indicator character %";
            break;
          case "|":
          case ">": {
            badChar = `block scalar indicator ${source[0]}`;
            break;
          }
          case "@":
          case "`": {
            badChar = `reserved character ${source[0]}`;
            break;
          }
        }
        if (badChar)
          onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
        return foldLines(source);
      }
      function singleQuotedValue(source, onError) {
        if (source[source.length - 1] !== "'" || source.length === 1)
          onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
        return foldLines(source.slice(1, -1)).replace(/''/g, "'");
      }
      function foldLines(source) {
        let first, line;
        try {
          first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
          line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
        } catch (_) {
          first = /(.*?)[ \t]*\r?\n/sy;
          line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
        }
        let match = first.exec(source);
        if (!match)
          return source;
        let res = match[1];
        let sep = " ";
        let pos = first.lastIndex;
        line.lastIndex = pos;
        while (match = line.exec(source)) {
          if (match[1] === "") {
            if (sep === "\n")
              res += sep;
            else
              sep = "\n";
          } else {
            res += sep + match[1];
            sep = " ";
          }
          pos = line.lastIndex;
        }
        const last = /[ \t]*(.*)/sy;
        last.lastIndex = pos;
        match = last.exec(source);
        return res + sep + (match?.[1] ?? "");
      }
      function doubleQuotedValue(source, onError) {
        let res = "";
        for (let i = 1; i < source.length - 1; ++i) {
          const ch = source[i];
          if (ch === "\r" && source[i + 1] === "\n")
            continue;
          if (ch === "\n") {
            const { fold, offset } = foldNewline(source, i);
            res += fold;
            i = offset;
          } else if (ch === "\\") {
            let next = source[++i];
            const cc = escapeCodes[next];
            if (cc)
              res += cc;
            else if (next === "\n") {
              next = source[i + 1];
              while (next === " " || next === "	")
                next = source[++i + 1];
            } else if (next === "\r" && source[i + 1] === "\n") {
              next = source[++i + 1];
              while (next === " " || next === "	")
                next = source[++i + 1];
            } else if (next === "x" || next === "u" || next === "U") {
              const length = { x: 2, u: 4, U: 8 }[next];
              res += parseCharCode(source, i + 1, length, onError);
              i += length;
            } else {
              const raw = source.substr(i - 1, 2);
              onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
              res += raw;
            }
          } else if (ch === " " || ch === "	") {
            const wsStart = i;
            let next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
            if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
              res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
          } else {
            res += ch;
          }
        }
        if (source[source.length - 1] !== '"' || source.length === 1)
          onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
        return res;
      }
      function foldNewline(source, offset) {
        let fold = "";
        let ch = source[offset + 1];
        while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
          if (ch === "\r" && source[offset + 2] !== "\n")
            break;
          if (ch === "\n")
            fold += "\n";
          offset += 1;
          ch = source[offset + 1];
        }
        if (!fold)
          fold = " ";
        return { fold, offset };
      }
      var escapeCodes = {
        "0": "\0",
        a: "\x07",
        b: "\b",
        e: "\x1B",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "	",
        v: "\v",
        N: "\x85",
        _: "\xA0",
        L: "\u2028",
        P: "\u2029",
        " ": " ",
        '"': '"',
        "/": "/",
        "\\": "\\",
        "	": "	"
      };
      function parseCharCode(source, offset, length, onError) {
        const cc = source.substr(offset, length);
        const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
        const code = ok ? parseInt(cc, 16) : NaN;
        if (isNaN(code)) {
          const raw = source.substr(offset - 2, length + 2);
          onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          return raw;
        }
        return String.fromCodePoint(code);
      }
      exports.resolveFlowScalar = resolveFlowScalar;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-scalar.js
  var require_compose_scalar = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
      "use strict";
      var identity = require_identity();
      var Scalar = require_Scalar();
      var resolveBlockScalar = require_resolve_block_scalar();
      var resolveFlowScalar = require_resolve_flow_scalar();
      function composeScalar(ctx, token, tagToken, onError) {
        const { value, type: type2, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(token, ctx.options.strict, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
        const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
        const tag = tagToken && tagName ? findScalarTagByName(ctx.schema, value, tagName, tagToken, onError) : token.type === "scalar" ? findScalarTagByTest(ctx, value, token, onError) : ctx.schema[identity.SCALAR];
        let scalar;
        try {
          const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
          scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
          scalar = new Scalar.Scalar(value);
        }
        scalar.range = range;
        scalar.source = value;
        if (type2)
          scalar.type = type2;
        if (tagName)
          scalar.tag = tagName;
        if (tag.format)
          scalar.format = tag.format;
        if (comment)
          scalar.comment = comment;
        return scalar;
      }
      function findScalarTagByName(schema2, value, tagName, tagToken, onError) {
        if (tagName === "!")
          return schema2[identity.SCALAR];
        const matchWithTest = [];
        for (const tag of schema2.tags) {
          if (!tag.collection && tag.tag === tagName) {
            if (tag.default && tag.test)
              matchWithTest.push(tag);
            else
              return tag;
          }
        }
        for (const tag of matchWithTest)
          if (tag.test?.test(value))
            return tag;
        const kt = schema2.knownTags[tagName];
        if (kt && !kt.collection) {
          schema2.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
          return kt;
        }
        onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
        return schema2[identity.SCALAR];
      }
      function findScalarTagByTest({ directives, schema: schema2 }, value, token, onError) {
        const tag = schema2.tags.find((tag2) => tag2.default && tag2.test?.test(value)) || schema2[identity.SCALAR];
        if (schema2.compat) {
          const compat = schema2.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema2[identity.SCALAR];
          if (tag.tag !== compat.tag) {
            const ts = directives.tagString(tag.tag);
            const cs = directives.tagString(compat.tag);
            const msg = `Value may be parsed as either ${ts} or ${cs}`;
            onError(token, "TAG_RESOLVE_FAILED", msg, true);
          }
        }
        return tag;
      }
      exports.composeScalar = composeScalar;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-empty-scalar-position.js
  var require_util_empty_scalar_position = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
      "use strict";
      function emptyScalarPosition(offset, before, pos) {
        if (before) {
          if (pos === null)
            pos = before.length;
          for (let i = pos - 1; i >= 0; --i) {
            let st = before[i];
            switch (st.type) {
              case "space":
              case "comment":
              case "newline":
                offset -= st.source.length;
                continue;
            }
            st = before[++i];
            while (st?.type === "space") {
              offset += st.source.length;
              st = before[++i];
            }
            break;
          }
        }
        return offset;
      }
      exports.emptyScalarPosition = emptyScalarPosition;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-node.js
  var require_compose_node = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-node.js"(exports) {
      "use strict";
      var Alias = require_Alias();
      var composeCollection = require_compose_collection();
      var composeScalar = require_compose_scalar();
      var resolveEnd = require_resolve_end();
      var utilEmptyScalarPosition = require_util_empty_scalar_position();
      var CN = { composeNode: composeNode2, composeEmptyNode };
      function composeNode2(ctx, token, props, onError) {
        const { spaceBefore, comment, anchor, tag } = props;
        let node;
        let isSrcToken = true;
        switch (token.type) {
          case "alias":
            node = composeAlias(ctx, token, onError);
            if (anchor || tag)
              onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
            break;
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
          case "block-scalar":
            node = composeScalar.composeScalar(ctx, token, tag, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
            break;
          case "block-map":
          case "block-seq":
          case "flow-collection":
            node = composeCollection.composeCollection(CN, ctx, token, tag, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
            break;
          default: {
            const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
            onError(token, "UNEXPECTED_TOKEN", message);
            node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError);
            isSrcToken = false;
          }
        }
        if (anchor && node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
        if (spaceBefore)
          node.spaceBefore = true;
        if (comment) {
          if (token.type === "scalar" && token.source === "")
            node.comment = comment;
          else
            node.commentBefore = comment;
        }
        if (ctx.options.keepSourceTokens && isSrcToken)
          node.srcToken = token;
        return node;
      }
      function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
        const token = {
          type: "scalar",
          offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
          indent: -1,
          source: ""
        };
        const node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor) {
          node.anchor = anchor.source.substring(1);
          if (node.anchor === "")
            onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
        }
        if (spaceBefore)
          node.spaceBefore = true;
        if (comment) {
          node.comment = comment;
          node.range[2] = end;
        }
        return node;
      }
      function composeAlias({ options }, { offset, source, end }, onError) {
        const alias = new Alias.Alias(source.substring(1));
        if (alias.source === "")
          onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
        if (alias.source.endsWith(":"))
          onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
        const valueEnd = offset + source.length;
        const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
        alias.range = [offset, valueEnd, re.offset];
        if (re.comment)
          alias.comment = re.comment;
        return alias;
      }
      exports.composeEmptyNode = composeEmptyNode;
      exports.composeNode = composeNode2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-doc.js
  var require_compose_doc = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/compose-doc.js"(exports) {
      "use strict";
      var Document = require_Document();
      var composeNode2 = require_compose_node();
      var resolveEnd = require_resolve_end();
      var resolveProps = require_resolve_props();
      function composeDoc(options, directives, { offset, start, value, end }, onError) {
        const opts = Object.assign({ _directives: directives }, options);
        const doc = new Document.Document(void 0, opts);
        const ctx = {
          atRoot: true,
          directives: doc.directives,
          options: doc.options,
          schema: doc.schema
        };
        const props = resolveProps.resolveProps(start, {
          indicator: "doc-start",
          next: value ?? end?.[0],
          offset,
          onError,
          startOnNewline: true
        });
        if (props.found) {
          doc.directives.docStart = true;
          if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
            onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
        }
        doc.contents = value ? composeNode2.composeNode(ctx, value, props, onError) : composeNode2.composeEmptyNode(ctx, props.end, start, null, props, onError);
        const contentEnd = doc.contents.range[2];
        const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
        if (re.comment)
          doc.comment = re.comment;
        doc.range = [offset, contentEnd, re.offset];
        return doc;
      }
      exports.composeDoc = composeDoc;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/composer.js
  var require_composer = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/compose/composer.js"(exports) {
      "use strict";
      var directives = require_directives();
      var Document = require_Document();
      var errors = require_errors();
      var identity = require_identity();
      var composeDoc = require_compose_doc();
      var resolveEnd = require_resolve_end();
      function getErrorPos(src) {
        if (typeof src === "number")
          return [src, src + 1];
        if (Array.isArray(src))
          return src.length === 2 ? src : [src[0], src[1]];
        const { offset, source } = src;
        return [offset, offset + (typeof source === "string" ? source.length : 1)];
      }
      function parsePrelude(prelude) {
        let comment = "";
        let atComment = false;
        let afterEmptyLine = false;
        for (let i = 0; i < prelude.length; ++i) {
          const source = prelude[i];
          switch (source[0]) {
            case "#":
              comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
              atComment = true;
              afterEmptyLine = false;
              break;
            case "%":
              if (prelude[i + 1]?.[0] !== "#")
                i += 1;
              atComment = false;
              break;
            default:
              if (!atComment)
                afterEmptyLine = true;
              atComment = false;
          }
        }
        return { comment, afterEmptyLine };
      }
      var Composer = class {
        constructor(options = {}) {
          this.doc = null;
          this.atDirectives = false;
          this.prelude = [];
          this.errors = [];
          this.warnings = [];
          this.onError = (source, code, message, warning) => {
            const pos = getErrorPos(source);
            if (warning)
              this.warnings.push(new errors.YAMLWarning(pos, code, message));
            else
              this.errors.push(new errors.YAMLParseError(pos, code, message));
          };
          this.directives = new directives.Directives({ version: options.version || "1.2" });
          this.options = options;
        }
        decorate(doc, afterDoc) {
          const { comment, afterEmptyLine } = parsePrelude(this.prelude);
          if (comment) {
            const dc = doc.contents;
            if (afterDoc) {
              doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
            } else if (afterEmptyLine || doc.directives.docStart || !dc) {
              doc.commentBefore = comment;
            } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
              let it = dc.items[0];
              if (identity.isPair(it))
                it = it.key;
              const cb = it.commentBefore;
              it.commentBefore = cb ? `${comment}
${cb}` : comment;
            } else {
              const cb = dc.commentBefore;
              dc.commentBefore = cb ? `${comment}
${cb}` : comment;
            }
          }
          if (afterDoc) {
            Array.prototype.push.apply(doc.errors, this.errors);
            Array.prototype.push.apply(doc.warnings, this.warnings);
          } else {
            doc.errors = this.errors;
            doc.warnings = this.warnings;
          }
          this.prelude = [];
          this.errors = [];
          this.warnings = [];
        }
        /**
         * Current stream status information.
         *
         * Mostly useful at the end of input for an empty stream.
         */
        streamInfo() {
          return {
            comment: parsePrelude(this.prelude).comment,
            directives: this.directives,
            errors: this.errors,
            warnings: this.warnings
          };
        }
        /**
         * Compose tokens into documents.
         *
         * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
         * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
         */
        *compose(tokens, forceDoc = false, endOffset = -1) {
          for (const token of tokens)
            yield* this.next(token);
          yield* this.end(forceDoc, endOffset);
        }
        /** Advance the composer by one CST token. */
        *next(token) {
          if (process.env.LOG_STREAM)
            console.dir(token, { depth: null });
          switch (token.type) {
            case "directive":
              this.directives.add(token.source, (offset, message, warning) => {
                const pos = getErrorPos(token);
                pos[0] += offset;
                this.onError(pos, "BAD_DIRECTIVE", message, warning);
              });
              this.prelude.push(token.source);
              this.atDirectives = true;
              break;
            case "document": {
              const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
              if (this.atDirectives && !doc.directives.docStart)
                this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
              this.decorate(doc, false);
              if (this.doc)
                yield this.doc;
              this.doc = doc;
              this.atDirectives = false;
              break;
            }
            case "byte-order-mark":
            case "space":
              break;
            case "comment":
            case "newline":
              this.prelude.push(token.source);
              break;
            case "error": {
              const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
              const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
              if (this.atDirectives || !this.doc)
                this.errors.push(error);
              else
                this.doc.errors.push(error);
              break;
            }
            case "doc-end": {
              if (!this.doc) {
                const msg = "Unexpected doc-end without preceding document";
                this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
                break;
              }
              this.doc.directives.docEnd = true;
              const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
              this.decorate(this.doc, true);
              if (end.comment) {
                const dc = this.doc.comment;
                this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
              }
              this.doc.range[2] = end.offset;
              break;
            }
            default:
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
          }
        }
        /**
         * Call at end of input to yield any remaining document.
         *
         * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
         * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
         */
        *end(forceDoc = false, endOffset = -1) {
          if (this.doc) {
            this.decorate(this.doc, true);
            yield this.doc;
            this.doc = null;
          } else if (forceDoc) {
            const opts = Object.assign({ _directives: this.directives }, this.options);
            const doc = new Document.Document(void 0, opts);
            if (this.atDirectives)
              this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
            doc.range = [0, endOffset, endOffset];
            this.decorate(doc, false);
            yield doc;
          }
        }
      };
      exports.Composer = Composer;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst-scalar.js
  var require_cst_scalar = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
      "use strict";
      var resolveBlockScalar = require_resolve_block_scalar();
      var resolveFlowScalar = require_resolve_flow_scalar();
      var errors = require_errors();
      var stringifyString = require_stringifyString();
      function resolveAsScalar(token, strict = true, onError) {
        if (token) {
          const _onError = (pos, code, message) => {
            const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
            if (onError)
              onError(offset, code, message);
            else
              throw new errors.YAMLParseError([offset, offset + 1], code, message);
          };
          switch (token.type) {
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar":
              return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
            case "block-scalar":
              return resolveBlockScalar.resolveBlockScalar(token, strict, _onError);
          }
        }
        return null;
      }
      function createScalarToken(value, context) {
        const { implicitKey = false, indent, inFlow = false, offset = -1, type: type2 = "PLAIN" } = context;
        const source = stringifyString.stringifyString({ type: type2, value }, {
          implicitKey,
          indent: indent > 0 ? " ".repeat(indent) : "",
          inFlow,
          options: { blockQuote: true, lineWidth: -1 }
        });
        const end = context.end ?? [
          { type: "newline", offset: -1, indent, source: "\n" }
        ];
        switch (source[0]) {
          case "|":
          case ">": {
            const he = source.indexOf("\n");
            const head = source.substring(0, he);
            const body = source.substring(he + 1) + "\n";
            const props = [
              { type: "block-scalar-header", offset, indent, source: head }
            ];
            if (!addEndtoBlockProps(props, end))
              props.push({ type: "newline", offset: -1, indent, source: "\n" });
            return { type: "block-scalar", offset, indent, props, source: body };
          }
          case '"':
            return { type: "double-quoted-scalar", offset, indent, source, end };
          case "'":
            return { type: "single-quoted-scalar", offset, indent, source, end };
          default:
            return { type: "scalar", offset, indent, source, end };
        }
      }
      function setScalarValue(token, value, context = {}) {
        let { afterKey = false, implicitKey = false, inFlow = false, type: type2 } = context;
        let indent = "indent" in token ? token.indent : null;
        if (afterKey && typeof indent === "number")
          indent += 2;
        if (!type2)
          switch (token.type) {
            case "single-quoted-scalar":
              type2 = "QUOTE_SINGLE";
              break;
            case "double-quoted-scalar":
              type2 = "QUOTE_DOUBLE";
              break;
            case "block-scalar": {
              const header = token.props[0];
              if (header.type !== "block-scalar-header")
                throw new Error("Invalid block scalar header");
              type2 = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
              break;
            }
            default:
              type2 = "PLAIN";
          }
        const source = stringifyString.stringifyString({ type: type2, value }, {
          implicitKey: implicitKey || indent === null,
          indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
          inFlow,
          options: { blockQuote: true, lineWidth: -1 }
        });
        switch (source[0]) {
          case "|":
          case ">":
            setBlockScalarValue(token, source);
            break;
          case '"':
            setFlowScalarValue(token, source, "double-quoted-scalar");
            break;
          case "'":
            setFlowScalarValue(token, source, "single-quoted-scalar");
            break;
          default:
            setFlowScalarValue(token, source, "scalar");
        }
      }
      function setBlockScalarValue(token, source) {
        const he = source.indexOf("\n");
        const head = source.substring(0, he);
        const body = source.substring(he + 1) + "\n";
        if (token.type === "block-scalar") {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          header.source = head;
          token.source = body;
        } else {
          const { offset } = token;
          const indent = "indent" in token ? token.indent : -1;
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type: "block-scalar", indent, props, source: body });
        }
      }
      function addEndtoBlockProps(props, end) {
        if (end)
          for (const st of end)
            switch (st.type) {
              case "space":
              case "comment":
                props.push(st);
                break;
              case "newline":
                props.push(st);
                return true;
            }
        return false;
      }
      function setFlowScalarValue(token, source, type2) {
        switch (token.type) {
          case "scalar":
          case "double-quoted-scalar":
          case "single-quoted-scalar":
            token.type = type2;
            token.source = source;
            break;
          case "block-scalar": {
            const end = token.props.slice(1);
            let oa = source.length;
            if (token.props[0].type === "block-scalar-header")
              oa -= token.props[0].source.length;
            for (const tok of end)
              tok.offset += oa;
            delete token.props;
            Object.assign(token, { type: type2, source, end });
            break;
          }
          case "block-map":
          case "block-seq": {
            const offset = token.offset + source.length;
            const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
            delete token.items;
            Object.assign(token, { type: type2, source, end: [nl] });
            break;
          }
          default: {
            const indent = "indent" in token ? token.indent : -1;
            const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
            for (const key of Object.keys(token))
              if (key !== "type" && key !== "offset")
                delete token[key];
            Object.assign(token, { type: type2, indent, source, end });
          }
        }
      }
      exports.createScalarToken = createScalarToken;
      exports.resolveAsScalar = resolveAsScalar;
      exports.setScalarValue = setScalarValue;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst-stringify.js
  var require_cst_stringify = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
      "use strict";
      var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
      function stringifyToken(token) {
        switch (token.type) {
          case "block-scalar": {
            let res = "";
            for (const tok of token.props)
              res += stringifyToken(tok);
            return res + token.source;
          }
          case "block-map":
          case "block-seq": {
            let res = "";
            for (const item of token.items)
              res += stringifyItem(item);
            return res;
          }
          case "flow-collection": {
            let res = token.start.source;
            for (const item of token.items)
              res += stringifyItem(item);
            for (const st of token.end)
              res += st.source;
            return res;
          }
          case "document": {
            let res = stringifyItem(token);
            if (token.end)
              for (const st of token.end)
                res += st.source;
            return res;
          }
          default: {
            let res = token.source;
            if ("end" in token && token.end)
              for (const st of token.end)
                res += st.source;
            return res;
          }
        }
      }
      function stringifyItem({ start, key, sep, value }) {
        let res = "";
        for (const st of start)
          res += st.source;
        if (key)
          res += stringifyToken(key);
        if (sep)
          for (const st of sep)
            res += st.source;
        if (value)
          res += stringifyToken(value);
        return res;
      }
      exports.stringify = stringify2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst-visit.js
  var require_cst_visit = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst-visit.js"(exports) {
      "use strict";
      var BREAK = Symbol("break visit");
      var SKIP = Symbol("skip children");
      var REMOVE = Symbol("remove item");
      function visit(cst, visitor) {
        if ("type" in cst && cst.type === "document")
          cst = { start: cst.start, value: cst.value };
        _visit(Object.freeze([]), cst, visitor);
      }
      visit.BREAK = BREAK;
      visit.SKIP = SKIP;
      visit.REMOVE = REMOVE;
      visit.itemAtPath = (cst, path) => {
        let item = cst;
        for (const [field, index] of path) {
          const tok = item?.[field];
          if (tok && "items" in tok) {
            item = tok.items[index];
          } else
            return void 0;
        }
        return item;
      };
      visit.parentCollection = (cst, path) => {
        const parent = visit.itemAtPath(cst, path.slice(0, -1));
        const field = path[path.length - 1][0];
        const coll = parent?.[field];
        if (coll && "items" in coll)
          return coll;
        throw new Error("Parent collection not found");
      };
      function _visit(path, item, visitor) {
        let ctrl = visitor(item, path);
        if (typeof ctrl === "symbol")
          return ctrl;
        for (const field of ["key", "value"]) {
          const token = item[field];
          if (token && "items" in token) {
            for (let i = 0; i < token.items.length; ++i) {
              const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
              if (typeof ci === "number")
                i = ci - 1;
              else if (ci === BREAK)
                return BREAK;
              else if (ci === REMOVE) {
                token.items.splice(i, 1);
                i -= 1;
              }
            }
            if (typeof ctrl === "function" && field === "key")
              ctrl = ctrl(item, path);
          }
        }
        return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
      }
      exports.visit = visit;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst.js
  var require_cst = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/cst.js"(exports) {
      "use strict";
      var cstScalar = require_cst_scalar();
      var cstStringify = require_cst_stringify();
      var cstVisit = require_cst_visit();
      var BOM = "\uFEFF";
      var DOCUMENT = "";
      var FLOW_END = "";
      var SCALAR = "";
      var isCollection = (token) => !!token && "items" in token;
      var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
      function prettyToken(token) {
        switch (token) {
          case BOM:
            return "<BOM>";
          case DOCUMENT:
            return "<DOC>";
          case FLOW_END:
            return "<FLOW_END>";
          case SCALAR:
            return "<SCALAR>";
          default:
            return JSON.stringify(token);
        }
      }
      function tokenType(source) {
        switch (source) {
          case BOM:
            return "byte-order-mark";
          case DOCUMENT:
            return "doc-mode";
          case FLOW_END:
            return "flow-error-end";
          case SCALAR:
            return "scalar";
          case "---":
            return "doc-start";
          case "...":
            return "doc-end";
          case "":
          case "\n":
          case "\r\n":
            return "newline";
          case "-":
            return "seq-item-ind";
          case "?":
            return "explicit-key-ind";
          case ":":
            return "map-value-ind";
          case "{":
            return "flow-map-start";
          case "}":
            return "flow-map-end";
          case "[":
            return "flow-seq-start";
          case "]":
            return "flow-seq-end";
          case ",":
            return "comma";
        }
        switch (source[0]) {
          case " ":
          case "	":
            return "space";
          case "#":
            return "comment";
          case "%":
            return "directive-line";
          case "*":
            return "alias";
          case "&":
            return "anchor";
          case "!":
            return "tag";
          case "'":
            return "single-quoted-scalar";
          case '"':
            return "double-quoted-scalar";
          case "|":
          case ">":
            return "block-scalar-header";
        }
        return null;
      }
      exports.createScalarToken = cstScalar.createScalarToken;
      exports.resolveAsScalar = cstScalar.resolveAsScalar;
      exports.setScalarValue = cstScalar.setScalarValue;
      exports.stringify = cstStringify.stringify;
      exports.visit = cstVisit.visit;
      exports.BOM = BOM;
      exports.DOCUMENT = DOCUMENT;
      exports.FLOW_END = FLOW_END;
      exports.SCALAR = SCALAR;
      exports.isCollection = isCollection;
      exports.isScalar = isScalar;
      exports.prettyToken = prettyToken;
      exports.tokenType = tokenType;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/lexer.js
  var require_lexer = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/lexer.js"(exports) {
      "use strict";
      var cst = require_cst();
      function isEmpty(ch) {
        switch (ch) {
          case void 0:
          case " ":
          case "\n":
          case "\r":
          case "	":
            return true;
          default:
            return false;
        }
      }
      var hexDigits = "0123456789ABCDEFabcdef".split("");
      var tagChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()".split("");
      var invalidFlowScalarChars = ",[]{}".split("");
      var invalidAnchorChars = " ,[]{}\n\r	".split("");
      var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.includes(ch);
      var Lexer = class {
        constructor() {
          this.atEnd = false;
          this.blockScalarIndent = -1;
          this.blockScalarKeep = false;
          this.buffer = "";
          this.flowKey = false;
          this.flowLevel = 0;
          this.indentNext = 0;
          this.indentValue = 0;
          this.lineEndPos = null;
          this.next = null;
          this.pos = 0;
        }
        /**
         * Generate YAML tokens from the `source` string. If `incomplete`,
         * a part of the last line may be left as a buffer for the next call.
         *
         * @returns A generator of lexical tokens
         */
        *lex(source, incomplete = false) {
          if (source) {
            this.buffer = this.buffer ? this.buffer + source : source;
            this.lineEndPos = null;
          }
          this.atEnd = !incomplete;
          let next = this.next ?? "stream";
          while (next && (incomplete || this.hasChars(1)))
            next = yield* this.parseNext(next);
        }
        atLineEnd() {
          let i = this.pos;
          let ch = this.buffer[i];
          while (ch === " " || ch === "	")
            ch = this.buffer[++i];
          if (!ch || ch === "#" || ch === "\n")
            return true;
          if (ch === "\r")
            return this.buffer[i + 1] === "\n";
          return false;
        }
        charAt(n) {
          return this.buffer[this.pos + n];
        }
        continueScalar(offset) {
          let ch = this.buffer[offset];
          if (this.indentNext > 0) {
            let indent = 0;
            while (ch === " ")
              ch = this.buffer[++indent + offset];
            if (ch === "\r") {
              const next = this.buffer[indent + offset + 1];
              if (next === "\n" || !next && !this.atEnd)
                return offset + indent + 1;
            }
            return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
          }
          if (ch === "-" || ch === ".") {
            const dt = this.buffer.substr(offset, 3);
            if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
              return -1;
          }
          return offset;
        }
        getLine() {
          let end = this.lineEndPos;
          if (typeof end !== "number" || end !== -1 && end < this.pos) {
            end = this.buffer.indexOf("\n", this.pos);
            this.lineEndPos = end;
          }
          if (end === -1)
            return this.atEnd ? this.buffer.substring(this.pos) : null;
          if (this.buffer[end - 1] === "\r")
            end -= 1;
          return this.buffer.substring(this.pos, end);
        }
        hasChars(n) {
          return this.pos + n <= this.buffer.length;
        }
        setNext(state) {
          this.buffer = this.buffer.substring(this.pos);
          this.pos = 0;
          this.lineEndPos = null;
          this.next = state;
          return null;
        }
        peek(n) {
          return this.buffer.substr(this.pos, n);
        }
        *parseNext(next) {
          switch (next) {
            case "stream":
              return yield* this.parseStream();
            case "line-start":
              return yield* this.parseLineStart();
            case "block-start":
              return yield* this.parseBlockStart();
            case "doc":
              return yield* this.parseDocument();
            case "flow":
              return yield* this.parseFlowCollection();
            case "quoted-scalar":
              return yield* this.parseQuotedScalar();
            case "block-scalar":
              return yield* this.parseBlockScalar();
            case "plain-scalar":
              return yield* this.parsePlainScalar();
          }
        }
        *parseStream() {
          let line = this.getLine();
          if (line === null)
            return this.setNext("stream");
          if (line[0] === cst.BOM) {
            yield* this.pushCount(1);
            line = line.substring(1);
          }
          if (line[0] === "%") {
            let dirEnd = line.length;
            const cs = line.indexOf("#");
            if (cs !== -1) {
              const ch = line[cs - 1];
              if (ch === " " || ch === "	")
                dirEnd = cs - 1;
            }
            while (true) {
              const ch = line[dirEnd - 1];
              if (ch === " " || ch === "	")
                dirEnd -= 1;
              else
                break;
            }
            const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
            yield* this.pushCount(line.length - n);
            this.pushNewline();
            return "stream";
          }
          if (this.atLineEnd()) {
            const sp = yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - sp);
            yield* this.pushNewline();
            return "stream";
          }
          yield cst.DOCUMENT;
          return yield* this.parseLineStart();
        }
        *parseLineStart() {
          const ch = this.charAt(0);
          if (!ch && !this.atEnd)
            return this.setNext("line-start");
          if (ch === "-" || ch === ".") {
            if (!this.atEnd && !this.hasChars(4))
              return this.setNext("line-start");
            const s = this.peek(3);
            if (s === "---" && isEmpty(this.charAt(3))) {
              yield* this.pushCount(3);
              this.indentValue = 0;
              this.indentNext = 0;
              return "doc";
            } else if (s === "..." && isEmpty(this.charAt(3))) {
              yield* this.pushCount(3);
              return "stream";
            }
          }
          this.indentValue = yield* this.pushSpaces(false);
          if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
            this.indentNext = this.indentValue;
          return yield* this.parseBlockStart();
        }
        *parseBlockStart() {
          const [ch0, ch1] = this.peek(2);
          if (!ch1 && !this.atEnd)
            return this.setNext("block-start");
          if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
            const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
            this.indentNext = this.indentValue + 1;
            this.indentValue += n;
            return yield* this.parseBlockStart();
          }
          return "doc";
        }
        *parseDocument() {
          yield* this.pushSpaces(true);
          const line = this.getLine();
          if (line === null)
            return this.setNext("doc");
          let n = yield* this.pushIndicators();
          switch (line[n]) {
            case "#":
              yield* this.pushCount(line.length - n);
            case void 0:
              yield* this.pushNewline();
              return yield* this.parseLineStart();
            case "{":
            case "[":
              yield* this.pushCount(1);
              this.flowKey = false;
              this.flowLevel = 1;
              return "flow";
            case "}":
            case "]":
              yield* this.pushCount(1);
              return "doc";
            case "*":
              yield* this.pushUntil(isNotAnchorChar);
              return "doc";
            case '"':
            case "'":
              return yield* this.parseQuotedScalar();
            case "|":
            case ">":
              n += yield* this.parseBlockScalarHeader();
              n += yield* this.pushSpaces(true);
              yield* this.pushCount(line.length - n);
              yield* this.pushNewline();
              return yield* this.parseBlockScalar();
            default:
              return yield* this.parsePlainScalar();
          }
        }
        *parseFlowCollection() {
          let nl, sp;
          let indent = -1;
          do {
            nl = yield* this.pushNewline();
            if (nl > 0) {
              sp = yield* this.pushSpaces(false);
              this.indentValue = indent = sp;
            } else {
              sp = 0;
            }
            sp += yield* this.pushSpaces(true);
          } while (nl + sp > 0);
          const line = this.getLine();
          if (line === null)
            return this.setNext("flow");
          if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
            const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
            if (!atFlowEndMarker) {
              this.flowLevel = 0;
              yield cst.FLOW_END;
              return yield* this.parseLineStart();
            }
          }
          let n = 0;
          while (line[n] === ",") {
            n += yield* this.pushCount(1);
            n += yield* this.pushSpaces(true);
            this.flowKey = false;
          }
          n += yield* this.pushIndicators();
          switch (line[n]) {
            case void 0:
              return "flow";
            case "#":
              yield* this.pushCount(line.length - n);
              return "flow";
            case "{":
            case "[":
              yield* this.pushCount(1);
              this.flowKey = false;
              this.flowLevel += 1;
              return "flow";
            case "}":
            case "]":
              yield* this.pushCount(1);
              this.flowKey = true;
              this.flowLevel -= 1;
              return this.flowLevel ? "flow" : "doc";
            case "*":
              yield* this.pushUntil(isNotAnchorChar);
              return "flow";
            case '"':
            case "'":
              this.flowKey = true;
              return yield* this.parseQuotedScalar();
            case ":": {
              const next = this.charAt(1);
              if (this.flowKey || isEmpty(next) || next === ",") {
                this.flowKey = false;
                yield* this.pushCount(1);
                yield* this.pushSpaces(true);
                return "flow";
              }
            }
            default:
              this.flowKey = false;
              return yield* this.parsePlainScalar();
          }
        }
        *parseQuotedScalar() {
          const quote = this.charAt(0);
          let end = this.buffer.indexOf(quote, this.pos + 1);
          if (quote === "'") {
            while (end !== -1 && this.buffer[end + 1] === "'")
              end = this.buffer.indexOf("'", end + 2);
          } else {
            while (end !== -1) {
              let n = 0;
              while (this.buffer[end - 1 - n] === "\\")
                n += 1;
              if (n % 2 === 0)
                break;
              end = this.buffer.indexOf('"', end + 1);
            }
          }
          const qb = this.buffer.substring(0, end);
          let nl = qb.indexOf("\n", this.pos);
          if (nl !== -1) {
            while (nl !== -1) {
              const cs = this.continueScalar(nl + 1);
              if (cs === -1)
                break;
              nl = qb.indexOf("\n", cs);
            }
            if (nl !== -1) {
              end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
            }
          }
          if (end === -1) {
            if (!this.atEnd)
              return this.setNext("quoted-scalar");
            end = this.buffer.length;
          }
          yield* this.pushToIndex(end + 1, false);
          return this.flowLevel ? "flow" : "doc";
        }
        *parseBlockScalarHeader() {
          this.blockScalarIndent = -1;
          this.blockScalarKeep = false;
          let i = this.pos;
          while (true) {
            const ch = this.buffer[++i];
            if (ch === "+")
              this.blockScalarKeep = true;
            else if (ch > "0" && ch <= "9")
              this.blockScalarIndent = Number(ch) - 1;
            else if (ch !== "-")
              break;
          }
          return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
        }
        *parseBlockScalar() {
          let nl = this.pos - 1;
          let indent = 0;
          let ch;
          loop:
            for (let i = this.pos; ch = this.buffer[i]; ++i) {
              switch (ch) {
                case " ":
                  indent += 1;
                  break;
                case "\n":
                  nl = i;
                  indent = 0;
                  break;
                case "\r": {
                  const next = this.buffer[i + 1];
                  if (!next && !this.atEnd)
                    return this.setNext("block-scalar");
                  if (next === "\n")
                    break;
                }
                default:
                  break loop;
              }
            }
          if (!ch && !this.atEnd)
            return this.setNext("block-scalar");
          if (indent >= this.indentNext) {
            if (this.blockScalarIndent === -1)
              this.indentNext = indent;
            else
              this.indentNext += this.blockScalarIndent;
            do {
              const cs = this.continueScalar(nl + 1);
              if (cs === -1)
                break;
              nl = this.buffer.indexOf("\n", cs);
            } while (nl !== -1);
            if (nl === -1) {
              if (!this.atEnd)
                return this.setNext("block-scalar");
              nl = this.buffer.length;
            }
          }
          if (!this.blockScalarKeep) {
            do {
              let i = nl - 1;
              let ch2 = this.buffer[i];
              if (ch2 === "\r")
                ch2 = this.buffer[--i];
              const lastChar = i;
              while (ch2 === " " || ch2 === "	")
                ch2 = this.buffer[--i];
              if (ch2 === "\n" && i >= this.pos && i + 1 + indent > lastChar)
                nl = i;
              else
                break;
            } while (true);
          }
          yield cst.SCALAR;
          yield* this.pushToIndex(nl + 1, true);
          return yield* this.parseLineStart();
        }
        *parsePlainScalar() {
          const inFlow = this.flowLevel > 0;
          let end = this.pos - 1;
          let i = this.pos - 1;
          let ch;
          while (ch = this.buffer[++i]) {
            if (ch === ":") {
              const next = this.buffer[i + 1];
              if (isEmpty(next) || inFlow && next === ",")
                break;
              end = i;
            } else if (isEmpty(ch)) {
              let next = this.buffer[i + 1];
              if (ch === "\r") {
                if (next === "\n") {
                  i += 1;
                  ch = "\n";
                  next = this.buffer[i + 1];
                } else
                  end = i;
              }
              if (next === "#" || inFlow && invalidFlowScalarChars.includes(next))
                break;
              if (ch === "\n") {
                const cs = this.continueScalar(i + 1);
                if (cs === -1)
                  break;
                i = Math.max(i, cs - 2);
              }
            } else {
              if (inFlow && invalidFlowScalarChars.includes(ch))
                break;
              end = i;
            }
          }
          if (!ch && !this.atEnd)
            return this.setNext("plain-scalar");
          yield cst.SCALAR;
          yield* this.pushToIndex(end + 1, true);
          return inFlow ? "flow" : "doc";
        }
        *pushCount(n) {
          if (n > 0) {
            yield this.buffer.substr(this.pos, n);
            this.pos += n;
            return n;
          }
          return 0;
        }
        *pushToIndex(i, allowEmpty) {
          const s = this.buffer.slice(this.pos, i);
          if (s) {
            yield s;
            this.pos += s.length;
            return s.length;
          } else if (allowEmpty)
            yield "";
          return 0;
        }
        *pushIndicators() {
          switch (this.charAt(0)) {
            case "!":
              return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
            case "&":
              return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
            case "-":
            case "?":
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && invalidFlowScalarChars.includes(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
              }
            }
          }
          return 0;
        }
        *pushTag() {
          if (this.charAt(1) === "<") {
            let i = this.pos + 2;
            let ch = this.buffer[i];
            while (!isEmpty(ch) && ch !== ">")
              ch = this.buffer[++i];
            return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
          } else {
            let i = this.pos + 1;
            let ch = this.buffer[i];
            while (ch) {
              if (tagChars.includes(ch))
                ch = this.buffer[++i];
              else if (ch === "%" && hexDigits.includes(this.buffer[i + 1]) && hexDigits.includes(this.buffer[i + 2])) {
                ch = this.buffer[i += 3];
              } else
                break;
            }
            return yield* this.pushToIndex(i, false);
          }
        }
        *pushNewline() {
          const ch = this.buffer[this.pos];
          if (ch === "\n")
            return yield* this.pushCount(1);
          else if (ch === "\r" && this.charAt(1) === "\n")
            return yield* this.pushCount(2);
          else
            return 0;
        }
        *pushSpaces(allowTabs) {
          let i = this.pos - 1;
          let ch;
          do {
            ch = this.buffer[++i];
          } while (ch === " " || allowTabs && ch === "	");
          const n = i - this.pos;
          if (n > 0) {
            yield this.buffer.substr(this.pos, n);
            this.pos = i;
          }
          return n;
        }
        *pushUntil(test) {
          let i = this.pos;
          let ch = this.buffer[i];
          while (!test(ch))
            ch = this.buffer[++i];
          return yield* this.pushToIndex(i, false);
        }
      };
      exports.Lexer = Lexer;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/line-counter.js
  var require_line_counter = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/line-counter.js"(exports) {
      "use strict";
      var LineCounter = class {
        constructor() {
          this.lineStarts = [];
          this.addNewLine = (offset) => this.lineStarts.push(offset);
          this.linePos = (offset) => {
            let low = 0;
            let high = this.lineStarts.length;
            while (low < high) {
              const mid = low + high >> 1;
              if (this.lineStarts[mid] < offset)
                low = mid + 1;
              else
                high = mid;
            }
            if (this.lineStarts[low] === offset)
              return { line: low + 1, col: 1 };
            if (low === 0)
              return { line: 0, col: offset };
            const start = this.lineStarts[low - 1];
            return { line: low, col: offset - start + 1 };
          };
        }
      };
      exports.LineCounter = LineCounter;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/parser.js
  var require_parser = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/parse/parser.js"(exports) {
      "use strict";
      var cst = require_cst();
      var lexer = require_lexer();
      function includesToken(list, type2) {
        for (let i = 0; i < list.length; ++i)
          if (list[i].type === type2)
            return true;
        return false;
      }
      function findNonEmptyIndex(list) {
        for (let i = 0; i < list.length; ++i) {
          switch (list[i].type) {
            case "space":
            case "comment":
            case "newline":
              break;
            default:
              return i;
          }
        }
        return -1;
      }
      function isFlowToken(token) {
        switch (token?.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
          case "flow-collection":
            return true;
          default:
            return false;
        }
      }
      function getPrevProps(parent) {
        switch (parent.type) {
          case "document":
            return parent.start;
          case "block-map": {
            const it = parent.items[parent.items.length - 1];
            return it.sep ?? it.start;
          }
          case "block-seq":
            return parent.items[parent.items.length - 1].start;
          default:
            return [];
        }
      }
      function getFirstKeyStartProps(prev) {
        if (prev.length === 0)
          return [];
        let i = prev.length;
        loop:
          while (--i >= 0) {
            switch (prev[i].type) {
              case "doc-start":
              case "explicit-key-ind":
              case "map-value-ind":
              case "seq-item-ind":
              case "newline":
                break loop;
            }
          }
        while (prev[++i]?.type === "space") {
        }
        return prev.splice(i, prev.length);
      }
      function fixFlowSeqItems(fc) {
        if (fc.start.type === "flow-seq-start") {
          for (const it of fc.items) {
            if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
              if (it.key)
                it.value = it.key;
              delete it.key;
              if (isFlowToken(it.value)) {
                if (it.value.end)
                  Array.prototype.push.apply(it.value.end, it.sep);
                else
                  it.value.end = it.sep;
              } else
                Array.prototype.push.apply(it.start, it.sep);
              delete it.sep;
            }
          }
        }
      }
      var Parser = class {
        /**
         * @param onNewLine - If defined, called separately with the start position of
         *   each new line (in `parse()`, including the start of input).
         */
        constructor(onNewLine) {
          this.atNewLine = true;
          this.atScalar = false;
          this.indent = 0;
          this.offset = 0;
          this.onKeyLine = false;
          this.stack = [];
          this.source = "";
          this.type = "";
          this.lexer = new lexer.Lexer();
          this.onNewLine = onNewLine;
        }
        /**
         * Parse `source` as a YAML stream.
         * If `incomplete`, a part of the last line may be left as a buffer for the next call.
         *
         * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
         *
         * @returns A generator of tokens representing each directive, document, and other structure.
         */
        *parse(source, incomplete = false) {
          if (this.onNewLine && this.offset === 0)
            this.onNewLine(0);
          for (const lexeme of this.lexer.lex(source, incomplete))
            yield* this.next(lexeme);
          if (!incomplete)
            yield* this.end();
        }
        /**
         * Advance the parser by the `source` of one lexical token.
         */
        *next(source) {
          this.source = source;
          if (process.env.LOG_TOKENS)
            console.log("|", cst.prettyToken(source));
          if (this.atScalar) {
            this.atScalar = false;
            yield* this.step();
            this.offset += source.length;
            return;
          }
          const type2 = cst.tokenType(source);
          if (!type2) {
            const message = `Not a YAML token: ${source}`;
            yield* this.pop({ type: "error", offset: this.offset, message, source });
            this.offset += source.length;
          } else if (type2 === "scalar") {
            this.atNewLine = false;
            this.atScalar = true;
            this.type = "scalar";
          } else {
            this.type = type2;
            yield* this.step();
            switch (type2) {
              case "newline":
                this.atNewLine = true;
                this.indent = 0;
                if (this.onNewLine)
                  this.onNewLine(this.offset + source.length);
                break;
              case "space":
                if (this.atNewLine && source[0] === " ")
                  this.indent += source.length;
                break;
              case "explicit-key-ind":
              case "map-value-ind":
              case "seq-item-ind":
                if (this.atNewLine)
                  this.indent += source.length;
                break;
              case "doc-mode":
              case "flow-error-end":
                return;
              default:
                this.atNewLine = false;
            }
            this.offset += source.length;
          }
        }
        /** Call at end of input to push out any remaining constructions */
        *end() {
          while (this.stack.length > 0)
            yield* this.pop();
        }
        get sourceToken() {
          const st = {
            type: this.type,
            offset: this.offset,
            indent: this.indent,
            source: this.source
          };
          return st;
        }
        *step() {
          const top = this.peek(1);
          if (this.type === "doc-end" && (!top || top.type !== "doc-end")) {
            while (this.stack.length > 0)
              yield* this.pop();
            this.stack.push({
              type: "doc-end",
              offset: this.offset,
              source: this.source
            });
            return;
          }
          if (!top)
            return yield* this.stream();
          switch (top.type) {
            case "document":
              return yield* this.document(top);
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar":
              return yield* this.scalar(top);
            case "block-scalar":
              return yield* this.blockScalar(top);
            case "block-map":
              return yield* this.blockMap(top);
            case "block-seq":
              return yield* this.blockSequence(top);
            case "flow-collection":
              return yield* this.flowCollection(top);
            case "doc-end":
              return yield* this.documentEnd(top);
          }
          yield* this.pop();
        }
        peek(n) {
          return this.stack[this.stack.length - n];
        }
        *pop(error) {
          const token = error ?? this.stack.pop();
          if (!token) {
            const message = "Tried to pop an empty stack";
            yield { type: "error", offset: this.offset, source: "", message };
          } else if (this.stack.length === 0) {
            yield token;
          } else {
            const top = this.peek(1);
            if (token.type === "block-scalar") {
              token.indent = "indent" in top ? top.indent : 0;
            } else if (token.type === "flow-collection" && top.type === "document") {
              token.indent = 0;
            }
            if (token.type === "flow-collection")
              fixFlowSeqItems(token);
            switch (top.type) {
              case "document":
                top.value = token;
                break;
              case "block-scalar":
                top.props.push(token);
                break;
              case "block-map": {
                const it = top.items[top.items.length - 1];
                if (it.value) {
                  top.items.push({ start: [], key: token, sep: [] });
                  this.onKeyLine = true;
                  return;
                } else if (it.sep) {
                  it.value = token;
                } else {
                  Object.assign(it, { key: token, sep: [] });
                  this.onKeyLine = !includesToken(it.start, "explicit-key-ind");
                  return;
                }
                break;
              }
              case "block-seq": {
                const it = top.items[top.items.length - 1];
                if (it.value)
                  top.items.push({ start: [], value: token });
                else
                  it.value = token;
                break;
              }
              case "flow-collection": {
                const it = top.items[top.items.length - 1];
                if (!it || it.value)
                  top.items.push({ start: [], key: token, sep: [] });
                else if (it.sep)
                  it.value = token;
                else
                  Object.assign(it, { key: token, sep: [] });
                return;
              }
              default:
                yield* this.pop();
                yield* this.pop(token);
            }
            if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
              const last = token.items[token.items.length - 1];
              if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
                if (top.type === "document")
                  top.end = last.start;
                else
                  top.items.push({ start: last.start });
                token.items.splice(-1, 1);
              }
            }
          }
        }
        *stream() {
          switch (this.type) {
            case "directive-line":
              yield { type: "directive", offset: this.offset, source: this.source };
              return;
            case "byte-order-mark":
            case "space":
            case "comment":
            case "newline":
              yield this.sourceToken;
              return;
            case "doc-mode":
            case "doc-start": {
              const doc = {
                type: "document",
                offset: this.offset,
                start: []
              };
              if (this.type === "doc-start")
                doc.start.push(this.sourceToken);
              this.stack.push(doc);
              return;
            }
          }
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML stream`,
            source: this.source
          };
        }
        *document(doc) {
          if (doc.value)
            return yield* this.lineEnd(doc);
          switch (this.type) {
            case "doc-start": {
              if (findNonEmptyIndex(doc.start) !== -1) {
                yield* this.pop();
                yield* this.step();
              } else
                doc.start.push(this.sourceToken);
              return;
            }
            case "anchor":
            case "tag":
            case "space":
            case "comment":
            case "newline":
              doc.start.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(doc);
          if (bv)
            this.stack.push(bv);
          else {
            yield {
              type: "error",
              offset: this.offset,
              message: `Unexpected ${this.type} token in YAML document`,
              source: this.source
            };
          }
        }
        *scalar(scalar) {
          if (this.type === "map-value-ind") {
            const prev = getPrevProps(this.peek(2));
            const start = getFirstKeyStartProps(prev);
            let sep;
            if (scalar.end) {
              sep = scalar.end;
              sep.push(this.sourceToken);
              delete scalar.end;
            } else
              sep = [this.sourceToken];
            const map2 = {
              type: "block-map",
              offset: scalar.offset,
              indent: scalar.indent,
              items: [{ start, key: scalar, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map2;
          } else
            yield* this.lineEnd(scalar);
        }
        *blockScalar(scalar) {
          switch (this.type) {
            case "space":
            case "comment":
            case "newline":
              scalar.props.push(this.sourceToken);
              return;
            case "scalar":
              scalar.source = this.source;
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine) {
                let nl = this.source.indexOf("\n") + 1;
                while (nl !== 0) {
                  this.onNewLine(this.offset + nl);
                  nl = this.source.indexOf("\n", nl) + 1;
                }
              }
              yield* this.pop();
              break;
            default:
              yield* this.pop();
              yield* this.step();
          }
        }
        *blockMap(map2) {
          const it = map2.items[map2.items.length - 1];
          switch (this.type) {
            case "newline":
              this.onKeyLine = false;
              if (it.value) {
                const end = "end" in it.value ? it.value.end : void 0;
                const last = Array.isArray(end) ? end[end.length - 1] : void 0;
                if (last?.type === "comment")
                  end?.push(this.sourceToken);
                else
                  map2.items.push({ start: [this.sourceToken] });
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "space":
            case "comment":
              if (it.value) {
                map2.items.push({ start: [this.sourceToken] });
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                if (this.atIndentedComment(it.start, map2.indent)) {
                  const prev = map2.items[map2.items.length - 2];
                  const end = prev?.value?.end;
                  if (Array.isArray(end)) {
                    Array.prototype.push.apply(end, it.start);
                    end.push(this.sourceToken);
                    map2.items.pop();
                    return;
                  }
                }
                it.start.push(this.sourceToken);
              }
              return;
          }
          if (this.indent >= map2.indent) {
            const atNextItem = !this.onKeyLine && this.indent === map2.indent && it.sep;
            let start = [];
            if (atNextItem && it.sep && !it.value) {
              const nl = [];
              for (let i = 0; i < it.sep.length; ++i) {
                const st = it.sep[i];
                switch (st.type) {
                  case "newline":
                    nl.push(i);
                    break;
                  case "space":
                    break;
                  case "comment":
                    if (st.indent > map2.indent)
                      nl.length = 0;
                    break;
                  default:
                    nl.length = 0;
                }
              }
              if (nl.length >= 2)
                start = it.sep.splice(nl[1]);
            }
            switch (this.type) {
              case "anchor":
              case "tag":
                if (atNextItem || it.value) {
                  start.push(this.sourceToken);
                  map2.items.push({ start });
                  this.onKeyLine = true;
                } else if (it.sep) {
                  it.sep.push(this.sourceToken);
                } else {
                  it.start.push(this.sourceToken);
                }
                return;
              case "explicit-key-ind":
                if (!it.sep && !includesToken(it.start, "explicit-key-ind")) {
                  it.start.push(this.sourceToken);
                } else if (atNextItem || it.value) {
                  start.push(this.sourceToken);
                  map2.items.push({ start });
                } else {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [this.sourceToken] }]
                  });
                }
                this.onKeyLine = true;
                return;
              case "map-value-ind":
                if (includesToken(it.start, "explicit-key-ind")) {
                  if (!it.sep) {
                    if (includesToken(it.start, "newline")) {
                      Object.assign(it, { key: null, sep: [this.sourceToken] });
                    } else {
                      const start2 = getFirstKeyStartProps(it.start);
                      this.stack.push({
                        type: "block-map",
                        offset: this.offset,
                        indent: this.indent,
                        items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                      });
                    }
                  } else if (it.value) {
                    map2.items.push({ start: [], key: null, sep: [this.sourceToken] });
                  } else if (includesToken(it.sep, "map-value-ind")) {
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start, key: null, sep: [this.sourceToken] }]
                    });
                  } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                    const start2 = getFirstKeyStartProps(it.start);
                    const key = it.key;
                    const sep = it.sep;
                    sep.push(this.sourceToken);
                    delete it.key, delete it.sep;
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key, sep }]
                    });
                  } else if (start.length > 0) {
                    it.sep = it.sep.concat(start, this.sourceToken);
                  } else {
                    it.sep.push(this.sourceToken);
                  }
                } else {
                  if (!it.sep) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else if (it.value || atNextItem) {
                    map2.items.push({ start, key: null, sep: [this.sourceToken] });
                  } else if (includesToken(it.sep, "map-value-ind")) {
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: [], key: null, sep: [this.sourceToken] }]
                    });
                  } else {
                    it.sep.push(this.sourceToken);
                  }
                }
                this.onKeyLine = true;
                return;
              case "alias":
              case "scalar":
              case "single-quoted-scalar":
              case "double-quoted-scalar": {
                const fs3 = this.flowScalar(this.type);
                if (atNextItem || it.value) {
                  map2.items.push({ start, key: fs3, sep: [] });
                  this.onKeyLine = true;
                } else if (it.sep) {
                  this.stack.push(fs3);
                } else {
                  Object.assign(it, { key: fs3, sep: [] });
                  this.onKeyLine = true;
                }
                return;
              }
              default: {
                const bv = this.startBlockValue(map2);
                if (bv) {
                  if (atNextItem && bv.type !== "block-seq" && includesToken(it.start, "explicit-key-ind")) {
                    map2.items.push({ start });
                  }
                  this.stack.push(bv);
                  return;
                }
              }
            }
          }
          yield* this.pop();
          yield* this.step();
        }
        *blockSequence(seq2) {
          const it = seq2.items[seq2.items.length - 1];
          switch (this.type) {
            case "newline":
              if (it.value) {
                const end = "end" in it.value ? it.value.end : void 0;
                const last = Array.isArray(end) ? end[end.length - 1] : void 0;
                if (last?.type === "comment")
                  end?.push(this.sourceToken);
                else
                  seq2.items.push({ start: [this.sourceToken] });
              } else
                it.start.push(this.sourceToken);
              return;
            case "space":
            case "comment":
              if (it.value)
                seq2.items.push({ start: [this.sourceToken] });
              else {
                if (this.atIndentedComment(it.start, seq2.indent)) {
                  const prev = seq2.items[seq2.items.length - 2];
                  const end = prev?.value?.end;
                  if (Array.isArray(end)) {
                    Array.prototype.push.apply(end, it.start);
                    end.push(this.sourceToken);
                    seq2.items.pop();
                    return;
                  }
                }
                it.start.push(this.sourceToken);
              }
              return;
            case "anchor":
            case "tag":
              if (it.value || this.indent <= seq2.indent)
                break;
              it.start.push(this.sourceToken);
              return;
            case "seq-item-ind":
              if (this.indent !== seq2.indent)
                break;
              if (it.value || includesToken(it.start, "seq-item-ind"))
                seq2.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
          }
          if (this.indent > seq2.indent) {
            const bv = this.startBlockValue(seq2);
            if (bv) {
              this.stack.push(bv);
              return;
            }
          }
          yield* this.pop();
          yield* this.step();
        }
        *flowCollection(fc) {
          const it = fc.items[fc.items.length - 1];
          if (this.type === "flow-error-end") {
            let top;
            do {
              yield* this.pop();
              top = this.peek(1);
            } while (top && top.type === "flow-collection");
          } else if (fc.end.length === 0) {
            switch (this.type) {
              case "comma":
              case "explicit-key-ind":
                if (!it || it.sep)
                  fc.items.push({ start: [this.sourceToken] });
                else
                  it.start.push(this.sourceToken);
                return;
              case "map-value-ind":
                if (!it || it.value)
                  fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
                else if (it.sep)
                  it.sep.push(this.sourceToken);
                else
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                return;
              case "space":
              case "comment":
              case "newline":
              case "anchor":
              case "tag":
                if (!it || it.value)
                  fc.items.push({ start: [this.sourceToken] });
                else if (it.sep)
                  it.sep.push(this.sourceToken);
                else
                  it.start.push(this.sourceToken);
                return;
              case "alias":
              case "scalar":
              case "single-quoted-scalar":
              case "double-quoted-scalar": {
                const fs3 = this.flowScalar(this.type);
                if (!it || it.value)
                  fc.items.push({ start: [], key: fs3, sep: [] });
                else if (it.sep)
                  this.stack.push(fs3);
                else
                  Object.assign(it, { key: fs3, sep: [] });
                return;
              }
              case "flow-map-end":
              case "flow-seq-end":
                fc.end.push(this.sourceToken);
                return;
            }
            const bv = this.startBlockValue(fc);
            if (bv)
              this.stack.push(bv);
            else {
              yield* this.pop();
              yield* this.step();
            }
          } else {
            const parent = this.peek(2);
            if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
              yield* this.pop();
              yield* this.step();
            } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
              const prev = getPrevProps(parent);
              const start = getFirstKeyStartProps(prev);
              fixFlowSeqItems(fc);
              const sep = fc.end.splice(1, fc.end.length);
              sep.push(this.sourceToken);
              const map2 = {
                type: "block-map",
                offset: fc.offset,
                indent: fc.indent,
                items: [{ start, key: fc, sep }]
              };
              this.onKeyLine = true;
              this.stack[this.stack.length - 1] = map2;
            } else {
              yield* this.lineEnd(fc);
            }
          }
        }
        flowScalar(type2) {
          if (this.onNewLine) {
            let nl = this.source.indexOf("\n") + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf("\n", nl) + 1;
            }
          }
          return {
            type: type2,
            offset: this.offset,
            indent: this.indent,
            source: this.source
          };
        }
        startBlockValue(parent) {
          switch (this.type) {
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar":
              return this.flowScalar(this.type);
            case "block-scalar-header":
              return {
                type: "block-scalar",
                offset: this.offset,
                indent: this.indent,
                props: [this.sourceToken],
                source: ""
              };
            case "flow-map-start":
            case "flow-seq-start":
              return {
                type: "flow-collection",
                offset: this.offset,
                indent: this.indent,
                start: this.sourceToken,
                items: [],
                end: []
              };
            case "seq-item-ind":
              return {
                type: "block-seq",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken] }]
              };
            case "explicit-key-ind": {
              this.onKeyLine = true;
              const prev = getPrevProps(parent);
              const start = getFirstKeyStartProps(prev);
              start.push(this.sourceToken);
              return {
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start }]
              };
            }
            case "map-value-ind": {
              this.onKeyLine = true;
              const prev = getPrevProps(parent);
              const start = getFirstKeyStartProps(prev);
              return {
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start, key: null, sep: [this.sourceToken] }]
              };
            }
          }
          return null;
        }
        atIndentedComment(start, indent) {
          if (this.type !== "comment")
            return false;
          if (this.indent <= indent)
            return false;
          return start.every((st) => st.type === "newline" || st.type === "space");
        }
        *documentEnd(docEnd) {
          if (this.type !== "doc-mode") {
            if (docEnd.end)
              docEnd.end.push(this.sourceToken);
            else
              docEnd.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
          }
        }
        *lineEnd(token) {
          switch (this.type) {
            case "comma":
            case "doc-start":
            case "doc-end":
            case "flow-seq-end":
            case "flow-map-end":
            case "map-value-ind":
              yield* this.pop();
              yield* this.step();
              break;
            case "newline":
              this.onKeyLine = false;
            case "space":
            case "comment":
            default:
              if (token.end)
                token.end.push(this.sourceToken);
              else
                token.end = [this.sourceToken];
              if (this.type === "newline")
                yield* this.pop();
          }
        }
      };
      exports.Parser = Parser;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/public-api.js
  var require_public_api = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/public-api.js"(exports) {
      "use strict";
      var composer = require_composer();
      var Document = require_Document();
      var errors = require_errors();
      var log = require_log();
      var lineCounter = require_line_counter();
      var parser = require_parser();
      function parseOptions(options) {
        const prettyErrors = options.prettyErrors !== false;
        const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
        return { lineCounter: lineCounter$1, prettyErrors };
      }
      function parseAllDocuments(source, options = {}) {
        const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
        const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
        const composer$1 = new composer.Composer(options);
        const docs = Array.from(composer$1.compose(parser$1.parse(source)));
        if (prettyErrors && lineCounter2)
          for (const doc of docs) {
            doc.errors.forEach(errors.prettifyError(source, lineCounter2));
            doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
          }
        if (docs.length > 0)
          return docs;
        return Object.assign([], { empty: true }, composer$1.streamInfo());
      }
      function parseDocument2(source, options = {}) {
        const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
        const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
        const composer$1 = new composer.Composer(options);
        let doc = null;
        for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
          if (!doc)
            doc = _doc;
          else if (doc.options.logLevel !== "silent") {
            doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
            break;
          }
        }
        if (prettyErrors && lineCounter2) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
        return doc;
      }
      function parse(src, reviver, options) {
        let _reviver = void 0;
        if (typeof reviver === "function") {
          _reviver = reviver;
        } else if (options === void 0 && reviver && typeof reviver === "object") {
          options = reviver;
        }
        const doc = parseDocument2(src, options);
        if (!doc)
          return null;
        doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
        if (doc.errors.length > 0) {
          if (doc.options.logLevel !== "silent")
            throw doc.errors[0];
          else
            doc.errors = [];
        }
        return doc.toJS(Object.assign({ reviver: _reviver }, options));
      }
      function stringify2(value, replacer, options) {
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
        }
        if (typeof options === "string")
          options = options.length;
        if (typeof options === "number") {
          const indent = Math.round(options);
          options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
        }
        if (value === void 0) {
          const { keepUndefined } = options ?? replacer ?? {};
          if (!keepUndefined)
            return void 0;
        }
        return new Document.Document(value, _replacer, options).toString(options);
      }
      exports.parse = parse;
      exports.parseAllDocuments = parseAllDocuments;
      exports.parseDocument = parseDocument2;
      exports.stringify = stringify2;
    }
  });

  // ../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/index.js
  var require_dist = __commonJS({
    "../../../.yarn/cache/yaml-npm-2.3.4-8bb6dc2c0d-cf03b68f8f.zip/node_modules/yaml/dist/index.js"(exports) {
      "use strict";
      var composer = require_composer();
      var Document = require_Document();
      var Schema = require_Schema();
      var errors = require_errors();
      var Alias = require_Alias();
      var identity = require_identity();
      var Pair = require_Pair();
      var Scalar = require_Scalar();
      var YAMLMap = require_YAMLMap();
      var YAMLSeq = require_YAMLSeq();
      var cst = require_cst();
      var lexer = require_lexer();
      var lineCounter = require_line_counter();
      var parser = require_parser();
      var publicApi = require_public_api();
      var visit = require_visit();
      exports.Composer = composer.Composer;
      exports.Document = Document.Document;
      exports.Schema = Schema.Schema;
      exports.YAMLError = errors.YAMLError;
      exports.YAMLParseError = errors.YAMLParseError;
      exports.YAMLWarning = errors.YAMLWarning;
      exports.Alias = Alias.Alias;
      exports.isAlias = identity.isAlias;
      exports.isCollection = identity.isCollection;
      exports.isDocument = identity.isDocument;
      exports.isMap = identity.isMap;
      exports.isNode = identity.isNode;
      exports.isPair = identity.isPair;
      exports.isScalar = identity.isScalar;
      exports.isSeq = identity.isSeq;
      exports.Pair = Pair.Pair;
      exports.Scalar = Scalar.Scalar;
      exports.YAMLMap = YAMLMap.YAMLMap;
      exports.YAMLSeq = YAMLSeq.YAMLSeq;
      exports.CST = cst;
      exports.Lexer = lexer.Lexer;
      exports.LineCounter = lineCounter.LineCounter;
      exports.Parser = parser.Parser;
      exports.parse = publicApi.parse;
      exports.parseAllDocuments = publicApi.parseAllDocuments;
      exports.parseDocument = publicApi.parseDocument;
      exports.stringify = publicApi.stringify;
      exports.visit = visit.visit;
      exports.visitAsync = visit.visitAsync;
    }
  });

  // sources/index.ts
  var sources_exports = {};
  __export(sources_exports, {
    default: () => sources_default
  });
  var import_fs2 = __toESM(__require("fs"));
  var import_fslib3 = __require("@yarnpkg/fslib");

  // sources/PackageYamlFS.ts
  var import_fslib = __require("@yarnpkg/fslib");
  var import_fslib2 = __require("@yarnpkg/fslib");
  var import_fs = __toESM(__require("fs"));

  // ../../../.yarn/cache/js-yaml-npm-4.1.0-3606f32312-184a24b4ea.zip/node_modules/js-yaml/dist/js-yaml.mjs
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence))
      return sequence;
    else if (isNothing(sequence))
      return [];
    return [sequence];
  }
  function extend(target, source) {
    var index, length, key, sourceKeys;
    if (source) {
      sourceKeys = Object.keys(source);
      for (index = 0, length = sourceKeys.length; index < length; index += 1) {
        key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    var result = "", cycle;
    for (cycle = 0; cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  var isNothing_1 = isNothing;
  var isObject_1 = isObject;
  var toArray_1 = toArray;
  var repeat_1 = repeat;
  var isNegativeZero_1 = isNegativeZero;
  var extend_1 = extend;
  var common = {
    isNothing: isNothing_1,
    isObject: isObject_1,
    toArray: toArray_1,
    repeat: repeat_1,
    isNegativeZero: isNegativeZero_1,
    extend: extend_1
  };
  function formatError(exception2, compact) {
    var where = "", message = exception2.reason || "(unknown reason)";
    if (!exception2.mark)
      return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += "\n\n" + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException$1(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException$1.prototype = Object.create(Error.prototype);
  YAMLException$1.prototype.constructor = YAMLException$1;
  YAMLException$1.prototype.toString = function toString(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  var exception = YAMLException$1;
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    var head = "";
    var tail = "";
    var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
      pos: position - lineStart + head.length
      // relative position
    };
  }
  function padStart(string, max) {
    return common.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer)
      return null;
    if (!options.maxLength)
      options.maxLength = 79;
    if (typeof options.indent !== "number")
      options.indent = 1;
    if (typeof options.linesBefore !== "number")
      options.linesBefore = 3;
    if (typeof options.linesAfter !== "number")
      options.linesAfter = 2;
    var re = /\r?\n|\r|\0/g;
    var lineStarts = [0];
    var lineEnds = [];
    var match;
    var foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0)
      foundLineNo = lineStarts.length - 1;
    var result = "", i, line;
    var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (i = 1; i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0)
        break;
      line = getLine(
        mark.buffer,
        lineStarts[foundLineNo - i],
        lineEnds[foundLineNo - i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
        maxLineLength
      );
      result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
    }
    line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
    result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
    for (i = 1; i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length)
        break;
      line = getLine(
        mark.buffer,
        lineStarts[foundLineNo + i],
        lineEnds[foundLineNo + i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
        maxLineLength
      );
      result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
    }
    return result.replace(/\n$/, "");
  }
  var snippet = makeSnippet;
  var TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  var YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    var result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type$1(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  var type = Type$1;
  function compileList(schema2, name) {
    var result = [];
    schema2[name].forEach(function(currentType) {
      var newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    var result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, index, length;
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (index = 0, length = arguments.length; index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema$1(definition) {
    return this.extend(definition);
  }
  Schema$1.prototype.extend = function extend2(definition) {
    var implicit = [];
    var explicit = [];
    if (definition instanceof type) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit)
        implicit = implicit.concat(definition.implicit);
      if (definition.explicit)
        explicit = explicit.concat(definition.explicit);
    } else {
      throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type$1) {
      if (!(type$1 instanceof type)) {
        throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type$1.loadKind && type$1.loadKind !== "scalar") {
        throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type$1.multi) {
        throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type$1) {
      if (!(type$1 instanceof type)) {
        throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    var result = Object.create(Schema$1.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  var schema = Schema$1;
  var str = new type("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  var seq = new type("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  var map = new type("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  var failsafe = new schema({
    explicit: [
      str,
      seq,
      map
    ]
  });
  function resolveYamlNull(data) {
    if (data === null)
      return true;
    var max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  var _null = new type("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  function resolveYamlBoolean(data) {
    if (data === null)
      return false;
    var max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  var bool = new type("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  function isHexCode(c) {
    return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
  }
  function isOctCode(c) {
    return 48 <= c && c <= 55;
  }
  function isDecCode(c) {
    return 48 <= c && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null)
      return false;
    var max = data.length, index = 0, hasDigits = false, ch;
    if (!max)
      return false;
    ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max)
        return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (; index < max; index++) {
          ch = data[index];
          if (ch === "_")
            continue;
          if (ch !== "0" && ch !== "1")
            return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "x") {
        index++;
        for (; index < max; index++) {
          ch = data[index];
          if (ch === "_")
            continue;
          if (!isHexCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "o") {
        index++;
        for (; index < max; index++) {
          ch = data[index];
          if (ch === "_")
            continue;
          if (!isOctCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
    }
    if (ch === "_")
      return false;
    for (; index < max; index++) {
      ch = data[index];
      if (ch === "_")
        continue;
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits || ch === "_")
      return false;
    return true;
  }
  function constructYamlInteger(data) {
    var value = data, sign = 1, ch;
    if (value.indexOf("_") !== -1) {
      value = value.replace(/_/g, "");
    }
    ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-")
        sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0")
      return 0;
    if (ch === "0") {
      if (value[1] === "b")
        return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x")
        return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o")
        return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
  }
  var int = new type("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      /* eslint-disable max-len */
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  var YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function resolveYamlFloat(data) {
    if (data === null)
      return false;
    if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    data[data.length - 1] === "_") {
      return false;
    }
    return true;
  }
  function constructYamlFloat(data) {
    var value, sign;
    value = data.replace(/_/g, "").toLowerCase();
    sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    var res;
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common.isNegativeZero(object)) {
      return "-0.0";
    }
    res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
  }
  var float = new type("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  var json = failsafe.extend({
    implicit: [
      _null,
      bool,
      int,
      float
    ]
  });
  var core = json;
  var YAML_DATE_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  );
  var YAML_TIMESTAMP_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function resolveYamlTimestamp(data) {
    if (data === null)
      return false;
    if (YAML_DATE_REGEXP.exec(data) !== null)
      return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
      return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
    match = YAML_DATE_REGEXP.exec(data);
    if (match === null)
      match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null)
      throw new Error("Date resolve error");
    year = +match[1];
    month = +match[2] - 1;
    day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    hour = +match[4];
    minute = +match[5];
    second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      tz_hour = +match[10];
      tz_minute = +(match[11] || 0);
      delta = (tz_hour * 60 + tz_minute) * 6e4;
      if (match[9] === "-")
        delta = -delta;
    }
    date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta)
      date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  var timestamp = new type("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  var merge = new type("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
  function resolveYamlBinary(data) {
    if (data === null)
      return false;
    var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
    for (idx = 0; idx < max; idx++) {
      code = map2.indexOf(data.charAt(idx));
      if (code > 64)
        continue;
      if (code < 0)
        return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
    for (idx = 0; idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
    for (idx = 0; idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  var binary = new type("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
  var _toString$2 = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null)
      return true;
    var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
    for (index = 0, length = object.length; index < length; index += 1) {
      pair = object[index];
      pairHasKey = false;
      if (_toString$2.call(pair) !== "[object Object]")
        return false;
      for (pairKey in pair) {
        if (_hasOwnProperty$3.call(pair, pairKey)) {
          if (!pairHasKey)
            pairHasKey = true;
          else
            return false;
        }
      }
      if (!pairHasKey)
        return false;
      if (objectKeys.indexOf(pairKey) === -1)
        objectKeys.push(pairKey);
      else
        return false;
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  var omap = new type("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  var _toString$1 = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null)
      return true;
    var index, length, pair, keys, result, object = data;
    result = new Array(object.length);
    for (index = 0, length = object.length; index < length; index += 1) {
      pair = object[index];
      if (_toString$1.call(pair) !== "[object Object]")
        return false;
      keys = Object.keys(pair);
      if (keys.length !== 1)
        return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null)
      return [];
    var index, length, pair, keys, result, object = data;
    result = new Array(object.length);
    for (index = 0, length = object.length; index < length; index += 1) {
      pair = object[index];
      keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  var pairs = new type("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null)
      return true;
    var key, object = data;
    for (key in object) {
      if (_hasOwnProperty$2.call(object, key)) {
        if (object[key] !== null)
          return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  var set = new type("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  var _default = core.extend({
    implicit: [
      timestamp,
      merge
    ],
    explicit: [
      binary,
      omap,
      pairs,
      set
    ]
  });
  var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
  var CONTEXT_FLOW_IN = 1;
  var CONTEXT_FLOW_OUT = 2;
  var CONTEXT_BLOCK_IN = 3;
  var CONTEXT_BLOCK_OUT = 4;
  var CHOMPING_CLIP = 1;
  var CHOMPING_STRIP = 2;
  var CHOMPING_KEEP = 3;
  var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
  var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
  var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function is_EOL(c) {
    return c === 10 || c === 13;
  }
  function is_WHITE_SPACE(c) {
    return c === 9 || c === 32;
  }
  function is_WS_OR_EOL(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function is_FLOW_INDICATOR(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    var lc;
    if (48 <= c && c <= 57) {
      return c - 48;
    }
    lc = c | 32;
    if (97 <= lc && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (48 <= c && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode(
      (c - 65536 >> 10) + 55296,
      (c - 65536 & 1023) + 56320
    );
  }
  var simpleEscapeCheck = new Array(256);
  var simpleEscapeMap = new Array(256);
  for (i = 0; i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  var i;
  function State$1(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || _default;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.firstTabInLine = -1;
    this.documents = [];
  }
  function generateError(state, message) {
    var mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      // omit trailing \0
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = snippet(mark);
    return new exception(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  var directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      var match, major, minor;
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      major = parseInt(match[1], 10);
      minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      var handle, prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty$1.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    var _position, _length, _character, _result;
    if (start < end) {
      _result = state.input.slice(start, end);
      if (checkJson) {
        for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
          _character = _result.charCodeAt(_position);
          if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    var sourceKeys, key, index, quantity;
    if (!common.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    sourceKeys = Object.keys(source);
    for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
      key = sourceKeys[index];
      if (!_hasOwnProperty$1.call(destination, key)) {
        destination[key] = source[key];
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    var index, quantity;
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      if (keyNode === "__proto__") {
        Object.defineProperty(_result, keyNode, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: valueNode
        });
      } else {
        _result[keyNode] = valueNode;
      }
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    var ch;
    ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (is_EOL(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    var _position = state.position, ch;
    ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || is_WS_OR_EOL(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common.repeat("\n", count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
    ch = state.input.charCodeAt(state.position);
    if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
          break;
        }
      } else if (ch === 35) {
        preceding = state.input.charCodeAt(state.position - 1);
        if (is_WS_OR_EOL(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
        break;
      } else if (is_EOL(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!is_WHITE_SPACE(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    var ch, captureStart, captureEnd;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (is_EOL(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        captureEnd = state.position;
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (is_EOL(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          hexLength = tmp;
          hexResult = 0;
          for (; hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (is_EOL(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        captureEnd = state.position;
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (is_WHITE_SPACE(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (is_WHITE_SPACE(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!is_EOL(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (is_EOL(ch)) {
        emptyLines++;
        continue;
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += "\n";
          }
        }
        break;
      }
      if (folding) {
        if (is_WHITE_SPACE(ch)) {
          atMoreIndented = true;
          state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common.repeat("\n", emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common.repeat("\n", emptyLines);
        }
      } else {
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      captureStart = state.position;
      while (!is_EOL(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
    ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      following = state.input.charCodeAt(state.position + 1);
      if (!is_WS_OR_EOL(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
    ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      following = state.input.charCodeAt(state.position + 1);
      _line = state.line;
      if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!is_WS_OR_EOL(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 33)
      return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    var _position, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 38)
      return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    var _position, alias, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 42)
      return false;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (readTagProperty(state) || readAnchorProperty(state)) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        typeList = state.typeMap.multi[state.kind || "fallback"];
        for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveName = state.input.slice(_position, state.position);
      directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !is_EOL(ch));
          break;
        }
        if (is_EOL(ch))
          break;
        _position = state.position;
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0)
        readLineBreak(state);
      if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    } else {
      return;
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += "\n";
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    var state = new State$1(input, options);
    var nullpos = input.indexOf("\0");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\0";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll$1(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    var documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (var index = 0, length = documents.length; index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load$1(input, options) {
    var documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return void 0;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new exception("expected a single document in the stream, but found more");
  }
  var loadAll_1 = loadAll$1;
  var load_1 = load$1;
  var loader = {
    loadAll: loadAll_1,
    load: load_1
  };
  var _toString = Object.prototype.toString;
  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  var CHAR_BOM = 65279;
  var CHAR_TAB = 9;
  var CHAR_LINE_FEED = 10;
  var CHAR_CARRIAGE_RETURN = 13;
  var CHAR_SPACE = 32;
  var CHAR_EXCLAMATION = 33;
  var CHAR_DOUBLE_QUOTE = 34;
  var CHAR_SHARP = 35;
  var CHAR_PERCENT = 37;
  var CHAR_AMPERSAND = 38;
  var CHAR_SINGLE_QUOTE = 39;
  var CHAR_ASTERISK = 42;
  var CHAR_COMMA = 44;
  var CHAR_MINUS = 45;
  var CHAR_COLON = 58;
  var CHAR_EQUALS = 61;
  var CHAR_GREATER_THAN = 62;
  var CHAR_QUESTION = 63;
  var CHAR_COMMERCIAL_AT = 64;
  var CHAR_LEFT_SQUARE_BRACKET = 91;
  var CHAR_RIGHT_SQUARE_BRACKET = 93;
  var CHAR_GRAVE_ACCENT = 96;
  var CHAR_LEFT_CURLY_BRACKET = 123;
  var CHAR_VERTICAL_LINE = 124;
  var CHAR_RIGHT_CURLY_BRACKET = 125;
  var ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = '\\"';
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  var DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    var result, keys, index, length, tag, style, type2;
    if (map2 === null)
      return {};
    result = {};
    keys = Object.keys(map2);
    for (index = 0, length = keys.length; index < length; index += 1) {
      tag = keys[index];
      style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    var string, handle, length;
    string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common.repeat("0", length - string.length) + string;
  }
  var QUOTING_TYPE_SINGLE = 1;
  var QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || _default;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
    while (position < length) {
      next = string.indexOf("\n", position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== "\n")
        result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return "\n" + common.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    var index, length, type2;
    for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
      type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (
      // ns-plain-safe
      (inblock ? (
        // c = flow-in
        cIsNsCharOrWhitespace
      ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
    );
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    var first = string.charCodeAt(pos), second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    var leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  var STYLE_PLAIN = 1;
  var STYLE_SINGLE = 2;
  var STYLE_LITERAL = 3;
  var STYLE_FOLDED = 4;
  var STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    var i;
    var char = 0;
    var prevChar = null;
    var hasLineBreak = false;
    var hasFoldableLine = false;
    var shouldTrackWidth = lineWidth !== -1;
    var previousLineBreak = -1;
    var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
            i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      var indent = state.indent * Math.max(1, level);
      var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(
        string,
        singleLineOnly,
        state.indent,
        lineWidth,
        testAmbiguity,
        state.quotingType,
        state.forceQuotes && !iskey,
        inblock
      )) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new exception("impossible error: invalid scalar style");
      }
    }();
  }
  function blockHeader(string, indentPerLevel) {
    var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    var clip = string[string.length - 1] === "\n";
    var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    var chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + "\n";
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    var lineRe = /(\n+)([^\n]*)/g;
    var result = function() {
      var nextLF = string.indexOf("\n");
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }();
    var prevMoreIndented = string[0] === "\n" || string[0] === " ";
    var moreIndented;
    var match;
    while (match = lineRe.exec(string)) {
      var prefix = match[1], line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ")
      return line;
    var breakRe = / [^ ]/g;
    var match;
    var start = 0, end, curr = 0, next = 0;
    var result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += "\n" + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    var result = "";
    var char = 0;
    var escapeSeq;
    for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536)
          result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    var _result = "", _tag = state.tag, index, length, value;
    for (index = 0, length = object.length; index < length; index += 1) {
      value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "")
          _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    var _result = "", _tag = state.tag, index, length, value;
    for (index = 0, length = object.length; index < length; index += 1) {
      value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = "";
      if (_result !== "")
        pairBuffer += ", ";
      if (state.condenseFlow)
        pairBuffer += '"';
      objectKey = objectKeyList[index];
      objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024)
        pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new exception("sortKeys must be a boolean or a function");
    }
    for (index = 0, length = objectKeyList.length; index < length; index += 1) {
      pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      objectKey = objectKeyList[index];
      objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    var _result, typeList, index, length, type2, style;
    typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (index = 0, length = typeList.length; index < length; index += 1) {
      type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          style = state.styleMap[type2.tag] || type2.defaultStyle;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new exception("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    var type2 = _toString.call(state.dump);
    var inblock = block;
    var tagStr;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid)
          return false;
        throw new exception("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        tagStr = encodeURI(
          state.tag[0] === "!" ? state.tag.slice(1) : state.tag
        ).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    var objects = [], duplicatesIndexes = [], index, length;
    inspectNode(object, objects, duplicatesIndexes);
    for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    var objectKeyList, index, length;
    if (object !== null && typeof object === "object") {
      index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (index = 0, length = object.length; index < length; index += 1) {
            inspectNode(object[index], objects, duplicatesIndexes);
          }
        } else {
          objectKeyList = Object.keys(object);
          for (index = 0, length = objectKeyList.length; index < length; index += 1) {
            inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump$1(input, options) {
    options = options || {};
    var state = new State(options);
    if (!state.noRefs)
      getDuplicateReferences(input, state);
    var value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true))
      return state.dump + "\n";
    return "";
  }
  var dump_1 = dump$1;
  var dumper = {
    dump: dump_1
  };
  function renamed(from, to) {
    return function() {
      throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  var FAILSAFE_SCHEMA = failsafe;
  var load = loader.load;
  var loadAll = loader.loadAll;
  var dump = dumper.dump;
  var safeLoad = renamed("safeLoad", "load");
  var safeLoadAll = renamed("safeLoadAll", "loadAll");
  var safeDump = renamed("safeDump", "dump");

  // sources/PackageYamlFS.ts
  var import_yaml = __toESM(require_dist());

  // sources/lru.ts
  var LruCache = class {
    values = /* @__PURE__ */ new Map();
    maxEntries = 20;
    get(key) {
      const hasKey = this.values.has(key);
      let entry;
      if (hasKey) {
        entry = this.values.get(key);
        this.values.delete(key);
        if (typeof entry !== "undefined") {
          this.values.set(key, entry);
        }
      }
      return entry;
    }
    set(key, value) {
      if (this.values.size >= this.maxEntries) {
        const keyToDelete = this.values.keys().next().value;
        this.values.delete(keyToDelete);
      }
      this.values.set(key, value);
    }
    delete(key) {
      this.values.delete(key);
    }
  };

  // sources/PackageYamlFS.ts
  var PackageYamlFS = class extends import_fslib.ProxiedFS {
    baseFs;
    constructor(realFs) {
      super(import_fslib2.npath);
      this.baseFs = new PortablePackageYamlFS(realFs);
    }
    mapFromBase(path) {
      return import_fslib2.npath.fromPortablePath(path);
    }
    mapToBase(path) {
      return import_fslib2.npath.toPortablePath(path);
    }
    patchManifestPath(p) {
      return this.baseFs.patchManifestPath(p);
    }
  };
  var BasePortableFakeFS = class extends import_fslib.FakeFS {
    constructor() {
      super(import_fslib2.ppath);
    }
  };
  var ManifestFiles = ["package.json", "package.yaml", "package.yml"];
  var PortablePackageYamlFS = class extends BasePortableFakeFS {
    realFs;
    // Package.json mapping cache
    //
    // To check if a file has been remapped from package.json to package.yaml
    // we need to read off the file system. This is expensive, and has the
    // potential to end up in infinite loops if we're not careful.
    //
    // This cache is is limited to just those files which we think are
    // pakage.json manifests, and it only remembers the last 100.
    // Even then, it can dramatically cut down on what was a performance hit.
    //
    // For any fs methods that may remove or rename the file, we remove their
    // cache entry. So that next time it needs to be accessed, it can be
    // checked on the filesystem again.
    //
    // This will (most likely) only fail if another program alters the file
    // during a process.
    cache;
    constructor(realFs = import_fs.default) {
      super();
      this.realFs = { ...realFs };
      this.cache = new LruCache();
    }
    // package.yaml stuff
    convertManifestPath(p, f) {
      const str2 = p.toString();
      const rest = str2.substring(0, str2.lastIndexOf("/") + 1);
      return `${rest}${f}`;
    }
    isPathForManifest(p) {
      const str2 = p.toString();
      const file = str2.substring(str2.lastIndexOf("/") + 1, str2.length);
      return ManifestFiles.includes(file) ? file : false;
    }
    doesManifestExist(p) {
      const str2 = p.toString();
      const rest = str2.substring(0, str2.lastIndexOf("/") + 1);
      return ManifestFiles.find((manifest) => {
        return this.realFs.existsSync(
          import_fslib2.npath.fromPortablePath(`${rest}${manifest}`)
        );
      });
    }
    patchManifestPath(p) {
      const cached = this.cache.get(p);
      if (typeof cached !== "undefined") {
        return cached;
      }
      let patched = p;
      if (!!this.isPathForManifest(p)) {
        const manifestName = this.doesManifestExist(p);
        if (typeof manifestName !== "undefined") {
          patched = this.convertManifestPath(p, manifestName);
        }
        this.cache.set(p, patched);
      }
      return patched;
    }
    // read the manifest file if it's yaml, and return it as json
    readManifestFile(p, encoding) {
      try {
        const manifestType = this.isPathForManifest(p);
        if (manifestType === false || manifestType == "package.json") {
          return false;
        }
        const fsNativePath = typeof p === `string` ? import_fslib2.npath.fromPortablePath(p) : p;
        const data = this.realFs.readFileSync(
          fsNativePath,
          encoding
        );
        let rawManifest = ``;
        if (data instanceof Buffer) {
          rawManifest = data.toString();
        } else {
          rawManifest = data;
        }
        const pkgYml = safeLoad(rawManifest, {
          schema: FAILSAFE_SCHEMA,
          json: true
        });
        return `${JSON.stringify(pkgYml, null, 2)}
`;
      } catch {
      }
      return false;
    }
    /// If p is for a non package.json manifest file write it, otherwise bail
    // The .yaml/.yml manifest file must be on disk, otherwsise a .json will
    // be defaulted to
    writeManifestFile(p, content, manifestFilename, opts) {
      if (typeof content === `string` || Buffer.isBuffer(content)) {
        if (manifestFilename == "package.json") {
          return false;
        }
        const mJsonStr = Buffer.isBuffer(content) ? content.toString() : content;
        try {
          const manifestObject = JSON.parse(mJsonStr);
          const nativeManifestPath = import_fslib2.npath.fromPortablePath(p);
          const rawManifest = this.realFs.readFileSync(
            nativeManifestPath,
            `utf-8`
          );
          const rpkg = (0, import_yaml.parseDocument)(rawManifest, { schema: "json" });
          const recursiveSet = (source, ppath2) => {
            for (const property in source) {
              const value = source[property];
              const path = [...ppath2, property];
              if (Array.isArray(value)) {
                recursiveSet(value, path);
              } else {
                switch (typeof value) {
                  case "object":
                    recursiveSet(value, path);
                    break;
                  case "string":
                  case "bigint":
                  case "boolean":
                  case "number":
                    rpkg.setIn(path, value);
                }
              }
            }
          };
          recursiveSet(manifestObject, []);
          const pkgStr = `${(0, import_yaml.stringify)(rpkg, {
            nullStr: "",
            simpleKeys: true
          })}
`;
          if (opts) {
            this.realFs.writeFileSync(
              import_fslib2.npath.fromPortablePath(nativeManifestPath),
              pkgStr,
              opts
            );
          } else {
            this.realFs.writeFileSync(
              import_fslib2.npath.fromPortablePath(nativeManifestPath),
              pkgStr
            );
          }
          return true;
        } catch {
        }
      }
      return false;
    }
    // FS
    getExtractHint() {
      return false;
    }
    getRealPath() {
      return import_fslib2.PortablePath.root;
    }
    resolve(p) {
      p = this.patchManifestPath(p);
      return import_fslib2.ppath.resolve(p);
    }
    async openPromise(p, flags, mode) {
      p = this.patchManifestPath(p);
      return await new Promise((resolve, reject) => {
        this.realFs.open(
          import_fslib2.npath.fromPortablePath(p),
          flags,
          mode,
          this.makeCallback(resolve, reject)
        );
      });
    }
    openSync(p, flags, mode) {
      p = this.patchManifestPath(p);
      return this.realFs.openSync(import_fslib2.npath.fromPortablePath(p), flags, mode);
    }
    async opendirPromise(p, opts) {
      return await new Promise((resolve, reject) => {
        if (typeof opts !== `undefined`) {
          this.realFs.opendir(
            import_fslib2.npath.fromPortablePath(p),
            opts,
            this.makeCallback(resolve, reject)
          );
        } else {
          this.realFs.opendir(
            import_fslib2.npath.fromPortablePath(p),
            this.makeCallback(resolve, reject)
          );
        }
      }).then((dir) => {
        return Object.defineProperty(dir, `path`, {
          value: p,
          configurable: true,
          writable: true
        });
      });
    }
    opendirSync(p, opts) {
      const dir = typeof opts !== `undefined` ? this.realFs.opendirSync(
        import_fslib2.npath.fromPortablePath(p),
        opts
      ) : this.realFs.opendirSync(
        import_fslib2.npath.fromPortablePath(p)
      );
      return Object.defineProperty(dir, `path`, {
        value: p,
        configurable: true,
        writable: true
      });
    }
    async readPromise(fd, buffer, offset = 0, length = 0, position = -1) {
      return await new Promise((resolve, reject) => {
        this.realFs.read(
          fd,
          buffer,
          offset,
          length,
          position,
          (error, bytesRead) => {
            if (error) {
              reject(error);
            } else {
              resolve(bytesRead);
            }
          }
        );
      });
    }
    readSync(fd, buffer, offset, length, position) {
      return this.realFs.readSync(fd, buffer, offset, length, position);
    }
    async writePromise(fd, buffer, offset, length, position) {
      return await new Promise((resolve, reject) => {
        if (typeof buffer === `string`) {
          return this.realFs.write(
            fd,
            buffer,
            offset,
            this.makeCallback(resolve, reject)
          );
        } else {
          return this.realFs.write(
            fd,
            buffer,
            offset,
            length,
            position,
            this.makeCallback(resolve, reject)
          );
        }
      });
    }
    writeSync(fd, buffer, offset, length, position) {
      if (typeof buffer === `string`) {
        return this.realFs.writeSync(fd, buffer, offset);
      } else {
        return this.realFs.writeSync(fd, buffer, offset, length, position);
      }
    }
    async closePromise(fd) {
      await new Promise((resolve, reject) => {
        this.realFs.close(fd, this.makeCallback(resolve, reject));
      });
    }
    closeSync(fd) {
      this.realFs.closeSync(fd);
    }
    createReadStream(p, opts) {
      if (p !== null) {
        p = this.patchManifestPath(p);
      }
      const realPath = p !== null ? import_fslib2.npath.fromPortablePath(p) : p;
      return this.realFs.createReadStream(
        realPath,
        opts
      );
    }
    createWriteStream(p, opts) {
      if (p !== null) {
        p = this.patchManifestPath(p);
      }
      const realPath = p !== null ? import_fslib2.npath.fromPortablePath(p) : p;
      return this.realFs.createWriteStream(
        realPath,
        opts
      );
    }
    async realpathPromise(p) {
      p = this.patchManifestPath(p);
      return await new Promise((resolve, reject) => {
        this.realFs.realpath(
          import_fslib2.npath.fromPortablePath(p),
          {},
          this.makeCallback(resolve, reject)
        );
      }).then((path) => {
        return import_fslib2.npath.toPortablePath(path);
      });
    }
    realpathSync(p) {
      p = this.patchManifestPath(p);
      return import_fslib2.npath.toPortablePath(
        this.realFs.realpathSync(import_fslib2.npath.fromPortablePath(p), {})
      );
    }
    async existsPromise(p) {
      p = this.patchManifestPath(p);
      return await new Promise((resolve) => {
        if (this.realFs.existsSync(import_fslib2.npath.fromPortablePath(p))) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }
    accessSync(p, mode) {
      p = this.patchManifestPath(p);
      return this.realFs.accessSync(import_fslib2.npath.fromPortablePath(p), mode);
    }
    async accessPromise(p, mode) {
      p = this.patchManifestPath(p);
      return await new Promise((resolve, reject) => {
        this.realFs.access(
          import_fslib2.npath.fromPortablePath(p),
          mode,
          this.makeCallback(resolve, reject)
        );
      });
    }
    existsSync(p) {
      p = this.patchManifestPath(p);
      return this.realFs.existsSync(import_fslib2.npath.fromPortablePath(p));
    }
    async statPromise(p, opts) {
      return await new Promise((resolve, reject) => {
        p = this.patchManifestPath(p);
        if (opts) {
          this.realFs.stat(
            import_fslib2.npath.fromPortablePath(p),
            opts,
            this.makeCallback(resolve, reject)
          );
        } else {
          this.realFs.stat(
            import_fslib2.npath.fromPortablePath(p),
            this.makeCallback(resolve, reject)
          );
        }
      });
    }
    statSync(p, opts) {
      p = this.patchManifestPath(p);
      if (opts) {
        return this.realFs.statSync(import_fslib2.npath.fromPortablePath(p), opts);
      } else {
        return this.realFs.statSync(import_fslib2.npath.fromPortablePath(p));
      }
    }
    async fstatPromise(fd, opts) {
      return await new Promise((resolve, reject) => {
        if (opts) {
          this.realFs.fstat(fd, opts, this.makeCallback(resolve, reject));
        } else {
          this.realFs.fstat(fd, this.makeCallback(resolve, reject));
        }
      });
    }
    fstatSync(fd, opts) {
      if (opts) {
        return this.realFs.fstatSync(fd, opts);
      } else {
        return this.realFs.fstatSync(fd);
      }
    }
    async lstatPromise(p, opts) {
      return await new Promise((resolve, reject) => {
        p = this.patchManifestPath(p);
        if (opts) {
          this.realFs.lstat(
            import_fslib2.npath.fromPortablePath(p),
            opts,
            this.makeCallback(resolve, reject)
          );
        } else {
          this.realFs.lstat(
            import_fslib2.npath.fromPortablePath(p),
            this.makeCallback(resolve, reject)
          );
        }
      });
    }
    lstatSync(p, opts) {
      p = this.patchManifestPath(p);
      if (opts) {
        return this.realFs.lstatSync(import_fslib2.npath.fromPortablePath(p), opts);
      } else {
        return this.realFs.lstatSync(import_fslib2.npath.fromPortablePath(p));
      }
    }
    async chmodPromise(p, mask) {
      return await new Promise((resolve, reject) => {
        p = this.patchManifestPath(p);
        this.realFs.chmod(
          import_fslib2.npath.fromPortablePath(p),
          mask,
          this.makeCallback(resolve, reject)
        );
      });
    }
    chmodSync(p, mask) {
      p = this.patchManifestPath(p);
      return this.realFs.chmodSync(import_fslib2.npath.fromPortablePath(p), mask);
    }
    async chownPromise(p, uid, gid) {
      return await new Promise((resolve, reject) => {
        p = this.patchManifestPath(p);
        this.realFs.chown(
          import_fslib2.npath.fromPortablePath(p),
          uid,
          gid,
          this.makeCallback(resolve, reject)
        );
      });
    }
    chownSync(p, uid, gid) {
      p = this.patchManifestPath(p);
      return this.realFs.chownSync(import_fslib2.npath.fromPortablePath(p), uid, gid);
    }
    async renamePromise(oldP, newP) {
      this.cache.delete(oldP);
      this.cache.delete(newP);
      return await new Promise((resolve, reject) => {
        this.realFs.rename(
          import_fslib2.npath.fromPortablePath(oldP),
          import_fslib2.npath.fromPortablePath(newP),
          this.makeCallback(resolve, reject)
        );
      });
    }
    renameSync(oldP, newP) {
      this.cache.delete(oldP);
      this.cache.delete(newP);
      return this.realFs.renameSync(
        import_fslib2.npath.fromPortablePath(oldP),
        import_fslib2.npath.fromPortablePath(newP)
      );
    }
    async copyFilePromise(sourceP, destP, flags = 0) {
      return await new Promise((resolve, reject) => {
        this.realFs.copyFile(
          import_fslib2.npath.fromPortablePath(sourceP),
          import_fslib2.npath.fromPortablePath(destP),
          flags,
          this.makeCallback(resolve, reject)
        );
      });
    }
    copyFileSync(sourceP, destP, flags = 0) {
      this.cache.delete(sourceP);
      this.cache.delete(destP);
      return this.realFs.copyFileSync(
        import_fslib2.npath.fromPortablePath(sourceP),
        import_fslib2.npath.fromPortablePath(destP),
        flags
      );
    }
    async changeFilePromise(p, content, opts = {}) {
      if (Buffer.isBuffer(content)) {
        return this.writeFilePromise(p, content, opts);
      } else {
        return this.writeFilePromise(p, content, opts);
      }
    }
    changeFileSync(p, content, opts = {}) {
      if (Buffer.isBuffer(content)) {
        return this.writeFileSync(p, content, opts);
      } else {
        return this.writeFileSync(p, content, opts);
      }
    }
    async appendFilePromise(p, content, opts) {
      p = this.patchManifestPath(p);
      return await new Promise((resolve, reject) => {
        const fsNativePath = typeof p === `string` ? import_fslib2.npath.fromPortablePath(p) : p;
        if (opts) {
          this.realFs.appendFile(
            fsNativePath,
            content,
            opts,
            this.makeCallback(resolve, reject)
          );
        } else {
          this.realFs.appendFile(
            fsNativePath,
            content,
            this.makeCallback(resolve, reject)
          );
        }
      });
    }
    // Not patched, if you tried to append to package.json and it was yaml,
    // it wouldn't be great.
    appendFileSync(p, content, opts) {
      const fsNativePath = typeof p === `string` ? import_fslib2.npath.fromPortablePath(p) : p;
      if (opts) {
        this.realFs.appendFileSync(
          fsNativePath,
          content,
          opts
        );
      } else {
        this.realFs.appendFileSync(fsNativePath, content);
      }
    }
    async writeFilePromise(p, content, opts) {
      await new Promise((resolve, reject) => {
        p = this.patchManifestPath(p);
        const m = this.isPathForManifest(p);
        if (m !== false) {
          const success = this.writeManifestFile(p, content, m, opts);
          if (success) {
            resolve();
            return;
          }
        }
        const fsNativePath = typeof p === `string` ? import_fslib2.npath.fromPortablePath(p) : p;
        if (opts) {
          this.realFs.writeFile(
            fsNativePath,
            content,
            opts,
            this.makeCallback(resolve, reject)
          );
        } else {
          this.realFs.writeFile(
            fsNativePath,
            content,
            this.makeCallback(resolve, reject)
          );
        }
      });
      return;
    }
    writeFileSync(p, content, opts) {
      p = this.patchManifestPath(p);
      const m = this.isPathForManifest(p);
      if (m !== false) {
        const success = this.writeManifestFile(p, content, m, opts);
        if (success) {
          return;
        }
      }
      const fsNativePath = typeof p === `string` ? import_fslib2.npath.fromPortablePath(p) : p;
      if (opts) {
        return this.realFs.writeFileSync(
          fsNativePath,
          content,
          opts
        );
      } else {
        return this.realFs.writeFileSync(
          fsNativePath,
          content
        );
      }
    }
    async writeJsonPromise(p, data) {
      return await this.writeFilePromise(p, `${JSON.stringify(data, null, 2)}
`);
    }
    writeJsonSync(p, data) {
      return this.writeFileSync(p, `${JSON.stringify(data, null, 2)}
`);
    }
    async unlinkPromise(p) {
      p = this.patchManifestPath(p);
      return await new Promise((resolve, reject) => {
        this.realFs.unlink(
          import_fslib2.npath.fromPortablePath(p),
          this.makeCallback(resolve, reject)
        );
      });
    }
    unlinkSync(p) {
      p = this.patchManifestPath(p);
      return this.realFs.unlinkSync(import_fslib2.npath.fromPortablePath(p));
    }
    async utimesPromise(p, atime, mtime) {
      return await new Promise((resolve, reject) => {
        p = this.patchManifestPath(p);
        this.realFs.utimes(
          import_fslib2.npath.fromPortablePath(p),
          atime,
          mtime,
          this.makeCallback(resolve, reject)
        );
      });
    }
    utimesSync(p, atime, mtime) {
      p = this.patchManifestPath(p);
      this.realFs.utimesSync(import_fslib2.npath.fromPortablePath(p), atime, mtime);
    }
    async mkdirPromise(p, opts) {
      return await new Promise((resolve, reject) => {
        this.realFs.mkdir(
          import_fslib2.npath.fromPortablePath(p),
          opts,
          this.makeCallback(resolve, reject)
        );
      });
    }
    mkdirSync(p, opts) {
      return this.realFs.mkdirSync(import_fslib2.npath.fromPortablePath(p), opts);
    }
    async rmdirPromise(p, opts) {
      this.cache.delete(p);
      return await new Promise((resolve, reject) => {
        if (opts) {
          this.realFs.rmdir(
            import_fslib2.npath.fromPortablePath(p),
            opts,
            this.makeCallback(resolve, reject)
          );
        } else {
          this.realFs.rmdir(
            import_fslib2.npath.fromPortablePath(p),
            this.makeCallback(resolve, reject)
          );
        }
      });
    }
    rmdirSync(p, opts) {
      this.cache.delete(p);
      return this.realFs.rmdirSync(import_fslib2.npath.fromPortablePath(p), opts);
    }
    async linkPromise(existingP, newP) {
      return await new Promise((resolve, reject) => {
        this.realFs.link(
          import_fslib2.npath.fromPortablePath(existingP),
          import_fslib2.npath.fromPortablePath(newP),
          this.makeCallback(resolve, reject)
        );
      });
    }
    linkSync(existingP, newP) {
      return this.realFs.linkSync(
        import_fslib2.npath.fromPortablePath(existingP),
        import_fslib2.npath.fromPortablePath(newP)
      );
    }
    async symlinkPromise(target, p, type2) {
      return await new Promise((resolve, reject) => {
        this.realFs.symlink(
          import_fslib2.npath.fromPortablePath(target.replace(/\/+$/, ``)),
          import_fslib2.npath.fromPortablePath(p),
          type2,
          this.makeCallback(resolve, reject)
        );
      });
    }
    symlinkSync(target, p, type2) {
      return this.realFs.symlinkSync(
        import_fslib2.npath.fromPortablePath(target.replace(/\/+$/, ``)),
        import_fslib2.npath.fromPortablePath(p),
        type2
      );
    }
    // TODO: extract this
    async readFilePromise(p, encoding) {
      return await new Promise((resolve, reject) => {
        p = this.patchManifestPath(p);
        if (this.isPathForManifest(p)) {
          const manifest = this.readManifestFile(p, encoding);
          if (manifest !== false) {
            resolve(manifest);
          }
        }
        const fsNativePath = typeof p === `string` ? import_fslib2.npath.fromPortablePath(p) : p;
        this.realFs.readFile(
          fsNativePath,
          encoding,
          this.makeCallback(resolve, reject)
        );
      });
    }
    // TODO: patch this and load the yaml
    readFileSync(p, encoding) {
      p = this.patchManifestPath(p);
      if (this.isPathForManifest(p)) {
        const manifest = this.readManifestFile(p, encoding);
        if (manifest !== false) {
          return manifest;
        }
      }
      const fsNativePath = typeof p === `string` ? import_fslib2.npath.fromPortablePath(p) : p;
      return this.realFs.readFileSync(
        fsNativePath,
        encoding
      );
    }
    // TODO: patch this?
    async readdirPromise(p, { withFileTypes } = {}) {
      return await new Promise(
        (resolve, reject) => {
          if (withFileTypes) {
            this.realFs.readdir(
              import_fslib2.npath.fromPortablePath(p),
              { withFileTypes: true },
              this.makeCallback(resolve, reject)
            );
          } else {
            this.realFs.readdir(
              import_fslib2.npath.fromPortablePath(p),
              this.makeCallback(
                (value) => resolve(value),
                reject
              )
            );
          }
        }
      );
    }
    // TODO: patch this?
    readdirSync(p, { withFileTypes } = {}) {
      if (withFileTypes) {
        return this.realFs.readdirSync(import_fslib2.npath.fromPortablePath(p), {
          withFileTypes: true
        });
      } else {
        return this.realFs.readdirSync(
          import_fslib2.npath.fromPortablePath(p)
        );
      }
    }
    async readlinkPromise(p) {
      return await new Promise((resolve, reject) => {
        this.realFs.readlink(
          import_fslib2.npath.fromPortablePath(p),
          this.makeCallback(resolve, reject)
        );
      }).then((path) => {
        return import_fslib2.npath.toPortablePath(path);
      });
    }
    readlinkSync(p) {
      return import_fslib2.npath.toPortablePath(
        this.realFs.readlinkSync(import_fslib2.npath.fromPortablePath(p))
      );
    }
    async truncatePromise(p, len) {
      return await new Promise((resolve, reject) => {
        this.realFs.truncate(
          import_fslib2.npath.fromPortablePath(p),
          len,
          this.makeCallback(resolve, reject)
        );
      });
    }
    truncateSync(p, len) {
      return this.realFs.truncateSync(import_fslib2.npath.fromPortablePath(p), len);
    }
    watch(p, a, b) {
      p = this.patchManifestPath(p);
      return this.realFs.watch(
        import_fslib2.npath.fromPortablePath(p),
        // @ts-expect-error undefined
        a,
        b
      );
    }
    watchFile(p, a, b) {
      p = this.patchManifestPath(p);
      return this.realFs.watchFile(
        import_fslib2.npath.fromPortablePath(p),
        // @ts-expect-error undefined
        a,
        b
      );
    }
    unwatchFile(p, cb) {
      p = this.patchManifestPath(p);
      return this.realFs.unwatchFile(import_fslib2.npath.fromPortablePath(p), cb);
    }
    makeCallback(resolve, reject) {
      return (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      };
    }
  };

  // sources/index.ts
  var fsPatched = false;
  var patchFileSystem = (realFs) => {
    if (!fsPatched) {
      const patchedFs = new PackageYamlFS({ ...realFs });
      (0, import_fslib3.patchFs)(import_fs2.default, patchedFs);
      fsPatched = true;
    }
  };
  patchFileSystem(import_fs2.default);
  var plugin = {};
  var sources_default = plugin;
  return __toCommonJS(sources_exports);
})();
/*! Bundled license information:

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT *)
*/
return plugin;
}
};
