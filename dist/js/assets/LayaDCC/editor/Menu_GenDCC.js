import * as fs from 'fs';
import { LayaDCC, Params } from '../common/LayaDCC.js';
import { GenDCCZipDialog } from './GenDCCZipDialog.js';
import { LayaDCCTools } from '../ExpTools/LayaDCCTools.js';
import { PackRaw, PackWZip } from '../ExpTools/DCCPackWriters.js';
export class testDCC {
    static init1() {
    }
    async genDCC() {
        var _a, _b, _c;
        let data = Editor.getSettings("DCCSettings").data;
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
        params.mergeFile = (_a = data.mergeSmallFiles) !== null && _a !== void 0 ? _a : true;
        params.fileToMerge = (_b = data.maxSmallFileSize) !== null && _b !== void 0 ? _b : 100 * 1024;
        params.mergedFileSize = (_c = data.maxPackSize) !== null && _c !== void 0 ? _c : 1000 * 1024;
        //a.dir = path.join(Editor.projectPath,'release/web');
        let dcc = new LayaDCC();
        dcc.params = params;
        let st = Date.now();
        await dcc.genDCC(data.targetPath);
        let dt = Date.now() - st;
        console.log('Time:', dt / 1000);
    }
    async testDCCZip() {
        Editor.showDialog(GenDCCZipDialog, null);
    }
    async testDCCPackPath() {
        let zipfile = await LayaDCCTools.genZipByPath('D:/work/ideproj/DCCPlugin/release/web/internal', 'd:/temp/ddd.zip');
    }
    async testDCCPackFiles() {
        let zipfile = await LayaDCCTools.genPackByFileList(['D:/work/ideproj/DCCPlugin/release/web/internal/Box.lm',
            'D:/work/ideproj/DCCPlugin/release/web/internal/sky.jpg',
        ], 'd:/temp/ddd1.zip', PackWZip);
    }
    async testDCCPackToPack() {
        let zipfile = await LayaDCCTools.genPackByFileList(['D:/work/ideproj/DCCPlugin/release/web/internal/Box.lm',
            'D:/work/ideproj/DCCPlugin/release/web/internal/sky.jpg',
        ], 'd:/temp/ddd1.pack', PackRaw);
    }
}
__decorate([
    IEditor.menu('App/tool/生成DCC')
], testDCC.prototype, "genDCC", null);
__decorate([
    IEditor.menu('App/tool/DCC生成Zip')
], testDCC.prototype, "testDCCZip", null);
__decorate([
    IEditor.menu('App/tool/打包目录生成Zip')
], testDCC.prototype, "testDCCPackPath", null);
__decorate([
    IEditor.menu('App/tool/打包文件列表生成Zip')
], testDCC.prototype, "testDCCPackFiles", null);
__decorate([
    IEditor.menu('App/tool/打包文件列表到pack')
], testDCC.prototype, "testDCCPackToPack", null);
__decorate([
    IEditor.onLoad
], testDCC, "init1", null);
