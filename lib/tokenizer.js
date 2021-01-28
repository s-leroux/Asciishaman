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
    as token delimitors.
*/

// ========================================================================
// Tokenizer
// ========================================================================

/**
    Tokenize a input stream by attaching a `data` and `end` handler.
*/
function Tokenizer(readable, diagnostic, callback) {
  let _buffer = "";
  let _pos = 0;   // where are we in the buffer
  let _start = 0; // where starts the current token
  let _end = 0;   // where ends the current token
                  // most of the time _end == _pos.
                  // but there is some cases like
                  // trailing spaces where _end < _pos

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
      _start = _end = _pos;
      emit(Tk.END);
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
    callback(tk, _buffer.substring(_start, _end));

    // We start a new token. Reset `_start` and `_end`:
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
      _state = stateDocumentFlow;
    }
  }

  /**
      The document flow.
  */
  function stateDocumentFlow(c) {
    if (c === '\n') {
      ++_lineNo;
      // This case is notably used to collapse `\n` after
      // a `.title` preamble
      _state = stateDocumentFlow;
      _start = _end = ++_pos;
    }
    else if (c === '.') {
      _state = stateTitle;
      _start = _end = ++_pos;
    }
    else if (c === '=') {
      _state = stateSectionTitle1;
      _end = ++_pos;
    }
    else if (c === '*') {
      _state = stateUnorderedList1;
      _end = ++_pos;
    }
    else {
      // XXX Should be a paragraph block
      _state = stateText;
    }
  }

  function stateNewLine(c) {
    if (c === '\n') {
      ++_lineNo;
      _state = stateBlankLine;
      _end = ++_pos;
    }
    else {
      emit(Tk.NEW_LINE);
      _state = stateDocumentFlow;
    }
  }
  function stateBlankLine(c) {
    if (c === '\n') {
      ++_lineNo;
      _state = stateBlankLine;
      _end = ++_pos;
    }
    else {
      emit(Tk.BLANK_LINE);
      _state = stateDocumentFlow;
    }
  }

  function stateUnorderedList1(c) {
    if ((c === ' ') || (c === '\t')) {
      emit(Tk.UNORDERED_LIST_1);
      _state = stateListSeparator;
    }
    else if (c == '*') {
      _state = stateUnorderedList2;
      _end = ++_pos;
    }
    else {
      // No list token separator. Emit the Tk.STAR token.
      emit(Tk.STAR_1);
      _state = stateText;
    }
  }

  function stateUnorderedList2(c) {
    if ((c === ' ') || (c === '\t')) {
      emit(Tk.UNORDERED_LIST_2);
      _state = stateListSeparator;
    }
    else if (c == '*') {
      // _state = stateUnorderedList3;
      // ++_pos;
    }
    else {
      // No list token separator. Emit the Tk.STAR token.
      emit(Tk.STAR_2);
      _state = stateText;
    }
  }

  function stateListSeparator(c) {
    if ((c === ' ') || (c === '\t')) {
      _end = ++_pos;
    }
    else {
      _start = _end = _pos;
      _state = stateDocumentFlow;
    }
  }

  function stateSectionTitle1(c) {
    if (c === '=') {
      _state = stateSectionTitle2;
      _end = ++_pos;
    }
    else if ((c === ' ') || (c === '\t')) {
      emit(Tk.SECTION_TITLE_1);
      _state = stateSectionTitleSeparator;
    }
    else {
      // This was not a section title token
      _state = stateText;
    }
  }

  function stateSectionTitle2(c) {
    if (c === '=') {
      _state = stateSectionTitle3;
      _end = ++_pos;
    }
    else if ((c === ' ') || (c === '\t')) {
      emit(Tk.SECTION_TITLE_2);
      _state = stateSectionTitleSeparator;
    }
    else {
      // This was not a section title token
      _state = stateText;
    }
  }

  function stateSectionTitle3(c) {
    if (c === '=') {
      //_state = stateSectionTitle3;
      _end = ++_pos;
    }
    else if ((c === ' ') || (c === '\t')) {
      emit(Tk.SECTION_TITLE_3);
      _state = stateSectionTitleSeparator;
    }
    else {
      // This was not a section title token
      _state = stateText;
    }
  }

  function stateSectionTitleSeparator(c) {
    if ((c === ' ') || (c === '\t')) {
      _end = ++_pos;
    }
    else {
      _start = _end = _pos;
      _state = stateDocumentFlow;
    }
  }

  function stateTitle(c) {
    if (c === '\n') {
      ++_lineNo;
      emit(Tk.TITLE);
      _state = stateDocumentFlow;
      _start = _end = ++_pos;
    }
    else {
      _end = ++_pos;
    }
  }

  function stateStar1(c) {
    if (c === '*') {
      _state = stateStar2;
      _end = ++_pos;
    }
    else {
      emit(Tk.STAR_1);
      _state = stateText;
      _end = ++_pos;
    }
  }

  function stateStar2(c) {
    emit(Tk.STAR_2);
    _state = stateText;
    _end = ++_pos;
  }

  /**
    Textual content.

    Per-normalization, trailing spaces are removed.
  */
  function stateText(c) {
    if ((c === ' ') || (c === '\t') || (c === '\n')) {
      _state = statePossibleEndOfLine;
    }
    else if (c === '*') {
      emit(Tk.TEXT);
      _state = stateStar1;
      _end = ++_pos;
    }
    else {
      _end = ++_pos;
    }
  }

  function statePossibleEndOfLine(c) {
    if ((c === ' ') || (c === '\t')) {
      ++_pos; // do NOT change _end here
    } // XXX should handle stars in ` *...* ` here too
    else if (c === '\n') {
      emit(Tk.TEXT);
      ++_lineNo;
      _state = stateNewLine;
      _end = ++_pos;
    }
    else {
      _state = stateText;
      _end = _pos;
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
