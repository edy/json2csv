var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b ||= {})
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// packages/plainjs/src/BaseParser.ts
import lodashGet from "https://cdn.jsdelivr.net/gh/lodash/lodash@master/get.js";
import defaultFormatter from "../formatters/default.js";
import numberFormatterCtor from "../formatters/number.js";
import stringFormatterCtor from "../formatters/string.js";
import symbolFormatterCtor from "../formatters/symbol.js";
import objectFormatterCtor from "../formatters/object.js";
import { getProp, flattenReducer, fastJoin } from "./utils.js";
var FormatterTypes = /* @__PURE__ */ ((FormatterTypes2) => {
  FormatterTypes2["header"] = "header";
  FormatterTypes2["undefined"] = "undefined";
  FormatterTypes2["boolean"] = "boolean";
  FormatterTypes2["number"] = "number";
  FormatterTypes2["bigint"] = "bigint";
  FormatterTypes2["string"] = "string";
  FormatterTypes2["symbol"] = "symbol";
  FormatterTypes2["function"] = "function";
  FormatterTypes2["object"] = "object";
  return FormatterTypes2;
})(FormatterTypes || {});
var JSON2CSVBase = class {
  constructor(opts) {
    this.opts = this.preprocessOpts(opts);
  }
  preprocessOpts(opts) {
    const processedOpts = Object.assign(
      {},
      opts
    );
    if (processedOpts.fields) {
      processedOpts.fields = this.preprocessFieldsInfo(
        processedOpts.fields,
        processedOpts.defaultValue
      );
    }
    processedOpts.transforms = processedOpts.transforms || [];
    const stringFormatter = processedOpts.formatters && processedOpts.formatters["string"] || stringFormatterCtor();
    const objectFormatter = objectFormatterCtor({ stringFormatter });
    const defaultFormatters = {
      header: stringFormatter,
      undefined: defaultFormatter,
      boolean: defaultFormatter,
      number: numberFormatterCtor(),
      bigint: defaultFormatter,
      string: stringFormatter,
      symbol: symbolFormatterCtor({ stringFormatter }),
      function: objectFormatter,
      object: objectFormatter
    };
    processedOpts.formatters = __spreadValues(__spreadValues({}, defaultFormatters), processedOpts.formatters);
    processedOpts.delimiter = processedOpts.delimiter || ",";
    processedOpts.eol = processedOpts.eol || "\n";
    processedOpts.header = processedOpts.header !== false;
    processedOpts.includeEmptyRows = processedOpts.includeEmptyRows || false;
    processedOpts.withBOM = processedOpts.withBOM || false;
    return processedOpts;
  }
  preprocessFieldsInfo(fields, globalDefaultValue) {
    return fields.map((fieldInfo) => {
      if (typeof fieldInfo === "string") {
        return {
          label: fieldInfo,
          value: fieldInfo.includes(".") || fieldInfo.includes("[") ? (row) => lodashGet(row, fieldInfo, globalDefaultValue) : (row) => getProp(row, fieldInfo, globalDefaultValue)
        };
      }
      if (typeof fieldInfo === "object") {
        const defaultValue = "default" in fieldInfo ? fieldInfo.default : globalDefaultValue;
        if (typeof fieldInfo.value === "string") {
          const fieldPath = fieldInfo.value;
          return {
            label: fieldInfo.label || fieldInfo.value,
            value: fieldInfo.value.includes(".") || fieldInfo.value.includes("[") ? (row) => lodashGet(row, fieldPath, defaultValue) : (row) => getProp(row, fieldPath, defaultValue)
          };
        }
        if (typeof fieldInfo.value === "function") {
          const label = fieldInfo.label || fieldInfo.value.name || "";
          const field = { label, default: defaultValue };
          const valueGetter = fieldInfo.value;
          return {
            label,
            value(row) {
              const value = valueGetter(row, field);
              return value === void 0 ? defaultValue : value;
            }
          };
        }
      }
      throw new Error(
        "Invalid field info option. " + JSON.stringify(fieldInfo)
      );
    });
  }
  getHeader() {
    return fastJoin(
      this.opts.fields.map(
        (fieldInfo) => this.opts.formatters.header(fieldInfo.label)
      ),
      this.opts.delimiter
    );
  }
  preprocessRow(row) {
    return this.opts.transforms.reduce(
      (rows, transform) => rows.map((row2) => transform(row2)).reduce(flattenReducer, []),
      [row]
    );
  }
  processRow(row) {
    if (!row) {
      return void 0;
    }
    const processedRow = this.opts.fields.map(
      (fieldInfo) => this.processCell(row, fieldInfo)
    );
    if (!this.opts.includeEmptyRows && processedRow.every((field) => field === "")) {
      return void 0;
    }
    return fastJoin(processedRow, this.opts.delimiter);
  }
  processCell(row, fieldInfo) {
    return this.processValue(fieldInfo.value(row));
  }
  processValue(value) {
    const formatter = this.opts.formatters[typeof value];
    return formatter(value);
  }
};
export {
  FormatterTypes,
  JSON2CSVBase as default
};
