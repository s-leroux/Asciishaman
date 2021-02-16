const debug = require("debug")("asciishaman:tests-model");
const chai = require('chai');
const assert = chai.assert;


const dom = require("../lib/model.js");


describe("utils", function() {

  describe("string parser", function() {
      this.timeout(10);

      it("should keep plaintext intect", function() {
          const style = dom._breakString("Hello");

          assert.deepEqual(style, [
            0x00, "Hello",
            0x00,
          ]);
      });

      it("should parse strong", function() {
          const style = dom._breakString("Hello *world* !");
          assert.deepEqual(style, [
            0x00, "Hello ",
            0x01, "world",
            0x00, " !",
            0x00,
          ]);
      });

      it("should parse italic", function() {
          const style = dom._breakString("Hello _world_ !");
          assert.deepEqual(style, [
            0x00, "Hello ",
            0x02, "world",
            0x00, " !",
            0x00,
          ]);
      });

      it("should parse stong+italic", function() {
          const style = dom._breakString("This *is a _strong_ text* !");
          assert.deepEqual(style, [
            0x00, "This ",
            0x01, "is a ",
            0x03, "strong",
            0x01, " text",
            0x00, " !",
            0x00
          ]);
      });

  });

});

describe("dom", function() {
    this.timeout(10);

    it("should create document", function() {
        const document = new dom.Document();

        assert.isNotNull(document);
        assert.deepEqual(document.children, []);
    });

    it("should create paragraph", function() {
        const paragraph = new dom.Paragraph();

        assert.isNotNull(paragraph);
    });

});

