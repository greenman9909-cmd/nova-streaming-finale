const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace fetch('/api/...
  content = content.replace(/fetch\(\s*['"]\/(api\/.*?)['"]\s*(,|\))/g, 'fetch(`${import.meta.env.VITE_API_URL || ""}/$1`$2');
  
  // Replace fetch(`/api/...
  content = content.replace(/fetch\(\s*`\/(api\/.*?)`\s*(,|\))/g, 'fetch(`${import.meta.env.VITE_API_URL || ""}/$1`$2');
  
  // Replace src={`/api/...
  content = content.replace(/src=\{\`\/(api\/.*?)\`\}/g, 'src={`${import.meta.env.VITE_API_URL || ""}/$1`}');
  
  // Handle specific constants
  content = content.replace(/const STREAMED_BASE_URL = ['"]\/(api\/sports)['"]/, 'const STREAMED_BASE_URL = `${import.meta.env.VITE_API_URL || ""}/$1`');
  content = content.replace(/const API_BASE = ['"]\/(api\/auth)['"]/, 'const API_BASE = `${import.meta.env.VITE_API_URL || ""}/$1`');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('c:/Users/owais/Downloads/nova main/nova-frontend/src');
