const debug = require("debug")("asciishaman:model");


class Node {
  constructor() {
  };

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
  constructor(...children) {
    super();

    this._children = children;
  };

  children() { return this._children; };
};

/**
  The root of the node hiearchy.

  By definition, the document is the root of
  its Node tree.
*/
class Document extends Container {
  constructor(...blocks) {
    super(...blocks);
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
  A collection of inline elements (text and/or inta-paragraph elements)
*/
class PhrasingContent extends Node {
  constructor(text) {
    super();

    this._children = [ new Text(text) ]; // should parse inlne markers
  };

  children() { return this._children; };
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
  constructor(text) {
    super();

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
  Text: Text,
  Paragraph: Paragraph,
}
