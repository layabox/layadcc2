/**
 * web端的dcc文件接口
 * 
 */

import { IndexDBFileRW } from "./IndexDBFileRW";
import { IGitFSFileIO } from "./gitfs/GitFS";

//访问服务器文件的接口。只要读就行了
export class DCCClientFS_web implements IGitFSFileIO{
    private dbfile:IndexDBFileRW;
    repoPath:string;

    async init(repoPath:string){
        if(!repoPath.endsWith('/'))repoPath+='/';
        this.repoPath =repoPath;

        this.dbfile = new IndexDBFileRW();
        await this.dbfile.init('');
    }
    
    async read(url: string, encode: "utf8" | "buffer"): Promise<string | ArrayBuffer> {
        //先从本地读取，如果没有就从远程下载
        let ret:string|ArrayBuffer;
        try{
            ret = await this.dbfile.read(url,encode)
        }catch(e:any){
            let resp = await fetch(this.repoPath+url);
            if(encode=='utf8'){
                ret = await resp.text();
                await this.dbfile.write(url,ret);
            }else{
                ret = await resp.arrayBuffer();
                await this.dbfile.write(url,ret);
            }
        }
        return ret;
    }

    //write只能往本地写
    async write(url: string, content: string | ArrayBuffer, overwrite?: boolean): Promise<any> {
        if(!overwrite && await this.dbfile.isFileExist(url)){
            return;
        }
        this.dbfile.write(url,content);
    }

    //只能判断本地的
    async isFileExist(url: string): Promise<boolean> {
        return await this.dbfile.isFileExist(url);
    }

    async mv(src: string, dst: string) {
        await this.dbfile.mv(src,dst)
    }

    unzip(buff: ArrayBuffer): ArrayBuffer {
        throw new Error("Method not implemented.");
    }

    zip(buff: ArrayBuffer): ArrayBuffer {
        throw new Error("Method not implemented.");
    }

    textencode(text: string): ArrayBuffer {
        return new TextEncoder().encode(text);
    }

    textdecode(buffer: ArrayBuffer, off: number): string {
        return new TextDecoder().decode(buffer);
    }

}