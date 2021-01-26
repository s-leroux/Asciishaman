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
        newLine(data) {
            result.push(["newLine", data]);
        },
        blankLine(data) {
            result.push(["blankLine", data]);
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

    it("should tokenize paragraphs", function() {
        return tkTest("paragraph_1.adoc", [
          [ "text", "Paragraphs don't require any special markup in AsciiDoc." ],
          [ "newLine", "\n" ],
          [ "text", "A paragraph is just one or more lines of consecutive text." ],
          [ "blankLine", "\n\n" ],
          [ "text", "To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block." ],
        ]);
    });

    it("should tokenize section titles", function() {
        return tkTest("sections_1.adoc", [
          [ "sectionTitle2", "==" ],
          [ "text", "First Section" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Content of first section" ],
          [ "blankLine", "\n\n" ],
          [ "sectionTitle3", "===" ],
          [ "text", "Nested Section" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Content of nested section" ],
          [ "blankLine", "\n\n" ],
          [ "sectionTitle2", "==" ],
          [ "text", "Second Section" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Content of second section" ],
        ]);
    });

    it("should tokenize unordered lists", function() {
        return tkTest("lists_1.adoc", [
          [ "unorderedList1", "*" ],
          [ "text", "Edgar Allan Poe" ],
          [ "newLine", "\n" ],
          [ "unorderedList1", "*" ],
          [ "text", "Sheri S. Tepper" ],
          [ "newLine", "\n" ],
          [ "unorderedList1", "*" ],
          [ "text", "Bill Bryson" ],
        ]);
    });

    for(let i of ['a','b','c']) {
        const fName = `lists_2${i}.adoc`;
        it(`should tokenize unordered lists with title (${fName})`, function() {
            return tkTest(fName, [
              [ "title", ".Kizmet's Favorite Authors" ],
              [ "unorderedList1", "*" ],
              [ "text", "Edgar Allan Poe" ],
              [ "newLine", "\n" ],
              [ "unorderedList1", "*" ],
              [ "text", "Sheri S. Tepper" ],
              [ "newLine", "\n" ],
              [ "unorderedList1", "*" ],
              [ "text", "Bill Bryson" ],
            ]);
        });
    };
});




