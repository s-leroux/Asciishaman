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
    const callback = function(tk, data) {
        result.push([tk.description, data]);
    };

    return tokenizer.Tokenizer(
              fs.createReadStream(fixture(fName), { highWaterMark: 16 })
            )(
              diagnostic,
              callback
    ).then(() => {
        assert.deepEqual(result, expected);
    });
}

describe("tokenizer", function() {
    this.timeout(20);

    it("should tokenize paragraphs", function() {
        return tkTest("paragraph_1.adoc", [
          [ "text", "Paragraphs don't require any special markup in AsciiDoc." ],
          [ "newLine", "\n" ],
          [ "text", "A paragraph is just one or more lines of consecutive text." ],
          [ "blankLine", "\n\n" ],
          [ "text", "To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block." ],
          [ "end", "" ],
        ]);
    });

    it("should remove trailing spaces and tabs", function() {
        return tkTest("trailing-spaces.adoc", [
          [ "sectionTitle", "==" ],
          [ "text", "My section" ],
          [ "blankLine", "\n\n" ],
          [ "text", "This document" ],
          [ "newLine", "\n" ],
          [ "text", "contains trailing spaces" ],
          [ "newLine", "\n" ],
          [ "text", "and tabs." ],
          [ "end", "" ],
        ]);
    });

    it("should detect blank lines (empty)", function() {
        return tkTest("empty_lines_1.adoc", [
          [ "text", "The line below is empty:" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Some content" ],
          [ "end", "" ],
        ]);
    });

    it("should detect blank lines (empty)", function() {
        return tkTest("empty_lines_2.adoc", [
          [ "text", "The line below contains a space:" ],
          [ "blankLine", "\n \n" ],
          [ "text", "Some content" ],
          [ "end", "" ],
        ]);
    });

    it("should tokenize paragraph (bold)", function() {
        return tkTest("bold_1.adoc", [
          [ "text", "A bold " ],
          [ "star1", "*" ],
          [ "text", "word" ],
          [ "star1", "*" ],
          [ "text", ", and a bold " ],
          [ "star1", "*" ],
          [ "text", "phrase of text" ],
          [ "star1", "*" ],
          [ "text", "." ],
          [ "end", "" ],
        ]);
    });

    it("should consider a lone star as text", function() {
        return tkTest("bold_2.adoc", [
          [ "text", "A lone " ],
          [ "star1", "*" ],
          [ "text", " is not a bold character." ],
          [ "end", "" ],
        ]);
    });

    it("should tokenize paragraph (with * and **)", function() {
        return tkTest("bold_4.adoc", [
          [ "text", "A bold " ],
          [ "star1", "*" ],
          [ "text", "word" ],
          [ "star1", "*" ],
          [ "text", ", and a bold " ],
          [ "star1", "*" ],
          [ "text", "phrase of text" ],
          [ "star1", "*" ],
          [ "text", "." ],
          [ "blankLine", "\n\n" ],

          [ "text", "Bold c" ],
          [ "star2", "**" ],
          [ "text", "hara" ],
          [ "star2", "**" ],
          [ "text", "cter" ],
          [ "star2", "**" ],
          [ "text", "s" ],
          [ "star2", "**" ],
          [ "text", " within a word." ],
          [ "end", "" ],
        ]);
    });

    it("should tokenize section titles", function() {
        return tkTest("sections_1.adoc", [
          [ "sectionTitle", "==" ],
          [ "text", "First Section" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Content of first section" ],
          [ "blankLine", "\n\n" ],
          [ "sectionTitle", "===" ],
          [ "text", "Nested Section" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Content of nested section" ],
          [ "blankLine", "\n\n" ],
          [ "sectionTitle", "==" ],
          [ "text", "Second Section" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Content of second section" ],
          [ "end", "" ],
        ]);
    });

    it("should tokenize section titles (bold)", function() {
        return tkTest("sections_2.adoc", [
          [ "sectionTitle", "==" ],
          [ "text", "Section title with a " ],
          [ "star1", "*" ],
          [ "text", "bold" ],
          [ "star1", "*" ],
          [ "text", " word" ],
          [ "blankLine", "\n\n" ],
          [ "text", "Section content" ],
          [ "end", "" ],
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
          [ "end", "" ],
        ]);
    });

    for(let i of ['a','b','c']) {
        const fName = `lists_2${i}.adoc`;
        it(`should tokenize unordered lists with title (${fName})`, function() {
            return tkTest(fName, [
              [ "title", "Kizmet's Favorite Authors" ],
              [ "unorderedList1", "*" ],
              [ "text", "Edgar Allan Poe" ],
              [ "newLine", "\n" ],
              [ "unorderedList1", "*" ],
              [ "text", "Sheri S. Tepper" ],
              [ "newLine", "\n" ],
              [ "unorderedList1", "*" ],
              [ "text", "Bill Bryson" ],
              [ "end", "" ],
            ]);
        });
    };

});




