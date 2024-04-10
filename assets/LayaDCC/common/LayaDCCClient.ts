import { DCCClientFS_web_local, DCCClientFS_web_remote } from "./DCCClientFS_web";
import { DCCDownloader } from "./DCCDownloader";
import { RootDesc } from "./RootDesc";
import { GitFS } from "./gitfs/GitFS";

export class LayaDCCClient{
    private _urlBase:string;
    private _headFile:string;
    //dcc数据的url，根据headfile获得
    private _dccUrl:string;
    private _oldDownloader:Laya.Downloader;
    private _dccDownloader:Laya.Downloader;
    private _frw:DCCClientFS_web_local;

    set urlBase(v:string){
        if(!v.endsWith('\\')&&!v.endsWith('/'))
            v+='/';
        this._urlBase=v;
    }

    get urlBase(){
        return this._urlBase;
    }

    set headFile(url:string){
        if(url.startsWith('https://')||url.startsWith('http://')){
            this._headFile = url;
        }else{
            this._headFile = this.urlBase+url;
        }
        let p = this._headFile.lastIndexOf('/');
        if(p>0){
            this._dccUrl=this._headFile.substring(0,p+1);   //包含最后的/
        }else{
            throw 'bad headfile'
        }
    }

    get headFile(){
        return this._headFile;
    }

    //初始化，下载必须信息
    async init(){
        let frw = this._frw = new DCCClientFS_web_local();
        let gitfs = new GitFS(this._dccUrl, new DCCClientFS_web_remote());
        //下载head文件
        let headResp = await fetch(this._headFile);
        while(!headResp.ok){
            headResp = await fetch(this._headFile);
        }
        let headStr = await headResp.text();
        let dcchead = JSON.parse(headStr) as RootDesc;
        //处理打包
        //TODO
        //let rootTree = await gitfs.getTreeNode(dcchead.root,null);
        await gitfs.setRoot(dcchead.root);
        let bbb = await gitfs.loadFileByPath('atlas/comp.png','buffer')
        debugger;
    }

    mountURL(url: string) {

    }
    mountPath(p: string) {

    }
    mountZip() {

    }

    mountAPK() {

    }

    getChangedList(){

    }

    isFileChanged(url:string){

    }

    injectToLayaDownloader(downloader:Laya.Downloader){
        if(!this._oldDownloader){
            this._oldDownloader = downloader;
        }else{
            if(downloader && downloader==this._dccDownloader)
                return;
        }
        let dccDownloader =this._dccDownloader = new DCCDownloader(downloader);
        Laya.Loader.downloader = dccDownloader;
    }

    removeInjection(){
        if(Laya.Loader.downloader==this._dccDownloader){
            Laya.Loader.downloader = this._oldDownloader;
            this._oldDownloader=null;
        }
    }

}