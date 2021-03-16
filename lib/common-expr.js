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
  Attribute names are defined in
  https://docs.asciidoctor.org/asciidoc/latest/attributes/custom-attributes/#user-defined-names
*/
const ATTR_NAME = peg.join(WC, peg.zeroOrMore(WC.union("-")));

const MACRO_NAME = ATTR_NAME;

module.exports = {
  // charsets
  SP,
  WC,

  // terminal symbols
  ATTR_NAME,
  BLANK,
  EOL,
  MACRO_NAME,
}
