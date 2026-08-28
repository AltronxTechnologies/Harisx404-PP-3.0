import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dirToScan = path.join(process.cwd(), 'app');

walkDir(dirToScan, function(filePath: string) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    content = content.replace(/Braydon Coyer/g, 'Muhammad Haris');
    content = content.replace(/BraydonCoyer/gi, 'harisx404');
    content = content.replace(/Braydon/g, 'Haris');
    content = content.replace(/braydon/g, 'haris');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Replaced in ${filePath}`);
    }
  }
});
