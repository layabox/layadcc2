import { DCCDownloader } from "../assets/LayaDCC/common/DCCDownloader";
import { DCCUpdate, UniDCCClient } from "./DCCUpdate";

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
            case 'updateAll':
                await this.updateAll();
                break;
            case 'clean':
                await this.clean();
                break;
            case 'commondown':
                await this.commonDown();
                break;
        }
    }

    private async commonDown(){
        debugger;
        let urlbase = 'http://localhost:8899/';
        let dccurl = 'http://localhost:7788/'
        let headFile = 'http://localhost:7788/version.3.0.0.json'

        let dcc = new UniDCCClient( dccurl );
        dcc.onlyTransUrl=false;
        dcc.pathMapToDCC= urlbase;

        let initok = await dcc.init(headFile);
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