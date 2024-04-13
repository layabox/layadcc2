/**
 * web端的dcc文件接口
 * 
 */

import { IGitFSFileIO } from "./gitfs/GitFS";

function myFetch(url:string, encode:'utf8'|'buffer'='buffer') {
    return new Promise<any>((resolve, reject) => {
      const xhr = new _XMLHttpRequest();
      if(encode=='utf8')
        xhr.responseTypeCode=1;
      else 
        xhr.responseTypeCode=5;
      // 设置请求的方法和URL
      xhr._open('GET', url, true);
      xhr.setPostCB((result)=>{
        debugger;
        resolve(result);
      },(e1)=>{
        debugger;
        resolve(null);
      });
      xhr.getData(url);
    });
  }

//访问服务器文件的接口。只要读就行了
export class DCCClientFS_native implements IGitFSFileIO{
    repoPath:string;

    async init(repoPath:string|null){
        if(repoPath && !repoPath.endsWith('/'))repoPath+='/';
        this.repoPath =repoPath;

        console.log('pp', conch.getCachePath());
    }
    
    async fetch(url: string): Promise<Response> {
        let ret = await myFetch(url);
        return {
            ok:!!ret,
            arrayBuffer:async ()=>{return ret;},
            text:async ()=>{ return (new TextDecoder()).decode(ret);}
        } as unknown as Response;
    }

    async read(url: string, encode: "utf8" | "buffer"): Promise<string | ArrayBuffer> {
        //先从本地读取，如果没有就从远程下载
        let ret:string|ArrayBuffer;
        try{
            debugger;
            let buff = fs_readFileSync(url);
            //ret = await this.dbfile.read(url,encode)
        }catch(e:any){
            if(this.repoPath){
                let resp = await this.fetch(this.repoPath+url);
                if(encode=='utf8'){
                    ret = await resp.text();
                    debugger;
                    fs_writeFileSync(url,ret);
                    //await this.dbfile.write(url,ret);
                }else{
                    ret = await resp.arrayBuffer();
                    debugger;
                    fs_writeFileSync(url,ret);
                    //await this.dbfile.write(url,ret);
                }
            }
        }
        return ret;
    }

    //write只能往本地写
    async write(url: string, content: string | ArrayBuffer, overwrite?: boolean): Promise<any> {
        if(!overwrite && fs_exists(url)){
            return;
        }
        fs_writeFileSync(url,content);
        //this.dbfile.write(url,content);
    }

    //只能判断本地的
    async isFileExist(url: string): Promise<boolean> {
        return Promise.resolve().then(()=>{return fs_exists(url);})
    }

    async mv(src: string, dst: string) {
        throw 'native no mv'
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

    async rm(url: string): Promise<void> {
        fs_rm(url)
    }
    //如果希望遍历服务器端的怎么办
    async enumCachedObjects(callback: (objid: string) => void): Promise<void> {
        debugger;
        //await this.dbfile.enumCachedObjects(callback);
    }

}