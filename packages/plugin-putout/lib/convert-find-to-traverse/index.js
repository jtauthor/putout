'use strict';

const {types, operate} = require('putout');
const {replaceWith} = operate;
const {ReturnStatement} = types;

module.exports.report = () => '"traverse" should be used instead of "find"';

module.exports.fix = (path) => {
    if (path.isMemberExpression())
        return path.get('property').node.name = 'traverse';
    
    if (path.isFunction())
        return path.node.params = [path.node.params[1]];
    
    if (path.isCallExpression()) {
        replaceWith(path.parentPath, ReturnStatement(path.node.arguments[1]));
    }

};

module.exports.traverse = ({push}) => {
    return {
        AssignmentExpression(path) {
            const leftPath = path.get('left');
            const objectPath = leftPath.get('object');
            const propertyPath = leftPath.get('property');
            
            if (!isModuleExports(objectPath))
                return;
            
            if (!propertyPath.isIdentifier({name: 'find'}))
                return;
            
            const rightPath = path.get('right');
            
            if (!rightPath.isFunction())
                return;
            
            if (isReturn(rightPath))
                return;
            
            const traverseCallPath = getTraverseCall(rightPath);
            
            if (!traverseCallPath)
                return;
            
            push(traverseCallPath);
            push(leftPath);
            
            if (rightPath.node.params.length === 2)
                push(rightPath);
        },
    };
};

function isModuleExports(path) {
    if (!path.node)
        return;
    
    const isModule = path.get('object').isIdentifier({name: 'module'});
    const isExports = path.get('property').isIdentifier({name: 'exports'});
    
    return isModule && isExports;
}

function isReturn(path) {
    let is = false;
    
    path.traverse({
        ReturnStatement(returnPath) {
            if (returnPath.scope.uid !== path.scope.uid)
                return;
            
            is = true;
        },
    });
    
    return is;
}

function getTraverseCall(path) {
    let result;
    
    path.traverse({
        CallExpression(path) {
            if (!path.get('callee').isIdentifier({name: 'traverse'}))
                return;
            
            result = path;
            path.stop();
        },
    });
    
    return result;
}
