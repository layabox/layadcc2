import { DCCDownloader } from "../assets/LayaDCC/common/DCCDownloader";
import { LayaDCCClient as DCCClient } from "../assets/LayaDCC/common/LayaDCCClient";

export class UniDCCClient extends DCCClient{
    constructor(dccurl:string){
        super(null,dccurl);
    }
}

export class DCCUpdate{
    dcc:DCCClient;
    
    async update(head='version.1.0.0.json'){
        let dccurl = 'http://localhost:7788/'
        let headFile = 'http://localhost:7788/'+head;// Editor.serverURL;

        let dcc = this.dcc = new UniDCCClient(dccurl );
        dcc.onlyTransUrl=false;

        console.log('初始化dcc开始');
        let initok = await dcc.init(headFile,null);
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

    //更新所有的。要有进度统计
    async updateAll(progress:(p:number)=>void,head='version.3.0.0.json'){
        if(typeof progress === 'function' && typeof head=='string'){}
        else throw 'bad params'
        let dccurl = 'http://localhost:7788/'
        let headFile = 'http://localhost:7788/'+head;// Editor.serverURL;

        let dcc = this.dcc = new DCCClient(null,dccurl );
        dcc.onlyTransUrl=false;

        console.log('初始化dcc开始');
        let initok = await dcc.init(headFile,null);
        console.log('初始化dcc结束');
        if(!initok)
            return false;
        //遍历
        dcc.updateAll(p=>{console.log('progress:',p*100);});
    }

    async clean(){
        let dcc = this.dcc = new DCCClient( null, null);
        dcc.onlyTransUrl=false;
        console.log('初始化dcc开始');
        let initok = await dcc.init(null,null);
        console.log('初始化dcc结束');
        if(!initok)
            return false;
        await dcc.clean();   
    }
}

//TEST DEBUG TODO
(window as any).DCC = DCCUpdate;