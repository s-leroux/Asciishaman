"use strict";

const Tk = require("./token");

const { DocumentBuilder } = require("./builder");

// ========================================================================
// Parser
// ========================================================================
function Parser(diagnostic, tokenize) {
  let builder = new DocumentBuilder();
  const document = builder.document;

  return Promise.resolve(tokenize(diagnostic, parse))
    .then( () => document );

  function parse(tk, ...m) {
    // console.log("TK", tk);
    // console.dir(document, { depth: Infinity });
    // console.dir(builder, { depth: 2 });

    if (tk === Tk.SECTION) {
      builder = builder.section(m[0], m[1]);
    }
    else if (tk === Tk.LIST_ITEM) {
      builder = builder.unorderedListItem(m[0]);
      builder = builder.addText(m[1]);
    }
    else if (tk === Tk.PLAIN_TEXT) {
      // console.log(builder.constructor);
      builder = builder.addText(m[0]);
    }
    else if (tk === Tk.BLANK_LINE) {
      builder = builder.close();
    }
    else if (tk === Tk.END) {
      while(builder) {
        builder.close();
        builder = builder.parent;
      }
    }

  }

}

module.exports = {
  Parser: Parser,
};
