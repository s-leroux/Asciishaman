const debug = require("debug")("asciishaman:tests-tokenizer");
const chai = require('chai');
const assert = chai.assert;


const fs = require('fs');
const path = require('path');
function fixture(fName) {
  return path.join(__dirname, "fixtures", fName);
}

const tokenizer = require("../lib/tokenizer");
const { Diagnostic } = require("../lib/diagnostic");

function tkTest(fName, expected) {
    const result = [];
    const diagnostic = new Diagnostic;
    const callback = function(tk) {
        result.push([tk.tag.description, tk.data]);
    };

    return tokenizer.Tokenizer(
              fs.createReadStream(fixture(fName), { highWaterMark: 16 })
            )(
              diagnostic,
              callback
    ).then(() => {
        // console.dir(result, { depth: Infinity });
        assert.deepEqual(result, expected);
    });
}

describe("The tokenizer", function() {
    this.timeout(20);

    describe("empty documents", function() {

      it("should accept 0-byte documents", function() {
          return tkTest("empty_1.adoc", [
            [ "end", undefined ],
          ]);
      });

      it("should accept newline-only documents", function() {
          return tkTest("empty_2.adoc", [
            [ "end", undefined ],
          ]);
      });

    });

    describe("plain text", function() {

      it("should parse text", function() {
          return tkTest("paragraph_2.adoc", [
            [ "text", "Paragraphs don't require any special markup in AsciiDoc." ],
            [ "newLine", undefined ],
            [ "text", "A paragraph is just one or more lines of consecutive text." ],
            [ "newLine", undefined ],
            [ "newLine", undefined ],
            [ "text", "To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block." ],
            [ "newLine", undefined ],
            [ "end", undefined ],
          ]);
      });

      it("should discard trailing spaces", function() {
          return tkTest("trailing-spaces.adoc", [
            [ "text", "This document" ],
            [ "newLine", undefined ],
            [ "text", "contains trailing spaces" ],
            [ "newLine", undefined ],
            [ "text", "and tabs." ],
            [ "newLine", undefined ],
            [ "end", undefined ],
          ]);
      });

      it("should keep leading spaces on non-empty lines", function() {
          return tkTest("leading-spaces.adoc", [
            [ "whiteSpace", "  " ],
            [ "text", "This document contains" ],
            [ "newLine", undefined ],
            [ "whiteSpace", "  " ],
            [ "text", "leading spaces" ],
            [ "newLine", undefined ],
            [ "newLine", undefined ],
            [ "whiteSpace", "        " ],
            [ "text", "and" ],
            [ "newLine", undefined ],
            [ "newLine", undefined ],
            [ "newLine", undefined ],
            [ "whiteSpace", "       " ],
            [ "text", "tabs." ],
            [ "newLine", undefined ],
            [ "end", undefined ],
          ]);
      });

    });


});




