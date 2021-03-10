"use strict";

const Promise = require("bluebird");

const { Visitor } = require("../visitor");

class ModelVisitor extends Visitor {
  constructor() {
    super();
  }

  visitText(node) {
    return node.text;
  }

  visitDocument(node) {
    return {
      "document": this.visitChildren(node),
    };
  }

  visitParagraph(node) {
    return {
      "paragraph": this.visitChildren(node),
    };
  }

  visitStrong(node) {
    return {
      "strong": this.visitChildren(node),
    };
  }

  visitEmphasis(node) {
    return {
      "em": this.visitChildren(node),
    };
  }

  visitMonospace(node) {
    return {
      "monospace": this.visitChildren(node),
    };
  }

  visitSuperscript(node) {
    return {
      "superscript": this.visitChildren(node),
    };
  }

  visitBlock(node) {
    return {
      "block": this.visitChildren(node),
    };
  }

  visitSection(node) {
    const levels = [
      undefined,
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ];
    return {
      "heading": this.visit(node.heading),
      "content": this.visitChildren(node),
    };
  }

  visitUnorderedList(node) {
    return {
      "ul": node.children.map(item => this.visit(item)),
    };
  }

  visitListItem(node) {
    return {
      "li": this.visitChildren(node),
    };
  }

  visitHeading(node) {
    return {
      "paragraph": this.visitChildren(node),
    };
  }
}

module.exports = {
  ModelVisitor,
};
