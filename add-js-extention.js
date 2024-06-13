import fs from 'fs';
import path from 'path';

function addJsExtension(dirPath) {
  fs.readdirSync(dirPath).forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      addJsExtension(filePath);
    } else if (filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      //必须是以.开头的模块
      content = content.replace(/from ['"](\..*)['"]/g, (match, p1) => {
        if(!p1.endsWith('.js')) return `from '${p1}.js'`; 
        return match;
      });
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}

// 用法：node add-js-extension.js <your-output-directory>
addJsExtension('./dist/js');