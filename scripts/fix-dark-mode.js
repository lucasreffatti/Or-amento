const fs = require('fs');
const path = require('path');

const replacements = {
  // 1. Undo inverted buttons (keep them dark even in dark mode, as they were in light mode)
  'dark:bg-neutral-50': '',
  'dark:text-neutral-900': '',
  
  // 2. Remove hover effects in dark mode
  'dark:hover:bg-neutral-800': '',
  'dark:hover:bg-neutral-800/50': '',
  'dark:hover:text-neutral-50': '',
  'dark:hover:text-white': '',
  'dark:hover:text-neutral-200': '',
  
  // 3. Make the dark mode palette "black and gray"
  // If the background was neutral-950, let's make it black
  'dark:bg-neutral-950': 'dark:bg-black',
  'dark:bg-[#0A0A0A]': 'dark:bg-[#0A0A0A]', // Keep Sidebar black
  // Change card backgrounds from neutral-900 to neutral-950 (darker gray/black)
  'dark:bg-neutral-900': 'dark:bg-[#111111]',
  'dark:border-neutral-800': 'dark:border-[#222222]',
  'dark:border-neutral-800/50': 'dark:border-[#222222]',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [oldClass, newClass] of Object.entries(replacements)) {
    // Replace the exact class
    // We add spaces around it so we don't accidentally match part of another class, 
    // but since they are utility classes, replacing them globally with a regex is safer.
    const escapedOld = oldClass.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedOld}\\b`, 'g');
    content = content.replace(regex, newClass);
  }
  
  // Clean up any double spaces caused by removing classes
  content = content.replace(/  +/g, ' ');
  
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
    } else if (filePath.endsWith('.tsx')) { // We will run this on all TSX files including Sidebar
      processFile(filePath);
    }
  }
}

walk(path.join(__dirname, '../src'));
console.log('Dark mode fixes applied.');
