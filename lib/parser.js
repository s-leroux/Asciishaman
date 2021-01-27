const Tk = require("./token");
const tokenizer = require("./tokenizer");

const debug = require("debug")("asciishaman:parser");

const dom = require("./model");

// ========================================================================
// Parser
// ========================================================================
function Parser(readable) {
  const _root = _curr = {
    children: [],
  };
  const _stack = [];
  const _document = new dom.Document();
  let   _node = _document;

  push(stateInit, stateEnd);


  return tokenizer.Tokenizer(readable, callback).then(() => _document);

  function pop() {
    _node = _stack.pop();
    return _stack.pop();
  }

  function push(... states) {
    let i = states.length;
    while(i--)
      _stack.push(states[i], _node);
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
    TextBlock := TEXT TextBlockTail1
  */
  function stateTextBlock(tk, data) { // XXX Rename: Paragraph

    if (tk === Tk.TEXT) {
      _node = _node.makeParagraph();
      _node = _node.makeText();
      _node.concat(data);

      push(stateTextBlockTail1);

      return true;
    }

    return false;
  }

  /*
    TextBlockTail1 := NEW_LINE TextBlockTail2
                     | ø
  */
  function stateTextBlockTail1(tk, data) {
    if (tk == Tk.NEW_LINE) {
      _node.concat(' ');

      push(stateTextBlockTail2);

      return true;
    }

    return false;
  }

  /*
    TextBlockTail2 := TEXT TextBlockTail1
                     | ø
  */
  function stateTextBlockTail2(tk, data) {
    if (tk == Tk.TEXT) {
      _node.concat(data);

      push(stateTextBlockTail1);

      return true;
    }

    return false;
  }

  /*
    BlankLine  := BLANK_LINE
  */
  function stateBlankLine(tk, data) {
    if (tk === Tk.BLANK_LINE) {
      return true;
    }
    else {
      debug("Bad state", tk, data);
    }
  }
}

module.exports = {
  Parser: Parser,
};
