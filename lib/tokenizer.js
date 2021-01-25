/*
    See https://docs.asciidoctor.org/asciidoc/latest/syntax-quick-reference/
    for the AsciiDoc syntax reference.

    Not all AsciiDoc features are supported. Features are implemented on
    a per-need basis.
*/

const Promise = require("bluebird");

const TK_END_OF_LINE      = Symbol("endOfLine");

const TK_TEXT             = Symbol("text");

const TK_SECTION_TITLE_1  = Symbol("sectionTitle1");
const TK_SECTION_TITLE_2  = Symbol("sectionTitle2");
const TK_SECTION_TITLE_3  = Symbol("sectionTitle3");

const TK_UNORDERED_LIST_1  = Symbol("unorderedList1");

const TK_TITLE  = Symbol("title"); // block title (`.my list`)

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
      // nothing
    }
    else {
      _state = stateDocumentFlow;
    }
  }

  /**
      In the document flow. Section titles and block elements
      live here.
  */ 
  function stateDocumentFlow(c) {
    if (c === '=') {
      _state = stateSectionTitle1;
      ++_pos;
    }
    else if (c === '\n') {
      _state = stateEndOfLine;
    }
    else if (c === '*') {
      _state = stateUnorderedList1;
      ++_pos;
    }
    else if (c === '.') {
      _state = stateTitle;
      ++_pos;
    }
    else {
      _state = stateText;
    }
  }

  function stateUnorderedList1(c) {
    emit(TK_UNORDERED_LIST_1);
    _state = stateDocumentFlow;
  }

  function stateSectionTitle1(c) {
    if (c === '=') {
      _state = stateSectionTitle2;
      ++_pos;
    }
    else {
      emit(TK_SECTION_TITLE_1);
      _state = stateDocumentFlow;
    }
  }

  function stateSectionTitle2(c) {
    if (c === '=') {
      _state = stateSectionTitle3;
      ++_pos;
    }
    else {
      emit(TK_SECTION_TITLE_2);
      _state = stateDocumentFlow;
    }
  }

  function stateSectionTitle3(c) {
    if (c === '=') {
      //_state = stateSectionTitle3;
      ++_pos;
    }
    else {
      emit(TK_SECTION_TITLE_3);
      _state = stateDocumentFlow;
    }
  }

  function stateTitle(c) {
    if (c !== '\n' && c) {
      ++_pos;
      return;
    }

    emit(TK_TITLE);
    _state = stateEndOfLine;
  }

  function stateText(c) {
    if (c !== '\n' && c) {
      ++_pos;
      return;
    }

    emit(TK_TEXT);
    _state = stateEndOfLine;
  }

  function stateEndOfLine(c) {
    ++_pos;
    emit(TK_END_OF_LINE);
    _state = stateDocumentFlow;
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
