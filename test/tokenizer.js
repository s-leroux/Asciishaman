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

const chai = require("chai");
const assert = chai.assert;


const fs = require("fs");
const path = require("path");
function fixture(fName) {
  return path.join(__dirname, "fixtures", fName);
}

const tokenizer = require("../lib/tokenizer");
const { Diagnostic } = require("../lib/diagnostic");

function tkTest(fName, expected) {
  const result = [];
  const diagnostic = new Diagnostic;
  const callback = function(tk, ...params) {
    result.push([tk.description, ...params]);
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
        [ "end" ],
      ]);
    });

    it("should accept newline-only documents", function() {
      return tkTest("empty_2.adoc", [
        [ "end" ],
      ]);
    });

  });

  describe("plain text", function() {

    it("should parse text", function() {
      return tkTest("asciidoc-paragraph.adoc", [
        [ "plain-text", "Paragraphs don't require any special markup in AsciiDoc." ],
        [ "plain-text", "A paragraph is just one or more lines of consecutive text." ],
        [ "blank-line", 1 ],
        [ "plain-text", "To begin a new paragraph, separate it by at least one blank line from the previous paragraph or block." ],
        [ "end" ],
      ]);
    });

    it("should discard trailing spaces", function() {
      return tkTest("trailing-spaces.adoc", [
        [ "plain-text", "This document" ],
        [ "plain-text", "contains trailing spaces" ],
        [ "plain-text", "and tabs." ],
        [ "end" ],
      ]);
    });

    it("should keep leading spaces on non-empty lines", function() {
      return tkTest("leading-spaces.adoc", [
        [ "plain-text", "  This document contains" ],
        [ "plain-text", "  leading spaces" ],
        [ "blank-line", 1 ],
        [ "plain-text", "        and" ],
        [ "blank-line", 2 ],
        [ "plain-text", "       tabs." ],
        [ "end" ],
      ]);
    });

  });


});




