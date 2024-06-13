import { AppResReader_Native, FileIO_AppRes } from './AppResReader_Native.js';
import { DCCConfig } from './Config.js';
import { DCCObjectWrapper } from './DCCObjectWrapper.js';
import { ObjPack } from './ObjPack.js';
/**
 * 保存在apk资源中的对象包
 * 对android来说是相对于assets目录
 * 对ios来说是相对于resource目录
 */
export class ObjPack_AppRes {
    //path是相对于资源根目录的路径
    constructor(path = 'cache') {
        this.resReader = new AppResReader_Native();
        this.treePacks = [];
        this.blobPacks = [];
        if (path.startsWith('/'))
            path = path.substring(1);
        if (path.endsWith('/'))
            path = path.substring(0, path.length - 1);
        this.cachePath = path;
    }
    async init() {
        //读取head，看有没有打包的文件
        try {
            let frw = new FileIO_AppRes(this.cachePath);
            let head = await frw.read('head.json', 'utf8', true);
            if (!head)
                return false;
            let headobj = JSON.parse(head);
            if (headobj.treePackages) {
                for (let tpack of headobj.treePackages) {
                    let pack = new ObjPack('tree', frw, tpack);
                    await pack.init();
                    this.treePacks.push(pack);
                }
            }
            if (headobj.objPackages) {
                for (let bpack of headobj.objPackages) {
                    let pack = new ObjPack('blob', frw, bpack);
                    await pack.init();
                    this.blobPacks.push(pack);
                }
            }
        }
        catch (e) {
            return false;
        }
        return true;
    }
    async has(oid) {
        let path = this.cachePath + '/objects/' + oid.substring(0, 2) + '/' + oid.substring(2);
        //先判断包中有没有
        for (let pack of this.treePacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                return true;
            }
        }
        for (let pack of this.blobPacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                return true;
            }
        }
        let buff = await this.resReader.getRes(path, 'buffer');
        return !!buff;
    }
    async get(oid) {
        let buff = await this._get(oid);
        let head = new DCCObjectWrapper();
        let decryptBuff = DCCObjectWrapper.unwrapObject(buff, head);
        if (!decryptBuff) {
            return buff;
        }
        return decryptBuff;
    }
    async _get(oid) {
        let path = this.cachePath + '/objects/' + oid.substring(0, 2) + '/' + oid.substring(2);
        //先判断包中有没有
        let buff;
        for (let pack of this.treePacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                buff = await pack.get(oid);
            }
            if (buff) {
                DCCLog(`Get Object from TreePack:${oid}`);
                return buff;
            }
        }
        for (let pack of this.blobPacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                buff = await pack.get(oid);
            }
            if (buff) {
                DCCLog(`Get Object from TreePack:${oid}`);
                return buff;
            }
        }
        return await this.resReader.getRes(path, 'buffer');
    }
}
function DCCLog(msg) {
    if (DCCConfig.log) {
        console.log(msg);
    }
}
