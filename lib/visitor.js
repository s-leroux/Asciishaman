"use strict";

class Visitor {
  visit(node) {
    return node.accept(this);
  };

  visitChildren(node) {
    for(let child of node.children ?? []) {
      this.visit(child);
    }
  }
};

module.exports = {
  Visitor: Visitor,
};
