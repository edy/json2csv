"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.FormatterTypes = void 0;
var lodash_get_1 = require("lodash.get");
var default_js_1 = require("@json2csv/formatters/default.js");
var number_js_1 = require("@json2csv/formatters/number.js");
var string_js_1 = require("@json2csv/formatters/string.js");
var symbol_js_1 = require("@json2csv/formatters/symbol.js");
var object_js_1 = require("@json2csv/formatters/object.js");
var utils_js_1 = require("./utils.js");
var FormatterTypes;
(function (FormatterTypes) {
    FormatterTypes["header"] = "header";
    FormatterTypes["undefined"] = "undefined";
    FormatterTypes["boolean"] = "boolean";
    FormatterTypes["number"] = "number";
    FormatterTypes["bigint"] = "bigint";
    FormatterTypes["string"] = "string";
    FormatterTypes["symbol"] = "symbol";
    FormatterTypes["function"] = "function";
    FormatterTypes["object"] = "object";
})(FormatterTypes = exports.FormatterTypes || (exports.FormatterTypes = {}));
var JSON2CSVBase = /** @class */ (function () {
    function JSON2CSVBase(opts) {
        this.opts = this.preprocessOpts(opts);
    }
    /**
     * Check passing opts and set defaults.
     *
     * @param {Json2CsvOptions} opts Options object containing fields,
     * delimiter, default value, quote mark, header, etc.
     */
    JSON2CSVBase.prototype.preprocessOpts = function (opts) {
        var processedOpts = Object.assign({}, opts);
        if (processedOpts.fields) {
            processedOpts.fields = this.preprocessFieldsInfo(processedOpts.fields, processedOpts.defaultValue);
        }
        processedOpts.transforms = processedOpts.transforms || [];
        var stringFormatter = (processedOpts.formatters && processedOpts.formatters['string']) ||
            (0, string_js_1["default"])();
        var objectFormatter = (0, object_js_1["default"])({ stringFormatter: stringFormatter });
        var defaultFormatters = {
            header: stringFormatter,
            undefined: default_js_1["default"],
            boolean: default_js_1["default"],
            number: (0, number_js_1["default"])(),
            bigint: default_js_1["default"],
            string: stringFormatter,
            symbol: (0, symbol_js_1["default"])({ stringFormatter: stringFormatter }),
            "function": objectFormatter,
            object: objectFormatter
        };
        processedOpts.formatters = __assign(__assign({}, defaultFormatters), processedOpts.formatters);
        processedOpts.delimiter = processedOpts.delimiter || ',';
        processedOpts.eol = processedOpts.eol || '\n';
        processedOpts.header = processedOpts.header !== false;
        processedOpts.includeEmptyRows = processedOpts.includeEmptyRows || false;
        processedOpts.withBOM = processedOpts.withBOM || false;
        return processedOpts;
    };
    /**
     * Check and normalize the fields configuration.
     *
     * @param {(string|object)[]} fields Fields configuration provided by the user
     * or inferred from the data
     * @returns {object[]} preprocessed FieldsInfo array
     */
    JSON2CSVBase.prototype.preprocessFieldsInfo = function (fields, globalDefaultValue) {
        return fields.map(function (fieldInfo) {
            if (typeof fieldInfo === 'string') {
                return {
                    label: fieldInfo,
                    value: fieldInfo.includes('.') || fieldInfo.includes('[')
                        ? function (row) { return (0, lodash_get_1["default"])(row, fieldInfo, globalDefaultValue); }
                        : function (row) { return (0, utils_js_1.getProp)(row, fieldInfo, globalDefaultValue); }
                };
            }
            if (typeof fieldInfo === 'object') {
                var defaultValue_1 = 'default' in fieldInfo ? fieldInfo["default"] : globalDefaultValue;
                if (typeof fieldInfo.value === 'string') {
                    var fieldPath_1 = fieldInfo.value;
                    return {
                        label: fieldInfo.label || fieldInfo.value,
                        value: fieldInfo.value.includes('.') || fieldInfo.value.includes('[')
                            ? function (row) { return (0, lodash_get_1["default"])(row, fieldPath_1, defaultValue_1); }
                            : function (row) { return (0, utils_js_1.getProp)(row, fieldPath_1, defaultValue_1); }
                    };
                }
                if (typeof fieldInfo.value === 'function') {
                    var label = fieldInfo.label || fieldInfo.value.name || '';
                    var field_1 = { label: label, "default": defaultValue_1 };
                    var valueGetter_1 = fieldInfo.value;
                    return {
                        label: label,
                        value: function (row) {
                            var value = valueGetter_1(row, field_1);
                            return value === undefined ? defaultValue_1 : value;
                        }
                    };
                }
            }
            throw new Error('Invalid field info option. ' + JSON.stringify(fieldInfo));
        });
    };
    /**
     * Create the title row with all the provided fields as column headings
     *
     * @returns {String} titles as a string
     */
    JSON2CSVBase.prototype.getHeader = function () {
        var _this = this;
        return (0, utils_js_1.fastJoin)(this.opts.fields.map(function (fieldInfo) {
            return _this.opts.formatters.header(fieldInfo.label);
        }), this.opts.delimiter);
    };
    /**
     * Preprocess each object according to the given transforms (unwind, flatten, etc.).
     * @param {Object} row JSON object to be converted in a CSV row
     */
    JSON2CSVBase.prototype.preprocessRow = function (row) {
        return this.opts.transforms.reduce(function (rows, transform) {
            return rows.map(function (row) { return transform(row); }).reduce(utils_js_1.flattenReducer, []);
        }, [row]);
    };
    /**
     * Create the content of a specific CSV row
     *
     * @param {Object} row JSON object to be converted in a CSV row
     * @returns {String} CSV string (row)
     */
    JSON2CSVBase.prototype.processRow = function (row) {
        var _this = this;
        if (!row) {
            return undefined;
        }
        var processedRow = this.opts.fields.map(function (fieldInfo) {
            return _this.processCell(row, fieldInfo);
        });
        if (!this.opts.includeEmptyRows &&
            processedRow.every(function (field) { return field === ''; })) {
            return undefined;
        }
        return (0, utils_js_1.fastJoin)(processedRow, this.opts.delimiter);
    };
    /**
     * Create the content of a specfic CSV row cell
     *
     * @param {Object} row JSON object representing the  CSV row that the cell belongs to
     * @param {FieldInfo} fieldInfo Details of the field to process to be a CSV cell
     * @returns {String} CSV string (cell)
     */
    JSON2CSVBase.prototype.processCell = function (row, fieldInfo) {
        return this.processValue(fieldInfo.value(row));
    };
    /**
     * Create the content of a specfic CSV row cell
     *
     * @param {T} value Value to be included in a CSV cell
     * @returns {String} Value stringified and processed
     */
    JSON2CSVBase.prototype.processValue = function (value) {
        var formatter = this.opts.formatters[typeof value];
        return formatter(value);
    };
    return JSON2CSVBase;
}());
exports["default"] = JSON2CSVBase;
