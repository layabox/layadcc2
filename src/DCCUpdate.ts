import { DCCClientFS_native } from "../assets/LayaDCC/common/DCCClientFS_native";
import { DCCClientFS_web } from "../assets/LayaDCC/common/DCCClientFS_web";
import { DCCDownloader } from "../assets/LayaDCC/common/DCCDownloader";
import { Env } from "../assets/LayaDCC/common/Env";
import { LayaDCCClient as DCCClient } from "../assets/LayaDCC/common/LayaDCCClient";
import { IGitFSFileIO } from "../assets/LayaDCC/common/gitfs/GitFS";

let DCCClientFS = {
    "layaNative":DCCClientFS_native,
    "web":DCCClientFS_web
}[Env.runtimeName];

export class DCCUpdate{
    dcc:DCCClient;
    
    async update(){
        let dccurl = 'http://localhost:8899/dccout/'
        let headFile = 'http://localhost:8899/dccout/version.1.0.1.json';// Editor.serverURL;

        let dcc = this.dcc = new DCCClient( DCCClientFS,dccurl );
        dcc.onlyTransUrl=false;

        console.log('初始化dcc开始');
        let initok = await dcc.init(headFile);
        console.log('初始化dcc结束');
        if(!initok)
            return false;
        
        //把具有dcc功能的下载器插入laya引擎
        let downloader = new DCCDownloader(dcc);
        downloader.injectToLaya();

        let img = new Laya.Image();
        img.skin='atlas/comp.png';
        img.scale(0.2,0.2)
        Laya.stage.addChild(img)
    }

    async clean(){
        let dcc = this.dcc = new DCCClient( DCCClientFS, null);
        dcc.onlyTransUrl=false;
        console.log('初始化dcc开始');
        let initok = await dcc.init(null);
        console.log('初始化dcc结束');
        if(!initok)
            return false;
        await dcc.clean();   
    }
}

//TEST DEBUG TODO
(window as any).DCC = DCCUpdate;