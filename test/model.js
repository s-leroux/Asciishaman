const debug = require("debug")("asciishaman:tests-model");
const chai = require('chai');
const assert = chai.assert;


const model = require("../lib/model.js");


describe("model", function() {
    this.timeout(10);

    it("should create document", function() {
        const document = new model.Document();

        assert.isNotNull(document);
        assert.deepEqual(document.children, []);
    });

    it("should create paragraph", function() {
        const paragraph = new model.Paragraph();

        assert.isNotNull(paragraph);
    });

});

