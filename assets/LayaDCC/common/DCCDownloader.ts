

export class DCCDownloader extends Laya.Downloader{
    originDownloader:Laya.Downloader;

    constructor(downloader:Laya.Downloader) {
        super();
        this.originDownloader = downloader;
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
        if (this.vfs && url.startsWith(this.vfsprefix)) {
            url = this.vfsGetPath(url);
            this.vfs.load(url, contentType == 'json' ? 'utf8' : 'buffer').then(v => {
                let url1 = url;
                if (contentType == 'json') {
                    onComplete(JSON.parse(v));
                } else {
                    onComplete(v);
                }
            })
        } else {
            this.originDownloader.common.call(this.originDownloader,owner, url, originalUrl, contentType, onProgress, onComplete);
        }
    }

    override image(owner: any, url: string, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void {
        if (this.vfs && url.startsWith(this.vfsprefix)) {
            url = this.vfsGetPath(url);
            this.vfs.load(url, 'buffer').then((v: ArrayBuffer) => {
                if (v) {
                    var blob = new Blob([v], { type: 'application/octet-binary' });
                    url = window.URL.createObjectURL(blob);
                    super.image(owner, url, originalUrl, onProgress, onComplete);
                }else{
                    // 失败了也要返回，否则会认为卡住了，没有机会再次下载了
                    onComplete(v);
                }
            })
        } else {
            this.originDownloader.image.call(this.originDownloader,owner, url, originalUrl, onProgress, onComplete);
        }
    }    
}