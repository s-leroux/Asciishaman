const Tk = require("./token");

const debug = require("debug")("asciishaman:parser");

const dom = require("./model");
const { Grammar, Rule, Test, Token, ZeroOrOne, ZeroOrMore, OneOrMore } = require("backparse");

// ========================================================================
// Grammar
// ========================================================================
const grammar = new Grammar();
function L(tag) {
  return Test((tk, fail) => (tk.tag == tag) ? (tk.data ?? tk.tag.description) : fail);
}

function Text() {
  return Test((tk, fail) => tk.data || fail);
}

grammar.define("root",
  [ Rule("document"), L(Tk.END) ],
  function(fail, document) {
    return document;
  }
);

grammar.define("document",
  [ ZeroOrMore(Rule("block")), ZeroOrMore(L(Tk.NEW_LINE)) ],
  function(fail, blocks) {
    // console.log("D", ...blocks);
    return new dom.Document(...blocks);
  },
);

grammar.define("block",
  [ Rule("paragraph"), OneOrMore(L(Tk.NEW_LINE)) ],
  function(fail, content) {
    // console.log("B", content);
    return content;
  }
);

grammar.define("paragraph",
  [ Rule("phrase"), ZeroOrMore(Rule("extra_phrase")) ],
  function(fail, phrase, extra) {
    // console.log("P", phrase, extra);
    return new dom.Paragraph([phrase, extra].flat().join(""));
  },
);

grammar.define("phrase",
  [ Rule("text") ],
  function(fail, content) {
    // console.log("H", content);
    return content;
  }
);

grammar.define("extra_phrase",
  [ L(Tk.NEW_LINE), Rule("phrase") ],
  function(fail, nl, phrase) {
    // console.log("X", phrase);
    return " " + phrase;
  },
);

grammar.define("text",
  [ L(Tk.TEXT) ],
  function(fail, content) {
    return content;
  }
);

// ========================================================================
// Parser
// ========================================================================
function Parser(diagnostic, tokenize) {
  const _parser = grammar.parser("root");

  return Promise.resolve(tokenize(diagnostic, parse))
    .then(
      () => (_parser.status === "ok") && _parser.result()
    );

  function parse(tk) {
    // console.log("TK", tk);
    _parser.accept(tk);
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

}

module.exports = {
  Parser: Parser,
};
