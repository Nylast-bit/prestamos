const fs = require('fs');
const path = require('path');

function fixTableDetails() {
  const filePath = path.join('components', 'prestamos', 'PrestamoTable.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the row background for paid installments in the details table
  content = content.replace(/bg-green-50\/70 hover:bg-green-50/g, 'bg-green-50/70 dark:bg-green-950/40 hover:bg-green-50 dark:hover:bg-green-950/60');
  
  // Fix the border color for the rows
  content = content.replace(/border-slate-100/g, 'border-border');

  // Fix the text-slate-300 placeholder
  content = content.replace(/text-slate-300/g, 'text-muted-foreground');

  // Fix the text-card-foreground in the detail which might have issues
  // text-card-foreground is actually semantic so it should be fine.
  
  // Make sure the TableHeader gradient is ok
  // It has: bg-gradient-to-r from-slate-50 dark:from-slate-900 to-slate-100 dark:to-slate-800
  // That's completely fine for dark mode.

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed PrestamoTable rows");
}

fixTableDetails();
