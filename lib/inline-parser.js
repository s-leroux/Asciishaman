"use strict";

const debug = require("debug")("asciishaman:inline-parser");
const dom = require("./model");

const CONSTRAINED_STRONG_RE = /(?<=[ \t]|^)[*](.*)[*](?=[ \t]|$)/;
const CONSTRAINED_EM_RE = /(?<=[ \t]|^)[_](.*)[_](?=[ \t]|$)/;

const MACRO_RE = /\x1B(\w+:\w+)\[|\x1B\]/;

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

/*
  Parse a string to produce a valid PhrasingContent object
*/
function parseText(str) {
  // replace short style markers by macros
  str = str.replace(CONSTRAINED_STRONG_RE, "\x1Bas:strong[$1\x1B]");
  str = str.replace(CONSTRAINED_EM_RE, "\x1Bas:em[$1\x1B]");

  // parse inline macros
  return parseMacro(str);
}

module.exports = {
  parseText,
}
