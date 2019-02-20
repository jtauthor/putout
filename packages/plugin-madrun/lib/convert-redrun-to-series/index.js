'use strict';

const {
    isStringLiteral,
    
    arrowFunctionExpression,
    stringLiteral,
    identifier,
    callExpression,
    arrayExpression,
} = require('putout').types;

module.exports.report = ({name}) => {
    return `"series" should be called instead of "redrun" in script: "${name}"`;
};

module.exports.find = (ast, {push, traverse}) => {
    traverse(ast, {
        ArrowFunctionExpression(path) {
            const {body} = path.node;
            if (!isStringLiteral(body))
                return;
            
            const {value} = body;
            if (value.indexOf('redrun'))
                return;
            
            push({
                path,
                value,
                name: path.parent.key.value,
            });
        },
    });
};

module.exports.fix = ({path, value}) => {
    const [line, arg] = value.split(' -- ');
    const scripts = line.split(' ').slice(1);
    
    const strs = [];
    for (const script of scripts) {
        strs.push(stringLiteral(script));
    }
    
    const seriesArgs = getSeriesArgs(strs, arg);
    
    path.node.body = callExpression(identifier('series'), seriesArgs);
};

function getSeriesArgs(strs, arg) {
    if (!arg)
        return [
            arrayExpression(strs),
        ];
    
   return [
    arrayExpression(strs),
    stringLiteral(arg),
    ];
}

