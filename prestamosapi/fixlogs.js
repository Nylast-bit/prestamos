const fs = require('fs');
const path = require('path');

function findFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  });
  return files;
}

const files = findFiles('c:/Projects/prestamos/prestamosapi/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(/console\.(log|error|warn)/)) {
    content = content.replace(/console\.(log|error|warn)/g, (match, p1) => `logger.${p1 === 'log' ? 'info' : p1}`);
    
    if (!content.includes('import { logger }')) {
      const depth = file.replace(/\\/g, '/').split('src/')[1].split('/').length - 1;
      let importPath = '../'.repeat(depth) + 'utils/logger';
      if (depth === 0) importPath = './utils/logger';
      
      content = `import { logger } from '${importPath}';\n` + content;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
