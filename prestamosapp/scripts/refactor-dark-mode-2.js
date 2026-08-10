const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Gradients
  { regex: /\bfrom-(slate|gray)-50\b/g, replacement: 'from-$1-50 dark:from-slate-900' },
  { regex: /\bto-(slate|gray)-100\b/g, replacement: 'to-$1-100 dark:to-slate-800' },
  { regex: /\bfrom-(slate|gray)-100\b/g, replacement: 'from-$1-100 dark:from-slate-800' },
  { regex: /\bto-(slate|gray)-50\b/g, replacement: 'to-$1-50 dark:to-slate-900' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { regex, replacement } of REPLACEMENTS) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const targetDir = process.argv[2];
processDirectory(targetDir);
