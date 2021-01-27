const Tk = require("./token");
const tokenizer = require("./tokenizer");

const debug = require("debug")("asciishaman:parser");

const dom = require("./model");

// ========================================================================
// Parser
// ========================================================================
function Parser(readable, diagnostic) {
  const _root = _curr = {
    children: [],
  };
  const _stack = [];
  const _document = new dom.Document();
  let   _node = _document;

  push(stateInit, stateEnd);


  return tokenizer.Tokenizer(readable, diagnostic, parse).then(() => _document);

  function pop() {
    _node = _stack.pop();
    return _stack.pop();
  }

  function push(... states) {
    let i = states.length;
    while(i--)
      _stack.push(states[i], _node);
  }

  function error(message = "Syntax error") {
    diagnostic.error(message);

    // unwind the stack until we find a recovery state
    parse(Tk.ERROR, "");

    return true;
  }

  function parse(tk, data) {
    let state;

    while((state = pop())) {
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
      BlockFlow := TextBlock BlockFlowTail
                   | ERROR
                   | ø
  */
  function stateBlockFlow(tk, data) {
    if (tk === Tk.TEXT) {
      /*
        Implied text block. This does not consume the token.
      */

      push(stateTextBlock, stateBlockFlowTail);
      return false;
    }
    else if (tk === Tk.ERROR) {
      return true;
    }
    else {
      return false;
    }
  }

  /*
      BlockFlowTail := BLANK_LINE BlockFlow
                   | ERROR
                   | ø
  */
  function stateBlockFlowTail(tk, data) {
    if (tk === Tk.BLANK_LINE) {
      push(stateBlockFlow);
      return true;
    }
    else if (tk === Tk.ERROR) {
      return true;
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
    else {
      return error(`TEXT expected but found ${tk.description}`);
    }
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
      return error(`BLANK_LINE expected but found ${tk.description}`);
    }
  }
}

module.exports = {
  Parser: Parser,
};
