const Tk = require("./token");

const debug = require("debug")("asciishaman:parser");

const dom = require("./model");

// ========================================================================
// Parser
// ========================================================================
function Parser(diagnostic, tokenize) {
  const _root = _curr = new dom.Document();

  const _stack = [];
  push(stateInit, stateEnd);


  return Promise.resolve(tokenize(diagnostic, parse)).then(() => _root);

  function push(... states) {
    // Remember the current DOM node to revert its value
    // when unwinding the stack

    let i = states.length;
    while(i--) {
      _stack.push(states[i], _curr);
    }
  }

  function using(state, node) {
    function _using(tk, data) {
      _curr = node;
      return state(tk, data);
    };

    return _using;
  }

  function expect(expected) {
    function _expect(tk, data) {
      return (tk === expected) ||
              error(`${expected.description} expected. Found ${tk.description}`)
    };

    return _expect;
  }


  function error(message = "Syntax error") {
    diagnostic.error(message);

    // unwind the stack until we find a recovery state
    parse(Tk.ERROR, "");

    return true;
  }

  function parse(tk, data) {
    while((_curr = _stack.pop())) {
      let state = _stack.pop();

      debug(state, tk, data, _curr);
      if (state(tk, data))
        break;
    }
  }

  // ======================================================================
  // Pushdown automaton
  // ======================================================================
  /*
      The automaton implements a top-bottom predictive parser
  */
  function stateInit(tk, data) {
    push(stateBlockFlow);

    return false;
  }

  /*
      BlockFlow := Paragraph BlockFlowTail
                   | Section BlockFlowTail
                   | ERROR
                   | ø
  */
  function stateBlockFlow(tk, data) {
    if (tk === Tk.TEXT) {
      /*
        Implied text block. This does not consume the token.
      */

      push(stateParagraph, stateBlockFlowTail);
      return false;
    }
    else if (tk === Tk.SECTION) {
      push(stateSection, stateBlockFlow);
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

  /*
      Paragraph := PhrasingContent
  */
  function stateParagraph(tk, data) {
    _curr = _curr.makeParagraph()

    push(statePhrasingContent);
    return false;
  }

  /*
      =====================================================================
      Phrasing content:
      =====================================================================

      Phrasing content is the text of the document. It is made of
      text and intra-paragraphe elements (for bold, italics, ...)

      NEW_LINEs embedded in a phrasing content are ignored.

      Note: the tokenizer has already taken care of replacing
      sequences of two or more consecutive _new lines_ (`\n\n+`)
      by the token EMPTY_LINE


      PhrasingContent :=
              TEXT PhrasingContent
              | NEW_LINE PhrasingContent
              | STAR_1 StrongContent STAR_1 PhrasingContent
              | ERROR
  */
  function statePhrasingContent(tk, data) {
    if (tk === Tk.TEXT) {

      _curr.makeText(data);

      push(statePhrasingContent);
      return true;
    }
    else if (tk === Tk.NEW_LINE) {

      // replace the new-line by a single space
      _curr.makeText(" ");


      push(statePhrasingContent);
      return true;
    }
    else if (tk === Tk.STAR_1) {
      push(using(stateStrongContent,_curr.makeStrong()), expect(Tk.STAR_1), statePhrasingContent);
      return true;
    }
    else if (tk === Tk.ERROR) {
      return true;
    }
    else {
      return false;
    }
  }

  /*
      ======================================================================
      Strong content:
      ======================================================================

      A _strong content_ is identical to a _phrasing content_ except it
      can't contain a _strong_ element.


      StrongContent :=
              TEXT StrongContent
              | NEW_LINE StrongContent
  */
  function stateStrongContent(tk, data) {
    if (tk === Tk.TEXT) {

      _curr.makeText(data);

      push(stateStrongContent);
      return true;
    }
    else if (tk === Tk.NEW_LINE) {

      // replace the new-line by a single space
      _curr.makeText(" ");

      push(stateStrongContent);
      return true;
    }
    else {
      return false;
    }
  }


  /*
      ======================================================================
      Section:
      ======================================================================

      A _section_ serves as container for other block-level
      element,incl. section whose level is > (striclty) to
      the level of the enclosing section.


      Section :=
              SECTION SectionHeading SectionContent
  */
  function stateSection(tk, data) {
    if (tk === Tk.SECTION) {

      // Make a new section node in the DOM
      _curr = _curr.makeSection(data.length-1);

      push(stateSectionHeading, stateSectionContent);
      return true;
    }
    else {
      return false;
    }
  }

  /*
      SectionContent :=
              NEW_LINE BlockFlow
              | ø
  */
  function stateSectionContent(tk, data) {
    if (tk === Tk.NEW_LINE) {
      push(stateBlockFlow);
      return true;
    }
    else {
      return false;
    }
  }

  /*
      =====================================================================
      Section heading:
      =====================================================================

      A wrapper arround the _section title_.


      SectionHeading := SectionTitle
  */
  function stateSectionHeading(tk, data) {
    _curr = _curr.makeHeading();
    push(stateSectionTitle);
  }

  /*
      =====================================================================
      Section title:
      =====================================================================

      A _section title_ is like a _phrasing element_ except it
      cannot contain NEW_LINE.


      SectionTitle :=
              TEXT SectionTitle
              | STAR_1 StrongSectionTitle STAR_1 SectionTitle
  */
  function stateSectionTitle(tk, data) {
    if (tk === Tk.TEXT) {

      _curr.makeText(data);

      push(stateSectionTitle);
      return true;
    }
    else if (tk === Tk.STAR_1) {
      push(using(stateStrongSectionTitle,_curr.makeStrong()), expect(Tk.STAR_1), stateSectionTitle);
      return true;
    }
    else {
      return false;
    }
  }

  /*
      ======================================================================
      Strong section title:
      ======================================================================

      A _strong section title_ is identical to a _strong content_ except it
      can't contain a NEW_LINE.


      StrongSectionTitle :=
              TEXT StrongSectionTitle
  */
  function stateStrongSectionTitle(tk, data) {
    if (tk === Tk.TEXT) {

      _curr.makeText(data);

      push(stateStrongSectionTitle);
      return true;
    }
    else {
      return false;
    }
  }


  function stateEnd(tk,data) {
    if (tk !== Tk.END) {
      return error(`Trailing data: ${data} (${tk.description})`);
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
    TextBlock := TextBlockHead TextBlockTail
  */
  function stateTextBlock(tk, data) { // XXX Rename: Paragraph

    if (tk === Tk.TEXT) {
      const p = _node.makeParagraph();

      push(stateTextBlockHead, stateTextBlockTail);

      return true;
    }
    else {
      return error(`TEXT expected but found ${tk.description}`);
    }
  }

  /*
    TextBlockHead := Phrasing TextBlockTail
  */
  function stateTextBlockHead(tk, data) { // XXX Rename: Paragraph

    if (tk === Tk.TEXT) {
      push(statePhrasing, stateTextBlockTail);

      return true;
    }
    else {
      return error(`TEXT expected but found ${tk.description}`);
    }
  }

  /*
    TextBlockTail := NEW_LINE TextBlockHead
                     | ø
  */
  function stateTextBlockTail(tk, data) {
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
