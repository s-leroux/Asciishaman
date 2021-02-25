"use strict";

const debug = require("debug")("asciishaman:inline-parser");
const dom = require("./model");

const gMacroMap = {
  ['as:strong']: (text) => new dom.Strong(text),
  ['as:em']: (text) => new dom.Emphasis(text),
  ['as:span']: (text) => new dom.Span(text),
};

function parseMacro(str) {
//  str = `\x1Bas:plaintext[${str}\x1B]`;

  const parts = str.split(MACRO_RE);
  const stack = [];
  let top = gMacroMap['as:span'];
  let n = 0;

  let i = 0;

  while(i < parts.length) {
    const textspan = parts[i++];
    const macroname = parts[i++];

    // XXX Should we avoid pushing "empty" texts here?
    stack.push(new dom.Text(textspan));
    n+=1;

    if (macroname) {
      const fct = gMacroMap[macroname]; // FIXME Possible JS injection?

      stack.push(top);
      stack.push(n);
      n=0;

      if (fct) {
        top = fct;
      }
    }
    else {
      const item = top.call(undefined, stack.splice(-n));
      n = stack.pop();
      top = stack.pop();

      stack.push(item);
      n+=1;
    }
  }

  return stack.pop();
}

const peg = require("pegparse/lib/grammar");
const grammar = new peg.Grammar();

const SP = peg.charset(" \t");
const LETTER = peg.charset("a-z", "A-Z");

grammar.define("S",
  peg.rule("inline"),
  (content) => content
);

grammar.define("inline",
  peg.oneOrMore(
    peg.choice(
      peg.rule("em-cons"),
      peg.rule("strong-cons"),
      peg.any(),
    )
  ),
  (...content) => new dom.Span(compact(content))
);

/*
  Per https://docs.asciidoctor.org/asciidoc/latest/text/italic/#mixing-italic-with-other-formatting
  """
  Monospace syntax (`) must be the outermost formatting pair. 
  Bold syntax (*) must be outside the italics formatting pair. 
  Italic syntax is always the innermost formatting pair.
  """
*/
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
      [ peg.not(LETTER, "*", peg.not(LETTER)), peg.any() ],
    )
  )
);

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
      [ peg.not(LETTER, "_", peg.not(LETTER)), peg.any() ],
    )
  )
);

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

module.exports = {
  parseText,
}
