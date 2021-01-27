const debug = require("debug")("asciishaman:tests-visitor");
const chai = require('chai');
const assert = chai.assert;


const { HTMLVisitor } = require("../lib/visitors/html.js");
const dom = require("../lib/model.js");

describe("visitor (html)", function() {
    this.timeout(10);

    it("should parse paragraphs with plain text", function() {
      const doc = new dom.Document();
      const p1 = doc.makeParagraph();
      const p2 = doc.makeParagraph();

      p1.makeText().concat("hello");
      p1.makeText().concat(" ");
      p1.makeText().concat("world");
      p2.makeText().concat("!");

      const visitor = new HTMLVisitor(process.stdout);
      visitor.visit(doc);
    });

});

