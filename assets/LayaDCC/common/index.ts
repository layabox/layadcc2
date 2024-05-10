import * as fs from 'fs';
import { LayaDCC, Params } from "./LayaDCC";

const args = process.argv.slice(2);

export class LayaDCCCmd {
    private dcc = new LayaDCC();
    private _dir: string;
    constructor() {

    }
    set dir(v: string) {
        this._dir = v;
    }

    set params(p: Params) {
        this.dcc.params = p;
    }

    async run() {
        let st = Date.now();
        await this.dcc.genDCC(this._dir);
        let dt = Date.now() - st;
        console.log('Time:', dt / 1000)
        //this.dcc.checkoutTest(this._dir,'head.json')
    }

    /**
     * 
     * @param dir 构建目录，即resource所在目录,例如 xx/release/android/
     * @param platform 
     */
    async genDCCCache(dir: string, platform: "android" | "ios" | "windows") {
        let dcc = new LayaDCC();
        let param = new Params();
        dcc.params = param;
        //确定路径
        let cachePath = dir;
        if (platform == 'android') {
            //查找 android_studio 目录
            let dirs = fs.readdirSync(dir);
            for (let f of dirs) {
                if (f == 'resource') continue;
                let ccs = fs.readdirSync(`${dir}/${f}`);
                if (ccs.indexOf('android_studio') >= 0) {
                    cachePath = `${cachePath}/${f}/android_studio/app/src/main/assets`
                    break;
                }
            }
        } else if (platform == 'ios') {
            //DCCPlugin\ios\DCCPlugin\resource/cache
            //先查找包含 native.json的目录，通常也包含ios
            //在ios下找一个包含resource的目录，就是项目名称
            let dirs = fs.readdirSync(dir);
            for (let f of dirs) {
                if (f == 'resource') continue;
                let ccs = fs.readdirSync(`${dir}/${f}`);
                if (ccs.indexOf('ios') >= 0 && ccs.indexOf('native.json') > 0) {
                    cachePath = `${dir}/${f}/ios/${f}/resource/`
                    break;
                }
            }
        }
        if (cachePath == dir) {
            //没有找到
            throw '没有找到包含存放cache的目录'
        }

        param.dccout = cachePath + '/cache/dcc2.0/';
        await dcc.genDCC(dir + '/resource');
        console.log('完成，输出在:', param.dccout);
    }
}