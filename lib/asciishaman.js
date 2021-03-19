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

const fs = require("fs");

const parser = require("../lib/parser");
const { Tokenizer } = require("../lib/tokenizer");
const { Diagnostic } = require("../lib/diagnostic");

/**
  Return a promise whose value when fulfilled will be the DOM of the document
*/
function parseFile(fPath) {
  const diagnostic = new Diagnostic(fPath);
  const input = fs.createReadStream(fPath);
  const tokenizer = Tokenizer(input);

  return parser.Parser(diagnostic, tokenizer);

}

module.exports = {
  parseFile,
};
