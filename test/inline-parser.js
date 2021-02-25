const debug = require("debug")("asciishaman:tests-inline-parser");
const chai = require('chai');
const assert = chai.assert;


const ip = require("../lib/inline-parser.js");

const streams = require('memory-streams');
const { HTMLVisitor } = require("../lib/visitors/html.js");

describe("string parser", function() {
    this.timeout(10);

    function dump(phrasingContent) {
      const writable = new streams.WritableStream();
      const visitor = new HTMLVisitor(writable);
      return visitor.visit(phrasingContent).then(() => writable.toString());
    }

    it("should keep plaintext intect", function() {
        const style = ip.parseText("Hello");

        return dump(style).then((html) => assert.equal(html, "Hello"));
    });

    it("should parse strong", function() {
        const style = ip.parseText("Hello *world* !");

        return dump(style).then((html) => assert.equal(html, "Hello <strong>world</strong> !"));
    });

    it("should parse multiple strong", function() {
        const style = ip.parseText("*Hello* *world* !");

        return dump(style).then((html) => assert.equal(html, "<strong>Hello</strong> <strong>world</strong> !"));
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

    it("should parse superscript", function() {
        const style = ip.parseText("Hello ^world^ !");

        return dump(style).then((html) => assert.equal(html, "Hello <sup>world</sup> !"));
    });

    it("should parse monospace", function() {
        const style = ip.parseText("Hello `world` !");

        return dump(style).then((html) => assert.equal(html, "Hello <tt>world</tt> !"));
    });

    describe("mixed content", function() {

      it("should parse monospace", function() {
          const style = ip.parseText("This is *a _deep *nested* ^quoted^ text_!!!");

          return dump(style).then((html) => assert.equal(html, "This is *a <em>deep <strong>nested</strong> <sup>quoted</sup> text</em>!!!"));
      });

    });

});


