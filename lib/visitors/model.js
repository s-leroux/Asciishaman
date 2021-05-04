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

const Promise = require("bluebird");

const { Visitor } = require("../visitor");

class ModelVisitor extends Visitor {
  constructor() {
    super();
  }

  visitText(node) {
    return node.text;
  }

  visitDocument(node) {
    return {
      "title": node.title,
      "authors": node.authors,
      "document": this.visitAll(node.children),
      "attributes": Object.fromEntries(node.attributes),
    };
  }

  visitParagraph(node) {
    return {
      "paragraph": this.visitAll(node.children),
    };
  }

  visitStrong(node) {
    return {
      "strong": this.visitAll(node.children),
    };
  }

  visitEmphasis(node) {
    return {
      "em": this.visitAll(node.children),
    };
  }

  visitMark(node) {
    return {
      "mark": this.visitAll(node.children),
    };
  }

  visitHyperlink(node) {
    return {
      "a": this.visitAll(node.children),
      "href": node.href,
    };
  }

  visitMonospace(node) {
    return {
      "monospace": this.visitAll(node.children),
    };
  }

  visitSubscript(node) {
    return {
      "subscript": this.visitAll(node.children),
    };
  }

  visitSuperscript(node) {
    return {
      "superscript": this.visitAll(node.children),
    };
  }

  visitBlock(node) {
    return {
      "metadata": node.metadata,
      "block": this.visitAll(node.children),
    };
  }

  visitSection(node) {
    const levels = [
      undefined,
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ];
    return {
      "heading": this.visit(node.heading),
      "content": this.visitAll(node.children),
    };
  }

  visitUnorderedList(node) {
    return {
      "ul": node.children.map(item => this.visit(item)),
    };
  }

  visitListItem(node) {
    return {
      "li": this.visitAll(node.children),
    };
  }

  visitHeading(node) {
    return {
      "paragraph": this.visitAll(node.children),
    };
  }
}

module.exports = ModelVisitor;
