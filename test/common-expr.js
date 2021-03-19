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

const cx = require("../lib/common-expr.js");
const peg = require("pegparse");

function test(expr, tests) {
  const grammar = new peg.Grammar();
  grammar.define("S", expr);

  for(let [str, result] of tests) {
    const parser = grammar.parser("S");

    parser.accept(str);
    parser.run();
    if (result === undefined) {
      assert.equal(parser.status, "failure", `with ${str}`);
    }
    else {
      assert.equal(parser.status, "success", `with ${str}`);
      assert.equal(parser.result(), result, `with ${str}`);
    }
  }
}

describe("common-expr", function() {
  this.timeout(10);

  it("should parse attribute names", function() {
    test(cx.ATTR_NAME, [
      [ "an.attr-name", "an.attr-name" ],
    ]);
  });

  it("should parse deliminted strings (length >= 1)", function() {
    test(cx.STRING("!", 1), [
      [ "!" ],
      [ "0!", "0" ],
      [ "01!", "01" ],
      [ "012!", "012" ],
      [ "a string!another string", "a string" ],
    ]);
  });

  it("should parse quoted strings (double quotes)", function() {
    test(cx.QUOTED_STRING, [
      [ "\"\"", "" ],
      [ "\"a string\"", "a string" ],
      [ "\"a quote(\\\")\"", "a quote(\")" ],
      [ "\"protected \\\n newline\"", "protected \n newline" ],
      [ "\"missing end quote" ],
      [ "missing start quote\"" ],
      [ "\"stay \n newline\"" ],
    ]);
  });

});

