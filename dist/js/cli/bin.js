#!/usr/bin/env node
import path from "path";
import fs from 'fs';
import { LayaDCC, Params } from '../assets/LayaDCC/common/LayaDCC.js';
import { program } from 'commander';
import * as readline from 'node:readline/promises';
import { LayaDCCTools } from '../assets/LayaDCC/ExpTools/LayaDCCTools.js';
let curDir = process.cwd();
function customProgressBar(total) {
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
    .option('-o, --output <outDir>', '指定输出目录,如果是相对目录，则是相对于输入目录', 'dccout')
    .option('-m, --merge', '是否合并小文件')
    .option('-y, --overwrite', '是否覆盖输出目录（保留历史记录需要覆盖）')
    .action(genDCC);
// 子命令：genpatch
program
    .command('genpatch')
    .description('生成补丁文件')
    .argument('<inputDir1>', '输入目录1')
    .argument('<inputDir2>', '输入目录2')
    .option('-f, --output-file <filename>', '输出文件', 'patch.zip')
    .action(genPatchZip);
program
    .command('checkout')
    .description('把dcc目录恢复成原始结构')
    .argument('<inputDir>', '输入目录')
    .option('--head <headFile>', '根文件,不指定则使用head.json', 'head.json')
    .option('-d, --outdir <outDir>', '输出目录', 'checkout')
    .action(checkout);
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
async function genDCC(dir, options) {
    var _a;
    console.log(`start generating dcc for ${dir}`);
    if (!path.isAbsolute(dir)) {
        dir = path.join(curDir, dir);
    }
    let output = (_a = options.output) !== null && _a !== void 0 ? _a : path.join(dir, 'dccout');
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
        }
        else {
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
    param.progressCB = (curfile, percent) => {
        if (curfile.length > consoleW) {
            curfile = curfile.substring(0, consoleW);
            curfile += '...';
        }
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${n}:${curfile} `);
        n++;
    };
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
    process.stdout.write('\n');
    console.log('ok');
}
async function genPatchZip(inputDir1, inputDir2, options) {
    var _a;
    if (!path.isAbsolute(inputDir1)) {
        inputDir1 = path.join(curDir, inputDir1);
    }
    if (!path.isAbsolute(inputDir2)) {
        inputDir2 = path.join(curDir, inputDir2);
    }
    let output = (_a = options.outputFile) !== null && _a !== void 0 ? _a : "patch.zip";
    if (!path.isAbsolute(output)) {
        output = path.join(curDir, output);
    }
    console.log(`generate patch zip  ${inputDir1} to ${inputDir2}`);
    let zipfile = await LayaDCCTools.genZipByComparePath(inputDir1, inputDir2, '', output);
    console.log(`ok. patch file：${zipfile}`);
}
async function checkout(inputDir, options) {
    let head = options.head;
    let outDir = options.outdir;
    inputDir = path.isAbsolute(inputDir) ? inputDir : path.join(curDir, inputDir);
    if (!fs.existsSync(inputDir)) {
        console.log('input directory not exist!');
        process.exit(1);
    }
    head = path.join(inputDir, head);
    await LayaDCCTools.checkout(head, outDir);
    console.log('ok, checkedout to :', outDir);
}
