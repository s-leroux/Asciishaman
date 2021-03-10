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

