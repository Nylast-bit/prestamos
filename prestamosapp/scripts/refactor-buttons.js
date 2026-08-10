const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Fix #213685 buttons
  { regex: /bg-\[#213685\](?!\s+text-white)/g, replacement: 'bg-[#213685] text-white dark:text-white' },
  // Fix other dark buttons
  { regex: /bg-indigo-600(?!\s+text-white)/g, replacement: 'bg-indigo-600 text-white dark:text-white' },
  { regex: /bg-emerald-600(?!\s+text-white)/g, replacement: 'bg-emerald-600 text-white dark:text-white' },
  { regex: /bg-amber-600(?!\s+text-white)/g, replacement: 'bg-amber-600 text-white dark:text-white' },
  { regex: /bg-blue-600(?!\s+text-white)/g, replacement: 'bg-blue-600 text-white dark:text-white' },
  { regex: /bg-red-600(?!\s+text-white)/g, replacement: 'bg-red-600 text-white dark:text-white' }
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

  // Also fix specific bad contrasts in Prestatarios card gradients
  if (filePath.includes('prestatarios-content.tsx')) {
    content = content.replace(/from-indigo-50\/80 to-slate-50 dark:to-slate-900/g, 'from-indigo-50/80 dark:from-indigo-950/30 to-slate-50 dark:to-slate-900');
    content = content.replace(/text-indigo-700/g, 'text-indigo-700 dark:text-indigo-300');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const targetDir = process.argv[2];
processDirectory(targetDir);
