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

/*
    See https://docs.asciidoctor.org/asciidoc/latest/syntax-quick-reference/
    for the AsciiDoc syntax reference.

    Not all AsciiDoc features are supported. Features are implemented on
    a per-need basis.
*/

const Promise = require("bluebird");
const Tk = require("./token");
const Preprocessor = require("./preprocessor");
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

/*
  Warning:
  ========
  The tokenizer uses a PEG. But due to the way later procesing stages are
  implemented, it _must_ not backtrack once a token has been emitted.

  As far as I can tell, this is an implementation of an LL(*) parser since,
  thanks to PEG, the tokenizer can look up to an arbitrary number of tokens in
  advance. But once a token was emitted, it is used by the parser to build a
  leftmost derivation of the sentence.
*/

const grammar = new peg.Grammar();

const { SP, EOL, BLANK } = require("./common-expr.js");

const WORD = peg.string(peg.anyExcept(SP.union("\n")));
const EMAIL = [ peg.consume("<"), peg.string(peg.anyExcept(SP.union("\n>"))), peg.consume(">") ];
const TEXT = grammar.define("text",
  peg.zeroOrMore( peg.zeroOrMore(SP), WORD ),
  (...content) => content.join("")
);

// ------------------------------------------------------------------------
// Document
//
// Parser's starting point.
// ------------------------------------------------------------------------
grammar.define("document",
  [
    peg.zeroOrOne(peg.rule("document-header")),
    peg.zeroOrMore(EOL),
    peg.rule("document-body")
  ],
  function() {
    this.emit(Tk.END);
  }
);

// ------------------------------------------------------------------------
// Document header
// ------------------------------------------------------------------------
grammar.define("document-header",
  [
    peg.rule("document-title"),
    peg.zeroOrOne(peg.rule("author-line")),
    peg.capture(
      peg.zeroOrMore(
        peg.choice(
          peg.consume(peg.rule("comment")),
          peg.rule("document-attribute")
        )
      )
    ),
    EOL,
  ],
  function(title, authors, attrs) {
    this.emit(Tk.HEADER, {
      title: title,
      authors: authors,
      attributes: new Map(attrs),
    });
  }
);

grammar.define("document-title",
  [ peg.consume("=", peg.oneOrMore(SP)), peg.rule("text"), EOL ],
  function(title) {
    return title;
  }
);

grammar.define("author-line",
  [
    peg.not(":"), peg.not("//"), // disambiguate attributes and comments
    peg.rule("author"), peg.zeroOrMore(peg.consume(";", BLANK), peg.rule("author")), EOL
  ],
  function(...authors) {
    return authors;
  }
);

grammar.define("author",
  [
    WORD,
    BLANK,
    peg.zeroOrOne(
      peg.string(peg.anyExcept(SP.union("\n;"))), BLANK, peg.not("<")
    ),
    peg.string(peg.anyExcept(SP.union("\n;"))),
    peg.zeroOrOne(BLANK, EMAIL)
  ],
  (firstname, middlename, lastname, email) => ({
    firstname, middlename, lastname, email
  })
);

grammar.define("document-attribute",
  [
    peg.consume(":"), peg.string(peg.anyExcept(SP.union("\n:"))), peg.consume(":"),
    peg.optional(
      [ peg.consume(BLANK), TEXT ],
      ""
    ),
    EOL
  ]
);

grammar.define("comment",
  [peg.consume("//"), TEXT, EOL]
);

// ------------------------------------------------------------------------
// Document body
// ------------------------------------------------------------------------
grammar.define("document-body",
  peg.zeroOrMore(
    peg.choice(
      peg.rule("blank-line"),
      peg.rule("block-delim"),
      peg.rule("section"),
      peg.rule("list-item"),
      peg.rule("paragraph"),
      peg.rule("plain-text")
    )
  ),
  () => {}
);

grammar.define("blank-line",
  peg.oneOrMore(
    peg.capture(EOL) // XXX What is the purpose of counting lines?
  ),
  function(...lines) {
    this.emit(Tk.BLANK_LINE, lines.length);
  }
);

// ------------------------------------------------------------------------
// Paragraph (with explicit metadata)
//
// Notice that most paragraphs in a document are implicitly defined
// when stray text is encountered out of any block. This case is
// handled by the stateful parser.
// ------------------------------------------------------------------------
grammar.define("paragraph",
  [ peg.rule("block-metadata"), TEXT, EOL ],
  function(metadata, text) {
    this.emit(Tk.PARAGRAPH, metadata);
    this.emit(Tk.PLAIN_TEXT, text);
  }
);

// ------------------------------------------------------------------------
// Block delimiter
//
// The exact nature of the delimiter (opening or closing) will be
// determined by the stateful parser. In all cases, we accept
// optional metadata.
//
// See https://www.eclipse.org/lists/asciidoc-lang-dev/msg00143.html
// ------------------------------------------------------------------------
grammar.define("block-delim",
  [
    peg.optional(peg.rule("block-metadata"), []),
    peg.choice(
      peg.rule("example-block-delim"),
    )
  ],
  function(metadata, delim) {
    this.emit(Tk.BLOCK_DELIM, delim.length, delim[0], metadata);
  }
);

grammar.define("block-metadata",
  peg.oneOrMore(
    peg.choice(
      [ peg.consume("["), peg.rule("block-attribute-list"), peg.consume("]"), EOL ]
    )
  ),
  (metadata) => (metadata)
);

grammar.define("block-attribute-list",
  [
    peg.rule("positional-attribute"),
    peg.zeroOrMore(peg.consume(","), peg.rule("positional-attribute"))
  ],
  (...args) => (args)
);

grammar.define("positional-attribute",
  [ peg.oneOrMore(peg.not(","), peg.not("]"), peg.any()) ],
  (...content) => content.join("")
);

grammar.define("example-block-delim",
  [ peg.capture(peg.oneOrMore("=")), EOL ],
  function(delim) {
    return delim;
  }
);


grammar.define("section",
  [
    peg.rule("section-mark"),
    peg.consume(peg.oneOrMore(SP)),
    peg.rule("text"),
    EOL
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
    EOL
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
  [ peg.rule("text"), EOL ],
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
  const parser = grammar.parser("document", { emit: callback });
  const preprocessor = new Preprocessor((line) => parser.accept(line));

  return new Promise(function(resolve, reject) {
    readable.on("end", end);
    readable.on("data", data);

    function data(chunk) {
      preprocessor.accept(chunk);
    }

    function end() {
      preprocessor.flush();
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
