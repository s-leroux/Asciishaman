const debug = require("debug")("asciishaman:tests-parser");
const chai = require('chai');
const assert = chai.assert;

const streams = require('memory-streams');

const parser = require("../lib/parser");
const Tk = require("../lib/token");
const { Diagnostic } = require("../lib/diagnostic");
const { HTMLVisitor } = require("../lib/visitors/html");

function tkTest(tokenize) {
    const output = new streams.WritableStream();
    const diagnostic = new Diagnostic("");

    return parser.Parser(diagnostic, tokenize)
    .then((document) => {
        const visitor = new HTMLVisitor(output);

        return visitor.visit(document);
    })
    .then(() => [diagnostic, output.toString() ])
}


describe("The parser (well-formed token streams)", function() {
    this.timeout(20);

    it("should accept a single-line text-only paragraph", function() {
        return tkTest((_, parse) => {
          parse(Tk.TEXT, "Hello");
          parse(Tk.END, "");
        })
          .then(([diagnostic ,output]) => {
            assert.deepEqual(diagnostic._errors, []);
            assert.equal(output, "<body><p>Hello</p></body>");
          });
    });

    it("should accept a multi-line text-only paragraph", function() {
        return tkTest((_, parse) => {
          parse(Tk.TEXT, "Hello");
          parse(Tk.NEW_LINE, "\n");
          parse(Tk.TEXT, "World");
          parse(Tk.NEW_LINE, "\n");
          parse(Tk.TEXT, "!");
          parse(Tk.END, "");
        })
          .then(([diagnostic ,output]) => {
            assert.deepEqual(diagnostic._errors, []);
            assert.equal(output, "<body><p>Hello World !</p></body>");
          });
    });

    it("should accept a mixed-content paragraph", function() {
        return tkTest((_, parse) => {
          parse(Tk.TEXT, "This text");
          parse(Tk.STAR_1, "*");
          parse(Tk.NEW_LINE, "\n");
          parse(Tk.TEXT, "constains");
          parse(Tk.NEW_LINE, "\n");
          parse(Tk.TEXT, "some bold");
          parse(Tk.STAR_1, "*");
          parse(Tk.TEXT, "words");
          parse(Tk.END, "");
        })
          .then(([diagnostic ,output]) => {
            assert.deepEqual(diagnostic._errors, []);
            assert.equal(output, "<body><p>This text<strong> constains some bold</strong>words</p></body>");
          });
    });

    it("should accept mixed-content section headings", function() {
        return tkTest((_, parse) => {
          parse(Tk.SECTION, "==");
          parse(Tk.TEXT, "This is a");
          parse(Tk.STAR_1, "*");
          parse(Tk.TEXT, "section heading");
          parse(Tk.STAR_1, "*");
          parse(Tk.NEW_LINE, "\n");
          parse(Tk.TEXT, "Some content");
          parse(Tk.END, "");
        })
          .then(([diagnostic ,output]) => {
            assert.deepEqual(diagnostic._errors, []);
            assert.equal(output, "<body><div><h2>This is a<strong>section heading</strong></h2><p>Some content</p></div></body>");
          });
    });

    it("should accept a section without content", function() {
        return tkTest((_, parse) => {
          parse(Tk.SECTION, "==");
          parse(Tk.TEXT, "My section");
          parse(Tk.END, "");
        })
          .then(([diagnostic ,output]) => {
            assert.deepEqual(diagnostic._errors, []);
            assert.equal(output, "<body><div><h2>My section</h2></div></body>");
          });
    });
});


describe("The parser (ill-formed token streams)", function() {
    this.timeout(20);

    it("should detect unbalanced stars", function() {
        return tkTest((_, parse) => {
          parse(Tk.TEXT, "This text");
          parse(Tk.STAR_1, "*");
          parse(Tk.NEW_LINE, "\n");
          parse(Tk.STAR_1, "*");
          parse(Tk.TEXT, "constains");
          parse(Tk.NEW_LINE, "\n");
          parse(Tk.TEXT, "some bold");
          parse(Tk.STAR_1, "*");
          parse(Tk.TEXT, "words");
          parse(Tk.END, "");
        })
          .then(([diagnostic ,output]) => {
            assert.equal(diagnostic._errors.length, 1);
            assert.match(diagnostic._errors[0].message, /star1 expected/);

          });
    });

});

