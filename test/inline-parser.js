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

const Promise = require("bluebird");
const ip = require("../lib/inline-parser.js");
const builder = require("../lib/builder");

const HTMLVisitor = require("../lib/visitors/html.js");

describe("inline parser", function() {
  this.timeout(10);

  function dump(phrasingContent) {
    const visitor = new HTMLVisitor();
    return Promise.resolve(visitor.visitAll(phrasingContent).join(""));
  }

  it("should keep plaintext intect", function() {
    const style = ip.parseText("Hello");

    return dump(style).then((html) => assert.equal(html, "Hello"));
  });

  describe("string parser", function() {

    it("should parse strong (constrained)", function() {
      const style = ip.parseText("Hello *world* !");

      return dump(style).then((html) => assert.equal(html, "Hello <strong>world</strong> !"));
    });

    it("should parse strong (uncontrained)", function() {
      const style = ip.parseText("Hello **w**orld !");

      return dump(style).then((html) => assert.equal(html, "Hello <strong>w</strong>orld !"));
    });

    it("should parse emphasis (constrained)", function() {
      const style = ip.parseText("Hello _world_ !");

      return dump(style).then((html) => assert.equal(html, "Hello <em>world</em> !"));
    });

    it("should parse emphasis (uncontrained)", function() {
      const style = ip.parseText("Hello __w__orld !");

      return dump(style).then((html) => assert.equal(html, "Hello <em>w</em>orld !"));
    });

    it("should parse monospace (constrained)", function() {
      const style = ip.parseText("Hello `world` !");

      return dump(style).then((html) => assert.equal(html, "Hello <tt>world</tt> !"));
    });

    it("should parse monospace (uncontrained)", function() {
      const style = ip.parseText("Hello ``w``orld !");

      return dump(style).then((html) => assert.equal(html, "Hello <tt>w</tt>orld !"));
    });

    it("should parse mark (constrained)", function() {
      const style = ip.parseText("Hello #world# !");

      return dump(style).then((html) => assert.equal(html, "Hello <span>world</span> !"));
    });

    it("should parse mark (uncontrained)", function() {
      const style = ip.parseText("Hello ##w##orld !");

      return dump(style).then((html) => assert.equal(html, "Hello <span>w</span>orld !"));
    });

    it("should parse superscript", function() {
      const style = ip.parseText("Hello ^world^ !");

      return dump(style).then((html) => assert.equal(html, "Hello <sup>world</sup> !"));
    });

    it("should parse subscript", function() {
      const style = ip.parseText("Hello ~world~ !");

      return dump(style).then((html) => assert.equal(html, "Hello <sub>world</sub> !"));
    });

    it("should backtrack to constrained if needed ", function() {
      const style = ip.parseText("Hello **world* !");

      return dump(style).then((html) => assert.equal(html, "Hello *<strong>world</strong> !"));
    });

    it("should parse multiple strong (contrained)", function() {
      const style = ip.parseText("*Hello* *world* !");

      return dump(style).then((html) => assert.equal(html, "<strong>Hello</strong> <strong>world</strong> !"));
    });

    it("should parse multiple strong (uncontrained)", function() {
      const style = ip.parseText("**H**ello **w**orld !");

      return dump(style).then((html) => assert.equal(html, "<strong>H</strong>ello <strong>w</strong>orld !"));
    });

  });

  it("should parse italic", function() {
    const style = ip.parseText("Hello _world_ !");

    return dump(style).then((html) => assert.equal(html, "Hello <em>world</em> !"));
  });

  it("should parse stong+italic", function() {
    const style = ip.parseText("This *is a _strong_ text* !");

    return dump(style).then((html) => assert.equal(html, "This <strong>is a <em>strong</em> text</strong> !"));
  });

  it("should parse style markers at the start of a line", function() {
    const style = ip.parseText("*world* !");

    return dump(style).then((html) => assert.equal(html, "<strong>world</strong> !"));
  });

  it("should parse style markers at both the start and the end of a line", function() {
    const style = ip.parseText("*world*");

    return dump(style).then((html) => assert.equal(html, "<strong>world</strong>"));
  });

  it("should parse id", function() {
    const style = ip.parseText("[#my-id]*Hello*");
    assert.equal(style[0].attributes.get('id'), "my-id");
  });

  it("should parse id and role", function() {
    const style = ip.parseText("[#my-id.my-role]*Hello*");

    assert.equal(style[0].attributes.get('id'), "my-id");
    assert.deepEqual(style[0].attributes.get('roles'), ["my-role"]);
  });

  describe("macros", function() {
    beforeEach(function() {
      this.docBuilder = new builder.DocumentBuilder();
      this.paraBuilder = this.docBuilder.paragraph([]);
    });

    it("should invoke the default handler", function() {
      const style = ip.parseText("Some unknown:macro[]", this.paraBuilder);

      return dump(style).then((html) => assert.equal(html, "Some <tt>unknown:macro[]</tt>"));
    });

    it("should handle links (default text)", function() {
      const style = ip.parseText("Link to http://docs.asciidoctor.org[]", this.paraBuilder);

      return dump(style).then((html) => assert.equal(html, "Link to <a href='http://docs.asciidoctor.org'>http://docs.asciidoctor.org</a>"));
    });

    it("should handle links (custom text)", function() {
      const style = ip.parseText("Link to http://docs.asciidoctor.org[the docs]", this.paraBuilder);

      return dump(style).then((html) => assert.equal(html, "Link to <a href='http://docs.asciidoctor.org'>the docs</a>"));
    });

    it("should handle links (custom text, named attribute)", function() {
      const style = ip.parseText("Link to http://docs.asciidoctor.org[text=the docs]", this.paraBuilder);

      return dump(style).then((html) => assert.equal(html, "Link to <a href='http://docs.asciidoctor.org'>the docs</a>"));
    });

  });

  describe("mixed content", function() {

    it("should parse monospace", function() {
      const style = ip.parseText("This is *a _deep *nested* ^quoted^ text_!!!");

      return dump(style).then((html) => assert.equal(html, "This is *a <em>deep <strong>nested</strong> <sup>quoted</sup> text</em>!!!"));
    });

  });

});


