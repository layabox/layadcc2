import * as fs from 'fs';
import { LayaDCCCmd } from "../common";
import { Params } from "../common/LayaDCC";
import { GenDCCZipDialog } from "./GenDCCZipDialog";

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
        let a = new LayaDCCCmd();
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
        params.mergeFile = data.mergeSmallFiles;
        params.fileToMerge = data.maxSmallFileSize ?? 100 * 1024;
        params.mergedFileSize = data.maxPackSize ?? 1000 * 1024;
        a.dir = data.targetPath;
        a.params = params;

        //a.dir = path.join(Editor.projectPath,'release/web');
        a.run();
    }

    @IEditor.menu('App/tool/DCC生成Zip')
    async testDCCZip() {
        Editor.showDialog(GenDCCZipDialog, null);
        //let a = new LayaDCCCmd();
        //a.genzip('','');
    }

}