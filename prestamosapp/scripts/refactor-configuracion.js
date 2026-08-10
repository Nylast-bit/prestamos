const fs = require('fs');
const path = require('path');

function fixConfiguracion() {
  const filePath = path.join('components', 'configuracion-content.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the outline buttons (exportar datos)
  content = content.replace(/hover:bg-\[#213685\] text-white dark:text-white\/10/g, 'hover:bg-[#213685] hover:text-white');

  // Fix the active theme button
  content = content.replace(/bg-\[#213685\] text-white dark:text-white hover:bg-\[#213685\] text-white dark:text-white\/90/g, 'bg-[#213685] text-white hover:bg-[#213685]/90');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed configuracion-content.tsx buttons");
}

fixConfiguracion();
