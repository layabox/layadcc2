
import { DCCPackW } from "../common/DCCPackRW";
import * as fs from 'fs'

export interface IPackW{
    //添加一个对象的内容
    addObject(objid:string, buffer:ArrayBuffer):void;
    //保存到一个绝对路径
    save(file:string):Promise<void>;
}

export class PackWZip implements IPackW{
    private zip:IEditor.IZipFileW;
    constructor(){
        this.zip = new IEditor.ZipFileW('');
    }
    addObject(objid: string, buffer: ArrayBuffer): void {
        this.zip.addBuffer(objid,new Uint8Array(buffer));
    }
    async save(file: string) {
        this.zip.save(file);
    }
}

export class PackRaw implements IPackW{
    private pack = new DCCPackW();
    addObject(objid: string, buffer: ArrayBuffer): void {
        this.pack.addObj(objid,buffer);
    }
    async save(file: string) {
        const [index,content] = this.pack.pack(null);
        let buff = this.pack.mergeIndexAndContent(index,content as ArrayBuffer)
        fs.writeFileSync(file, Buffer.from(buff));
    }
}

