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

class HTMLVisitor extends Visitor {
  constructor(writable) {
    super();
    this._writable = writable;
    this._promise = Promise.resolve();
  }

  write(data) {
    function _write(past) {
      return new Promise(function(resolve, reject) {
        this._writable.write(data, "utf8", (value, err) => {
          if (err)
            reject(err);
          else
            return past.then(resolve(value));
        });

      });
    }

    return this._promise = _write(this._promise);
  }

  visit(node) {
    super.visit(node);
    return this._promise;
  }

  visitText(node) {
    this._writable.write(node.text);
  }

  visitStrong(node) {
    this._writable.write("<strong>");
    this.visitChildren(node);
    this._writable.write("</strong>");
  }

  visitEmphasis(node) {
    this._writable.write("<em>");
    this.visitChildren(node);
    this._writable.write("</em>");
  }

  visitMonospace(node) {
    this._writable.write("<tt>");
    this.visitChildren(node);
    this._writable.write("</tt>");
  }

  visitHyperlink(node) {
    this._writable.write(`<a href='${node.href}'>`);
    this.visitChildren(node);
    this._writable.write("</a>");
  }

  visitSuperscript(node) {
    this._writable.write("<sup>");
    this.visitChildren(node);
    this._writable.write("</sup>");
  }

  visitParagraph(node) {
    this._writable.write("<p>");
    this.visitChildren(node);
    this._writable.write("</p>");
  }

  visitDocument(node) {
    this._writable.write("<body>");
    this.visitChildren(node);
    this._writable.write("</body>");
  }

  visitBlock(node) {
    this._writable.write("<div>");
    this.visitChildren(node);
    this._writable.write("</div>");
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
    this._writable.write("<div>");
    this._writable.write(`<${levels[node.level]}>`);
    this.visit(node.heading);
    this._writable.write(`</${levels[node.level]}>`);
    this.visitChildren(node);
    this._writable.write("</div>");
  }

  visitUnorderedList(node) {
    this._writable.write("<ul>");
    for(let item of node.children) {
      this.visitListItem(item);
    }
    this._writable.write("</ul>");
  }

  visitListItem(node) {
    this._writable.write("<li>");
    this.visitChildren(node);
    this._writable.write("</li>");
  }

  visitHeading(node) {
    this.visitChildren(node);
  }
}

module.exports = {
  HTMLVisitor: HTMLVisitor,
};
