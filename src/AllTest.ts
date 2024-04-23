//import path, { resolve } from "path";
import { AppResReader_Native } from "../assets/LayaDCC/common/AppResReader_Native";
import { DCCDownloader } from "../assets/LayaDCC/common/DCCDownloader";
import { DCCUpdate, UniDCCClient } from "./DCCUpdate";
import { Zip_Native } from "../assets/LayaDCC/common/Zip_Native";
import { Env } from "../assets/LayaDCC/common/Env";

const { regClass, property, Loader} = Laya;

@regClass()
export class AllTest extends Laya.Script {
    //declare owner : Laya.Sprite3D;
    //declare owner : Laya.Sprite;

    @property(String)
    public cmd: string = "";

    //组件被激活后执行，此时所有节点和组件均已创建完毕，此方法只执行一次
    //onAwake(): void {}

    //组件被启用后执行，例如节点被添加到舞台后
    //onEnable(): void {}

    //组件被禁用时执行，例如从节点从舞台移除后
    //onDisable(): void {}

    //第一次执行update之前执行，只会执行一次
    //onStart(): void {}

    //手动调用节点销毁时执行
    //onDestroy(): void {}

    //每帧更新时执行，尽量不要在这里写大循环逻辑或者使用getComponent方法
    //onUpdate(): void {}

    //每帧更新时执行，在update之后执行，尽量不要在这里写大循环逻辑或者使用getComponent方法
    //onLateUpdate(): void {}

    //鼠标点击后执行。与交互相关的还有onMouseDown等十多个函数，具体请参阅文档。
    async onMouseClick() {
        switch(this.cmd){
            case 'imgSrc':
                await this.imgSrc();
                break;
            case 'update':
                this.update1();
                break;
            case 'updateAll':
                await this.updateAll();
                break;
            case 'clean':
                await this.clean();
                break;
            case 'commondown':
                await this.commonDown();
                break;
            case 'zipupdate':
                await this.zipUpdate();
                break;
            case 'apkres':
                await this.apkRes();
                break;
        }
    }

    //apk资源测试
    private async apkRes(){
        /**
测试方法：
1. 把dccout2中的内容拷贝到android的assets/cache/dcc2.0/目录下
2. 这个测试不需要服务器，apk中已经包含资源了
         */

        //let dccurl = 'http://localhost:7788/'
        //let headFile = 'http://localhost:7788/version.3.0.0.json'
        
        let dcc = new UniDCCClient( null );
        let initok = await dcc.init(null,null);
        //读取缓存目录的head.json
        let txt = await dcc.fileIO.read('head.json','utf8',true)
        console.log('read head.json:'+txt);

        //用相对目录访问
        let ab = await dcc.readFile("txt.txt");
        let tt = (new TextDecoder()).decode(ab);
        console.log('tt:',tt)

        //测试绝对地址的
        dcc.pathMapToDCC= 'http://bu.cun.zai:8899/';

        let down = new DCCDownloader(dcc)
        down.injectToLaya();

        let layaload = await Laya.loader.load('http://bu.cun.zai:8899/txt.txt',Laya.Loader.TEXT)
        console.log(''+layaload.data)
        let _txt = this.owner.getChildByName('Text') as Laya.Text;
        _txt.text = layaload.data;
    }

    private async update1(){
        let r = new AppResReader_Native();
        let rtxt1 = await r.getRes('cache/dcc2.0/head.json','utf8');
    }

    private async commonDown(){
        debugger;
        let urlbase = 'http://localhost:8899/';
        let dccurl = 'http://localhost:7788/'
        let headFile = 'http://localhost:7788/version.3.0.0.json'

        let dcc = new UniDCCClient( dccurl );
        dcc.onlyTransUrl=false;
        dcc.pathMapToDCC= urlbase;

        let initok = await dcc.init(headFile,null);
        if(!initok)
            return false;
        
        //把具有dcc功能的下载器插入laya引擎
        let downloader = new DCCDownloader(dcc);
        downloader.injectToLaya();

        let lmtl = await Laya.loader.load(urlbase+'mtls/Material.lmat');

        downloader.removeFromLaya();
        let lmtl1 = await Laya.loader.load(urlbase+'mtls/Material.lmat');
        debugger;
    }

    private async downloadBigZip(url:string):Promise<string|null>{
        let cachePath = conch.getCachePath();
        let localfile =  cachePath+url.substring(url.lastIndexOf('/'));
    
        return new Promise((resolve,reject)=>{
                downloadBigFile(url, localfile, (total, now, speed) => {
                    console.log(`downloading:${Math.floor((now / total) * 100)}`)
                    return false;
                }, (curlret, httpret) => {
                    if (curlret != 0 || httpret < 200 || httpret >= 300) {
                        //onEvent('downloadError');
                        resolve(null);
                    }
                    else {
                        //onEvent('downloadOK');
                        resolve(localfile);
                    }
                }, 10, 100000000);        
            }
        );
    }

    /**
测试方法：
1. 生成zip包，old=ver2,new=ver1。 注意不能直接把dccout1打zip，因为更新用的zip包只是一堆对象，不是原来的文件结构
2. 这个zip包放到项目服务器 :8899/update/dccout1.zip 
2. dcc初始化为dccout2
3. 下载zip更新。最后再取 txt.txt应该是 "ver1.txt"
    */
    private async zipUpdate(){
        let zipfile = await this.downloadBigZip('http://10.10.20.26:8899/update/dccout1.zip')
        //先用dccout2
        //然后把1打包，保存到手机上
        //用zip更新
            //cache path
        //let dccurl = getAbs('dccout1');
        let dccurl='http://10.10.20.26:6666/dccout2'
        let client = new UniDCCClient(dccurl);
        let iniok = await client.init(dccurl+'/head.json', null);
        await client.updateAll(null);
        //await client.updateByZip(zipfile, window.conch?Zip_Native:Zip_Nodejs,null);
        await client.updateByZip(zipfile, Zip_Native,null);
        await client.clean();
        //let headAfterUpdate = await client.readFile('head.json');
        //head.json不是gitfs的，需要底层访问
        let headAfterUpdate = await client.fileIO.read('head.json','utf8',true) as string;
        let headobj = JSON.parse(headAfterUpdate)
        let txtbuf = await client.readFile('txt.txt');
        let txt = Env.dcodeUtf8(txtbuf);
        //txt='ver1'
        console.log(`txt:${txt}`);
        //verify(headobj.root=='90ca87c602f132407250bcf2ae8368f629ec43d7','updateByZip 要更新head.json');
    
    }

    private async clean(){
        debugger;
        let dcc = new DCCUpdate();
        await dcc.clean()
    }

    private async updateAll(){
        let dcc = new DCCUpdate();
        await dcc.updateAll((p:number)=>{

        });

    }

    private async imgSrc(){
        debugger;
        let dcc = new DCCUpdate();
        await dcc.update();
        let img2 = new Laya.Image();
        img2.skin = 'resources/tt.jpg'
        img2.scale(0.2,0.2);
        img2.pos(100,100);
        Laya.stage.addChild(img2);

    }
}