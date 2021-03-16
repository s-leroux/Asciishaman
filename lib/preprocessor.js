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

const peg = require("pegparse");


const grammar = new peg.Grammar();

const SP = peg.charset(" \t");
const EOL = peg.consume(peg.zeroOrMore(SP), "\n");
const BLANK = peg.consume(peg.oneOrMore(SP));

/*
  A text possibly containing substitutions
*/
const TEXT = peg.join(
  peg.zeroOrMore(
    peg.zeroOrMore(SP),
    peg.choice(
      peg.string(peg.anyExcept(SP.union("\n{"))),
      peg.rule("attribute-reference"),
      peg.anyExcept(SP.union("\n")),
    )
  ),
);

/*
  Attribute names are defined in
  https://docs.asciidoctor.org/asciidoc/latest/attributes/custom-attributes/#user-defined-names
*/
const WC = peg.charset("A-Z", "a-z", "0-9", "_");
const ATTR_NAME = peg.join(WC, peg.zeroOrMore(WC.union("-")));

grammar.define("document",
  peg.zeroOrMore(
    peg.consume(
      peg.rule("line")
    )
  )
);

grammar.define("line",
  peg.choice(
    peg.rule("attribute-definition"),
    peg.rule("text-line"),
  )
);

grammar.define("text-line",
  [ TEXT, EOL ],
  function(...content) {
    const line = content.join("")+"\n";
    this.send(line);
  }
);

grammar.define("attribute-reference",
  [
    peg.consume("{"), ATTR_NAME, peg.consume("}"),
  ],
  function(attrName) {
    return this.getAttribute(attrName) ?? `{${attrName}}`;
  }
);

grammar.define("attribute-definition",
  [
    peg.consume(":"), ATTR_NAME, peg.consume(":"),
    peg.optional(
      [ peg.consume(BLANK), TEXT ],
      ""
    ),
    EOL
  ],
  function(name, value) {
    this.setAttribute(name, value);
    // forward the line to the next stage
    this.send(`:${name}: ${value}\n`); // XXX should do proper excaping!
  }
);

/**
  The preprocessor.

  Process data on a line-by-line basis.
*/
class Preprocessor {
  constructor(send) {
    this.parser = grammar.parser("document", this);
    this.send = send;
    this.last = "\x00";
    this.attributes = new Map();
  }

  accept(str) {
    if (str)
      this.last = str.slice(-1);
    this.parser.accept(str);
  }

  flush() {
    if (this.last !== "\n") {
      this.parser.accept("\n");
    }
    this.parser.run();
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }
}

module.exports = Preprocessor;
