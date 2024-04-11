import { IGitFSFileIO } from "./gitfs/GitFS";
import {promisify} from 'util'
import * as fs from 'fs'
import { gunzipSync, gzipSync } from "zlib";
import * as path from "path";

export class NodejsFRW implements IGitFSFileIO{
    repoPath='';
    constructor(basedir:string){
        this.repoPath=basedir;
    }
    async init(repoPath:string){
        this.repoPath=repoPath;
    }
    async read(url:string, encode:'utf8'|'buffer') {
        if(!path.isAbsolute(url)){
            url = path.join(this.repoPath,url);
        }
        if (encode === 'buffer') {
            const buffer = await promisify(fs.readFile)(url);
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }else{
            return  promisify(fs.readFile)(url, 'utf8');
        } 
    }

    async write(url: string, content: string | ArrayBuffer, overwrite?:boolean) {
        let paths = url.split('/');
        paths.pop();
        let absfile = path.resolve(this.repoPath,url);
        let abspath = path.resolve(this.repoPath,paths.join('/'))
        try{
            if(!overwrite && fs.existsSync(absfile))
                return;
            await promisify(fs.access)(abspath)
        }catch(e:any){
            await promisify(fs.mkdir)(abspath,{recursive:true});
        }

        if (content instanceof ArrayBuffer) {
            return promisify(fs.writeFile)(absfile, Buffer.from(content));
        }

        await promisify(fs.writeFile)(absfile, content);
    }

    async isFileExist(url: string) {
        try {
            await promisify(fs.access)(url, fs.constants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    }

    unzip(buff: ArrayBuffer) {
        if (!(buff instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        const buffer = Buffer.from(buff);
        return gunzipSync(buffer).buffer;
    }

    zip(buff: ArrayBuffer) {
        if (!(buff instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        const buffer = Buffer.from(buff);
        return gzipSync(buffer).buffer;
    }

    textencode(text: string) {
        return Buffer.from(text, 'utf-8').buffer;
    }

    textdecode(buffer: ArrayBuffer, off: number) {
        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        return Buffer.from(buffer).toString('utf-8', off);
    }

    async mv(src:string, dst:string){
        return promisify(fs.rename)(src,dst);
    }
}