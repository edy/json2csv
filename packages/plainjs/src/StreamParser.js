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
var json_1 = require("@streamparser/json");
var BaseParser_js_1 = require("./BaseParser.js");
var JSON2CSVStreamParser = /** @class */ (function (_super) {
    __extends(JSON2CSVStreamParser, _super);
    function JSON2CSVStreamParser(opts, asyncOpts) {
        var _this = _super.call(this, opts) || this;
        _this._hasWritten = false;
        if (_this.opts.fields)
            _this.preprocessFieldsInfo(_this.opts.fields, _this.opts.defaultValue);
        _this.initTokenizer(_this.opts, asyncOpts);
        return _this;
    }
    JSON2CSVStreamParser.prototype.initTokenizer = function (opts, asyncOpts) {
        if (asyncOpts === void 0) { asyncOpts = {}; }
        if (asyncOpts.objectMode) {
            this.tokenizer = this.getObjectModeTokenizer();
            return;
        }
        if (opts.ndjson) {
            this.tokenizer = this.getNdJsonTokenizer(asyncOpts);
            return;
        }
        this.tokenizer = this.getBinaryModeTokenizer(asyncOpts);
        return;
    };
    JSON2CSVStreamParser.prototype.getObjectModeTokenizer = function () {
        var _this = this;
        return {
            write: function (data) { return _this.pushLine(data); },
            end: function () {
                _this.pushHeaderIfNotWritten();
                _this.onEnd();
            }
        };
    };
    JSON2CSVStreamParser.prototype.configureCallbacks = function (tokenizer, tokenParser) {
        var _this = this;
        tokenizer.onToken = tokenParser.write.bind(this.tokenParser);
        tokenizer.onError = function (err) { return _this.onError(err); };
        tokenizer.onEnd = function () {
            if (!_this.tokenParser.isEnded)
                _this.tokenParser.end();
        };
        tokenParser.onValue = function (_a) {
            var value = _a.value;
            return _this.pushLine(value);
        };
        tokenParser.onError = function (err) { return _this.onError(err); };
        tokenParser.onEnd = function () {
            _this.pushHeaderIfNotWritten();
            _this.onEnd();
        };
    };
    JSON2CSVStreamParser.prototype.getNdJsonTokenizer = function (asyncOpts) {
        var tokenizer = new json_1.Tokenizer(__assign(__assign({}, asyncOpts), { separator: this.opts.eol }));
        this.tokenParser = new json_1.TokenParser({
            paths: ['$'],
            keepStack: false,
            separator: this.opts.eol
        });
        this.configureCallbacks(tokenizer, this.tokenParser);
        return tokenizer;
    };
    JSON2CSVStreamParser.prototype.getBinaryModeTokenizer = function (asyncOpts) {
        var _this = this;
        var tokenizer = new json_1.Tokenizer(asyncOpts);
        tokenizer.onToken = function (_a) {
            var token = _a.token, value = _a.value;
            if (token === json_1.TokenType.LEFT_BRACKET) {
                _this.tokenParser = new json_1.TokenParser({
                    paths: ['$.*'],
                    keepStack: false
                });
            }
            else if (token === json_1.TokenType.LEFT_BRACE) {
                _this.tokenParser = new json_1.TokenParser({ paths: ['$'], keepStack: false });
            }
            else {
                _this.onError(new Error('Data items should be objects or the "fields" option should be included'));
                return;
            }
            _this.configureCallbacks(tokenizer, _this.tokenParser);
            _this.tokenParser.write({ token: token, value: value });
        };
        tokenizer.onError = function (err) {
            return _this.onError(err instanceof json_1.TokenizerError
                ? new Error('Data should be a valid JSON object or array')
                : err);
        };
        tokenizer.onEnd = function () {
            _this.pushHeaderIfNotWritten();
            _this.onEnd();
        };
        return tokenizer;
    };
    // TODO this should be narrowed based on options
    JSON2CSVStreamParser.prototype.write = function (data) {
        this.tokenizer.write(data);
    };
    JSON2CSVStreamParser.prototype.end = function () {
        if (this.tokenizer && !this.tokenizer.isEnded)
            this.tokenizer.end();
    };
    JSON2CSVStreamParser.prototype.pushHeaderIfNotWritten = function () {
        if (this._hasWritten)
            return;
        if (!this.opts.fields) {
            this.onError(new Error('Data should not be empty or the "fields" option should be included'));
            return;
        }
        this.pushHeader();
    };
    /**
     * Generate the csv header and pushes it downstream.
     */
    JSON2CSVStreamParser.prototype.pushHeader = function () {
        if (this.opts.withBOM) {
            this.onData('\ufeff');
        }
        if (this.opts.header) {
            var header = this.getHeader();
            this.onHeader(header);
            this.onData(header);
            this._hasWritten = true;
        }
    };
    /**
     * Transforms an incoming json data to csv and pushes it downstream.
     *
     * @param {Object} data JSON object to be converted in a CSV row
     */
    JSON2CSVStreamParser.prototype.pushLine = function (data) {
        var _this = this;
        var processedData = this.preprocessRow(data);
        if (!this._hasWritten) {
            if (!this.opts.fields) {
                if (typeof processedData[0] !== 'object') {
                    throw new Error('Data items should be objects or the "fields" option should be included');
                }
                this.opts.fields = this.preprocessFieldsInfo(Object.keys(processedData[0]), this.opts.defaultValue);
            }
            this.pushHeader();
        }
        processedData.forEach(function (row) {
            var line = _this.processRow(row);
            if (line === undefined)
                return;
            _this.onLine(line);
            _this.onData(_this._hasWritten ? _this.opts.eol + line : line);
            _this._hasWritten = true;
        });
    };
    // No idea why eslint doesn't detect the usage of these
    /* eslint-disable @typescript-eslint/no-unused-vars */
    JSON2CSVStreamParser.prototype.onHeader = function (header) {
        /* To be set by the user */
    };
    JSON2CSVStreamParser.prototype.onLine = function (line) {
        /* To be set by the user */
    };
    JSON2CSVStreamParser.prototype.onData = function (data) {
        /* To be set by the user */
    };
    JSON2CSVStreamParser.prototype.onError = function (err) {
        /* To be set by the user */
    };
    JSON2CSVStreamParser.prototype.onEnd = function () {
        /* To be set by the user */
    };
    return JSON2CSVStreamParser;
}(BaseParser_js_1["default"]));
exports["default"] = JSON2CSVStreamParser;
