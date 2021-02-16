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
          return tkTest("asciidoc-paragraph.adoc", [
            [ "text", "Paragraphs don't require any special markup in AsciiDoc." ],
            [ "text", "A paragraph is just one or more lines of consecutive text." ],
            [ "blankLine", undefined ],
            [ "text", "To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block." ],
            [ "end", undefined ],
          ]);
      });

      it("should discard trailing spaces", function() {
          return tkTest("trailing-spaces.adoc", [
            [ "text", "This document" ],
            [ "text", "contains trailing spaces" ],
            [ "text", "and tabs." ],
            [ "end", undefined ],
          ]);
      });

      it("should keep leading spaces on non-empty lines", function() {
          return tkTest("leading-spaces.adoc", [
            [ "text", "  This document contains" ],
            [ "text", "  leading spaces" ],
            [ "blankLine", undefined ],
            [ "text", "        and" ],
            [ "blankLine", undefined ],
            [ "blankLine", undefined ],
            [ "text", "       tabs." ],
            [ "end", undefined ],
          ]);
      });

    });


});




