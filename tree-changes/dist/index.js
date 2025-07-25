"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => treeChanges
});
module.exports = __toCommonJS(index_exports);
var import_deep_equal2 = __toESM(require("@gilbarbara/deep-equal"));
var import_is_lite2 = __toESM(require("is-lite"));

// src/helpers.ts
var import_deep_equal = __toESM(require("@gilbarbara/deep-equal"));
var import_is_lite = __toESM(require("is-lite"));
function canHaveLength(...arguments_) {
  return arguments_.every((d) => import_is_lite.default.string(d) || import_is_lite.default.array(d) || import_is_lite.default.plainObject(d));
}
function checkEquality(left, right, value) {
  if (!isSameType(left, right)) {
    return false;
  }
  if ([left, right].every(import_is_lite.default.array)) {
    return !left.some(hasValue(value)) && right.some(hasValue(value));
  }
  if ([left, right].every(import_is_lite.default.plainObject)) {
    return !Object.entries(left).some(hasEntry(value)) && Object.entries(right).some(hasEntry(value));
  }
  return right === value;
}
function compareNumbers(previousData, data, options) {
  const { actual, key, previous, type } = options;
  const left = nested(previousData, key);
  const right = nested(data, key);
  let changed = [left, right].every(import_is_lite.default.number) && (type === "increased" ? left < right : left > right);
  if (!import_is_lite.default.undefined(actual)) {
    changed = changed && right === actual;
  }
  if (!import_is_lite.default.undefined(previous)) {
    changed = changed && left === previous;
  }
  return changed;
}
function compareValues(previousData, data, options) {
  const { key, type, value } = options;
  const left = nested(previousData, key);
  const right = nested(data, key);
  const primary = type === "added" ? left : right;
  const secondary = type === "added" ? right : left;
  if (!import_is_lite.default.nullOrUndefined(value)) {
    if (import_is_lite.default.defined(primary)) {
      if (import_is_lite.default.array(primary) || import_is_lite.default.plainObject(primary)) {
        return checkEquality(primary, secondary, value);
      }
    } else {
      return (0, import_deep_equal.default)(secondary, value);
    }
    return false;
  }
  if ([left, right].every(import_is_lite.default.array)) {
    return !secondary.every(isEqualPredicate(primary));
  }
  if ([left, right].every(import_is_lite.default.plainObject)) {
    return hasExtraKeys(Object.keys(primary), Object.keys(secondary));
  }
  return ![left, right].every((d) => import_is_lite.default.primitive(d) && import_is_lite.default.defined(d)) && (type === "added" ? !import_is_lite.default.defined(left) && import_is_lite.default.defined(right) : import_is_lite.default.defined(left) && !import_is_lite.default.defined(right));
}
function getIterables(previousData, data, { key } = {}) {
  let left = nested(previousData, key);
  let right = nested(data, key);
  if (!isSameType(left, right)) {
    throw new TypeError("Inputs have different types");
  }
  if (!canHaveLength(left, right)) {
    throw new TypeError("Inputs don't have length");
  }
  if ([left, right].every(import_is_lite.default.plainObject)) {
    left = Object.keys(left);
    right = Object.keys(right);
  }
  return [left, right];
}
function hasEntry(input) {
  return ([key, value]) => {
    if (import_is_lite.default.array(input)) {
      return (0, import_deep_equal.default)(input, value) || input.some((d) => (0, import_deep_equal.default)(d, value) || import_is_lite.default.array(value) && isEqualPredicate(value)(d));
    }
    if (import_is_lite.default.plainObject(input) && input[key]) {
      return !!input[key] && (0, import_deep_equal.default)(input[key], value);
    }
    return (0, import_deep_equal.default)(input, value);
  };
}
function hasExtraKeys(left, right) {
  return right.some((d) => !left.includes(d));
}
function hasValue(input) {
  return (value) => {
    if (import_is_lite.default.array(input)) {
      return input.some((d) => (0, import_deep_equal.default)(d, value) || import_is_lite.default.array(value) && isEqualPredicate(value)(d));
    }
    return (0, import_deep_equal.default)(input, value);
  };
}
function includesOrEqualsTo(previousValue, value) {
  return import_is_lite.default.array(previousValue) ? previousValue.some((d) => (0, import_deep_equal.default)(d, value)) : (0, import_deep_equal.default)(previousValue, value);
}
function isEqualPredicate(data) {
  return (value) => data.some((d) => (0, import_deep_equal.default)(d, value));
}
function isSameType(...arguments_) {
  return arguments_.every(import_is_lite.default.array) || arguments_.every(import_is_lite.default.number) || arguments_.every(import_is_lite.default.plainObject) || arguments_.every(import_is_lite.default.string);
}
function nested(data, property) {
  if (import_is_lite.default.plainObject(data) || import_is_lite.default.array(data)) {
    if (import_is_lite.default.string(property)) {
      const props = property.split(".");
      return props.reduce((acc, d) => acc && acc[d], data);
    }
    if (import_is_lite.default.number(property)) {
      return data[property];
    }
    return data;
  }
  return data;
}

