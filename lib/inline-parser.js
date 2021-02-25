"use strict";

const debug = require("debug")("asciishaman:inline-parser");
const dom = require("./model");
const peg = require("pegparse/lib/grammar");
const grammar = new peg.Grammar();

//  ========================================================================
//  Grammar
//  ========================================================================

//  ------------------------------------------------------------------------
//  Terminal symbols
//  ------------------------------------------------------------------------
const SP = peg.charset(" \t");
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
      peg.rule("strong-cons"),
      peg.rule("monospace-cons"),
      peg.rule("superscript-cons"),
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
grammar.define("strong-cons",
  [ peg.nat(-1, LETTER), "*", peg.and(LETTER), peg.rule("strong-cons-content"), LETTER, "*", peg.not(LETTER) ],
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
  (st1, content, letter, st2, sp2) => {
    debugger;
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
function parseText(str) {
  const parser = grammar.parser("S");

  parser.accept(str);
  parser.run();

  const result = parser.result(); // FIXME Check status (success/failure)
  // parse inline macros
  return result;
}

module.exports = {
  parseText,
}
