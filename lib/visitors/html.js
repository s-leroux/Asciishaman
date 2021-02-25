const Promise = require('bluebird');

const { Visitor } = require("../visitor");

class HTMLVisitor extends Visitor {
  constructor(writable) {
    super();
    this._writable = writable;
    this._promise = Promise.resolve();
  }

  write(data) {
    function _write(past) {
      return new Promise(function(resolve, reject) {
        this._writable.write(data, 'utf8', (value, err) => {
          if (err)
            reject(err);
          else
            return past.then(resolve(value));
        });

      });
    };

    return this._promise = _write(this._promise);
  };

  visit(node) {
    super.visit(node);
    return this._promise;
  }

  visitText(node) {
    this._writable.write(node.text);
  };

  visitStrong(node) {
    this._writable.write("<strong>");
    this.visitChildren(node);
    this._writable.write("</strong>");
  };

  visitEmphasis(node) {
    this._writable.write("<em>");
    this.visitChildren(node);
    this._writable.write("</em>");
  };

  visitMonospace(node) {
    this._writable.write("<tt>");
    this.visitChildren(node);
    this._writable.write("</tt>");
  };

  visitSuperscript(node) {
    this._writable.write("<sup>");
    this.visitChildren(node);
    this._writable.write("</sup>");
  };

  visitParagraph(node) {
    this._writable.write("<p>");
    this.visitChildren(node);
    this._writable.write("</p>");
  }

  visitDocument(node) {
    this._writable.write("<body>");
    this.visitChildren(node);
    this._writable.write("</body>");
  };

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
    this._writable.write("<div>");
    this._writable.write(`<${levels[node.level]}>`);
    this.visit(node.heading);
    this._writable.write(`</${levels[node.level]}>`);
    this.visitChildren(node);
    this._writable.write("</div>");
  };

  visitUnorderedList(node) {
    this._writable.write("<ul>");
    for(let item of node.items) {
      this.visitListItem(item);
    }
    this._writable.write("</ul>");
  }

  visitListItem(node) {
    this._writable.write("<li>");
    this.visitChildren(node);
    this._writable.write("</li>");
  }

  visitHeading(node) {
    this.visitChildren(node);
  };
};

module.exports = {
  HTMLVisitor: HTMLVisitor,
};
