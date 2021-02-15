const debug = require("debug")("asciishaman:tests");

const assert = require('chai').assert;

describe("module", function() {
    let shaman = null;

    it("should be loadable", function() {
        gp = require("../index.js");
    });
});

require('./model.js');
require('./visitor.js');

require('./tokenizer.js');
require('./parser.js');
