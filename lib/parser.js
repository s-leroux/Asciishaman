const Tk = require("./token");

const debug = require("debug")("asciishaman:parser");

const dom = require("./model");

// ========================================================================
// regex
// ========================================================================
const RE_SECTION = /^(={1,6})[ \t]+(.+)/
const RE_ULIST = /^([*]+)[ \t]+(.+)/

// ========================================================================
// Parser
// ========================================================================
function Parser(diagnostic, tokenize) {
  const document = new dom.Document();
  let builder = document.builder();
  let wasClosed = false;

  return Promise.resolve(tokenize(diagnostic, parse))
    .then( () => document );

  function parse(tk) {
    // console.log("TK", tk);
    console.dir(document, { depth: Infinity });
    console.dir(builder, { depth: 2 });
  
    if (tk.tag === Tk.TEXT) {
      const text = tk.data;
      let m;

      wasClosed = false;

      if ((m=text.match(RE_SECTION))) {
        builder = builder.section(m[1].length, m[2]); 
      }
      else if ((m=text.match(RE_ULIST))) {
        builder = builder.unorderedListItem(m[1].length);
        builder = builder.addText(m[2]); 
      }
      else {
        // console.log(builder.constructor);
        builder = builder.addText(text);
      }
    }
    else if (tk.tag === Tk.BLANK_LINE) {
      if (!wasClosed) {
        builder = builder.close();
        wasClosed = true;
      }
    }
    else if (tk.tag === Tk.END) {
      while(builder) {
        builder.close();
        builder = builder.parent;
      }
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

}

module.exports = {
  Parser: Parser,
};
