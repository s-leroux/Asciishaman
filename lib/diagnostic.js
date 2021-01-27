/*
  Diagnotic
*/
class Diagnostic {
  constructor(fName="") {
    this._fName = fName;
    this._errors = [];
  };

  at(lineNo) {
    this._lineNo = lineNo;
  };

  error(message) {
    this._errors.push({
      fName: this._fName,
      lineNo: this._lineNo,
      message: message,
    });
  };

  success() {
    return this._errors.length == 0;
  }
};

module.exports = {
  Diagnostic: Diagnostic,
}
