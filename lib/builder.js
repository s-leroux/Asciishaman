"use strict";

const dom = require("./model");
const ip = require("./inline-parser");

// =========================================================================
//  Builders
// =========================================================================
class Builder {
  constructor(parent) {
    this.parent = parent;
    this.children = [];
  }

  close() { return this.parent; }

  /**
    Close the builder and all its ancestors.
  */
  closeAll() {
    let builder = this;
    while(builder) {
      builder = builder.close();
    }
  }

  addText(text) {
    return this.close().addText(text);
  }

  section(level, heading) {
    return this.close().section(level, heading);
  }

  unorderedListItem(level) {
    return this.close().unorderedListItem(level);
  }

  blockDelimiter(level, delim) {
    return this.close().blockDelimiter(level, delim);
  }
}

class CompoundBuilder extends Builder {

  addText(text) {
    const builder = new ParagraphBuilder(this);
    return builder.addText(text);
  }

  section(level, heading) {
    const builder = new SectionBuilder(this, level, heading);

    return builder;
  }

  blockDelimiter(level, delim) {
    return new BlockBuilder(this, level, delim);
  }

  unorderedListItem(level) {
    const list = new UnorderedListBuilder(this, level);
    return new UnorderedListItemBuilder(list, level);
  }
}

class DocumentBuilder extends CompoundBuilder {
  constructor() {
    super(null);

    this.document = null;
  }

  close() {
    const document = this.document = new dom.Document(this.children);

    return this.parent;
  }
}

class ParagraphBuilder extends Builder {
  constructor(parent) {
    super(parent);
  }

  addText(text) {
    this.children.push(text);
    return this;
  }

  close() {
    const text = ip.parseText(this.children.join(" "));
    const node = new dom.Paragraph([text]);

    this.parent.children.push(node);

    return this.parent;
  }
}

class SectionBuilder extends CompoundBuilder {
  constructor(parent, level, heading) {
    super(parent);
    this.level = level;
    this.heading = heading;
  }

  close() {
    const node = new dom.Section(this.level, new dom.Text(this.heading), this.children);

    this.parent.children.push(node);
    return this.parent;
  }

  section(level, heading) {
    if (level <= this.level)
      return this.close().section(level, heading);

    return super.section(level, heading);
  }
}

class BlockBuilder extends CompoundBuilder {
  constructor(parent, level, delim) {
    super(parent);

    this.level = level;
    this.delim = delim;
  }

  blockDelimiter(level, delim) {
    // this is either a closing delimiter or an opening one
    if ((level === this.level) && (delim === this.delim))
      return this.close();

    return super.blockDelimiter(level, delim);
  }

  close() {
    const node = new dom.Block(this.children);

    this.parent.children.push(node);
    return this.parent;
  }
}

class UnorderedListBuilder extends Builder {
  constructor(parent, level) {
    super(parent);
    this.level = level;
  }

  unorderedListItem(level) {
    if (level < this.level) {
      return this.close().unorderedListItem(level);
    }
    else {
      return new UnorderedListItemBuilder(this, level);
    }
  }

  close() {
    const node = new dom.UnorderedList(this.children);

    this.parent.children.push(node);
    return this.parent;
  }
}

class UnorderedListItemBuilder extends CompoundBuilder {
  constructor(parent, level) {
    super(parent);
    this.level = level;
  }

  unorderedListItem(level) {
    if (level > this.level) {
      return super.unorderedListItem(level);
    }
    else {
      return this.close().unorderedListItem(level);
    }
  }

  close() {
    const node = new dom.UnorderedListItem(this.children);

    this.parent.children.push(node);
    return this.parent;
  }
}

module.exports = {
  DocumentBuilder,
};
