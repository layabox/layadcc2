import { Env } from "./Env";
import { ICheckLog, LayaDCCClient } from "./LayaDCCClient";


export class DCCDownloader {
    private originDownloader: Laya.Downloader;
    private dcc: LayaDCCClient;
    private originNativeDownloader: (url: string, force: boolean, onok: (data: string) => void, onerr: () => void) => void;
    private myNativeDownloadFunc: (url: string, force: boolean, onok: (data: string) => void, onerr: () => void) => void;
    //因为可能没有laya环境，所以需要做成动态的，所以变成成员而不是使用继承
    private myDownloader: Laya.Downloader;
    private _logger: ICheckLog;
    constructor(dcc: LayaDCCClient, logger: ICheckLog = null) {
        this.dcc = dcc;
        this._logger = logger;
    }

    //插入到laya引擎的下载流程，实现下载的接管
    injectToLaya() {
        if (this.myDownloader && Laya.Loader.downloader == this.myDownloader) return;
        this.originDownloader = Laya.Loader.downloader;
        let downloader = this.myDownloader = new Laya.Downloader();
        downloader.audio = this.audio.bind(this);
        downloader.image = this.image.bind(this);
        downloader.common = this.common.bind(this);
        downloader.imageWithBlob = this.imageWithBlob.bind(this);
        downloader.imageWithWorker = this.imageWithWorker.bind(this);
        Laya.Loader.downloader = downloader;
    }

    //取消对laya下载引擎的插入
    removeFromLaya() {
        if (Laya.Loader.downloader == this.myDownloader) {
            Laya.Loader.downloader = this.originDownloader;
        }
    }

    /**
     * 插入到runtime中.
     * 这个是替换 window.downloadfile 函数，因为加载引擎是通过项目的 index.js中的loadLib函数实现的，
     * 而loadLib函数就是调用的 window.downloadfile 
     * 所以为了有效，这个最好是写在 apploader.js最后加载index.js的地方，或者在 项目index.js的最开始的地方
     */
    injectToNativeFileReader() {
        let win = window as any;
        if (win.downloadfile == this.myNativeDownloadFunc)
            return;
        this.originNativeDownloader = win.downloadfile;
        this.myNativeDownloadFunc = (url: string, force: boolean, onok: (data: string) => void, onerr: () => void) => {
            let q = url.indexOf('?');
            if (q > 0) {
                url = url.substring(0, q);
            }
            this.dcc.readFile(url).then(v => {
                onok(Env.dcodeUtf8(v));
            }, reason => {
                onerr();
            })
        }
        win.downloadfile = this.myNativeDownloadFunc;
    }

    removeFromNative() {
        let win = window as any;
        if (win.downloadfile == this.myNativeDownloadFunc) {
            win.downloadfile = this.originNativeDownloader;
        }
    }

    imageWithBlob(owner: any, blob: ArrayBuffer, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void {
        this._logger && this._logger.checkLog(`download:imageWithBlob:${originalUrl}`);
        this.originDownloader.imageWithBlob.call(this.originDownloader, owner, blob, originalUrl, onProgress, onComplete);
    }
    imageWithWorker(owner: any, url: string, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void) {
        this._logger && this._logger.checkLog(`download:imageWithWorker:${originalUrl}`);
        this.originDownloader.imageWithWorker.call(this.originDownloader, owner, url, originalUrl, onProgress, onComplete);
    }
    audio(owner: any, url: string, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void {
        this._logger && this._logger.checkLog(`download:audio:${originalUrl}`);
        this.originDownloader.audio.call(this.originDownloader, owner, url, originalUrl, onProgress, onComplete);
    }

    common(owner: any, url: string, originalUrl: string, contentType: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void {
        this._logger && this._logger.checkLog(`download:common:${originalUrl}`);
        let promise: Promise<string>;
        if (this.dcc.onlyTransUrl) {
            promise = this.dcc.transUrl(url);
            this._logger && this._logger.checkLog(`download:common:onlyTransUrl:${originalUrl}`);
        } else {
            promise = (async () => {
                let buff = await this.dcc.readFile(url);
                if (!buff) {
                    this._logger && this._logger.checkLog(`download:common:readFile(${url}) error`);
                    return url;
                } else {
                    this._logger && this._logger.checkLog(`download:common:readFile(${url}) OK`);
                }
                switch (contentType) {
                    case 'text':
                        onComplete(Env.dcodeUtf8(buff));
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
        promise.then(transed => {
            if (transed) {
                this.originDownloader.common.call(this.originDownloader, owner, transed, originalUrl, contentType, onProgress, onComplete);
                this._logger && this._logger.checkLog(`download:common:originCommon(${originalUrl})`);
            }
        });

    }

    image(owner: any, url: string, originalUrl: string, onProgress: (progress: number) => void, onComplete: (data: any, error?: string) => void): void {
        let promise: Promise<string>;
        if (this.dcc.onlyTransUrl) {
            promise = this.dcc.transUrl(url);
        } else {
            promise = (async () => {
                let buff = await this.dcc.readFile(url);
                if (!buff) return url;
                var blob = new Blob([buff], { type: 'application/octet-binary' });
                return window.URL.createObjectURL(blob);
            }
            )();
        }
        promise.then(transed => {
            this.originDownloader.image.call(this.originDownloader, owner, transed, originalUrl, onProgress, onComplete);
        });
    }
}