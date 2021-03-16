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
const peg = require("pegparse/lib/grammar");
const grammar = new peg.Grammar();

//  ========================================================================
//  Grammar
//  ========================================================================

const { SP, MACRO_NAME } = require('./common-expr');

//  ------------------------------------------------------------------------
//  Terminal symbols
//  ------------------------------------------------------------------------
const LETTER = peg.charset("a-z", "A-Z");

//  ------------------------------------------------------------------------
//  Initial state
//  ------------------------------------------------------------------------
grammar.define("S",
  peg.rule("inline"),
  (content) => content
);

grammar.define("inline",
  peg.oneOrMore(
    peg.choice(
      peg.rule("em-cons"),
      peg.rule("strong-uncons"),
      peg.rule("strong-cons"),
      peg.rule("monospace-cons"),
      peg.rule("superscript-cons"),
      peg.rule("inline-macro"),
      peg.any(),
    )
  ),
  (...content) => new dom.Span(compact(content))
);

//  ------------------------------------------------------------------------
//  Superscript
//  ------------------------------------------------------------------------
grammar.define("superscript-cons",
  [ peg.nat(-1, LETTER), "^", peg.and(LETTER), peg.rule("superscript-cons-content"), LETTER, "^", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (st1, content, letter, st2) => {
    content.push(letter);
    console.log("super");
    return new dom.Superscript(compact(content));
  }
);
grammar.define("superscript-cons-content",
  peg.zeroOrMore(
    peg.choice(
      peg.rule("em-cons"),
      peg.rule("strong-cons"),
      peg.rule("monospace-cons"),
      [ peg.not(LETTER, "^", peg.not(LETTER)), peg.any() ],
    )
  )
);

//  ------------------------------------------------------------------------
//  Monospace
//  ------------------------------------------------------------------------
grammar.define("monospace-cons",
  [ peg.nat(-1, LETTER), "`", peg.and(LETTER), peg.rule("monospace-cons-content"), LETTER, "`", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (st1, content, letter, st2) => {
    content.push(letter);
    return new dom.Monospace(compact(content));
  }
);
grammar.define("monospace-cons-content",
  peg.zeroOrMore(
    peg.choice(
      peg.rule("em-cons"),
      peg.rule("strong-cons"),
      peg.rule("superscript-cons"),
      [ peg.not(LETTER, "`", peg.not(LETTER)), peg.any() ],
    )
  )
);

//  ------------------------------------------------------------------------
//  Strong
//  ------------------------------------------------------------------------
grammar.define("strong-uncons",
  [ "**", peg.rule("strong-uncons-content"), "**" ],
  // eslint-disable-next-line no-unused-vars
  (st1, content, st2) => {
    return new dom.Strong(compact(content));
  }
);
grammar.define("strong-uncons-content",
  peg.zeroOrMore(
    peg.choice(
      [ peg.not("**"), peg.any() ],
    )
  )
);

grammar.define("strong-cons",
  [ peg.nat(-1, LETTER), "*", peg.and(LETTER), peg.rule("strong-cons-content"), LETTER, "*", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (st1, content, letter, st2) => {
    content.push(letter);
    return new dom.Strong(compact(content));
  }
);
grammar.define("strong-cons-content",
  peg.zeroOrMore(
    peg.choice(
      peg.rule("em-cons"),
      peg.rule("monospace-cons"),
      peg.rule("superscript-cons"),
      [ peg.not(LETTER, "*", peg.not(LETTER)), peg.any() ],
    )
  )
);

//  ------------------------------------------------------------------------
//  Emphasis
//  ------------------------------------------------------------------------
grammar.define("em-cons",
  [ peg.nat(-1, LETTER), "_", peg.and(LETTER), peg.rule("em-cons-content"), LETTER, "_", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (st1, content, letter, st2, sp2) => {
    content.push(letter);
    return new dom.Emphasis(compact(content));
  }
);
grammar.define("em-cons-content",
  peg.zeroOrMore(
    peg.choice(
      peg.rule("strong-cons"),
      peg.rule("monospace-cons"),
      peg.rule("superscript-cons"),
      [ peg.not(LETTER, "_", peg.not(LETTER)), peg.any() ],
    )
  )
);

//  ------------------------------------------------------------------------
//  Inline macros
//  ------------------------------------------------------------------------
grammar.define("inline-macro",
  [
    peg.nat(-1, LETTER),
    MACRO_NAME, peg.consume(":"), peg.string(peg.anyExcept(SP.union("\n["))),
    peg.consume("["), peg.rule("inline-attribute-list"), peg.consume("]")
  ],
  function(name, target, attributes) {
    return this.root.inlineMacro(name, target, attributes);
  }
);


grammar.define("inline-attribute-list",
  peg.choice(
    [
      peg.rule("positional-attribute"),
      peg.zeroOrMore(peg.consume(","), peg.rule("positional-attribute")),
    ],
    []
  ),
  (...args) => (args)
);

grammar.define("positional-attribute",
  [ peg.oneOrMore(peg.not(","), peg.not("]"), peg.any()) ],
  (...content) => content.join("")
);


//  ========================================================================
//  Utilities
//  ========================================================================

/*
  Takes an array of [Node | Strings] and convert strings into
  a proper Text node object.
*/
function compact(content) {
  const result = [];
  let acc = "";

  function flush() {
    if (acc) {
      result.push(new dom.Text(acc));
      acc = "";
    }
  }

  for(let item of content) {
    if (typeof item === "string") {
      acc += item;
    }
    else {
      flush();
      result.push(item);
    }
  }

  flush();

  return result;
}

//  ========================================================================
//  API
//  ========================================================================

/*
  Parse a string to produce a valid PhrasingContent object
*/
function parseText(str, parent) {
  const parser = grammar.parser("S", parent);

  parser.accept(str);
  parser.run();

  const result = parser.result(); // FIXME Check status (success/failure)
  // parse inline macros
  return result;
}

module.exports = {
  parseText,
};
