'use strict';

const {isIdentifier} = require('putout').types;

module.exports.report = ({idName}) => `Useless variable declaration with name "${idName}"`;

module.exports.fix = ({path, bindingPath, initName, idName}) => {
    bindingPath.scope.rename(initName, idName);
    path.remove();
};

module.exports.find = (ast, {push, traverse}) => {
    traverse(ast, {
        VariableDeclarator(path) {
            const {id, init} = path.node;
            const {name} = init;
            
            if (!isIdentifier(path.node.init))
                return;
            
            const bindingPath = path.scope.bindings[name].path;
            
            push({
                path,
                bindingPath,
                initName: init.name,
                idName: id.name,
            });
        },
    });
};
