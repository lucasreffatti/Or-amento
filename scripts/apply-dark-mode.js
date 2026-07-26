const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-white': 'bg-white dark:bg-neutral-900',
  'bg-neutral-50': 'bg-neutral-50 dark:bg-neutral-950/50',
  'border-neutral-200': 'border-neutral-200 dark:border-neutral-800',
  'border-neutral-100': 'border-neutral-100 dark:border-neutral-800/50',
  'text-neutral-900': 'text-neutral-900 dark:text-neutral-50',
  'text-neutral-800': 'text-neutral-800 dark:text-neutral-200',
  'text-neutral-700': 'text-neutral-700 dark:text-neutral-300',
  'text-neutral-600': 'text-neutral-600 dark:text-neutral-400',
  'text-neutral-500': 'text-neutral-500 dark:text-neutral-400',
  'text-neutral-400': 'text-neutral-400 dark:text-neutral-500',
  'bg-neutral-900': 'bg-neutral-900 dark:bg-neutral-50',
  'text-white': 'text-white dark:text-neutral-900',
  'hover:bg-neutral-100': 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
  'hover:bg-neutral-50': 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
  'hover:text-neutral-900': 'hover:text-neutral-900 dark:hover:text-neutral-50'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [oldClass, newClass] of Object.entries(replacements)) {
    // Regex that avoids replacing already replaced classes
    // e.g. replacing bg-white only if not already followed by dark:bg-neutral-900
    // Simplified regex for tailwind classes (must have word boundary)
    const escapedOld = oldClass.replace(/:/g, '\\:');
    const regex = new RegExp(`(?<!dark:)\\b${escapedOld}\\b(?! dark:)`, 'g');
    content = content.replace(regex, newClass);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') && !filePath.includes('Sidebar.tsx')) {
      processFile(filePath);
    }
  }
}

walk(path.join(__dirname, '../src'));
console.log('Dark mode classes applied.');
