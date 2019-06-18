'use strict';

const {replaceWith} = require('putout').operate;

const fullstore = require('fullstore');

const {
    operate,
    template,
} = require('putout');

const {insertAfter} = operate;

module.exports.report = () => {
    return `"operate.replaceWith" should be called instead of "path.replaceWith"`;
};

const replaceWithAST = template.ast(`
    const {replaceWith} = require('putout').operate;
`);

module.exports.fix = ({path, object, program, isInserted}) => {
    const strictNodePath = program.get('body.0');
    
    path.node.arguments.unshift(object);
    
    if (!isInserted()) {
        isInserted(true);
        insertAfter(strictNodePath, replaceWithAST);
    }
};

module.exports.find = (ast, {push, traverse}) => {
    const isInserted = fullstore();
    
    traverse(ast, {
        CallExpression(path) {
            const calleePath = path.get('callee');
            
            if (!calleePath.isMemberExpression())
                return;
            
            const callee = calleePath.node;
            const {object, property} = callee;
            
            if (property.name !== 'replaceWith')
                return;
            
            replaceWith(calleePath, property);
            const program = path.findParent((path) => path.isProgram());
            
            push({
                isInserted,
                path,
                object,
                program,
                calleePath,
            });
        },
    });
};
