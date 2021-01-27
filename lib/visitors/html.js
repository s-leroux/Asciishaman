const { Visitor } = require("../visitor");

class HTMLVisitor extends Visitor {
  visitText(node) {
    process.stdout.write("<span>");
    process.stdout.write(node.text());
    process.stdout.write("</span>");
  };

  visitDocument(node) {
    process.stdout.write("<body>");
    this.visitChildren(node);
    process.stdout.write("</body>");
    process.stdout.write("\n");
  }

  visitParagraph(node) {
    process.stdout.write("<p>");
    this.visitChildren(node);
    process.stdout.write("</p>");
  }
};

module.exports = {
  HTMLVisitor: HTMLVisitor,
};
