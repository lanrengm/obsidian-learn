"use strict";
var _a;
exports.__esModule = true;
exports.VC = void 0;
var VC = /** @class */ (function () {
    function VC(v) {
        this.testValue = v;
    }
    // 插入节点，插入到下一个位置
    VC.prototype.insertNext = function (current) {
        var previous = this;
        var next = this.next;
        previous.next = current;
        current.previous = previous;
        if (next) {
            current.next = next;
            next.previous = current;
        }
    };
    // 从链中删除节点，删除当前节点的下一个
    VC.prototype.removeNext = function () {
        var _a;
        var previous = this;
        var current = this.next;
        var next = (_a = current === null || current === void 0 ? void 0 : current.next) !== null && _a !== void 0 ? _a : null;
        if (current) {
            current.previous = null;
            current.next = null;
        }
        previous.next = next;
        if (next)
            next.previous = previous;
        return current;
    };
    // 从链中删除指定数量的节点，删除当前节点的后续节点， 相当于删除子链，返回子链的头节点
    VC.prototype.removeNextN = function (n) {
        var _a;
        var head = this.next;
        var current = head;
        while (current && (n >= 1)) {
            current = current.next;
            n = n - 1;
        }
        var previous = this;
        var next = (_a = current === null || current === void 0 ? void 0 : current.next) !== null && _a !== void 0 ? _a : null;
        previous.next = next;
        if (next)
            next.previous = previous;
        if (head)
            head.previous = null;
        if (current)
            current.next = null;
        return head;
    };
    VC.prototype.testPrint = function () {
        var node = this;
        while (node) {
            console.log(node.testValue);
            node = node.next;
        }
    };
    return VC;
}());
exports.VC = VC;
var root = new VC(1);
var index = root;
for (var i = 2; i < 11; i++) {
    var node = new VC(i);
    index.insertNext(node);
    index = node;
}
(_a = root.removeNextN(3)) === null || _a === void 0 ? void 0 : _a.testPrint();
root.testPrint();
