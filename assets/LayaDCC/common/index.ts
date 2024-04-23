import { gzip,gunzip } from "zlib";
import { LayaDCC, Params } from "./LayaDCC";
import { cwd } from "process";
import * as path from "path";
import * as fs from 'fs'
import { LayaDCCTools } from "../ExpTools/LayaDCCTools";

const args = process.argv.slice(2);

export class LayaDCCCmd{
    private dcc = new LayaDCC();
    private _dir:string;
    constructor(){

    }
    set dir(v:string){
        this._dir = v;
    }

    set params(p:Params){
        this.dcc.params = p;
    }
    
    async run(){
        let st = Date.now();
        await this.dcc.genDCC(this._dir);
        let dt = Date.now()-st;
        console.log('Time:',dt/1000)
        //this.dcc.checkoutTest(this._dir,'head.json')
    }

    async genzip(dcc1:string, dcc2:string){
        let dcc = new LayaDCC();
        let param = new Params();
        dcc.params = param;
        param.dccout = Editor.projectPath+'/dcctest/dccout1'
        await dcc.genDCC(Editor.projectPath+'/dcctest/ver1');
        let bb = fs.readFileSync(path.join(Editor.projectPath+'/dcctest/dccout1','objects/69','3253c6c7bb2298e1cf9e7768f5f8342dea87ea'));
        
    
        param.dccout = Editor.projectPath+'/dcctest/dccout2'
        dcc.params = param;
        await dcc.genDCC(Editor.projectPath+'/dcctest/ver2');
    
        let zipfile = await LayaDCCTools.genZipByComparePath(getAbs('dccout1'),getAbs('dccout2'));        
    }
}