'use strict';

const once = require('once');
const tryCatch = require('try-catch');

const {keys, entries} = Object;
const cwd = process.cwd();

const noConfigFound = (config, configError) => {
    if (configError && configError.messageTemplate === 'no-config-found')
        return true;
    
    if (!keys(config.rules).length)
        return true;
    
    return false;
};

const getCli = once((constructor) => {
    const cli = new constructor({
        ignorePattern: '!.*',
    });
    
    return {
        getConfigForFile: cli.getConfigForFile.bind(cli),
        executeOnText: cli.executeOnText.bind(cli),
    };
});

const loadPlugin = (name, require) => {
    if (name.includes('@'))
        name = name.replace('/', '/eslint-plugin-');
    else
        name = `eslint-plugin-${name}`;
    
    const path = require.resolve(name, {
        paths: [
            cwd,
        ],
    });
    
    return require(path);
};

const getPluginsStore = once(() => {
    const cache = {};
    
    return (name) => {
        if (cache[name])
            return cache[name];
        
        const {rules} = loadPlugin(name, require);
        
        cache[name] = {};
        for (const [rule, fn] of entries(rules)) {
            const fullRule = `${name}/${rule}`;
            
            cache[name][fullRule] = fn;
        }
        
        return cache[name];
    };
});

const getLinter = (constructor, plugins, parser) => {
    const linter = new constructor();
    const pluginsStore = getPluginsStore();
    
    if (parser)
        linter.defineParser(parser, require(parser));
    
    for (const name of plugins)
        linter.defineRules(pluginsStore(name));
    
    return linter;
};

const requireEslint = once(() => {
    const [e, eslint] = tryCatch(require, 'eslint');
    
    if (e)
        return [e];
    
    return [null, eslint];
});

module.exports = ({name, code, fix}) => {
    const noChanges = [
        code,
        [],
    ];
    
    const [error, eslint] = requireEslint();
    
    if (error)
        return noChanges;
    
    const {CLIEngine, Linter} = eslint;
    
    const cli = getCli(CLIEngine);
    const [configError, config] = tryCatch(cli.getConfigForFile, name);
    
    if (noConfigFound(config, configError))
        return noChanges;
    
    if (configError) {
        return [
            code,
            [convertToPlace(parseError(configError))],
        ];
    }
    
    disablePutout(config);
    
    if (fix) {
        const {plugins, parser} = config;
        const {output, messages} = getLinter(Linter, plugins, parser)
            .verifyAndFix(code, config);
        
        return [
            output,
            messages.map(convertToPlace),
        ];
    }
    
    const {results} = cli.executeOnText(code, name);
    
    if (!results.length)
        return noChanges;
    
    const [report] = results;
    const places = report.messages.map(convertToPlace);
    
    return [
        code,
        places,
    ];
};

module.exports._loadPlugin = loadPlugin;
module.exports._noConfigFound = noConfigFound;

function convertToPlace({ruleId = 'parser', message, line = 'x', column = 'x'}) {
    return {
        rule: `eslint/${ruleId}`,
        message,
        position: {
            line,
            column,
        },
    };
}

function disablePutout(config) {
    if (!config.rules['putout/putout'])
        return;
    
    config.rules['putout/putout'] = 'off';
}

function parseError(e) {
    if (!e)
        return false;
    
    const {
        messageTemplate,
        messageData,
        message,
    } = e;
    
    if (messageTemplate !== 'plugin-missing')
        return {
            message,
        };
    
    return {
        message: `Plugin missing: ${messageData.pluginName}`,
    };
}

