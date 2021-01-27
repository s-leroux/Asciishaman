const debug = require("debug")("asciishaman:tests-parser");
const chai = require('chai');
const assert = chai.assert;


const fs = require('fs');
const path = require('path');

function fixture(fName) { // XXX move me to test/utils.js
  return path.join(__dirname, "fixtures", fName);
} 

const parser = require("../lib/parser.js");

function tkTest(fName, expected) {
    return parser.Parser(
        fs.createReadStream(fixture(fName), { highWaterMark: 16 })
    ).then((result) => {
        assert.deepEqual(result, expected);
    });
}

describe("tokenizer", function() {
    this.timeout(10);

    it("should parse paragraphs", function() {
        return tkTest("paragraph_1.adoc", true)
          .then(ast => {
            debug(ast);
          });
    });

});

