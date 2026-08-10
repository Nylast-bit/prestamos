const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  // Backgrounds
  { regex: /\bbg-white\b/g, replacement: 'bg-background' },
  { regex: /\bbg-(slate|gray)-50\b/g, replacement: 'bg-muted' },
  { regex: /\bbg-(slate|gray)-100\b/g, replacement: 'bg-accent' },
  
  // Text Colors
  { regex: /\btext-(slate|gray)-(900|800)\b/g, replacement: 'text-foreground' },
  { regex: /\btext-(slate|gray)-(700)\b/g, replacement: 'text-card-foreground' },
  { regex: /\btext-(slate|gray)-(600|500|400)\b/g, replacement: 'text-muted-foreground' },
  
  // Borders
  { regex: /\bborder-(slate|gray)-(200|300)\b/g, replacement: 'border-border' },
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
if (!targetDir) {
  console.error("Please specify a directory");
  process.exit(1);
}

console.log(`Processing directory: ${targetDir}`);
processDirectory(targetDir);
console.log("Done.");
