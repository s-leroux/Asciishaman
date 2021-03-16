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

const Preprocessor = require("../lib/preprocessor");


function ppTest(input) {
  const result = [];
  const pp = new Preprocessor((line) => {
    result.push(line);
  });

  pp.accept(input.join(""));
  pp.flush();

  return result;
}

describe("The preprocessor", function() {
  this.timeout(20);

  describe("core", function() {

    it("should accept 0-byte documents", function() {
      const result = [];
      const pp = new Preprocessor((line) => {
        result.push(line);
      });

      pp.flush();

      assert.deepEqual(result, ["\n"]);
    });

    it("should accept plain text", function() {
      const doc = [
        "Hello\n",
        "World\n",
      ];
      const result = ppTest(doc);
      assert.deepEqual(result, doc);
    });

  });

  describe("attribute substitution", function() {

    it("should define and replace attributes", function() {
      const result = ppTest([
        ":my-attr: world  \n",
        "Hello {my-attr}",
      ]);
      assert.deepEqual(result, [
        ":my-attr: world\n",
        "Hello world\n"
      ]);
    });

    it("should replace attribute refs found inside attribute values", function() {
      const result = ppTest([
        ":o: o\n",
        ":my-attr: w{o}rld  \n",
        "Hello {my-attr}",
      ]);
      assert.deepEqual(result, [
        ":o: o\n",
        ":my-attr: world\n",
        "Hello world\n"
      ]);
    });

  });


});




