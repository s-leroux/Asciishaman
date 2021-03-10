"use strict";

const chai = require("chai");
const assert = chai.assert;


const db = require("../lib/builder.js");
const { ModelVisitor } = require("../lib/visitors/model.js");

describe("builder", function() {
  this.timeout(10);

  it("should create document", function() {
    const root = new db.DocumentBuilder();
    root.close();

    assert.isNotNull(root.document);
  });

  describe("document", function() {

    it("should create paragraph implicitly", function() {
      let root = new db.DocumentBuilder();
      let builder = root;

      builder = builder.addText("a");
      builder = builder.addText("b");
      builder = builder.addText("c");

      while(builder) {
        builder = builder.close();
      }

      const model = new ModelVisitor();
      const document = model.visit(root.document);

      assert.deepEqual(document, {
        "document": [
          {
            "paragraph": [ [ "a b c" ] ]
          },
        ]
      });
    });

    it("should create paragraph implicitly (backtrack)", function() {
      const buildstack = [];
      let root = new db.DocumentBuilder(buildstack);
      let builder = root;

      builder = builder.addText("a");
      builder = builder.addText("b");
      builder = builder.addText("c");

      // simulate backtracking
      builder = root;
      builder = builder.addText("d");

      while(builder) {
        builder = builder.close();
      }

      const model = new ModelVisitor();
      const document = model.visit(root.document);

      assert.deepEqual(document, {
        "document": [
          {
            "paragraph": [ [ "d" ] ]
          },
        ]
      });
    });

    it("should create sections", function() {
      let root = new db.DocumentBuilder();
      let builder = root;

      builder = builder.section(2, "hello");
      builder = builder.addText("a");
      builder = builder.addText("b");

      while(builder) {
        builder = builder.close();
      }

      const model = new ModelVisitor();
      const document = model.visit(root.document);

      assert.deepEqual(document, {
        "document": [
          {
            "heading": "hello",
            "content": [
              { "paragraph": [ [ "a b" ] ] }
            ]
          },
        ]
      });
    });

    it("should create nested blocks", function() {
      let root = new db.DocumentBuilder();
      let builder = root;

      builder = builder.blockDelimiter(2, "=");
      builder = builder.addText("a");
      builder = builder.blockDelimiter(3, "=");
      builder = builder.addText("b");
      builder = builder.blockDelimiter(3, "=");
      builder = builder.blockDelimiter(2, "=");

      while(builder) {
        builder = builder.close();
      }

      const model = new ModelVisitor();
      const document = model.visit(root.document);

      assert.deepEqual(document, {
        "document": [
          {
            "block": [
              { "paragraph": [ [ "a" ] ] },
              { "block": [ { "paragraph": [ [ "b" ] ] } ] }
            ]
          },
        ]
      });
    });

    it("should create consecutive blocks", function() {
      let root = new db.DocumentBuilder();
      let builder = root;

      builder = builder.blockDelimiter(2, "=");
      builder = builder.addText("a");
      builder = builder.blockDelimiter(2, "=");
      builder = builder.addText("b");
      builder = builder.blockDelimiter(2, "=");
      builder = builder.blockDelimiter(2, "=");

      while(builder) {
        builder = builder.close();
      }

      const model = new ModelVisitor();
      const document = model.visit(root.document);

      assert.deepEqual(document, {
        "document": [
          {
            "block": [
              { "paragraph": [ [ "a" ] ] },
            ],
          },
          { "paragraph": [ [ "b" ] ] },
          {
            "block": [
            ]
          }
        ]
      });
    });

    it("should create unordered lists", function() {
      let root = new db.DocumentBuilder();
      let builder = root;

      builder = builder.unorderedListItem(2);
      builder = builder.addText("a");
      builder = builder.unorderedListItem(2);
      builder = builder.addText("b");
      builder = builder.unorderedListItem(2);
      builder = builder.addText("c");

      while(builder) {
        builder = builder.close();
      }

      const model = new ModelVisitor();
      const document = model.visit(root.document);

      assert.deepEqual(document, {
        "document": [
          {
            "ul": [
              {
                "li": [
                  { "paragraph": [ [ "a" ] ] },
                ],
              },
              {
                "li": [
                  { "paragraph": [ [ "b" ] ] },
                ],
              },
              {
                "li": [
                  { "paragraph": [ [ "c" ] ] },
                ],
              },
            ],
          },
        ]
      });
    });

  });


});

