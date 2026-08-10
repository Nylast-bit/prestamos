const fs = require('fs');
const path = require('path');

function fixPrestamoTable() {
  const filePath = path.join('components', 'prestamos', 'PrestamoTable.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix text-[#213685]
  content = content.replace(/text-\[#213685\](?!\s+dark:text-blue-300)/g, 'text-[#213685] dark:text-blue-300');
  
  // Fix hover states
  content = content.replace(/hover:bg-blue-50\/50/g, 'hover:bg-accent');
  content = content.replace(/hover:bg-slate-50\/50/g, 'hover:bg-accent');
  content = content.replace(/group-hover:bg-blue-50\/50/g, 'group-hover:bg-accent');
  
  // Fix purple-900 / orange-900 etc which are unreadable on dark backgrounds
  content = content.replace(/text-purple-900/g, 'text-purple-900 dark:text-purple-300');
  content = content.replace(/text-orange-900/g, 'text-orange-900 dark:text-orange-300');
  content = content.replace(/text-emerald-900/g, 'text-emerald-900 dark:text-emerald-300');
  
  // Fix bg-accent text-white on Tasa badge (maybe it was bg-muted text-foreground before?)
  // Let's replace 'bg-accent text-white' if it's there
  content = content.replace(/bg-accent text-white/g, 'bg-accent text-accent-foreground');
  
  // Also fix simulation dialog
  const simPath = path.join('components', 'prestamos', 'PrestamoSimulationDialog.tsx');
  if (fs.existsSync(simPath)) {
    let simContent = fs.readFileSync(simPath, 'utf8');
    simContent = simContent.replace(/text-\[#213685\](?!\s+dark:text-blue-300)/g, 'text-[#213685] dark:text-blue-300');
    simContent = simContent.replace(/text-slate-800/g, 'text-foreground');
    fs.writeFileSync(simPath, simContent, 'utf8');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed PrestamoTable & Dialog");
}

fixPrestamoTable();
