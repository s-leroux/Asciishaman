const { Visitor } = require("../visitor");

class HTMLVisitor extends Visitor {
  constructor(writable) {
    super();
    this._writable = writable;
  }

  visitText(node) {
    this._writable.write("<span>");
    this._writable.write(node.text());
    this._writable.write("</span>");
  };

  visitDocument(node) {
    this._writable.write("<body>");
    this.visitChildren(node);
    this._writable.write("</body>");
    this._writable.write("\n");
  }

  visitParagraph(node) {
    this._writable.write("<p>");
    this.visitChildren(node);
    this._writable.write("</p>");
  }
};

module.exports = {
  HTMLVisitor: HTMLVisitor,
};
