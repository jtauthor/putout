'use strict';

const {
    types,
    operate,
} = require('putout');

const {replaceWithMultiple} = operate;

const {
    ExpressionStatement,
    ReturnStatement,
    BlockStatement,
    toStatement,
} = types;

function wrap(el) {
    if (/identifier|literal/i.test(el.type))
        return ExpressionStatement(el);
    
    return toStatement(el);
}

module.exports.report = () => 'sequence expressions should not be used';

module.exports.fix = (path) => {
    const {parentPath} = path;
    
    if (isFn(path)) {
        const expressions = parentPath.node.body.expressions.map(wrap);
        const n = expressions.length - 1;
        const {expression} = expressions[n];
        
        expressions[n] = ReturnStatement(expression);
        parentPath.node.body = BlockStatement(expressions);
        return;
    }
    
    if (isCallee(path)) {
        const expressions = path.node.expressions.map(wrap);
        const {expression} = expressions.pop();
        
        parentPath.insertBefore(expressions);
        parentPath.node.callee = expression;
        return;
    }
    
    return replaceWithMultiple(path, path.node.expressions);
};

const isBlock = ({parentPath}) => parentPath.isBlockStatement();
const isFn = ({parentPath}) => parentPath.isArrowFunctionExpression();
const isExpr = ({parentPath}) => parentPath.isExpressionStatement();

module.exports.traverse = ({push}) => {
    return {
        SequenceExpression(path) {
            if (isBlock(path) || isFn(path) || isExpr(path) || isCallee(path))
                push(path);
        },
    };
};

function isCallee(path) {
    const {parentPath} = path;
    const isCall = parentPath.isCallExpression();
    const isSame = parentPath.get('callee') === path;
    
    return isCall && isSame;
}

