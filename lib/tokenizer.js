/*
    See https://docs.asciidoctor.org/asciidoc/latest/syntax-quick-reference/
    for the AsciiDoc syntax reference.

    Not all AsciiDoc features are supported. Features are implemented on
    a per-need basis.
*/

const Promise = require("bluebird");

const TK_NEW_LINE         = Symbol("newLine");
const TK_BLANK_LINE       = Symbol("blankLine");

const TK_TEXT             = Symbol("text");

const TK_STAR_1           = Symbol("star1");
const TK_STAR_2           = Symbol("star2");

const TK_SECTION_TITLE_1  = Symbol("sectionTitle1");
const TK_SECTION_TITLE_2  = Symbol("sectionTitle2");
const TK_SECTION_TITLE_3  = Symbol("sectionTitle3");

const TK_UNORDERED_LIST_1  = Symbol("unorderedList1");
const TK_UNORDERED_LIST_2  = Symbol("unorderedList2");

const TK_TITLE  = Symbol("title"); // block title (`.my list`)

// ========================================================================
// Utilities
// ========================================================================

const BLANKS = new Set([
  '\u0020', '\u00a0', '\u1680',
  '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006',
  '\u2007', '\u2008', '\u2009', '\u200a',
  '\u202f', '\u205f', '\u3000'
]);

/**
    Return true is `c` is a blank.
    A blank here is an horizontal space (\x20, \t). Vertical spaces (`\n`)
    are not considered as blank.
*/
function isblank(c) {
  return BLANKS.has(c);
}

// ========================================================================
// Tokenizer
// ========================================================================

/**
    Tokenize a input stream by attaching a `data` and `end` handler.
*/
function Tokenizer(readable, callbacks) {
  let _buffer = "";
  let _pos = 0;
  let _start = 0;
  let _state = stateInit;

  return new Promise(function(resolve, reject) {
    readable.on('end', end);
    readable.on('data', data);

    function data(chunk) {
      _buffer += chunk;
      tokenize();
    }

    function end() {
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
    callbacks[tk.description](_buffer.substring(_start, _pos));

    // We start a new token. Reset `_start`:
    _start = _pos;
  }

  // ======================================================================
  // Finite-state machine
  // ======================================================================

  function stateInit(c) {
    if (c === '\n') {
      ++_pos;
      ++_start;
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
      // This case is notably used to collapse `\n` after
      // a `.title` preamble
      _state = stateDocumentFlow;
      _start = ++_pos;
    }
    else if (c === '.') {
      _state = stateTitle;
      _start = ++_pos;
    }
    else if (c === '=') {
      _state = stateSectionTitle1;
      ++_pos;
    }
    else if (c === '*') {
      _state = stateUnorderedList1;
      ++_pos;
    }
    else {
      // XXX Should be a paragraph block
      _state = stateText;
    }
  }

  function stateNewLine(c) {
    if (c === '\n') {
      _state = stateBlankLine;
      ++_pos;
    }
    else {
      emit(TK_NEW_LINE);
      _state = stateDocumentFlow;
    }
  }
  function stateBlankLine(c) {
    if (c === '\n') {
      _state = stateBlankLine;
      ++_pos;
    }
    else {
      emit(TK_BLANK_LINE);
      _state = stateDocumentFlow;
    }
  }

  function stateUnorderedList1(c) {
    if (isblank(c)) {
      emit(TK_UNORDERED_LIST_1);
      _state = stateListSeparator;
    }
    else if (c == '*') {
      _state = stateUnorderedList2;
      ++_pos;
    }
    else {
      // No list token separator. Emit the TK_STAR token.
      emit(TK_STAR_1);
      _state = stateText;
    }
  }

  function stateUnorderedList2(c) {
    if (isblank(c)) {
      emit(TK_UNORDERED_LIST_2);
      _state = stateListSeparator;
    }
    else if (c == '*') {
      // _state = stateUnorderedList3;
      // ++_pos;
    }
    else {
      // No list token separator. Emit the TK_STAR token.
      emit(TK_STAR_2);
      _state = stateText;
    }
  }

  function stateListSeparator(c) {
    if (isblank(c)) {
      ++_pos;
    }
    else {
      _start = _pos;
      _state = stateDocumentFlow;
    }
  }

  function stateSectionTitle1(c) {
    if (c === '=') {
      _state = stateSectionTitle2;
      ++_pos;
    }
    else if (isblank(c)) {
      emit(TK_SECTION_TITLE_1);
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
      ++_pos;
    }
    else if (isblank(c)) {
      emit(TK_SECTION_TITLE_2);
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
      ++_pos;
    }
    else if (isblank(c)) {
      emit(TK_SECTION_TITLE_3);
      _state = stateSectionTitleSeparator;
    }
    else {
      // This was not a section title token
      _state = stateText;
    }
  }

  function stateSectionTitleSeparator(c) {
    if (isblank(c)) {
      ++_pos;
    }
    else {
      _start = _pos;
      _state = stateDocumentFlow;
    }
  }

  function stateTitle(c) {
    if (c === '\n') {
      emit(TK_TITLE);
      _state = stateDocumentFlow;
      _start = ++_pos;
    }
    else {
      ++_pos;
    }
  }

  function stateStar1(c) {
    if (c === '*') {
      _state = stateStar2;
      ++_pos;
    }
    else {
      emit(TK_STAR_1);
      _state = stateText;
      ++_pos;
    }
  }

  function stateStar2(c) {
    emit(TK_STAR_2);
    _state = stateText;
    ++_pos;
  }

  function stateText(c) {
    if (c === '\n') {
      emit(TK_TEXT);
      _state = stateNewLine;
      ++_pos;
    }
    else if (c === '*') {
      emit(TK_TEXT);
      _state = stateStar1;
      ++_pos;
    }
    else {
      ++_pos;
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
