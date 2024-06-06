import * as fs from 'fs';
import { LayaDCC, Params } from "../common/LayaDCC";
import { GenDCCZipDialog } from "./GenDCCZipDialog";
import { LayaDCCTools } from '../ExpTools/LayaDCCTools';
import { PackRaw, PackWZip } from '../ExpTools/DCCPackWriters';

interface IConfigData {
    enable: boolean;
    buildCache: boolean;
    desc: string;
    useExportDir: boolean;
    targetPath: string;
    outputPath: string;
    outputFile: string;
    version: string;
    reserveOldAssets: boolean;
    fastMode: boolean;
    mergeSmallFiles: boolean;
    maxSmallFileSize: number;
    maxPackSize: number;
}

export class testDCC {
    @IEditor.onLoad
    static init1() {
    }

    @IEditor.menu('App/tool/生成DCC')
    async genDCC() {
        let data = Editor.getSettings("DCCSettings").data as unknown as IConfigData;
        //检查参数
        if (!data.targetPath || !fs.existsSync(data.targetPath)) {
            alert(`需要设置正确的资源目录。
资源目录设置在：构建发布>DCC `);
            return;
        }
        if (!data.outputPath) {
            alert(`需要设置正确输出目录。
输出目录设置在：构建发布>DCC `);
            return;
        }
        let params = new Params();
        params.dccout = data.outputPath;
        //params.outfile = data.OutputFile;
        params.version = data.version;
        params.fast = data.fastMode;
        params.desc = data.desc;
        params.mergeFile = data.mergeSmallFiles??true;
        params.fileToMerge = data.maxSmallFileSize ?? 100 * 1024;
        params.mergedFileSize = data.maxPackSize ?? 1000 * 1024;
        //a.dir = path.join(Editor.projectPath,'release/web');
        let dcc = new LayaDCC();
        dcc.params = params;
        let st = Date.now();
        await dcc.genDCC(data.targetPath);
        let dt = Date.now() - st;
        console.log('Time:', dt / 1000)

    }

    @IEditor.menu('App/tool/DCC生成Zip')
    async testDCCZip() {
        Editor.showDialog(GenDCCZipDialog, null);
    }

    @IEditor.menu('App/tool/打包目录生成Zip')
    async testDCCPackPath() {
        let zipfile = await LayaDCCTools.genZipByPath('D:/work/ideproj/DCCPlugin/release/web/internal','d:/temp/ddd.zip');
    }

    @IEditor.menu('App/tool/打包文件列表生成Zip')
    async testDCCPackFiles() {
        let zipfile = await LayaDCCTools.genPackByFileList(
            ['D:/work/ideproj/DCCPlugin/release/web/internal/Box.lm',
            'D:/work/ideproj/DCCPlugin/release/web/internal/sky.jpg',
            ],
            'd:/temp/ddd1.zip', PackWZip);
    }    

    @IEditor.menu('App/tool/打包文件列表到pack')
    async testDCCPackToPack() {
        let zipfile = await LayaDCCTools.genPackByFileList(
            ['D:/work/ideproj/DCCPlugin/release/web/internal/Box.lm',
            'D:/work/ideproj/DCCPlugin/release/web/internal/sky.jpg',
            ],
            'd:/temp/ddd1.pack', PackRaw);
    }    

}