'use strict';

const fs = require('fs');
const path = require('path');

const ICONS = 'src/icons';
const OUTPUT = 'src/app/shared/icon.ts';
var out = '/* tslint:disable */\nexport const ICON_CONTENTS = {\n';
var files = fs.readdirSync(ICONS);
files.forEach(file => {
  if (file.endsWith('.svg')) {
    const fullFile = path.join(ICONS, file);
    const content = fs.readFileSync(fullFile, 'utf-8')
      .replace(/'/g, '\\\'')
      .replace(/\n/g, '\\n');
    out += `  '${path.basename(file, '.svg')}': '${content}',\n`;
  }
});
out += '};\n\n';
out += 'export type Icon = keyof typeof ICON_CONTENTS;\n\n';
out += 'export const ICON_NAMES = Object.keys(ICON_CONTENTS);\n\n';
out += 'export const ICONS = ICON_NAMES as Icon[];\n\n';
fs.writeFileSync(OUTPUT, out, { encoding: 'utf-8' });
console.log(`Generated file ${OUTPUT}`);
