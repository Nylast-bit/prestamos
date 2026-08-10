const fs = require('fs');
const path = require('path');

function fixConsolidacionTable() {
  const filePath = path.join('components', 'consolidacion', 'ConsolidacionTable.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix badges
  content = content.replace(/bg-green-600"/g, 'bg-green-600 text-white dark:text-white"');
  content = content.replace(/bg-orange-600"/g, 'bg-orange-600 text-white dark:text-white"');
  content = content.replace(/bg-gray-600"/g, 'bg-gray-600 text-white dark:text-white"');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed ConsolidacionTable");
}

fixConsolidacionTable();
