"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var BaseParser_js_1 = require("./BaseParser.js");
var utils_js_1 = require("./utils.js");
var JSON2CSVParser = /** @class */ (function (_super) {
    __extends(JSON2CSVParser, _super);
    function JSON2CSVParser(opts) {
        return _super.call(this, opts) || this;
    }
    /**
     * Main function that converts json to csv.
     *
     * @param {Array|Object} data Array of JSON objects to be converted to CSV
     * @returns {String} The CSV formated data as a string
     */
    JSON2CSVParser.prototype.parse = function (data) {
        var preprocessedData = this.preprocessData(data);
        this.opts.fields =
            this.opts.fields ||
                this.preprocessFieldsInfo(preprocessedData.reduce(function (fields, item) {
                    Object.keys(item).forEach(function (field) {
                        if (!fields.includes(field)) {
                            fields.push(field);
                        }
                    });
                    return fields;
                }, []), this.opts.defaultValue);
        var header = this.opts.header ? this.getHeader() : '';
        var rows = this.processData(preprocessedData);
        var csv = (this.opts.withBOM ? '\ufeff' : '') +
            header +
            (header && rows ? this.opts.eol : '') +
            rows;
        return csv;
    };
    /**
     * Preprocess the data according to the give opts (unwind, flatten, etc.)
      and calculate the fields and field names if they are not provided.
     *
     * @param {Array|Object} data Array or object to be converted to CSV
     */
    JSON2CSVParser.prototype.preprocessData = function (data) {
        var _this = this;
        var processedData = Array.isArray(data) ? data : [data];
        if (!this.opts.fields) {
            if (data === undefined || data === null || processedData.length === 0) {
                throw new Error('Data should not be empty or the "fields" option should be included');
            }
            if (typeof processedData[0] !== 'object') {
                throw new Error('Data items should be objects or the "fields" option should be included');
            }
        }
        if (this.opts.transforms.length === 0)
            return processedData; // TODO remove any casting
        return processedData
            .map(function (row) { return _this.preprocessRow(row); })
            .reduce(utils_js_1.flattenReducer, []);
    };
    /**
     * Create the content row by row below the header
     *
     * @param {Array} data Array of JSON objects to be converted to CSV
     * @returns {String} CSV string (body)
     */
    JSON2CSVParser.prototype.processData = function (data) {
        var _this = this;
        return (0, utils_js_1.fastJoin)(data.map(function (row) { return _this.processRow(row); }).filter(function (row) { return row; }), // Filter empty rows
        this.opts.eol);
    };
    return JSON2CSVParser;
}(BaseParser_js_1["default"]));
exports["default"] = JSON2CSVParser;
