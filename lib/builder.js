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

const dom = require("./model");
const ip = require("./inline-parser");
const im = require("./inline-macro");

// =========================================================================
//  Builders
// =========================================================================
class Builder {
  constructor(parent) {
    this.parent = parent;
    this.root = parent?.root;
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

  paragraph(metadata) {
    return this.close().paragraph(metadata);
  }

  section(level, heading) {
    return this.close().section(level, heading);
  }

  unorderedListItem(level) {
    return this.close().unorderedListItem(level);
  }

  blockDelimiter(level, delim, metadata) {
    return this.close().blockDelimiter(level, delim, metadata);
  }

  blankLine() {
    return this;
  }
}

class CompoundBuilder extends Builder {

  addText(text) {
    return this.paragraph([]).addText(text);
  }

  paragraph(metadata) {
    return new ParagraphBuilder(this, metadata);
  }


  section(level, heading) {
    const builder = new SectionBuilder(this, level, heading);

    return builder;
  }

  blockDelimiter(level, delim, metadata) {
    return new BlockBuilder(this, level, delim, metadata);
  }

  unorderedListItem(level) {
    const list = new UnorderedListBuilder(this, level);
    return new UnorderedListItemBuilder(list, level);
  }
}

class DocumentBuilder extends CompoundBuilder {
  constructor() {
    super(null);

    const inlineMacroRegistry = this.inlineMacroRegistry = new Map();

    /* set the default handler */ 
    inlineMacroRegistry.set("", im.defaultHandler);
    inlineMacroRegistry.set("http", im.hrefHandler);
    inlineMacroRegistry.set("https", im.hrefHandler);

    this.root = this;
    this.document = null;
    this.header = {};
  }

  setHeader(header) {
    this.header = header;
  }

  close() {
    const document = this.document = new dom.Document(this.header, this.children);

    return this.parent;
  }

  /**
    Search and execute an inline macro.

    Return an InlineNode.
  */
  inlineMacro(name, target, attributes) {
    const macro = this.inlineMacroRegistry.get(name) ?? this.inlineMacroRegistry.get("");

    return macro(name, target, attributes);
  }
}

class ParagraphBuilder extends Builder {
  constructor(parent, metadata) {
    super(parent);

    this.metadata = metadata;
  }

  addText(text) {
    this.children.push(text);
    return this;
  }

  blankLine() {
    return this.close();
  }

  close() {
    const text = ip.parseText(this.children.join(" "), this);
    const node = new dom.Paragraph(this.metadata, text);

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
  constructor(parent, level, delim, metadata) {
    super(parent);

    this.level = level;
    this.delim = delim;
    this.metadata = metadata;
  }

  blockDelimiter(level, delim, metadata) {
    // this is either a closing delimiter or an opening one
    if ((level === this.level) && (delim === this.delim))
      return this.close();

    return super.blockDelimiter(level, delim, metadata);
  }

  close() {
    const node = new dom.Block(this.metadata, this.children);

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
