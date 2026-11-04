#!/usr/bin/env node
const { main } = require('../dist/index.cjs');

main().catch(error => {
  console.error('Vuesp hub failed to start:', error);
  process.exit(1);
});
