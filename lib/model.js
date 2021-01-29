const debug = require("debug")("asciishaman:model");


class Node {
  constructor(parent) {
    this._parent = parent;
  };

  parent() { return this._parent; };

  accept(visitor) {
    throw new TypeError(`${this.constructor.name}.accept() not implemented`);
  }
};

/**
  Base class for container nodes.

  A container may contain block-level nodes. But no
  inline nodes.
*/
class Container extends Node {
  constructor(parent) {
    super(parent);

    this._children = [];
  };

  children() { return this._children; };

  makeParagraph() {
    const node = new Paragraph(this);

    this._children.push(node);

    return node;
  }

  makeSection(level) {
    const node = new Section(this, level);

    this._children.push(node);

    return node;
  }
};

/**
  The root of the node hiearchy.

  By definition, the document is the root of
  its Node tree.
*/
class Document extends Container {
  constructor() {
    super(null);
  };

  accept(visitor) {
    return visitor.visitDocument(this);
  }
};

/**
  A section.

  A section is started in the document by `==`, `===`, ...
*/
class Section extends Container {
  constructor(parent, level) {
    super(parent);
    this._level = level;
    this._heading = null;
  }

  makeHeading() {
    return this._heading = new Heading(this);
  }

  heading() {
    return this._heading;
  }

  accept(visitor) {
    return visitor.visitSection(this);
  }
};

/**
  A block element.
  Blocks can be nested.
*/
class Block extends Node {
  constructor(parent) {
    super(parent);

    this._children = [];
  };

  children() { return this._children; };
};

/**
  A collection of inline elements (text and/or inta-paragraph elements)
*/
class PhrasingContent extends Node {
  constructor(parent) {
    super(parent);

    this._children = [];
  };

  children() { return this._children; };

  makeText(text) {
    const node = new Text(this, text);

    this._children.push(node);

    return node;
  }

  makeStrong() {
    const node = new Strong(this);

    this._children.push(node);

    return node;
  }
};

class Paragraph extends PhrasingContent {
  accept(visitor) {
    return visitor.visitParagraph(this);
  }
};

class Strong extends PhrasingContent {
  accept(visitor) {
    return visitor.visitStrong(this);
  }
};

class Heading extends PhrasingContent {
  accept(visitor) {
    return visitor.visitHeading(this);
  }
};

class InlineElement extends Node {
};

class Text extends InlineElement {
  constructor(parent, text) {
    super(parent);

    this._text = text;
  }

  accept(visitor) {
    return visitor.visitText(this);
  }

  text() {
    return this._text;
  }
};

module.exports = {
  Document: Document,
}
