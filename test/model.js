"use strict";

const chai = require("chai");
const assert = chai.assert;


const dom = require("../lib/model.js");

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

