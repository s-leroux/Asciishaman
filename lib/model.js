/* Asciishaman - A pure JavaScript implementation of AsciiDoc
 * Copyright (c) 2021 Sylvain Leroux
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const { HTMLVisitor } = require("./visitors/html");

// =========================================================================
//  Document Object Model
// =========================================================================
class Node {
  constructor() {
  }

  /**
    Implement a visitor pattern. Sub-classes should override to invoke
    thier corresponding `visitor.visitXXX()` method.
  */
  accept(/*visitor*/) {
    throw new TypeError(`${this.constructor.name}.accept() not implemented`);
  }

  // -----------------------------------------------------------------------
  //  High-level API
  // -----------------------------------------------------------------------
  /**
    Serialize the current object as HTML using the corresponding visitor.
  */
  html() {
    const visitor = new HTMLVisitor();
    return visitor.visit(this);
  }

}

/**
  Base class for compound nodes.

  A compound node may contain block-level nodes. But no
  inline nodes.
*/
class Compound extends Node {
  constructor(children) {
    super();

    this.children = children ?? []; // XXX Should we make a copy here?
  }
}

/**
  The root of the node hiearchy.

  By definition, the document is the root of
  its Node tree.
*/
class Document extends Compound {
  constructor(header, children) {
    super(children);

    this.title = header?.title ?? "";
    this.authors = header?.authors ?? [];
    this.attributes = header?.attributes ?? new Map();
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
  constructor(level, heading, children) {
    super(children);
    this.level = level ?? 1;
    this.heading = heading ?? new Text();
  }

  accept(visitor) {
    return visitor.visitSection(this);
  }
}

/**
  A table.
*/
class Table extends Node {
  constructor(metadata, rows) {
    super();

    this.metadata = metadata;
    this.rows = rows ?? [];
  }

  accept(visitor) {
    return visitor.visitTable(this);
  }
}

/**
  A block.

  A section is started in the document by `==`, `===`, ...
*/
class Block extends Compound {
  constructor(metadata, children) {
    super(children);

    this.metadata = metadata;
  }

  accept(visitor) {
    return visitor.visitBlock(this);
  }
}

/**
  An unordered list
*/
class UnorderedList extends Compound {
  constructor(children) {
    super(children);
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
    return visitor.visitListItem(this);
  }
}

class Paragraph extends Node {
  constructor(metadata, children) {
    super();

    this.metadata = metadata;
    this.children = children ?? [];
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
  constructor(attributes, content) { // we should make a copy here :/
    super();

    this.children = content ?? [];
    this.attributes = attributes;
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

class Subscript extends PhrasingContent {
  accept(visitor) {
    return visitor.visitSubscript(this);
  }
}

class Mark extends PhrasingContent {
  accept(visitor) {
    return visitor.visitMark(this);
  }
}

class Hyperlink extends PhrasingContent {
  constructor(attributes, content) {
    super(attributes, content);

    this.href = attributes?.href ?? "";
  }

  accept(visitor) {
    return visitor.visitHyperlink(this);
  }
}

/*
  A container for phrasing content.
*/
class Span extends PhrasingContent {
  accept(visitor) {
    return this.children.map(item => visitor.visit(item));
  }
}

/*
  A wrapper arround a JavaScript string

  XXX Is this required?
*/
class Text extends Node {
  constructor(text) {
    super();
    this.text = text ?? "";
  }

  accept(visitor) {
    return visitor.visitText(this);
  }
}

// =========================================================================
//  Inline marcos
// =========================================================================



module.exports = {
  Block,
  Document,
  Emphasis,
  Hyperlink,
  Mark,
  Monospace,
  Node,
  Paragraph,
  PhrasingContent,
  Section,
  Span,
  Strong,
  Subscript,
  Superscript,
  Table,
  Text,
  UnorderedList,
  UnorderedListItem,
};
