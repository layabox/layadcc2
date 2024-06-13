import path from "path";
import fs from 'fs'
import { LayaDCC, Params } from "../assets/LayaDCC/common/LayaDCC";
import { program } from 'commander'
import * as readline from 'node:readline/promises';

let curDir = process.cwd();

function customProgressBar(total: number) {
    let current = 0;
    const progressBarLength = process.stdout.columns - 10; // 为百分比和额外字符留出空间

    return {
        tick() {
            current++;
            const percentage = (current / total * 100).toFixed(0);
            const barsNum = Math.floor(current / total * progressBarLength);
            const bars = '='.repeat(barsNum);
            const spaces = ' '.repeat(progressBarLength - barsNum);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`[${bars}${spaces}] ${percentage}%`);

            if (current >= total) {
                process.stdout.write('\n');
                console.log('完成!');
            }
        },
        complete() {
            return current >= total;
        }
    };
}


// 主命令配置
program
    .version('0.1.0')
    .description('layadcc2命令工具')
    .argument('<dir>', '输入目录')
    .option('-o, --output <type>', '指定输出目录,如果是相对目录，则是相对于输入目录', 'dccout')
    .option('-m, --merge', '是否合并小文件')
    .option('-y, --overwrite', '是否覆盖输出目录（保留历史记录需要覆盖）')
    .action(genDCC)

// 子命令：genpatch
program
    .command('genpatch')
    .description('生成补丁文件')
    .argument('<inputDir1>', '输入目录1')
    .argument('<inputDir2>', '输入目录2')
    .option('-o, --output-file <filename>', '输出文件', 'patch.zip')
    .action(getPatchZip);

program
    .command('checkout')
    .argument('<inputDir>', '输入目录')
    .option('-o, --output <filename>', '输出目录', 'checkout')
    .action(checkout)



function main() {
    // 如果没有提供任何参数，显示帮助信息
    if (!process.argv.slice(2).length) {
        program.outputHelp();
        return;
    }

    // 解析命令行参数
    program.parse();

    const options = program.opts();
    if (options.merge) {
        console.log('合并文件已启用');
    }
}
main();

async function genDCC(dir: string, options: { output?: string, overwrite?: boolean }) {
    console.log(`start generating dcc for ${dir}`)
    if (!path.isAbsolute(dir)) {
        dir = path.join(curDir, dir);
    }
    let output = options.output ?? path.join(dir, 'dccout');
    if (!path.isAbsolute(output)) {
        output = path.join(dir, output);
    }
    if (fs.existsSync(output) && !options.overwrite) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let userR = await rl.question(`the dccout directory:
${output}
already exists, do you want to continue? (y/n)`);
        if (userR == 'y' || userR == 'yes') {
        } else {
            //直接退出
            process.exit(0);
        }
        rl.close();
    }
    console.log(`dccout dir:${output}`);
    let dcc = new LayaDCC();
    let param = new Params();
    let n = 0;
    let consoleW = process.stdout.columns - 10;
    param.progressCB = (curfile: string, percent: number) => {
        if (curfile.length > consoleW) {
            curfile = curfile.substring(0, consoleW);
            curfile += '...';
        }
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${n}:${curfile} `);
        n++;
    }
    dcc.params = param;
    param.dccout = output;
    // const myBar = customProgressBar(40);
    // const timer = setInterval(() => {
    //     myBar.tick();
    //     if (myBar.complete()) {
    //         clearInterval(timer);
    //     }
    // }, 100);    
    await dcc.genDCC(dir);
    process.stdout.write('\n')
    console.log('ok');
}

function getPatchZip(inputDir1: string, inputDir2: string, options: { outputFile?: string }) {
    console.log(`生成补丁文件从 ${inputDir1} 到 ${inputDir2}`);
    console.log(`输出文件：${options.outputFile}`);

}

function checkout(inputDir: string, options: any) {
}