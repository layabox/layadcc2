import { gzip,gunzip } from "zlib";
import { LayaDCC } from "./LayaDCC";
import { cwd } from "process";
import path = require("path");

const args = process.argv.slice(2);

class LayaDCCCmd{
    private dcc = new LayaDCC();
    private _dir:string;
    constructor(){

    }
    set dir(v:string){
        this._dir = path.join(cwd(),v);
    }
    async run(){
        this.dcc.genDCC(this._dir);
    }
}
//
let a = new LayaDCCCmd();
a.dir = args[0];
a.run();

//console.log('kk',a,args)

// gzip('aaass',(err,buff)=>{
//     console.log(buff);
//     gunzip(buff,(err,buff)=>{
//         console.log(buff.toString())
//     })
// })
