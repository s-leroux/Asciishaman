"use strict";

describe("module", function() {

  it("should be loadable", function() {
    require("../index.js");
  });
});

require("./inline-parser.js");
require("./visitor.js");
require("./model.js");

require("./tokenizer.js");
require("./parser.js");
