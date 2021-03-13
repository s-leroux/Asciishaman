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
      "document": this.visitChildren(node),
    };
  }

  visitParagraph(node) {
    return {
      "paragraph": this.visitChildren(node),
    };
  }

  visitStrong(node) {
    return {
      "strong": this.visitChildren(node),
    };
  }

  visitEmphasis(node) {
    return {
      "em": this.visitChildren(node),
    };
  }

  visitMonospace(node) {
    return {
      "monospace": this.visitChildren(node),
    };
  }

  visitSuperscript(node) {
    return {
      "superscript": this.visitChildren(node),
    };
  }

  visitBlock(node) {
    return {
      "metadata": node.metadata,
      "block": this.visitChildren(node),
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
      "content": this.visitChildren(node),
    };
  }

  visitUnorderedList(node) {
    return {
      "ul": node.children.map(item => this.visit(item)),
    };
  }

  visitListItem(node) {
    return {
      "li": this.visitChildren(node),
    };
  }

  visitHeading(node) {
    return {
      "paragraph": this.visitChildren(node),
    };
  }
}

module.exports = {
  ModelVisitor,
};
