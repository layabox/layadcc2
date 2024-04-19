import { DCCFS_NodeJS } from "./DCCFS_NodeJS";
import {promisify} from 'util'
import * as fs from 'fs'
import * as path from "path";
import { IGitFSFileIO } from "./gitfs/GitFS";

/**
 * 客户端使用的基于nodejs的文件接口
 * 主要是封装了一个缓存目录
 * 
 */
export class DCCClientFS_NodeJS extends DCCFS_NodeJS{
    private cachePath='d:/temp/dcctest/cache/';

    override async init(repoPath: string,cachePath:string): Promise<void> {
        await super.init(repoPath,cachePath);
        if(cachePath) this.cachePath = cachePath;
        await promisify(fs.mkdir)(path.join(this.cachePath,'objects'),{recursive:true});
    }

    override async read(url: string, encode: "utf8" | "buffer",onlylocal:boolean): Promise<string | ArrayBuffer> {
        //先从本地读取，如果没有就从远程下载
        if(path.isAbsolute(url)){
            throw 'only 相对'
        }
        let ret:string|ArrayBuffer;
        let absLocal = path.join(this.cachePath,url);
        try{
            ret = await promisify(fs.readFile)(absLocal);
            if(encode=='utf8'){
                ret = (new TextDecoder()).decode(ret);
            }
        }catch(e:any){
        }
        if(!ret){
            if(onlylocal)
                return null;
            if(this.repoPath){
                let resp = await this.fetch(this.repoPath+url);
                if(encode=='utf8'){
                    ret = await resp.text();
                }else{
                    ret = await resp.arrayBuffer();
                }
                await this.write(url,ret);
            }
        }
        return ret;
    }

    override async fetch(url: string): Promise<Response> {
        //测试用：只是本地
        if(url.startsWith('file:///')){
            url = url.replace('file:///','');
        }
        if(path.isAbsolute(url)){
            let buf = fs.readFileSync(url);
            return {
                ok:true,
                arrayBuffer:async ()=>{return buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);},
                text:async ()=>{ return (new TextDecoder()).decode(buf);}
            } as unknown as Response;
        }
        throw 'xx1'
    }

    //这个与DCCFS_Nodejs不同，那个是生成，这个是保存到缓存
    override async write(url: string, content: string | ArrayBuffer, overwrite?:boolean) {
        if(path.isAbsolute(url)){
            throw 'only rel'
            //url = path.relative(this.cachePath,url);
        }
        let paths = url.split('/');
        paths.pop();
        let absfile = path.resolve(this.cachePath,url);
        let abspath = path.resolve(this.cachePath,paths.join('/'))
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
    
    override async enumCachedObjects(callback: (objid: string) => void): Promise<void> {
        let objects = path.join(this.cachePath,'objects');
        let idPres = fs.readdirSync(objects);
        for(let pre of idPres){
            let cpath = objects+'/'+pre;
            let objs = fs.readdirSync(cpath);
            for(let o of objs){
                callback(pre+o);
            }
        }
    }    
}