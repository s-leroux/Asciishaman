"use strict";

// =========================================================================
//  Document Object Model
// =========================================================================
class Node {
  constructor() {
  }

  accept(/*visitor*/) {
    throw new TypeError(`${this.constructor.name}.accept() not implemented`);
  }
}

/**
  Base class for compound nodes.

  A compound node may contain block-level nodes. But no
  inline nodes.
*/
class Compound extends Node {
  constructor() {
    super();

    this.children = [];
  }
}

/**
  The root of the node hiearchy.

  By definition, the document is the root of
  its Node tree.
*/
class Document extends Compound {
  constructor() {
    super();
  }

  accept(visitor) {
    return visitor.visitDocument(this);
  }
}

/**
  A section.

  A section is started in the document by `==`, `===`, ...
*/
class Section extends Compound {
  constructor(level, heading) {
    super();
    this.level = level;
    this.heading = heading;
  }

  accept(visitor) {
    return visitor.visitSection(this);
  }
}

/**
  A block.

  A section is started in the document by `==`, `===`, ...
*/
class Block extends Compound {
  constructor() {
    super();
  }

  accept(visitor) {
    return visitor.visitBlock(this);
  }
}

/**
  An unordered list
*/
class UnorderedList extends Compound {
  constructor(level) {
    super();
    this.level = level;
    this.items = [];
  }

  accept(visitor) {
    return visitor.visitUnorderedList(this);
  }
}

/**
  An unordered list item
*/
class UnorderedListItem extends Compound {
  accept(visitor) {
    return visitor.visitUnorderedListItem(this);
  }
}

class Paragraph extends Node {
  constructor() {
    super();
  }

  accept(visitor) {
    return visitor.visitParagraph(this);
  }
}

/**
  A collection of inline elements (text and/or intra-paragraph elements).

  PhrasingContent can be nested to an arbitrary depth.
*/
class PhrasingContent extends Node {
  constructor(content) { // we should make a copy here :/
    super();

    this.children = content;
  }

}

class Strong extends PhrasingContent {
  accept(visitor) {
    return visitor.visitStrong(this);
  }
}

class Emphasis extends PhrasingContent {
  accept(visitor) {
    return visitor.visitEmphasis(this);
  }
}

class Monospace extends PhrasingContent {
  accept(visitor) {
    return visitor.visitMonospace(this);
  }
}

class Superscript extends PhrasingContent {
  accept(visitor) {
    return visitor.visitSuperscript(this);
  }
}

/*
  A container for phrasing content.
*/
class Span extends PhrasingContent {
  accept(visitor) {
    // simply delegate to its children
    for(let child of this.children) {
      visitor.visit(child);
    }
  }
}

/*
  A wrapper arround a JavaScript string

  XXX Is this required?
*/
class Text extends Node {
  constructor(text) {
    super();
    this.text = text;
  }

  accept(visitor) {
    return visitor.visitText(this);
  }
}

module.exports = {
  Block,
  Document,
  Emphasis,
  Monospace,
  Paragraph,
  PhrasingContent,
  Section,
  Span,
  Strong,
  Superscript,
  Text,
  UnorderedList,
  UnorderedListItem,
};