// src/index.ts
function treeChanges(previousData, data) {
  if ([previousData, data].some(import_is_lite2.default.nullOrUndefined)) {
    throw new Error("Missing required parameters");
  }
  if (![previousData, data].every((d) => import_is_lite2.default.plainObject(d) || import_is_lite2.default.array(d))) {
    throw new Error("Expected plain objects or array");
  }
  const added = (key, value) => {
    try {
      return compareValues(previousData, data, { key, type: "added", value });
    } catch {
      return false;
    }
  };
  const changed = (key, actual, previous) => {
    try {
      const left = nested(previousData, key);
      const right = nested(data, key);
      const hasActual = import_is_lite2.default.defined(actual);
      const hasPrevious = import_is_lite2.default.defined(previous);
      if (hasActual || hasPrevious) {
        const leftComparator = hasPrevious ? includesOrEqualsTo(previous, left) : !includesOrEqualsTo(actual, left);
        const rightComparator = includesOrEqualsTo(actual, right);
        return leftComparator && rightComparator;
      }
      if ([left, right].every(import_is_lite2.default.array) || [left, right].every(import_is_lite2.default.plainObject)) {
        return !(0, import_deep_equal2.default)(left, right);
      }
      return left !== right;
    } catch {
      return false;
    }
  };
  const changedFrom = (key, previous, actual) => {
    if (!import_is_lite2.default.defined(key)) {
      return false;
    }
    try {
      const left = nested(previousData, key);
      const right = nested(data, key);
      const hasActual = import_is_lite2.default.defined(actual);
      return includesOrEqualsTo(previous, left) && (hasActual ? includesOrEqualsTo(actual, right) : !hasActual);
    } catch {
      return false;
    }
  };
  const decreased = (key, actual, previous) => {
    if (!import_is_lite2.default.defined(key)) {
      return false;
    }
    try {
      return compareNumbers(previousData, data, { key, actual, previous, type: "decreased" });
    } catch {
      return false;
    }
  };
  const emptied = (key) => {
    try {
      const [left, right] = getIterables(previousData, data, { key });
      return !!left.length && !right.length;
    } catch {
      return false;
    }
  };
  const filled = (key) => {
    try {
      const [left, right] = getIterables(previousData, data, { key });
      return !left.length && !!right.length;
    } catch {
      return false;
    }
  };
  const increased = (key, actual, previous) => {
    if (!import_is_lite2.default.defined(key)) {
      return false;
    }
    try {
      return compareNumbers(previousData, data, { key, actual, previous, type: "increased" });
    } catch {
      return false;
    }
  };
  const removed = (key, value) => {
    try {
      return compareValues(previousData, data, { key, type: "removed", value });
    } catch {
      return false;
    }
  };
  return { added, changed, changedFrom, decreased, emptied, filled, increased, removed };
}
//# sourceMappingURL=index.js.map
// fix-cjs-exports
if (module.exports.default) {
  Object.assign(module.exports.default, module.exports);
  module.exports = module.exports.default;
  delete module.exports.default;
}
