import { DCCDownloader } from "./DCCDownloader";
import { RootDesc } from "./RootDesc";
import { GitFS, IGitFSFileIO } from "./gitfs/GitFS";
import { TreeEntry } from "./gitfs/GitTree";

function delay(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export class LayaDCCClient{
    private _headFile:string;
    private _frw:IGitFSFileIO;
    //是否只把请求的url转换成hash
    private _onlyTransUrl=false;
    private _gitfs:GitFS;
    //映射到dcc目录的地址头，如果没有，则按照http://*/算，所有的请求都裁掉主机地址
    private _pathMapToDCC='';

    constructor(frw:IGitFSFileIO){
        this._frw = frw;
    }

    set pathMapToDCC(v:string){
        this._pathMapToDCC=v;
    }
    
    get pathMapToDCC(){
        return this._pathMapToDCC;
    }

    //初始化，下载必须信息
    async init(headfile:string){
        if(this._gitfs){
            throw '重复初始化'
        }
        this._headFile=headfile;
        //let frw = this._frw = new DCCClientFS_web_local();
        //下载head文件
        let headResp = await fetch(this._headFile);
        let tryCount=0;        
        while(!headResp.ok){
            headResp = await fetch(this._headFile);
            tryCount++;
            if(tryCount>10){
                return false;
            }
            delay(100);
            
        }
        let headStr = await headResp.text();
        let dcchead = JSON.parse(headStr) as RootDesc;
        let gitfs = this._gitfs = new GitFS( this._frw);
        //处理打包
        //TODO
        await gitfs.setRoot(dcchead.root);
        //let rootTree = await gitfs.getTreeNode(dcchead.root,null);
        let bbb = await gitfs.loadFileByPath('atlas/comp.png','buffer')
        return true;
    }

    set onlyTransUrl(v:boolean){
        this._onlyTransUrl=v;
    }
    get onlyTransUrl(){
        return this._onlyTransUrl;
    }

    async transUrl(url:string){
        let gitfs = this._gitfs;
        if(!gitfs)return url;

        if(!this._pathMapToDCC){
            url = (new URL(url)).pathname;;
        }else{
            if(!url.startsWith(this._pathMapToDCC)) return url;
            url = url.substring(this._pathMapToDCC.length);
        }

        let objpath = await gitfs.pathToObjPath(url);
        if(!objpath){
            return url;
        }
        return this._frw.repoPath+objpath;
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



}