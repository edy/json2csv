import Benchmark from 'benchmark';
import { Parser as LegacyParser } from 'json2csv';
import { Parser } from '@json2csv/parsers';
import Papa from 'papaparse'
import json2csv2 from 'json-2-csv';
import { fixtures } from '@json2csv/test-helpers/fixtureLoader.js';

const { jsonFixtures } = await fixtures;
const data = Array(100).fill((() => ({ carModel: 'Audi', price: 0, color: 'blue' }))());

const suite = new Benchmark.Suite();
const json2csvParser = new Parser();
const json2csvLegacyParser = new LegacyParser();

suite
  // add tests
  .add('@json2csv', function() {
    json2csvParser.parse(data);
  })
  .add('json2csv (Legacy)', function() {
    json2csvLegacyParser.parse(data);
  })
  .add('PapaParse', function() {
    Papa.unparse(data);
  })
  .add('json-2-csv', {
    defer: true,
    fn: function (deferred) {
      json2csv2.json2csv(data, () => deferred.resolve());
    }
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .on('error', console.error)
  // run async
  .run({ 'async': true });