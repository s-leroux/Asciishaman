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

const streams = require("memory-streams");

const { HTMLVisitor } = require("../lib/visitors/html.js");
const { DocumentBuilder } = require("../lib/builder.js");

describe("visitor (html)", function() {
  this.timeout(10);

  it("should output paragraphs with plain text", function() {
    const root = new DocumentBuilder();
    let builder = root;

    builder = builder.addText("Hello");
    builder = builder.close();
    builder = builder.addText("World!");
    builder = builder.close();

    builder?.closeAll();

    const document = builder.document;

    const writable = new streams.WritableStream();
    const visitor = new HTMLVisitor(writable);
    return visitor.visit(document).then(() => {
      assert.equal(
        writable.toString(),
        "<body><p>Hello</p><p>World!</p></body>"
      );
    });
  });

});

