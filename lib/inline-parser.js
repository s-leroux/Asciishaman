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

const {
  ATTR_NAME,
  BLANK,
  ID,
  MACRO_NAME,
  QUOTED_STRING,
  ROLE,
  SP, 
  STRING,
} = require('./common-expr');

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
  (...content) => new dom.Span({}, compact(content))
);

//  ------------------------------------------------------------------------
//  Superscript
//  ------------------------------------------------------------------------
grammar.define("superscript-cons",
  [ peg.nat(-1, LETTER), peg.rule("shorthand-attributes"), "^", peg.and(LETTER), peg.rule("superscript-cons-content"), LETTER, "^", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (attr, st1, content, letter, st2) => {
    content.push(letter);
    console.log("super");
    return new dom.Superscript(attr, compact(content));
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
  [ peg.nat(-1, LETTER), peg.rule("shorthand-attributes"), "`", peg.and(LETTER), peg.rule("monospace-cons-content"), LETTER, "`", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (attr, st1, content, letter, st2) => {
    content.push(letter);
    return new dom.Monospace(attr, compact(content));
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
  [ peg.rule("shorthand-attributes"), "**", peg.rule("strong-uncons-content"), "**" ],
  // eslint-disable-next-line no-unused-vars
  (attr, st1, content, st2) => {
    return new dom.Strong(attr, compact(content));
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
  [ peg.nat(-1, LETTER), peg.rule("shorthand-attributes"), "*", peg.and(LETTER), peg.rule("strong-cons-content"), LETTER, "*", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (attr, st1, content, letter, st2) => {
    content.push(letter);
    return new dom.Strong(attr, compact(content));
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
  [ peg.nat(-1, LETTER), peg.rule("shorthand-attributes"), "_", peg.and(LETTER), peg.rule("em-cons-content"), LETTER, "_", peg.not(LETTER) ],
  // eslint-disable-next-line no-unused-vars
  (attr, st1, content, letter, st2, sp2) => {
    content.push(letter);
    return new dom.Emphasis(attr, compact(content));
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
//  Inline attributes
//  ------------------------------------------------------------------------
grammar.define("shorthand-attributes", peg.optional(
    [ peg.consume('[') , peg.rule("shorthand-attribute-list"), peg.consume(']') ],
    new Map()
  ),
  (attr) => attr
);

grammar.define("shorthand-attribute-list", [
    peg.optional( [ peg.consume("#"), ID ] , undefined),
    peg.zeroOrMore(
      peg.consume("."), ROLE
    )
  ],
  (id, ...roles) => new Map([["id", id], ["roles", roles]])
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
      peg.rule("positional-or-named-attribute"),
      peg.zeroOrMore(peg.consume(","), peg.rule("positional-or-named-attribute")),
    ],
    []
  ),
);

grammar.define("positional-or-named-attribute",
  peg.choice(
    peg.rule("named-attribute"),
    peg.rule("positional-attribute")
  ),
  (attr) => attr,
);

/*
  Named attributes are defined in
  https://docs.asciidoctor.org/asciidoc/latest/attributes/positional-and-named-attributes/#attribute-list-parsing
*/
const ATTR_VALUE = peg.join(
  peg.choice(
    QUOTED_STRING,
    STRING(peg.charset("\n,]"), 1),
  )
);

grammar.define("named-attribute",
  [ ATTR_NAME, peg.consume(peg.zeroOrOne(BLANK), "=", peg.zeroOrOne(BLANK)), ATTR_VALUE ]
);

grammar.define("positional-attribute",
  ATTR_VALUE,
  (value) => [undefined, value],
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
