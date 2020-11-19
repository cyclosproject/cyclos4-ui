'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const bootstrapIcons = 'node_modules/bootstrap-icons/icons';
const customIcons = 'src/svg';
const icons = {};
for (const dir of [bootstrapIcons, customIcons]) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.svg')) {
      const name = file.replace('.svg', '');
      let content = fs.readFileSync(path.join(dir, file), 'utf-8');
      if (dir === customIcons) {
        content = content.replace('<svg ', `<svg class="ci ci-${name}" `);
      }
      icons[name] = content;
    }
  });
}
const OUTPUT = 'src/svg/icons.json';
fs.writeFileSync(OUTPUT, JSON.stringify(icons, null, 2), { encoding: 'utf-8' });
console.log(`Generated file ${OUTPUT}`);
