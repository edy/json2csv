// packages/plainjs/src/Parser.ts
import JSON2CSVBase from "./BaseParser.js";
import { flattenReducer, fastJoin } from "./utils.js";
var JSON2CSVParser = class extends JSON2CSVBase {
  constructor(opts) {
    super(opts);
  }
  parse(data) {
    const preprocessedData = this.preprocessData(data);
    this.opts.fields = this.opts.fields || this.preprocessFieldsInfo(
      preprocessedData.reduce((fields, item) => {
        Object.keys(item).forEach((field) => {
          if (!fields.includes(field)) {
            fields.push(field);
          }
        });
        return fields;
      }, []),
      this.opts.defaultValue
    );
    const header = this.opts.header ? this.getHeader() : "";
    const rows = this.processData(preprocessedData);
    const csv = (this.opts.withBOM ? "\uFEFF" : "") + header + (header && rows ? this.opts.eol : "") + rows;
    return csv;
  }
  preprocessData(data) {
    const processedData = Array.isArray(data) ? data : [data];
    if (!this.opts.fields && (processedData.length === 0 || typeof processedData[0] !== "object")) {
      throw new Error(
        'Data should not be empty or the "fields" option should be included'
      );
    }
    if (this.opts.transforms.length === 0)
      return processedData;
    return processedData.map((row) => this.preprocessRow(row)).reduce(flattenReducer, []);
  }
  processData(data) {
    return fastJoin(
      data.map((row) => this.processRow(row)).filter((row) => row),
      this.opts.eol
    );
  }
};
export {
  JSON2CSVParser as default
};
