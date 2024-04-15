import { RootDesc } from "./RootDesc";
import { GitFS, IGitFSFileIO } from "./gitfs/GitFS";
import { toHex } from "./gitfs/GitFSUtils";

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
    private _dccurl:string;

    constructor(frw:new ()=>IGitFSFileIO, dccurl:string){
        this._dccurl=dccurl;
        this._frw = new frw();
    }

    set pathMapToDCC(v:string){
        this._pathMapToDCC=v;
    }
    
    get pathMapToDCC(){
        return this._pathMapToDCC;
    }

    //初始化，下载必须信息
    //headfile为null则不下载，仅仅使用本地缓存
    async init(headfile:string|null){
        if(this._gitfs){
            throw '重复初始化'
        }
        await this._frw.init(this._dccurl);
        this._headFile=headfile;
        //let frw = this._frw = new DCCClientFS_web_local();
        //下载head文件
        let headStr='';
        if(headfile){
            let headResp = await this._frw.fetch(this._headFile);
            let tryCount=0;        
            while(!headResp.ok){
                headResp = await this._frw.fetch(this._headFile);
                tryCount++;
                if(tryCount>10){
                    return false;
                }
                delay(100);
                
            }
            headStr = await headResp.text();
            //保存head到本地
            //TODO以后加上比较
            await this._frw.write('head.json',headStr,true);
        }
        
        if(!headStr){
            //本地
            headStr = await this._frw.read('head.json','utf8') as string;
        }

        let dcchead = JSON.parse(headStr) as RootDesc;
        let gitfs = this._gitfs = new GitFS( this._frw);
        //处理打包
        //TODO
        await gitfs.setRoot(dcchead.root);
        //let rootTree = await gitfs.getTreeNode(dcchead.root,null);
        //let bbb = await gitfs.loadFileByPath('atlas/comp.png','buffer')
        return true;
    }

    set onlyTransUrl(v:boolean){
        this._onlyTransUrl=v;
    }
    get onlyTransUrl(){
        return this._onlyTransUrl;
    }

    async readFile(url:string):Promise<ArrayBuffer|null>{
        let gitfs = this._gitfs;
        if(!gitfs)return null;
        if(!this._pathMapToDCC){
            url = (new URL(url)).pathname;;
        }else{
            if(!url.startsWith(this._pathMapToDCC)) return null;
            url = url.substring(this._pathMapToDCC.length);
        }

        let buff = await gitfs.loadFileByPath(url,'buffer') as ArrayBuffer;
        return buff;
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

    //在第一次调用progress之前是下载节点的过程
    async updateAll(progress:(p:number)=>void){
        let gitfs = this._gitfs;
        //为了能统计，需要先下载所有的目录节点，这段时间是无法统计的

        //先统计本地已经存在的
        let locals:Set<string> = new Set();
        await this._frw.enumCachedObjects((objid)=>{
            locals.add(objid);
        })

        //遍历file
        let needUpdateFiles:string[]=[];
        //统计所有树上的
        await gitfs.visitAll(gitfs.treeRoot,async (tree)=>{
            //下载
            if(!locals.has(tree.sha))
                await this._frw.read( gitfs.getObjUrl(tree.sha),'buffer')
        },async (blob)=>{
            let id = toHex(blob.oid);
            if(!locals.has(id)){
                needUpdateFiles.push(id);
            }
        })
        //
        console.log('need update:',needUpdateFiles.length);
        needUpdateFiles.forEach(id=>{console.log(id);});
        let p = 0;
        progress&&progress(0);
        for(let i=0,n=needUpdateFiles.length; i<n; i++){
            let id = needUpdateFiles[i];
            //TODO并发
            await this._frw.read(gitfs.getObjUrl(id),'buffer');
            progress(i/n);
        }
        progress&&progress(1);
    }

    async clean(){
        let gitfs = this._gitfs;
        //遍历file
        let files:Set<string> = new Set()
        //统计所有树上的
        await gitfs.visitAll(gitfs.treeRoot,async (tree)=>{
            files.add(tree.sha);
        }, async (blob)=>{
            files.add(toHex(blob.oid));
        })
        //统计所有的本地保存的
        //不在树上的全删掉
        let removed:string[]=[];
        let dbgRemovdeFile:string[]=[];
        await this._frw.enumCachedObjects((objid)=>{
            if(!files.has(objid)){
                removed.push(objid);
            }
        })
        //
        for(let id of removed ){
            console.log('清理节点:',id)
            gitfs.removeObject(id);
        }
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