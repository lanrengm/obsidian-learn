"use strict";
exports.__esModule = true;
var chain_1 = require("../src/widgets/explorer/chain");
var root = new chain_1.VC(1);
var index = root;
for (var i = 2; i < 11; i++) {
    var node = new chain_1.VC(i);
    index.insertNext(node);
    index = node;
}
root.testPrint();
root.insertNextN(root.next);
root.testPrint();
