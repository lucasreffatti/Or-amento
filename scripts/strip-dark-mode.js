const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Remove any dark: class variant
  content = content.replace(/\bdark:[^\s"'`<>]+/g, '');
  // Clean up double spaces
  content = content.replace(/  +/g, ' ');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Stripped dark classes: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

walk(path.join(__dirname, '../src'));
