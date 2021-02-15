"use strict"

/*
    See https://docs.asciidoctor.org/asciidoc/latest/syntax-quick-reference/
    for the AsciiDoc syntax reference.

    Not all AsciiDoc features are supported. Features are implemented on
    a per-need basis.
*/

const Promise = require("bluebird");
const Tk = require("./token")

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

/**
    Tokenize a input stream by attaching a `data` and `end` handler to
    a Node.js stream.
*/
function Tokenizer(readable) {
  return ((diagnostic, callback) => _Tokenizer(readable, diagnostic, callback));
}

function _Tokenizer(readable, diagnostic, callback) {
  let _buffer = "";
  let _pos = 0;   // where are we in the buffer
  let _start = 0; // where starts the current token
  let _end = 0;

  let _state = stateInit;
  let _lineNo = 1;

  return new Promise(function(resolve, reject) {
    readable.on('end', end);
    readable.on('data', data);

    function data(chunk) {
      _buffer += chunk;
      tokenize();
    }

    function end() {
      if (_buffer.slice(-1) !== '\n')
        data("\n"); // force a last end-of-line

      _start = _end = _pos;
      emitWithoutData(Tk.END);
      resolve(); // XXX Always ?
    }
  });

  function tokenize() {
    let c;

    while((c=_buffer[_pos]) !== undefined) {
      // console.log(c, _pos, _state);
      _state(c);
    }
  }

  // ======================================================================
  // Emitter
  // ======================================================================

  function emit(tk) {
    diagnostic.at(_lineNo);
    callback({tag: tk, data: _buffer.substring(_start, _end)});

    // We start a new token. Reset `_start`:
    _start = _end = _pos;
  }

  function emitWithoutData(tk) {
    diagnostic.at(_lineNo);
    callback({tag: tk});

    // We start a new token. Reset `_start`:
    _start = _end = _pos;
  }



  // ======================================================================
  // Finite-state machine
  // ======================================================================

  function stateInit(c) {
    if (c === '\n') {
      ++_lineNo;
      _start = _end = ++_pos;
    }
    else {
      _state = stateStartOfLine;
    }
  }

  /*
      We are at the start of a line.

      - The line may be empty
      - The line may contains only blanks
      - The line may start by a token
      - The line may start by non-token characters
  */
  function stateStartOfLine(c) {
    if ((c === ' ') || (c === '\t')) {
      _state = stateLeadingSpaces;
    }
    else if (c === '\n') {
      ++_pos;
      emitWithoutData(Tk.NEW_LINE);
      _state = stateStartOfLine; // XXX Collapse multiple BLANK_LINES ?
      ++_lineNo;
    }
    else {
      _state = stateText;
    }
  }

  /*
      We already have consumed 1 or more space at the start
      of a line.

      - The line may be blank
      - The line may contain text
  */
  function stateLeadingSpaces(c) {
    if ((c === ' ') || (c === '\t')) {
      _end = ++_pos;
      _state = stateLeadingSpaces;
    }
    else if ((c === '\n')) {
      ++_pos;
      emitWithoutData(Tk.NEW_LINE);
      _state = stateStartOfLine;
      ++_lineNo;
    }
    else {
      emit(Tk.WHITE_SPACE);
      _state = stateText;
    }
  }

  /*
      We have found one or several non-blank characters on the line
  */
  function stateText(c) {
    if ((c === ' ') || (c === '\t')) {
      _state = statePossibleTrailingSpace;
    }
    else if ((c === '\n')) {
      if (_end > _start)
        emit(Tk.TEXT);
      ++_pos;
      emitWithoutData(Tk.NEW_LINE);
      _state = stateStartOfLine;
    }
    else {
      _end = ++_pos;
    }
  }

  /*
    We have a blank after some text.

    It may be some trailing whitespace to ignore. Or a
    space embedded in a the text.
  */
  function statePossibleTrailingSpace(c) {
    if ((c === ' ') || (c === '\t')) {
      ++_pos;
    }
    else if ((c === '\n')) {
      // ignore the trailing spaces and start a new line
      emit(Tk.TEXT);
      ++_pos;
      emitWithoutData(Tk.NEW_LINE);
      _state = stateStartOfLine;
    }
    else {
      _state = stateText; // resume text line processing
    }
  }
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
}
