"use strict";

const debug = require("debug")("asciishaman:model");

class Builder {
  constructor(parent, container) {
    this.parent = parent;
    this.container = container;
  }

  close() { return this; }

  addText(text) {
    this.close();
    return this.parent.addText(text);
  }

  section(level, heading) {
    this.close();
    return this.parent.section(level, heading);
  }

  unorderedListItem(level) {
    this.close();
    return this.parent.unorderedListItem(level);
  }
}

class DocumentBuilder extends Builder {
  constructor(container) {
    super(null, container);
  }

  addText(text) {
    const builder = new ParagraphBuilder(this, this.container);
    return builder.addText(text);
  }

  section(level, heading) {
    const builder = new SectionBuilder(this, this.container, level, heading);

    return builder;
  }

  unorderedListItem(level) {
    return new UnorderedListItemBuilder(this, this.container, level);
  }
}

class ParagraphBuilder extends Builder {
  constructor(parent, container) {
    super(parent, container);

    this.text = []; // an array of _strings_
    this.node = new Paragraph();
    this.container.children.push(this.node);
  }

  addText(text) {
    this.text.push(text);
    return this;
  }

  close() {
    const text = new Text(this.text.join(" "));
    this.node.children = [ text ];

    return this.parent;
  }
}

class SectionBuilder extends Builder {
  constructor(parent, container, level, heading) {
    super(parent, container);
    this.level = level;
    this.heading = heading;
    this.node = new Section(level, new Text(heading));
    this.container.children.push(this.node);
  }

  addText(text) {
    const builder = new ParagraphBuilder(this, this.node);
    return builder.addText(text);
  }

  section(level, heading) {
    if (level > this.level) {
      return new SectionBuilder(this, this.node, level, heading);
    }
    else {
      return super.section(level, heading);
    }
  }
}

class UnorderedListItemBuilder extends Builder {
  constructor(parent, container, level) {
    super(parent, container);
    this.level = level;
    this.list = new UnorderedList(level);
    this.container.children.push(this.list);

    this.item = new UnorderedListItem();
    this.list.items.push(this.item);
  }

  addText(text) {
    const builder = new ParagraphBuilder(this, this.item);
    return builder.addText(text);
  }

  unorderedListItem(level) {
    if (level > this.level) {
      return new UnorderedListItemBuilder(this, this.item, level);
    }
    else if (level < this.level) {
      return super.unorderedListItem(level, level);
    }
    else {
      // new item
      this.item = new UnorderedListItem();
      this.list.items.push(this.item);

      return this;
    }
  }

  close() {
    return this;
  }
}


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
  constructor() {
    super();

    this.children = [];
  };
};

/**
  The root of the node hiearchy.

  By definition, the document is the root of
  its Node tree.
*/
class Document extends Container {
  constructor() {
    super();
  };

  builder() {
    return new DocumentBuilder(this);
  }

  accept(visitor) {
    return visitor.visitDocument(this);
  }
};

/**
  A section.

  A section is started in the document by `==`, `===`, ...
*/
class Section extends Container {
  constructor(level, heading) {
    super();
    this.level = level;
    this.heading = heading;
  }

  accept(visitor) {
    return visitor.visitSection(this);
  }
};

/**
  An unordered list
*/
class UnorderedList extends Container {
  constructor(level) {
    super();
    this.level = level;
    this.items = [];
  }

  accept(visitor) {
    return visitor.visitUnorderedList(this);
  }
};

/**
  An unordered list item
*/
class UnorderedListItem extends Container {
  accept(visitor) {
    return visitor.visitUnorderedListItem(this);
  }
};

/**
  A collection of inline elements (text and/or inta-paragraph elements)
*/
class PhrasingContent extends Node {
  constructor() {
    super();

    this.children = [];
  };
};

class Paragraph extends PhrasingContent {
  constructor(parent) {
    super(parent);
  }

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
  constructor(parent) {
    super(parent);
  }
};

class Text extends InlineElement {
  constructor(text) {
    super();

    this.text = text;
  }

  accept(visitor) {
    return visitor.visitText(this);
  }
};

module.exports = {
  Document: Document,
  Text: Text,
  Paragraph: Paragraph,
}
