/* Asciishaman - A pure JavaScript implementation of AsciiDoc
 * Copyright (c) 2021 Sylvain Leroux
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";


const debug = require("debug")("asciishaman:tests-parser");
const chai = require("chai");
const assert = chai.assert;

const fs = require("fs");
const path = require("path");

function fixture(fName) { // XXX move me to test/utils.js
  return path.join(__dirname, "fixtures", fName);
}

const parser = require("../lib/parser");
const { Tokenizer } = require("../lib/tokenizer");
const { Diagnostic } = require("../lib/diagnostic");
const HTMLVisitor = require("../lib/visitors/html");
const ModelVisitor = require("../lib/visitors/model.js");

function tkTest(fName, expected) {
  const fPath = fixture(fName);
  const input = fs.createReadStream(fPath, { highWaterMark: 16 });

  const diagnostic = new Diagnostic(fPath);
  const tokenizer = Tokenizer(input);

  return parser.Parser(diagnostic, tokenizer)
    .then((document) => {
      assert.isOk(document);
      // console.dir(document, {depth: Infinity});
      const visitor = new HTMLVisitor();

      return visitor.visit(document);
      // assert.deepEqual(result, expected);
    })
    .then((output) => {
      assert.deepEqual(diagnostic._errors, []);
      assert.equal(output, expected, `while processing ${fName}`);
    });
}

function mdTest(fName, expected) {
  const fPath = fixture(fName);
  const input = fs.createReadStream(fPath, { highWaterMark: 16 });
  const diagnostic = new Diagnostic(fPath);
  const tokenizer = Tokenizer(input);

  return parser.Parser(diagnostic, tokenizer)
    .then((document) => {
      assert.isOk(document);
      // console.dir(document, {depth: Infinity});
      const visitor = new ModelVisitor();

      return visitor.visit(document);
      // assert.deepEqual(result, expected);
    })
    .then((result) => {
      assert.deepEqual(diagnostic._errors, []);
      if (expected !== undefined)
        assert.deepEqual(result, expected, `while processing ${fName}`);

      return result;
    });
}

describe("parser", function() {
  this.timeout(500);

  describe("empty documents", function() {

    it("should accept 0-byte documents", function() {
      return tkTest("empty_1.adoc", "<body></body>");
    });

    it("should accept newline-only documents", function() {
      return tkTest("empty_2.adoc", "<body></body>");
    });


  });


  describe("core rules", function() {

    it("should accept one-line documents", function() {
      return tkTest("text_1.adoc", "<body><p>A one-line document</p></body>");
    });

    it("should accept two-lines documents", function() {
      return tkTest("text_2.adoc", "<body><p>A two-lines document</p></body>");
    });

    it("should accept two-paragraphs documents", function() {
      return tkTest("paragraph_1.adoc", "<body><p>This document contains two paragraphs</p><p>Here is the second</p></body>");

    });

    it("should accept two-paragraphs documents with extra newlines", function() {
      return tkTest("paragraph_2.adoc", "<body><p>There are extra newlines</p><p>Between these paragraphs</p></body>");

    });

    it("should create explicit paragraph", function() {
      return tkTest("paragraph_3.adoc", "<body><p>An attribute list</p><p>introduces a new paragraph</p></body>");

    });

  });

  describe("sections", function() {

    it("should parse sections", function() {
      return tkTest("sections_1.adoc", "<body><div><h2>First Section</h2><p>Content of first section</p><div><h3>Nested Section</h3><p>Content of nested section</p></div></div><div><h2>Second Section</h2><p>Content of second section</p></div></body>");
    });

  });

  describe("lists", function() {

    it("should parse unordered lists", function() {
      return tkTest("lists_1.adoc",
        "<body><ul><li><p>Edgar Allan Poe</p></li><li><p>Sheri S. Tepper</p></li><li><p>Bill Bryson</p></li></ul></body>");
    });

    it("should parse nested unordered lists", function() {
      return tkTest("lists_2.adoc",
        "<body><ul><li><p>West wood maze</p><ul><li><p>Maze heart</p><ul><li><p>Reflection pool</p></li></ul></li><li><p>Secret exit</p></li></ul></li><li><p>Untracked file in git repository</p></li></ul></body>");
    });

    it("should parse unordered lists (with blank lines between items)", function() {
      return tkTest("lists_4.adoc",
        "<body><ul><li><p>Edgar Allan Poe</p></li><li><p>Sheri S. Tepper</p></li><li><p>Bill Bryson</p></li></ul></body>");
    });

  });

  describe("blocks", function() {

    it("should parse blocks", function() {
      return tkTest("blocks_1.adoc",
        "<body><div><p>This is inside a block</p></div><p>This is outside</p></body>");
    });

    it("should parse nested blocks", function() {
      return tkTest("blocks_2.adoc",
        "<body><div><p>outer</p><div><p>inner</p></div><p>outer</p></div></body>");
    });

    it("should accept positional attributes", function() {
      return mdTest("blocks_3.adoc").then(function({document}) {
        assert.deepEqual(document, [
          {
            "metadata": [ "attr1" ],
            "block": [
              { "paragraph": [[ "blk1" ]] }
            ]
          },
          {
            "metadata": [ "attr1", "attr2" ],
            "block": [
              { "paragraph": [[ "blk2" ]] }
            ]
          },
        ]);
      });
    });

  });

  describe("document header", function() {

    it("should find the document title", function() {
      return mdTest("header_1.adoc").then((document) => {
        assert.equal(document.title, "The title");
      });
    });

    it("should find the author name (first, last, email)", function() {
      return mdTest("header_2.adoc").then((document) => {
        assert.deepEqual(document.authors, [
          {
            "firstname": "Sylvain",
            "middlename": undefined,
            "lastname": "Leroux",
            "email": "sylvain@chicoree.fr",
          }
        ]);
      });
    });

    it("should find the author name (first, middle, last, email)", function() {
      return mdTest("header_3.adoc").then((document) => {
        assert.deepEqual(document.authors, [
          {
            "firstname": "Sylvain",
            "middlename": "C.",
            "lastname": "Leroux",
            "email": "sylvain@chicoree.fr",
          }
        ]);
      });
    });

    it("should find the author name (first, middle, last)", function() {
      return mdTest("header_4.adoc").then((document) => {
        assert.deepEqual(document.authors, [
          {
            "firstname": "Sylvain",
            "middlename": "C.",
            "lastname": "Leroux",
            "email": undefined,
          }
        ]);
      });
    });

    it("should find the author name (first, last)", function() {
      return mdTest("header_5.adoc").then((document) => {
        assert.deepEqual(document.authors, [
          {
            "firstname": "Sylvain",
            "middlename": undefined,
            "lastname": "Leroux",
            "email": undefined,
          }
        ]);
      });
    });

    it("should parse an author list", function() {
      return mdTest("header_6.adoc").then((document) => {
        assert.deepEqual(document.authors, [
          {
            "firstname": "Sylvain",
            "middlename": undefined,
            "lastname": "Leroux",
            "email": undefined,
          },
          {
            "firstname": "Sonia",
            "middlename": undefined,
            "lastname": "Leroux",
            "email": undefined,
          }
        ]);
      });
    });

    it("should parse attributes", function() {
      return mdTest("header_7.adoc").then((document) => {
        assert.deepEqual(document.attributes,
          {
            "empty-attr1" : "",
            "empty-attr2" : "",
            "non-empty-attr": "value",
          },
        );
      });
    });

  });

  describe("AsciiDoc test suite", function() {

    it("paragraph", function() {
      return tkTest("asciidoc-paragraph.adoc",
        "<body><p>Paragraphs don't require any special markup in AsciiDoc. A paragraph is just one or more lines of consecutive text.</p><p>To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block.</p></body>")
        .then(ast => {
          debug(ast);
        });
    });

    it("unordered lists", function() {
      return tkTest("asciidoc-unordered.adoc",
        "<body><ul><li><p>Edgar Allan Poe</p></li><li><p>Sheri S. Tepper</p></li><li><p>Bill Bryson</p></li></ul></body>")
        .then(ast => {
          debug(ast);
        });
    });

  });

});

