'use strict';
const xmldom = require('xmldom');
const fs = require('fs');
const TEXT_NODE = 3;
const args = process.argv.slice(2);
const inFile = args[0];
const outFile = args[1] || inFile;
if (!inFile) {
  console.error('No input file given');
  process.exit(1);
}
const content = fs.readFileSync(inFile, { encoding: 'utf-8' });
const dom = new xmldom.DOMParser().parseFromString(content);
const tags = ['source', 'target'];
tags.forEach(tag => {
  const els = dom.getElementsByTagName(tag);
  for (let i = 0; i < els.length; i++) {
    const el = els.item(i);
    const nodes = el.childNodes;
    const toRemove = [];
    const len = nodes.length;
    for (let j = 0; j < len; j++) {
      const node = nodes.item(j);
      if (node.nodeType === TEXT_NODE) {
        let trimmed;
        if (len === 1) {
          trimmed = node.textContent.trim();
        } else if (j === 0) {
          trimmed = node.textContent.trimLeft();
        } else if (j === len - 1) {
          trimmed = node.textContent.trimRight();
        } else {
          trimmed = node.textContent;
        }
        trimmed = trimmed.replace(/\n +/g, '\n');
        trimmed = trimmed.replace(/ +/g, ' ');
        if (trimmed === '') {
          toRemove.push(node);
        } else {
          node.textContent = trimmed;
        }
      }
    }
    toRemove.forEach(node => el.removeChild(node));
  }
});

const serializer = new xmldom.XMLSerializer();
const result = serializer.serializeToString(dom);
fs.writeFileSync(outFile, result, { encoding: 'utf-8' });
console.log(`Trimmed ${inFile} to ${outFile}`);
