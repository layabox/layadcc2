import { Env } from "./Env";
import { LayaDCCClient } from "./LayaDCCClient";


export class DCCDownloader extends Laya.Downloader{
    private originDownloader:Laya.Downloader;
    private dcc:LayaDCCClient;

    constructor(dcc:LayaDCCClient){
        super()
        this.dcc = dcc;
    }

    injectToLaya(){
        if(Laya.Loader.downloader==this)return;
        this.originDownloader = Laya.Loader.downloader;
        Laya.Loader.downloader = this;
    }

    removeFromLaya(){
        if(Laya.Loader.downloader==this){
            Laya.Loader.downloader = this.originDownloader;
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