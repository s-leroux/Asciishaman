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

const { Visitor } = require("../visitor");

class HTMLVisitor {
  visit(node) {
    const buffer = [];
    const visitor = new _HTMLVisitor(buffer);
    visitor.visit(node);
    return buffer.splice(0, Infinity).join("");
  }
}

class _HTMLVisitor extends Visitor {
  constructor(buffer) {
    super();
    this._buffer = buffer;
  }

  write(data) {
    this._buffer.push(data);
  }

  visitText(node) {
    this.write(node.text);
  }

  visitStrong(node) {
    this.write("<strong>");
    this.visitChildren(node);
    this.write("</strong>");
  }

  visitEmphasis(node) {
    this.write("<em>");
    this.visitChildren(node);
    this.write("</em>");
  }

  visitMonospace(node) {
    this.write("<tt>");
    this.visitChildren(node);
    this.write("</tt>");
  }

  visitHyperlink(node) {
    this.write(`<a href='${node.href}'>`);
    this.visitChildren(node);
    this.write("</a>");
  }

  visitMark(node) {
    this.write("<span>");
    this.visitChildren(node);
    this.write("</span>");
  }

  visitSubscript(node) {
    this.write("<sub>");
    this.visitChildren(node);
    this.write("</sub>");
  }

  visitSuperscript(node) {
    this.write("<sup>");
    this.visitChildren(node);
    this.write("</sup>");
  }

  visitParagraph(node) {
    this.write("<p>");
    this.visitChildren(node);
    this.write("</p>");
  }

  visitDocument(node) {
    this.write("<body>");
    this.visitChildren(node);
    this.write("</body>");
  }

  visitBlock(node) {
    this.write("<div>");
    this.visitChildren(node);
    this.write("</div>");
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
    this.write("<div>");
    this.write(`<${levels[node.level]}>`);
    this.visit(node.heading);
    this.write(`</${levels[node.level]}>`);
    this.visitChildren(node);
    this.write("</div>");
  }

  visitUnorderedList(node) {
    this.write("<ul>");
    for(let item of node.children) {
      this.visitListItem(item);
    }
    this.write("</ul>");
  }

  visitListItem(node) {
    this.write("<li>");
    this.visitChildren(node);
    this.write("</li>");
  }

  visitHeading(node) {
    this.visitChildren(node);
  }
}

module.exports = {
  HTMLVisitor: HTMLVisitor,
};
