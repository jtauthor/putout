'use strict';

const {template} = require('@putout/engine-parser');
const {
    isIdentifier,
    isLiteral,
    isImportDefaultSpecifier,
} = require('@babel/types');

const ANY_OBJECT = '__object';
const ANY_ARRAY = '__array';
const ARGS = '__args';
const LINKED_NODE = /^__[a-z]$/;
const IMPORTS = '__imports';
const BODY = '__body';

module.exports.isNameStr = (a) => LINKED_NODE.test(a);
module.exports.isImportsStr = (a) => a === IMPORTS;
module.exports.isArgsStr = (a) => a === ARGS;

const isBody = (a) => isIdentifier(a, {
    name: BODY,
});

const isAnyObject = (a) => isIdentifier(a, {
    name: ANY_OBJECT,
});

const isAnyArray = (a) => isIdentifier(a, {
    name: ANY_ARRAY,
});

const isEqualType = (a, b) => a.type === b.type;
const {isArray} = Array;

module.exports.isEqualType = isEqualType;
module.exports.isStr = (a) => typeof a === 'string';
module.exports.isAny = (a) => isIdentifier(a, {name: '__'});
module.exports.isAnyLiteral = (a, b) => isLiteral(b, {value: '__'}) && isEqualType(a, b);
module.exports.isArgs = (a) => {
    const b = !isArray(a) ? a : a[0];
    
    return isIdentifier(b, {
        name: ARGS,
    });
};

module.exports.isPath = (path) => Boolean(path.node);
module.exports.isArray = isArray;

module.exports.isObject = (a) => {
    if (!a)
        return false;
    
    if (isArray(a))
        return false;
    
    return typeof a === 'object';
};

module.exports.isArrays = (a, b) => {
    if (!isArray(a) || !isArray(b))
        return false;
    
    if (a.length !== b.length)
        return false;
    
    return true;
};

module.exports.isImports = (a) => {
    const b = !isArray(a) ? a : a[0];
    
    if (!isImportDefaultSpecifier(b))
        return false;
    
    return isIdentifier(b.local, {
        name: IMPORTS,
    });
};

const __OBJECT_TYPE = 'ObjectPattern|ObjectExpression';
const __ARRAY_TYPE = 'ArrayPattern|ArrayExpression';

module.exports.isEqualAnyArray = (node, baseNode) => {
    if (!isAnyArray(baseNode))
        return false;
    
    const {type} = node;
    return __ARRAY_TYPE.includes(type);
};

module.exports.isEqualAnyObject = (node, baseNode) => {
    if (!isAnyObject(baseNode))
        return false;
    
    const {type} = node;
    return __OBJECT_TYPE.includes(type);
};

module.exports.isEqualBody = (node, baseNode) => {
    if (!isBody(baseNode))
        return false;
    
    return node.type === 'BlockStatement';
};

module.exports.isLinkedNode = (a) => {
    if (isIdentifier(a) && LINKED_NODE.test(a.name))
        return true;
    
    if (isLiteral(a) && LINKED_NODE.test(a.value))
        return true;
};

module.exports.parseTemplate = (tmpl) => {
    const node = template.ast(tmpl);
    
    if (tmpl === ANY_OBJECT)
        return [node, __OBJECT_TYPE];
    
    if (tmpl === ANY_ARRAY)
        return [node, __ARRAY_TYPE];
    
    const {type} = node;
    
    return [node, type];
};
