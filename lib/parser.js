const Tk = require("./token");

const debug = require("debug")("asciishaman:parser");

const { DocumentBuilder } = require("./builder");

// ========================================================================
// Parser
// ========================================================================
function Parser(diagnostic, tokenize) {
  let builder = new DocumentBuilder();
  const document = builder.document;

  let wasClosed = false;

  return Promise.resolve(tokenize(diagnostic, parse))
    .then( () => document );

  function parse(tk, ...m) {
    // console.log("TK", tk);
    // console.dir(document, { depth: Infinity });
    // console.dir(builder, { depth: 2 });

    if (tk === Tk.SECTION) {
      wasClosed = false;
      builder = builder.section(m[0], m[1]);
    }
    else if (tk === Tk.LIST_ITEM) {
      wasClosed = false;
      builder = builder.unorderedListItem(m[0]);
      builder = builder.addText(m[1]);
    }
    else if (tk === Tk.PLAIN_TEXT) {
      wasClosed = false;
      // console.log(builder.constructor);
      builder = builder.addText(m[0]);
    }
    else if (tk === Tk.BLANK_LINE) {
      if (!wasClosed) {
        builder = builder.close();
        wasClosed = true;
      }
    }
    else if (tk === Tk.END) {
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
