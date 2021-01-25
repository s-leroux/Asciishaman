const debug = require("debug")("asciishaman:tests-tokenizer");
const chai = require('chai');
const assert = chai.assert;


const fs = require('fs');
const path = require('path');
function fixture(fName) {
  return path.join(__dirname, "fixtures", fName);
}

const tokenizer = require("../lib/tokenizer.js");

function tkTest(fName, expected) {
    const result = [];
    const callbacks = {
        endOfLine(data) {
            result.push(["endOfLine", data]);
        },
        text(data) {
            result.push(["text", data]);
        },
        unorderedList1(data) {
            result.push(["unorderedList1", data]);
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
        title(data) {
            result.push(["title", data]);
        },
    };

    return tokenizer.Tokenizer(
        fs.createReadStream(fixture(fName)),
        callbacks
    ).then(() => {
        assert.deepEqual(result, expected);
    });
}

describe("tokenizer", function() {
    this.timeout(10);

    it("should tokenize section titles", function() {
        return tkTest("sections_1.adoc", [
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
        ]);
    });

    it("should tokenize unordered lists with title", function() {
        return tkTest("lists_1.adoc", [
          [ "title", ".Kizmet's Favorite Authors" ],
          [ "endOfLine", "\n" ],
          [ "unorderedList1", "*" ],
          [ "text", " Edgar Allan Poe" ],
          [ "endOfLine", "\n" ],
          [ "unorderedList1", "*" ],
          [ "text", " Sheri S. Tepper" ],
          [ "endOfLine", "\n" ],
          [ "unorderedList1", "*" ],
          [ "text", " Bill Bryson" ],
          [ "endOfLine", "\n" ],
        ]);
    });
});




