const debug = require("debug")("asciishaman:tests-model");
const chai = require('chai');
const assert = chai.assert;


const model = require("../lib/model.js");


describe("model", function() {
    this.timeout(10);

    it("should create document", function() {
        const document = new model.Document();

        assert.isNotNull(document);
        assert.isNull(document.parent());
        assert.deepEqual(document.children(), []);
    });

    it("should create paragraph", function() {
        const document = new model.Document();
        const paragraph = document.makeParagraph();

        assert.isNotNull(document);
        assert.isNotNull(paragraph);

        assert(Object.is(document, paragraph.parent()));
        assert(Object.is(paragraph, document.children()[0]));
    });

    it("should create text", function() {
        const myText = "Hello, world!"

        const document = new model.Document();
        const paragraph = document.makeParagraph();
        const text = paragraph.makeText();

        text.appendText(myText);

        assert.equal(text.text(), myText);
        assert(Object.is(paragraph, text.parent()));
    });

});

