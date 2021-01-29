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
    this._writable.write(node.text());
  };

  visitStrong(node) {
    this._writable.write("<strong>");
    this.visitChildren(node);
    this._writable.write("</strong>");
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
    this._writable.write("<div>");
    this._writable.write("<h2>");
    this.visit(node.heading());
    this._writable.write("</h2>");
    this.visitChildren(node);
    this._writable.write("</div>");
  };

  visitHeading(node) {
    this.visitChildren(node);
  };
};

module.exports = {
  HTMLVisitor: HTMLVisitor,
};
