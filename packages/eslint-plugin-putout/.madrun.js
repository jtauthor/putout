'use strict';

const {run} = require('madrun');

module.exports = {
    'test': () => `mocha 'rules/**/*.spec.js'`,
    'watch:test': () => `nodemon -w rules -x ${run('test')}`,
    'lint': () => 'putout rules index.js .madrun.js',
    'fix:lint': () => run('lint', '--fix'),
    'coverage': () => `nyc ${run('test')}`,
    'debug': () => 'mocha --inspect-brk --inspect=0.0.0.0',
};

