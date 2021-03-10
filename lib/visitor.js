"use strict";

class Visitor {
  visit(node) {
    return node.accept(this);
  }

  visitChildren(node) {
    const result = [];
    for(let child of node.children ?? []) {
      result.push(this.visit(child));
    }

    return result;
  }
}

module.exports = {
  Visitor: Visitor,
};
