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

function mapAttr(attributes, kwlist) {
  attributes = attributes.slice(0, kwlist.length); // discard extra attributes
  let result = {};

  attributes.forEach((item, index) => {
    let kw = item[0];
    if (kw === undefined)
      kw = kwlist[index];

    result[kw] = item[1];
  });

  return result;
}

function defaultHandler(name, target, attributes) {
  return new dom.Monospace({},[
    new dom.Text(`${name}:${target}[]`)
  ]);
}

function hrefHandler(name, target, attributes) {
  const href = `${name}:${target}`;
  attributes = mapAttr(attributes, ['text']);

  return new dom.Hyperlink({ href }, [
    new dom.Text(attributes.text ?? href)
  ]); 
}

module.exports = {
  defaultHandler,
  hrefHandler,
}
