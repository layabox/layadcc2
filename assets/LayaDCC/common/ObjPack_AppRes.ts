import { AppResReader_Native } from "./AppResReader_Native";
import { IObjectPack } from "./gitfs/GitFS";

/**
 * 保存在apk资源中的对象包
 * 对android来说是相对于assets目录
 * 对ios来说是相对于resource目录
 */

export class ObjPack_AppRes implements IObjectPack{
    cachePath:string;
    //path是相对于资源根目录的路径
    resReader = new AppResReader_Native();
    constructor(path='cache'){
        if(path.startsWith('/'))path=path.substring(1);
        if(path.endsWith('/'))path=path.substring(0,path.length-1);
        this.cachePath=path;
    }

    init(): Promise<boolean> {
        return;
    }
    async has(oid: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    async get(oid: string): Promise<ArrayBuffer> {
        let path = this.cachePath+'/objects/'+oid.substring(0,2)+'/'+oid.substring(2);
        return await this.resReader.getRes(path,'buffer') as ArrayBuffer
    }
}