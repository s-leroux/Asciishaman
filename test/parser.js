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
                  assert.isOk(document);
                  // console.dir(document, {depth: Infinity});
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
    this.timeout(500);

    describe("empty documents", function() {

      it("should accept 0-byte documents", function() {
          return tkTest("empty_1.adoc", "<body></body>")
      });

      it("should accept newline-only documents", function() {
          return tkTest("empty_2.adoc", "<body></body>")
      });


    });

    describe("core rules", function() {

      it("should accept a one-line documents", function() {
          return tkTest("text_1.adoc", "<body><p>A one-line document</p></body>")
      });

      it("should accept a two-lines documents", function() {
          return tkTest("text_2.adoc", "<body><p>A two-lines document</p></body>")
      });

      it("should accept a two-paragraphs documents", function() {
          return tkTest("paragraph_1.adoc", "<body><p>This document contains two paragraphs</p><p>Here is the second</p></body>")

      });

    });

    it("should parse paragraphs", function() {
        return tkTest("paragraph_2.adoc",
                      "<body><p>Paragraphs don't require any special markup in AsciiDoc. A paragraph is just one or more lines of consecutive text.</p><p>To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block.</p></body>")
          .then(ast => {
            debug(ast);
          });
    });

    it("should parse sections", function() {
        return tkTest("bold_1.adoc",
                      "<body><p>A bold *word*, and a bold *phrase of text*.</p></body>")
          .then(ast => {
            debug(ast);
          });
    });

});

