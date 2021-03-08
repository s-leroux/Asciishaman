"use strict";

/*
    See https://docs.asciidoctor.org/asciidoc/latest/syntax-quick-reference/
    for the AsciiDoc syntax reference.

    Not all AsciiDoc features are supported. Features are implemented on
    a per-need basis.
*/

const Promise = require("bluebird");
const Tk = require("./token");
const peg = require("pegparse");

// ========================================================================
// Utilities
// ========================================================================

/*
    According to the specs, AsciiDoc markup is made only of characters in
    the 32-127 range. Only plain spaces (\x20) and tabs (\x09) are considered
    as a token separator.
*/

// ========================================================================
// Tokenizer
// ========================================================================
const grammar = new peg.Grammar();
const SP = peg.charset(" \t");

grammar.define("asciidoc",
  [
    peg.zeroOrMore(peg.zeroOrMore(SP), "\n"),
    peg.zeroOrMore(peg.rule("line"))
  ],
  function() {
    this.emit(Tk.END);
  }
);

grammar.define("line",
  peg.choice(
    peg.rule("blank-line"),
    peg.rule("section"),
    peg.rule("list-item"),
    peg.rule("plain-text")
  ),
  () => {}
);

grammar.define("text",
  peg.zeroOrMore( peg.zeroOrMore(SP), peg.oneOrMore(peg.not(SP), peg.not("\n"), peg.any()) ),
  (...content) => content.join("")
);

grammar.define("blank-line",
  peg.oneOrMore(
    peg.capture(peg.zeroOrMore(SP), "\n")
  ),
  function(...lines) {
    this.emit(Tk.BLANK_LINE, lines.length);
  }
);

grammar.define("section",
  [
    peg.rule("section-mark"),
    peg.consume(peg.oneOrMore(SP)),
    peg.rule("text"),
    peg.consume(peg.zeroOrMore(SP), "\n")
  ],
  function(level, text) {
    this.emit(Tk.SECTION, level, text);
  }
);

grammar.define("section-mark",
  peg.oneOrMore("="),
  (...marks) => marks.length
);

grammar.define("list-item",
  [
    peg.rule("list-item-mark"),
    peg.consume(peg.oneOrMore(SP)),
    peg.rule("text"),
    peg.consume(peg.zeroOrMore(SP), "\n")
  ],
  function(level, text) {
    this.emit(Tk.LIST_ITEM, level, text);
  }
);

grammar.define("list-item-mark",
  peg.oneOrMore("*"),
  (...marks) => marks.length
);

grammar.define("plain-text",
  [
    peg.rule("text"),
    peg.consume(peg.zeroOrMore(SP), "\n")
  ],
  function(text) {
    this.emit(Tk.PLAIN_TEXT, text);
  }
);

/**
    Tokenize a input stream by attaching a `data` and `end` handler to
    a Node.js stream.
*/
function Tokenizer(readable) {
  return ((diagnostic, callback) => _Tokenizer(readable, diagnostic, callback));
}

function _Tokenizer(readable, diagnostic, callback) {
  const parser = grammar.parser("asciidoc", { emit: callback });

  return new Promise(function(resolve, reject) {
    readable.on("end", end);
    readable.on("data", data);

    function data(chunk) {
      parser.accept(chunk);
    }

    function end() {
      parser.run();
      if (parser.status === "success") {
        resolve();
      }
      else {
        reject("Can't parse");
      }
    }
  });

}


// function main() {
//   fs = require('fs');
//   file = fs.createReadStream('/etc/passwd', { highWaterMark: 64, encoding: 'utf8' });
//
//   tk = Tokenizer(file);
// }
//
// main();


module.exports = {
  Tokenizer: Tokenizer,
};
