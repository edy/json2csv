"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.StreamParser = exports.Parser = exports.FormatterTypes = exports.BaseParser = void 0;
var BaseParser_js_1 = require("./BaseParser.js");
__createBinding(exports, BaseParser_js_1, "default", "BaseParser");
__createBinding(exports, BaseParser_js_1, "FormatterTypes");
var Parser_js_1 = require("./Parser.js");
__createBinding(exports, Parser_js_1, "default", "Parser");
var StreamParser_js_1 = require("./StreamParser.js");
__createBinding(exports, StreamParser_js_1, "default", "StreamParser");
