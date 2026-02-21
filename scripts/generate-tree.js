const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'coverage', 'venv', '__pycache__'];
const IGNORE_FILES = ['.xlsx', '.xls', '.pdf', '.zip', '.csv', '.msg', '.vbs', '.pyc', '.log'];

// Statistika
const stats = {
  totalDirs: 0,
  totalFiles: 0,
  ignoredDirs: 0,
  ignoredFiles: 0,
  filesByExtension: {}
};

function shouldIgnore(name, isFile) {
  // Ignoriši direktorijume
  if (!isFile && IGNORE_DIRS.includes(name)) {
    stats.ignoredDirs++;
    return true;
  }
  
  // Ignoriši fajlove po ekstenziji
  if (isFile) {
    const lowerName = name.toLowerCase();
    if (IGNORE_FILES.some(ext => lowerName.endsWith(ext))) {
      stats.ignoredFiles++;
      return true;
    }
  }
  
  // Ignoriši sve što počinje sa tačkom
  if (name.startsWith('.') && name !== '.env.example' && name !== '.gitignore') {
    if (isFile) stats.ignoredFiles++;
    else stats.ignoredDirs++;
    return true;
  }
  
  return false;
}

function generateTree(dir, prefix = '', level = 0, maxLevel = 3) {
  if (level > maxLevel) return '';
  
  let items;
  try {
    items = fs.readdirSync(dir);
  } catch (e) {
    return '';
  }
  
  let tree = '';
  const filtered = items
    .filter(item => {
      const fullPath = path.join(dir, item);
      try {
        const stats_item = fs.statSync(fullPath);
        const isFile = !stats_item.isDirectory();
        
        // Track all items before filtering
        if (isFile) {
          const ext = path.extname(item).toLowerCase() || 'no-extension';
          stats.filesByExtension[ext] = (stats.filesByExtension[ext] || 0) + 1;
        }
        
        return !shouldIgnore(item, isFile);
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const aPath = path.join(dir, a);
        const bPath = path.join(dir, b);
        const aIsDir = fs.statSync(aPath).isDirectory();
        const bIsDir = fs.statSync(bPath).isDirectory();
        
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      } catch (e) {
        return 0;
      }
    });
  
  filtered.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const isLast = index === filtered.length - 1;
    
    let file_stats;
    try {
      file_stats = fs.statSync(fullPath);
    } catch (e) {
      return;
    }
    
    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    
    tree += `${prefix}${connector}${item}`;
    
    if (file_stats.isDirectory()) {
      stats.totalDirs++;
      tree += '/\n';
      tree += generateTree(fullPath, newPrefix, level + 1, maxLevel);
    } else {
      stats.totalFiles++;
      tree += '\n';
    }
  });
  
  return tree;
}

console.log('🌳 Generating project tree...\n');

const projectName = path.basename(process.cwd());
const treeContent = generateTree('.', '', 0, 3);
const tree = `# Project Structure\n\n\`\`\`\n${projectName}/\n${treeContent}\`\`\`\n`;

// Dodaj summary na kraju
const summary = `
## Summary

- **Total Directories**: ${stats.totalDirs}
- **Total Files**: ${stats.totalFiles}
- **Ignored Directories**: ${stats.ignoredDirs}
- **Ignored Files**: ${stats.ignoredFiles}

### Files by Extension
${Object.entries(stats.filesByExtension)
  .sort((a, b) => b[1] - a[1])
  .map(([ext, count]) => `- **${ext}**: ${count}`)
  .join('\n')}

### Ignored Patterns
- **Directories**: ${IGNORE_DIRS.join(', ')}
- **File Extensions**: ${IGNORE_FILES.join(', ')}
`;

const fullContent = tree + summary;

fs.writeFileSync('PROJECT-STRUCTURE.md', fullContent, 'utf8');

// Console output
console.log('✅ Generated: PROJECT-STRUCTURE.md\n');
console.log('📊 Summary:');
console.log(`   📁 Directories: ${stats.totalDirs} (ignored: ${stats.ignoredDirs})`);
console.log(`   📄 Files: ${stats.totalFiles} (ignored: ${stats.ignoredFiles})`);
console.log(`\n🔝 Top 5 file types:`);
Object.entries(stats.filesByExtension)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([ext, count]) => {
    console.log(`   ${ext}: ${count}`);
  });