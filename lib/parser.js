const Tk = require("./token");
const tokenizer = require("./tokenizer");

const debug = require("debug")("asciishaman:parser");

// ========================================================================
// Parser
// ========================================================================
function Parser(readable) {
  const _root = _curr = {
    children: [],
  };
  const _stack = [];
  push(stateInit, stateEnd);


  return tokenizer.Tokenizer(readable, callback).then(() => true);

  function pop() {
    return _stack.pop();
  }

  function push(... states) {
    states.reverse();
    _stack.push(...states);
  }

  function callback(tk, data) {
    let state;

    debug('callback', tk.description);
    // a state must return true if it has handled the token 
    while((state = pop())) {
      debug('>', state, tk.description);
      if (state(tk, data))
        break;
    }
  }

  // ======================================================================
  // Pushdown automaton
  // ======================================================================

  function stateInit(tk, data) {
    console.log("INIT");
    push(stateBlockFlow);

    return false;
  }

  /*
      BlockFlow := TextBlock BlankLine BlockFlow
                   | ø
  */
  function stateBlockFlow(tk, data) {
    if (tk === Tk.TEXT) {
      /*
        Implied text block. This does not consume the token.
      */
      console.log("FLOW");

      push(stateTextBlock, stateBlankLine, stateBlockFlow);
      return false;
    }
    else {
      return false;
    }
  }

  function stateEnd(tk,data) {
    if (tk !== Tk.END) {
      debug("ERROR: trailing data", tk.description, tk.data);
    }

    /*  
      since `stateEnd` is the last state of the stack,
      we know we won't ever enter in the processing loop
      for this parser.

      So, this state can return either true of false without
      any consequences.
    */
    return true;
  }

  /*
    TextBlock := TextData TextBlockTail
  */
  function stateTextBlock(tk, data) {
    console.log("BLCK");

    if (tk === Tk.TEXT) {
      push(stateTextData, stateTextBlockTail);
      return false;
    }

    return false;
  }

  /*
    TextBlockTail := NewLine TextData TextBlockTail
                     | ø
  */
  function stateTextBlockTail(tk, data) {
    if (tk == Tk.NEW_LINE) {
      push(stateNewLine, stateTextData, stateTextBlockTail);
    }

    return false;
  }

  /*
    TextData  := TEXT
  */
  function stateTextData(tk, data) {
    if (tk === Tk.TEXT) {
      console.log('TEXT', data);
    }
    else {
      debug("Bad state", tk, data);
    }

    return true;
  }

  /*
    NewLine  := NEW_LINE
  */
  function stateNewLine(tk, data) {
    if (tk === Tk.NEW_LINE) {
      console.log('CRLF', data);
    }
    else {
      debug("Bad state", tk, data);
    }

    return true;
  }

  /*
    BlankLine  := BLANK_LINE
  */
  function stateBlankLine(tk, data) {
    if (tk === Tk.BLANK_LINE) {
      console.log('BLNK', data);
    }
    else {
      debug("Bad state", tk, data);
    }

    return true;
  }
}

module.exports = {
  Parser: Parser,
};
