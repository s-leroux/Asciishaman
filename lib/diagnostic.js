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
  Diagnotic
*/
class Diagnostic {
  constructor(fName="") {
    this._fName = fName;
    this._errors = [];
  }

  at(lineNo) {
    this._lineNo = lineNo;
  }

  error(message) {
    this._errors.push({
      fName: this._fName,
      lineNo: this._lineNo,
      message: message,
    });
  }

  success() {
    return this._errors.length == 0;
  }
}

module.exports = {
  Diagnostic: Diagnostic,
};
