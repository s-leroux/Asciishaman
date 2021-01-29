const debug = require("debug")("asciishaman:tests-parser");
const chai = require('chai');
const assert = chai.assert;

const streams = require('memory-streams');

const fs = require('fs');
const path = require('path');

function fixture(fName) { // XXX move me to test/utils.js
  return path.join(__dirname, "fixtures", fName);
}

const parser = require("../lib/parser");
const { Tokenizer } = require("../lib/tokenizer");
const { Diagnostic } = require("../lib/diagnostic");
const { HTMLVisitor } = require("../lib/visitors/html");

function tkTest(fName, expected) {
    const fPath = fixture(fName);
    const input = fs.createReadStream(fPath, { highWaterMark: 16 });
    const output = new streams.WritableStream();

    const diagnostic = new Diagnostic(fPath);
    const tokenizer = Tokenizer(input);

    return parser.Parser(diagnostic, tokenizer)
              .then((document) => {
                  const visitor = new HTMLVisitor(output);

                  return visitor.visit(document);
                  // assert.deepEqual(result, expected);
              })
              .then(() => {
                  assert.deepEqual(diagnostic._errors, []);
                  assert.equal(output.toString(), expected);
              });
}

describe("parser", function() {
    this.timeout(20);

    it("should parse paragraphs", function() {
        return tkTest("paragraph_1.adoc",
                      "<body><p>Paragraphs don't require any special markup in AsciiDoc. A paragraph is just one or more lines of consecutive text.</p><p>To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block.</p></body>")
          .then(ast => {
            debug(ast);
          });
    });

    it("should parse sections", function() {
        return tkTest("sections_1.adoc",
                      "<body></body>")
          .then(ast => {
            debug(ast);
          });
    });

});

