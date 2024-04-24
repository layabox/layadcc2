import { cwd } from "process";
import { LayaDCCCmd } from "../common";
import * as path from 'path';
import { Params } from "../common/LayaDCC";
import { DCCAutoTest } from "../../../src/DCCAutoTest";
import { GenDCCZipDialog } from "./GenDCCZipDialog";

interface IConfigData{
    enable:boolean;
    buildCache:boolean;
    desc:string;
    useExportDir:boolean;
    targetPath:string;
    outputPath:string;
    outputFile:string;
    version:string;
    reserveOldAssets:boolean;
    fastMode:boolean;
    mergeSmallFiles:boolean;
    maxSmallFileSize:number;
    maxPackSize:number;
}

export class testDCC{
    @IEditor.onLoad
    static init1(){
        console.log('xiiii')
    }

    @IEditor.menu('App/tool/DCC')
    async genDCC(){
        let a = new LayaDCCCmd();
        let data = Editor.getSettings("DCCSettings").data as unknown as IConfigData;
        data.enable;
        let params = new Params();
        params.dccout = data.outputPath;
        //params.outfile = data.OutputFile;
        params.version = data.version;
        params.fast = data.fastMode;
        params.desc = data.desc;
        params.mergeFile = data.mergeSmallFiles;
        params.fileToMerge = data.maxSmallFileSize*1024;
        params.mergedFileSize=data.maxPackSize*1024;
        if(!data.useExportDir && data.targetPath )
            a.dir = data.targetPath;
        else{
            a.dir;
        }
        a.params = params;
        
        //a.dir = path.join(Editor.projectPath,'release/web');
        a.run();        
    }    

    @IEditor.menu('App/tool/DCCTest')
    async testDCC(){
        await DCCAutoTest.run();
    }

    @IEditor.menu('App/tool/DCCZip')
    async testDCCZip(){
        Editor.showDialog(GenDCCZipDialog, null);
        //let a = new LayaDCCCmd();
        //a.genzip('','');
    }

}