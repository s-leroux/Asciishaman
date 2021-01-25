const debug = require("debug")("asciishaman:tests-tokenizer");
const chai = require('chai');
const assert = chai.assert;


const fs = require('fs');
const path = require('path');
function fixture(fName) {
  return path.join(__dirname, "fixtures", fName);
}

const tokenizer = require("../lib/tokenizer.js");

describe("module", function() {
    it("should tokenize section titles", function() {
        const result = [];
        const callbacks = {
            endOfLine(data) {
                result.push(["endOfLine", data]);
            },
            text(data) {
                result.push(["text", data]);
            },
            sectionTitle1(data) {
                result.push(["sectionTitle1", data]);
            },
            sectionTitle2(data) {
                result.push(["sectionTitle2", data]);
            },
            sectionTitle3(data) {
                result.push(["sectionTitle3", data]);
            },
        };

        const expected = [
          [ "sectionTitle2", "==" ],
          [ "text", " First Section" ],
          [ "endOfLine", "\n" ],
          [ "endOfLine", "\n" ],
          [ "text", "Content of first section" ],
          [ "endOfLine", "\n" ],
          [ "endOfLine", "\n" ],
          [ "sectionTitle3", "===" ],
          [ "text", " Nested Section" ],
          [ "endOfLine", "\n" ],
          [ "endOfLine", "\n" ],
          [ "text", "Content of nested section" ],
          [ "endOfLine", "\n" ],
          [ "endOfLine", "\n" ],
          [ "sectionTitle2", "==" ],
          [ "text", " Second Section" ],
          [ "endOfLine", "\n" ],
          [ "endOfLine", "\n" ],
          [ "text", "Content of second section" ],
          [ "endOfLine", "\n" ],
        ];

        return tokenizer.Tokenizer(
          fs.createReadStream(fixture("sections_1.adoc")),
          callbacks
        ).then(() => {
          assert.deepEqual(result, expected);
        });
    });
});




