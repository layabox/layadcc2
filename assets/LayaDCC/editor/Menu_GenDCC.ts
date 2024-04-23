import { cwd } from "process";
import { LayaDCCCmd } from "../common";
import * as path from 'path';
import { Params } from "../common/LayaDCC";
import { DCCAutoTest } from "../../../src/DCCAutoTest";

interface IConfigData{
    enable:boolean;
    desc:string;
    TargetPath:string;
    OutputPath:string;
    OutputFile:string;
    version:string;
    ReserveOldAssets:boolean;
    FastMode:boolean;
    mergeSmallFiles:boolean;
    MaxSmallFileSize:number;
    MaxPackSize:number;
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
        params.dccout = data.OutputPath;
        params.outfile = data.OutputFile;
        params.version = data.version;
        params.fast = data.FastMode;
        params.desc = data.desc;
        params.fileToMerge = data.MaxSmallFileSize*1024;
        params.mergedFileSize=data.MaxPackSize*1024;
        params.mergeFile = data.mergeSmallFiles;
        a.dir = data.TargetPath;
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
        let a = new LayaDCCCmd();
        a.genzip('','');
    }

}