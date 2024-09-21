import path from "path";
import fs from 'fs'

// // 获取命令行参数
// const args = process.argv.slice(2);

// if (args.length < 2) {
//     console.log('用法: node script.js <dir1> <dir2> [outdir]');
//     process.exit(1);
// }

// // 定义目录路径
// const dir1 = path.resolve(args[0]);
// const dir2 = path.resolve(args[1]);
// const outdir = args[2] ? path.resolve(args[2]) : path.resolve('diffout');


// 递归比较目录
export function compareDirs(dir1Path:string, dir2Path:string, outdirPath:string) {
    const files2 = fs.readdirSync(dir2Path);

    files2.forEach(file => {
        const filePath1 = path.join(dir1Path, file);
        const filePath2 = path.join(dir2Path, file);
        const filePathOut = path.join(outdirPath, file);

        if (!fs.existsSync(filePath1)) {
            //如果1中不存在
            if (fs.statSync(filePath2).isDirectory()) {
                // 如果是目录，递归处理
                fs.mkdirSync(filePathOut, { recursive: true });
                compareDirs(filePath1, filePath2, filePathOut);
            } else {
                // 如果是文件，复制到输出目录
                fs.mkdirSync(path.dirname(filePathOut), { recursive: true });
                fs.copyFileSync(filePath2, filePathOut);
                //console.log(`Copied: ${filePathOut}`);
            }
        } else if (fs.statSync(filePath2).isDirectory()) {
            // 如果两边都存在且是目录，递归处理
            if (fs.statSync(filePath1).isDirectory()) {
                compareDirs(filePath1, filePath2, filePathOut);
            }
        }
    });
}

// 开始比较
// compareDirs(dir1, dir2, outdir);
