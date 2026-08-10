const fs = require('fs');
const path = require('path');

function fixCardsAndBadges() {
  const filePath = path.join('components', 'prestamos', 'PrestamoTable.tsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix Tasa badge
  content = content.replace(/bg-slate-200 text-card-foreground/g, 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100');

  // Fix Cards bg and borders
  content = content.replace(/bg-blue-50"/g, 'bg-blue-50 dark:bg-blue-950/40"');
  content = content.replace(/border-blue-200 bg-blue-50/g, 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40');
  
  content = content.replace(/bg-emerald-50"/g, 'bg-emerald-50 dark:bg-emerald-950/40"');
  content = content.replace(/border-emerald-200 bg-emerald-50/g, 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40');
  
  content = content.replace(/bg-orange-50"/g, 'bg-orange-50 dark:bg-orange-950/40"');
  content = content.replace(/border-orange-200 bg-orange-50/g, 'border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/40');
  
  content = content.replace(/bg-red-50/g, 'bg-red-50 dark:bg-red-950/40');
  content = content.replace(/border-red-200/g, 'border-red-200 dark:border-red-900/50');

  // Fix texts inside the cards
  content = content.replace(/text-blue-700/g, 'text-blue-700 dark:text-blue-400');
  content = content.replace(/text-emerald-700/g, 'text-emerald-700 dark:text-emerald-400');
  content = content.replace(/text-orange-700/g, 'text-orange-700 dark:text-orange-400');
  content = content.replace(/text-red-700/g, 'text-red-700 dark:text-red-400');
  content = content.replace(/text-red-800/g, 'text-red-800 dark:text-red-300');
  content = content.replace(/text-orange-600/g, 'text-orange-600 dark:text-orange-400');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed PrestamoTable cards and badges");
}

fixCardsAndBadges();
