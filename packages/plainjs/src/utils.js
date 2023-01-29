"use strict";
exports.__esModule = true;
exports.fastJoin = exports.flattenReducer = exports.getProp = void 0;
function getProp(obj, path, defaultValue) {
    var value = obj[path];
    return value === undefined ? defaultValue : value;
}
exports.getProp = getProp;
function flattenReducer(acc, arr) {
    try {
        // This is faster but susceptible to `RangeError: Maximum call stack size exceeded`
        Array.isArray(arr) ? acc.push.apply(acc, arr) : acc.push(arr);
        return acc;
    }
    catch (err) {
        // Fallback to a slower but safer option
        return acc.concat(arr);
    }
}
exports.flattenReducer = flattenReducer;
function fastJoin(arr, separator) {
    var isFirst = true;
    return arr.reduce(function (acc, elem) {
        if (elem === null || elem === undefined) {
            elem = '';
        }
        if (isFirst) {
            isFirst = false;
            return "".concat(elem);
        }
        return "".concat(acc).concat(separator).concat(elem);
    }, '');
}
exports.fastJoin = fastJoin;
