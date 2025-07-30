import { LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";
import * as fs from 'fs'
import * as path from "path";
import { LayaDCCReader } from "../assets/LayaDCC/common/LayaDCCReader";
import { DCCClientFS_NodeJS } from "../assets/LayaDCC/common/DCCClientFS_NodeJS";

async function test() {
    let urlbase = 'https://psbc-minio.layaverse.com/upload/svn/resource/psbc/';
    let dccurl = 'https://psbc-minio.layaverse.com/upload/svn/resource/psbc/.dcc/'
    let headFile = 'https://psbc-minio.layaverse.com/upload/svn/resource/psbc/.dcc/head.json'

    let frw = DCCClientFS_NodeJS;
    let dccc = new LayaDCCClient(dccurl, frw, { enableLogCheck: true, clear: () => { }, checkLog: console.log });

    let cachePath = 'd:/temp/dcccheckouturl/';
    let initok = await dccc.init(headFile, cachePath);
    console.log('init end', initok)
    await dccc.updateAll((p)=>{
        console.log('proc:',p)
    });

    let outdir = 'd:/temp/dcctest1';
    fs.mkdirSync(outdir, { recursive: true });

    let dcc = new LayaDCCReader();
    await dcc.init(cachePath+'head.json')
    dcc.checkout(outdir);
}

test();