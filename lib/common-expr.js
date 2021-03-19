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

// ========================================================================
// Common subexpressions for `tokenizer.js` and `preprocessor.js`.
// ========================================================================

// ------------------------------------------------------------------------
// Charsets
// ------------------------------------------------------------------------
const SP = peg.charset(" \t");
const WC = peg.charset("A-Z", "a-z", "0-9", "_");


// ------------------------------------------------------------------------
// Terminal symbols
// ------------------------------------------------------------------------
const EOL = peg.consume(peg.zeroOrMore(SP), "\n");
const BLANK = peg.consume(peg.oneOrMore(SP));

/*
  Custom attribute names are defined in
  https://docs.asciidoctor.org/asciidoc/latest/attributes/custom-attributes/#user-defined-names
*/
const CUSTOM_ATTR_NAME = peg.join(WC, peg.zeroOrMore(WC.union("-")));

/*
  Attribute names are defined in
  https://docs.asciidoctor.org/asciidoc/latest/attributes/positional-and-named-attributes/#attribute-list-parsing
*/
const ATTR_NAME = peg.join(WC, peg.zeroOrMore(WC.union(".-")));

const MACRO_NAME = CUSTOM_ATTR_NAME;
const ID = CUSTOM_ATTR_NAME;
const ROLE = CUSTOM_ATTR_NAME;

/*
  A string of character up to the given delimiter.  Usually, the delimiter is either
  charset or a litteral.

  Using a backslash remove the special meaning (if any) of the following character
  of the string.
*/
function STRING(delim, minLength) {
  minLength>>>=0;

  const term = peg.choice(
    [ peg.consume("\\"), peg.any() ],
    peg.anyExcept(delim)
  )

  const head = [];
  for(let i = 0; i < minLength; ++i) {
    head.push(term);
  }
  return peg.join(
    ...head,
    peg.zeroOrMore(term)
  );
}

/*
  A string delimited by double quotes. New line and double quotes may be part
  of the string by prefixing them with a backslash.
*/
const QUOTED_STRING = [
  peg.consume("\""),
  STRING(peg.charset("\n\"")),
  peg.consume("\""),
];

module.exports = {
  // charsets
  SP,
  WC,

  // terminal symbols
  ATTR_NAME,
  BLANK,
  CUSTOM_ATTR_NAME,
  EOL,
  ID,
  MACRO_NAME,
  QUOTED_STRING,
  ROLE,
  STRING,
}
