"use strict";

const debug = require("debug")("asciishaman:builder");
const dom = require("./model");
const ip = require("./inline-parser");

// =========================================================================
//  Builders
// =========================================================================
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
  constructor() {
    super(null, new dom.Document());
  }

  get document() {
    return this.container; // XXX Is this correct? Is the "container" the object we are building
                           //     or its parent ?!?
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
    this.node = new dom.Paragraph();
    this.container.children.push(this.node);
  }

  addText(text) {
    this.text.push(text);
    return this;
  }

  close() {
    const text = ip.parseText(this.text.join(" "));
    this.node.children = [ text ];

    return this.parent;
  }
}

class SectionBuilder extends Builder {
  constructor(parent, container, level, heading) {
    super(parent, container);
    this.level = level;
    this.heading = heading;
    this.node = new dom.Section(level, new dom.Text(heading));
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
    this.list = new dom.UnorderedList(level);
    this.container.children.push(this.list);

    this.item = new dom.UnorderedListItem();
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
      this.item = new dom.UnorderedListItem();
      this.list.items.push(this.item);

      return this;
    }
  }

  close() {
    return this;
  }
}

module.exports = {
  DocumentBuilder,
}
