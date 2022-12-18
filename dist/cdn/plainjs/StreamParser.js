var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// packages/plainjs/src/StreamParser.ts
import { Tokenizer, TokenParser, TokenType } from "https://cdn.jsdelivr.net/npm/@streamparser/json@0.0.12/dist/mjs/index.mjs";
import JSON2CSVBase from "./BaseParser.js";
var JSON2CSVStreamParser = class extends JSON2CSVBase {
  constructor(opts, asyncOpts) {
    super(opts);
    this._hasWritten = false;
    if (this.opts.fields)
      this.preprocessFieldsInfo(this.opts.fields, this.opts.defaultValue);
    this.initTokenizer(this.opts, asyncOpts);
  }
  initTokenizer(opts, asyncOpts = {}) {
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
  }
  getObjectModeTokenizer() {
    return {
      write: (data) => this.pushLine(data),
      end: () => {
        this.pushHeaderIfNotWritten();
        this.onEnd();
      }
    };
  }
  configureCallbacks(tokenizer, tokenParser) {
    tokenizer.onToken = tokenParser.write.bind(this.tokenParser);
    tokenizer.onError = (err) => this.onError(err);
    tokenizer.onEnd = () => {
      if (!this.tokenParser.isEnded)
        this.tokenParser.end();
    };
    tokenParser.onValue = ({ value }) => this.pushLine(value);
    tokenParser.onError = (err) => this.onError(err);
    tokenParser.onEnd = () => {
      this.pushHeaderIfNotWritten();
      this.onEnd();
    };
  }
  getNdJsonTokenizer(asyncOpts) {
    const tokenizer = new Tokenizer(__spreadProps(__spreadValues({}, asyncOpts), { separator: this.opts.eol }));
    this.tokenParser = new TokenParser({
      paths: ["$"],
      keepStack: false,
      separator: this.opts.eol
    });
    this.configureCallbacks(tokenizer, this.tokenParser);
    return tokenizer;
  }
  getBinaryModeTokenizer(asyncOpts) {
    const tokenizer = new Tokenizer();
    tokenizer.onToken = ({ token, value }) => {
      if (token === TokenType.LEFT_BRACKET) {
        this.tokenParser = new TokenParser({
          paths: ["$.*"],
          keepStack: false
        });
      } else if (token === TokenType.LEFT_BRACE) {
        this.tokenParser = new TokenParser({ paths: ["$"], keepStack: false });
      } else {
        this.onError(new Error("Data should be a JSON object or array"));
        return;
      }
      this.configureCallbacks(tokenizer, this.tokenParser);
      this.tokenParser.write({ token, value });
    };
    tokenizer.onError = () => this.onError(new Error("Data should be a JSON object or array"));
    tokenizer.onEnd = () => {
      this.pushHeaderIfNotWritten();
      this.onEnd();
    };
    return tokenizer;
  }
  write(data) {
    this.tokenizer.write(data);
  }
  end() {
    if (this.tokenizer && !this.tokenizer.isEnded)
      this.tokenizer.end();
  }
  pushHeaderIfNotWritten() {
    if (this._hasWritten)
      return;
    if (!this.opts.fields) {
      this.onError(
        new Error(
          'Data should not be empty or the "fields" option should be included'
        )
      );
      return;
    }
    this.pushHeader();
  }
  pushHeader() {
    if (this.opts.withBOM) {
      this.onData("\uFEFF");
    }
    if (this.opts.header) {
      const header = this.getHeader();
      this.onHeader(header);
      this.onData(header);
      this._hasWritten = true;
    }
  }
  pushLine(data) {
    const processedData = this.preprocessRow(data);
    if (!this._hasWritten) {
      this.opts.fields = this.preprocessFieldsInfo(
        this.opts.fields || Object.keys(processedData[0]),
        this.opts.defaultValue
      );
      this.pushHeader();
    }
    processedData.forEach((row) => {
      const line = this.processRow(row);
      if (line === void 0)
        return;
      this.onLine(line);
      this.onData(this._hasWritten ? this.opts.eol + line : line);
      this._hasWritten = true;
    });
  }
  onHeader(header) {
  }
  onLine(line) {
  }
  onData(data) {
  }
  onError(err) {
  }
  onEnd() {
  }
};
export {
  JSON2CSVStreamParser as default
};
