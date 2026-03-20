/**
 * web端的dcc文件接口
 * 
 */

import { dccLog } from "./Config";
import { IndexDBFileRW } from "./IndexDBFileRW";
import { IGitFSFileIO } from "./gitfs/GitFS";

//访问服务器文件的接口。只要读就行了
export class DCCClientFS_web implements IGitFSFileIO {
    private dbfile: IndexDBFileRW;
    repoPath: string;

    async init(repoPath: string | null, cachePath: string) {
        if (repoPath && !repoPath.endsWith('/')) repoPath += '/';
        this.repoPath = repoPath;

        this.dbfile = new IndexDBFileRW();
        await this.dbfile.init('', '');
    }

    async xhrWithProgressTimeout(url:string, options:{method?:'GET'|'POST',headers?:any,body?:any} = {}, timeout = 15000):Promise<Response> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            let timeoutId:any;

            function resetTimeout() {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    xhr.abort();
                    reject(new Error('Timeout: No data received for an extended period'));
                }, timeout);
            }

            xhr.onprogress = (event) => {
                if (event.loaded > 0) {
                    resetTimeout();
                }
            };

            xhr.onload = () => {
                clearTimeout(timeoutId);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('Network error'));
            };

            xhr.open(options.method || 'GET', url);

            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }

            // 设置初始超时
            resetTimeout();
            xhr.send(options.body);
        });
    }

    async fetch(url: string,timeout=0): Promise<Response> {
        //return this.xhrWithProgressTimeout(url,{},timeout)
        return await fetch(url);
    }

    async read(url: string, encode: "utf8" | "buffer", onlylocal: boolean, contentChecker:(buff:ArrayBuffer)=>Promise<boolean>): Promise<string | ArrayBuffer> {
        //先从本地读取，如果没有就从远程下载
        let ret: string | ArrayBuffer;
        try {
            ret = await this.dbfile.read(url, encode, true)
            if(!ret){
                console.error("从indexdb读取到了null", url);
            } else {
                dccLog('从IndexDB加载: ' + url);
            }
        } catch (e: any) {
            if (onlylocal)
                return null;
            if (this.repoPath) {
                dccLog('从网络下载: ' + this.repoPath + url);
                let resp = await fetch(this.repoPath + url);
                if(!resp.ok){
                    console.error('下载错误：',this.repoPath+url,resp.status,resp.statusText);
                }
                if (encode == 'utf8') {
                    ret = await resp.text();
                    try{
                        await this.dbfile.write(url, ret);
                        dccLog('已写入IndexDB: ' + url);
                    }catch(e){
                        console.log('write db error:',url)
                        return ret;
                    }
                } else {
                    ret = await resp.arrayBuffer();
                    try{
                        let contOK = (!contentChecker) ||(await contentChecker(ret));
                        if(contOK){
                            await this.dbfile.write(url, ret);
                            dccLog('已写入IndexDB: ' + url);
                        }
                    }catch(e){
                        console.error('write db error:',url)
                        return ret;
                    }
                }
            }
        }
        return ret;
    }

    //write只能往本地写
    async write(url: string, content: string | ArrayBuffer, overwrite?: boolean): Promise<any> {
        if (!overwrite && await this.dbfile.isFileExist(url)) {
            return;
        }
        this.dbfile.write(url, content);
    }

    //只能判断本地的
    async isFileExist(url: string): Promise<boolean> {
        return await this.dbfile.isFileExist(url);
    }

    async mv(src: string, dst: string) {
        await this.dbfile.mv(src, dst)
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
        await this.dbfile.rm(url);
    }
    //如果希望遍历服务器端的怎么办
    async enumCachedObjects(callback: (objid: string) => void): Promise<void> {
        await this.dbfile.enumCachedObjects(callback);
    }

}