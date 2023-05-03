"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEventDefinition = void 0;
const cloning_1 = require("../../utils/cloning");
const utils_1 = require("./utils");
function addEventDefinition(node, idRemapping, ast) {
    (0, utils_1.getBaseContracts)(node).forEach((base) => base.vEvents.forEach((event) => {
        const newEvent = (0, cloning_1.cloneASTNode)(event, ast);
        node.insertAtBeginning(newEvent);
        idRemapping.set(event.id, newEvent);
    }));
}
exports.addEventDefinition = addEventDefinition;
//# sourceMappingURL=eventInheritance.js.map