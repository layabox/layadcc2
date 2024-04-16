import { gzip,gunzip } from "zlib";
import { LayaDCC, Params } from "./LayaDCC";
import { cwd } from "process";
import * as path from "path";

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
}
//


//console.log('kk',a,args)

// gzip('aaass',(err,buff)=>{
//     console.log(buff);
//     gunzip(buff,(err,buff)=>{
//         console.log(buff.toString())
//     })
// })
