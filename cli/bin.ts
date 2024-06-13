import { LayaDCC, Params } from "../assets/LayaDCC/common/LayaDCC";
import {program} from 'commander'

// 主命令配置
program
    .version('0.1.0')
    .description('layadcc2命令工具')
    .argument('<dir>', '输入目录')
    .option('-o, --output <type>', '指定输出目录', 'dcc')
    .option('-m, --merge', '是否合并小文件')
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
    .option('-o, --output <filename>', '输出目录','checkout')
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

function genDCC(dir:string, options:{output?:string}) {
    console.log(`为${dir}生成dcc`)
    if (options.output) {
        console.log(`输出目录将是：${options.output}`);
    }
    let dcc = new LayaDCC();
    let param = new Params();
    // dcc.params = param;
    // param.dccout = Editor.projectPath + '/dcctest/dccout1'
    // dcc.genDCC(Editor.projectPath + '/dcctest/ver1').then(v=>{
    //     console.log('ok');
    // });

}

function getPatchZip(inputDir1:string, inputDir2:string, options:{outputFile?:string}) {
    console.log(`生成补丁文件从 ${inputDir1} 到 ${inputDir2}`);
    console.log(`输出文件：${options.outputFile}`);

}

function checkout(inputDir:string, options:any) {
}