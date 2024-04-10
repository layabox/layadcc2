import { LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";

export class DCCUpdate{
    dcc:LayaDCCClient;
    constructor(){
        this.dcc = new  LayaDCCClient();
        let sv = 'http://localhost:8899';// Editor.serverURL;
        this.dcc.urlBase=sv;
    }

    async update(){
        let dcc = this.dcc;
        dcc.headFile='dccout/version.1.0.1.json';
        console.log('初始化dcc开始');
        await dcc.init();
        console.log('初始化dcc结束');
        dcc.injectToLayaDownloader(Laya.Loader.downloader);

        debugger;
        let img = new Laya.Image();
        img.skin='a.png';
        Laya.stage.addChild(img)
    }
}