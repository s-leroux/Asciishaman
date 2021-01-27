const debug = require("debug")("asciishaman:model");


class Node {
  constructor(parent) {
    this._parent = parent;
    this._children = [];

    if (parent)
      parent.attach(this);
  };

  /**
    Called by a child node when it attaches this parent
  */
  attach(child) {
    this._children.push(child);
  };

  parent() { return this._parent; };
  children() { return this._children; };
};

/**
  The root of the node hiearchy.

  By definition, the document is the root of
  its Node tree.
*/
class Document extends Node {
  constructor() {
    super(null);
  };

  accept(visitor) {
    return visitor.visitDocument(this);
  }

  makeParagraph() {
    return new Paragraph(this);
  }
};

/**
  A block element.
  Blocks can be nested. They also serve as container for
  _inline_ nodes like text content.
*/
class Block extends Node {

};

class Paragraph extends Block {
  makeText() {
    return new Text(this);
  }

  accept(visitor) {
    return visitor.visitParagraph(this);
  }
};

class InlineElement extends Node {
  constructor(parent) {
    super(parent);

    this._text = "";
  }

  concat(moreText) { // XXX Should be a variadic function
    this._text += moreText;
  }

  text() { return this._text; }
};

class Text extends InlineElement {
  accept(visitor) {
    return visitor.visitText(this);
  }
};

module.exports = {
  Document: Document,
}