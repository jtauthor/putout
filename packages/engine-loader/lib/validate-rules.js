'use strict';

const shift = ([a]) => a;
const parse = (rule) => {
    if (/^putout/.test(rule))
        return rule.split('/').shift();
    
    return rule;
};

module.exports = ({items, rules}) => {
    const ruleItems = Object.keys(rules);
    const plugins = items.map(shift);
    
    for (const rule of ruleItems) {
        if (!plugins.includes(parse(rule)))
            throw Error(`no plugin found for a rule: "${rule}"`);
    }
};
