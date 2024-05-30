import { AppResReader_Native } from "../assets/LayaDCC/common/AppResReader_Native";
import { DCCUpdate, UniDCCClient } from "./DCCUpdate";
import { Zip_Native } from "../assets/LayaDCC/common/Zip_Native";
import { Env } from "../assets/LayaDCC/common/Env";
import { LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";

const { regClass, property, Loader } = Laya;

var keyevt = false;

@regClass()
export class AllTest extends Laya.Script {
    //declare owner : Laya.Sprite3D;
    //declare owner : Laya.Sprite;
    out: Laya.TextArea = null;
    outmsg = ''

    @property(String)
    public cmd: string = "";

    onEnable(): void {
        this.out = this.owner.parent.getChildByName('TextArea') as Laya.TextArea;
        this.out.text = 'hello'
        let oldlog = console.log;
        console.log = (...args) => {
            this.outmsg += '\n'
            this.outmsg += args.join(' ');
            this.out.text = this.outmsg;
            try {
                oldlog.call(console, args.join(' '));
            } catch (e) { }
        }

        if (!keyevt) {
            Laya.stage.on(Laya.Event.KEY_DOWN, (event: Laya.Event) => {
                console.log(`keycode ${event.keyCode}, ${event.charCode}, ctrl:${event.ctrlKey},shift:${event.shiftKey},alt:${event.altKey}`);
            })
            keyevt = true;
        }
    }

    async onMouseClick() {
        switch (this.cmd) {
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
            case 'packupdate':
                await this.packUpdate();
                break;
            case 'apkres':
                await this.apkRes();
                break;
        }
    }

    //apk资源测试
    private async apkRes() {
        /**
测试方法：
1. 把dccout2中的内容拷贝到android的assets/cache/dcc2.0/目录下
2. 这个测试不需要服务器，apk中已经包含资源了
         */

        //let dccurl = 'http://localhost:7788/'
        //let headFile = 'http://localhost:7788/version.3.0.0.json'

        let dcc = new UniDCCClient(null);
        let initok = await dcc.init(null, null);
        //读取缓存目录的head.json
        let txt = await dcc.fileIO.read('head.json', 'utf8', true)
        console.log('read head.json:' + txt);

        //用相对目录访问
        let ab = await dcc.readFile("txt.txt");
        let tt = Env.dcodeUtf8(ab);
        console.log('tt:', tt)

        //测试绝对地址的
        dcc.pathMapToDCC = 'http://bu.cun.zai:8899/';

        dcc.injectToLaya();

        let layaload = await Laya.loader.load('http://bu.cun.zai:8899/txt.txt', Laya.Loader.TEXT)
        console.log('' + layaload.data)
        let _txt = this.owner.getChildByName('Text') as Laya.Text;
        _txt.text = layaload.data;
    }

    private async update1() {
        let r = new AppResReader_Native();
        let rtxt1 = await r.getRes('cache/dcc2.0/head.json', 'utf8');
    }

    private async commonDown() {
        /**
         * android测试：
         * 不选择打包资源
         * 版本号1.0.0
         * 导出android
         * 在android的resource开 8899
         * 针对android的resource生成dcc，放到android/dccout,开7788
         */
        let urlbase = 'http://10.10.20.26:8899/';
        let dccurl = 'http://10.10.20.26:7788/'
        let headFile = 'http://10.10.20.26:7788/version.1.0.0.json'

        let dcc = new LayaDCCClient(dccurl, null, { enableLogCheck: true, clear: () => { }, checkLog: console.log });
        dcc.onlyTransUrl = false;
        dcc.pathMapToDCC = urlbase;

        let initok = await dcc.init(headFile, null);
        console.log('init end', initok)
        if (!initok)
            return false;

        //把具有dcc功能的下载器插入laya引擎
        dcc.injectToLaya();

        await dcc.updateAll((p) => { console.log(`${p * 100}%`) });
        console.log('iiiii')
        //由于dcc接管了，所以不应该有到服务器的请求了
        let lmtl = await Laya.loader.load(urlbase + 'mtls/fordcc.txt', Laya.Loader.TEXT);
        console.log('Laya load ret:', lmtl.data)

        dcc.removeFromLaya();
        //由于dcc不再接管，会真正下载，特意改成另外一个文件避免被资源缓存
        let lmtl1 = await Laya.loader.load(urlbase + 'mtls/dccCompare.txt', Laya.Loader.TEXT);
        console.log('Laya load ret2:', lmtl1.data)
        debugger;
    }

    private async downloadBigFile(url: string): Promise<string | null> {
        let cachePath = conch.getCachePath();
        let localfile = cachePath + url.substring(url.lastIndexOf('/'));

        return new Promise((resolve, reject) => {
            downloadBigFile(url, localfile, (total, now, speed) => {
                console.log(`downloading:${Math.floor((now / total) * 100)}`)
                return false;
            }, (curlret, httpret) => {
                if (curlret != 0 || httpret < 200 || httpret >= 300) {
                    resolve(null);
                }
                else {
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
    private async zipUpdate() {
        let zipfile = await this.downloadBigFile('http://10.10.20.26:8899/update/dccout1.zip')
        //先用dccout2
        //然后把1打包，保存到手机上
        //用zip更新
        //cache path
        //let dccurl = getAbs('dccout1');
        let dccurl = 'http://101.10.20.26:6677/dccout2'
        let client = new UniDCCClient(dccurl);
        let iniok = await client.init(dccurl + '/head.json', null);
        await client.updateAll(null);
        //await client.updateByZip(zipfile, window.conch?Zip_Native:Zip_Nodejs,null);
        await client.updateByZip(zipfile, Zip_Native, null);
        await client.clean();
        //let headAfterUpdate = await client.readFile('head.json');
        //head.json不是gitfs的，需要底层访问
        let headAfterUpdate = await client.fileIO.read('head.json', 'utf8', true) as string;
        let headobj = JSON.parse(headAfterUpdate)
        let txtbuf = await client.readFile('txt.txt');
        let txt = Env.dcodeUtf8(txtbuf);
        //txt='ver1'
        console.log(`txt:${txt}`);
        //verify(headobj.root=='90ca87c602f132407250bcf2ae8368f629ec43d7','updateByZip 要更新head.json');

    }

    private async packUpdate() {
        let packResp = await fetch('http://10.10.20.26:7788/update/ddd1.pack');
        if(!packResp.ok)throw 'err1';
        let packBuff = await packResp.arrayBuffer();
        if(!packBuff) throw 'err2';

        let dccurl = 'http://10.10.20.26:7788';
        let client = new LayaDCCClient(dccurl);
        let iniok = await client.init(dccurl + '/head.json', null);
        await client.updateAll(null);
        //await client.updateByZip(zipfile, window.conch?Zip_Native:Zip_Nodejs,null);
        await client.updateByPack(packBuff);
        await client.clean();
    }

    private async clean() {
        Laya.TextRender.textRenderInst.showAtlas(0, 'black', 10, 10, 1024, 1024);

        let dcc = new DCCUpdate();
        await dcc.clean()
    }

    private async updateAll() {
        let dcc = new DCCUpdate();
        await dcc.updateAll((p: number) => {

        });

    }

    private async imgSrc() {
        let dcc = new DCCUpdate();
        await dcc.update();
        let img2 = new Laya.Image();
        img2.skin = 'resources/tt.jpg'
        img2.scale(0.2, 0.2);
        img2.pos(100, 100);
        Laya.stage.addChild(img2);

    }
}