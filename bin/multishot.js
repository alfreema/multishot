#!/usr/bin/env node

const { run } = require('../src/cli');

const { code } = run(process.argv);
process.exit(code);

