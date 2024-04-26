import { Env } from "./Env";
import { LayaDCCClient } from "./LayaDCCClient";


export class DCCDownloader extends Laya.Downloader{
    private originDownloader:Laya.Downloader;
    private dcc:LayaDCCClient;
    private originNativeDownloader:(url:string, force:boolean, onok:(data:string)=>void, onerr:()=>void)=>void;
    private myNativeDownloadFunc:(url:string, force:boolean, onok:(data:string)=>void, onerr:()=>void)=>void;

    constructor(dcc:LayaDCCClient){
        super()
        this.dcc = dcc;
    }

    //插入到laya引擎的下载流程，实现下载的接管
    injectToLaya(){
        if(Laya.Loader.downloader==this)return;
        this.originDownloader = Laya.Loader.downloader;
        Laya.Loader.downloader = this;
    }

    //取消对laya下载引擎的插入
    removeFromLaya(){
        if(Laya.Loader.downloader==this){
            Laya.Loader.downloader = this.originDownloader;
        }
    }

    /**
     * 插入到runtime中.
     * 这个是替换 window.downloadfile 函数，因为加载引擎是通过项目的 index.js中的loadLib函数实现的，
     * 而loadLib函数就是调用的 window.downloadfile 
     * 所以为了有效，这个最好是写在 apploader.js最后加载index.js的地方，或者在 项目index.js的最开始的地方
     */
    injectToNativeFileReader(){
        let win = window as any;
        if(win.downloadfile==this.myNativeDownloadFunc)
            return;
        this.originNativeDownloader = win.downloadfile;
        this.myNativeDownloadFunc = (url:string, force:boolean, onok:(data:string)=>void, onerr:()=>void)=>{
            let q = url.indexOf('?');
            if(q>0){
                url = url.substring(0,q);
            }
            this.dcc.readFile(url).then(v=>{
                onok(Env.dcodeUtf8(v));
            },reason=>{
                onerr();
            })
        }
        win.downloadfile  = this.myNativeDownloadFunc;
    }

    removeFromNative(){
        let win = window as any;
        if(win.downloadfile==this.myNativeDownloadFunc){
            win.downloadfile = this.originNativeDownloader;
        }
    }

    override imageWithBlob(owner: any, blob: ArrayBuffer, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void{
        this.originDownloader.imageWithBlob.call(this.originDownloader,owner,blob,originalUrl,onProgress,onComplete);
    }
    override imageWithWorker(owner: any, url: string, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void){
        this.originDownloader.imageWithWorker.call(this.originDownloader,owner,url,originalUrl,onProgress,onComplete);
    }
    override audio(owner: any, url: string, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void{
        this.originDownloader.audio.call(this.originDownloader,owner,url,originalUrl,onProgress,onComplete);
    }

    override common(owner: any, url: string, originalUrl: string, contentType: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void {
        let promise:Promise<string>;
        if(this.dcc.onlyTransUrl){
            promise = this.dcc.transUrl(url);
        }else{
            promise = (async ()=>{
                    let buff = await this.dcc.readFile(url);
                    if(!buff) return url;
                    switch(contentType){
                        case 'text':
                            onComplete( Env.dcodeUtf8(buff));
                            return null;
                        case 'json':
                            onComplete(JSON.parse(Env.dcodeUtf8(buff)));
                            return null;
                        case 'arraybuffer':
                            onComplete(buff);
                            return null;
                        default:
                            var blob = new Blob([buff], { type: 'application/octet-binary' });
                            return window.URL.createObjectURL(blob); 
                    }
                }
            )();
        }
        promise.then(transed=>{
            if(transed)
                this.originDownloader.common.call(this.originDownloader,owner, transed, originalUrl, contentType, onProgress, onComplete);
        });

    }

    override image(owner: any, url: string, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void {
        let promise:Promise<string>;
        if(this.dcc.onlyTransUrl){
            promise = this.dcc.transUrl(url);
        }else{
            promise = (async ()=>{
                    let buff = await this.dcc.readFile(url);
                    if(!buff) return url;
                    var blob = new Blob([buff], { type: 'application/octet-binary' });
                    return window.URL.createObjectURL(blob); 
                }
            )();
        }
        promise.then(transed=>{
            this.originDownloader.image.call(this.originDownloader,owner, transed, originalUrl, onProgress, onComplete);
        });
    }    
}