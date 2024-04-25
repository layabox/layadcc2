import { AppResReader_Native } from "./AppResReader_Native";
import { ObjPack_AppRes } from "./ObjPack_AppRes";
import { RootDesc } from "./RootDesc";
import { GitFS, IGitFSFileIO } from "./gitfs/GitFS";
import { toHex } from "./gitfs/GitFSUtils";

function delay(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//流程记录，可以用来做测试
export interface ICheckLog{
    enableLogCheck:boolean;
    checkLog(event:string):void;
    clear():void;
}

export interface IZipEntry{
    entryName: string;
    getData(): Uint8Array;//Uint8Array比arraybuffer的优势是可以共享buffer
    isDirectory: boolean;
}
export interface IZip{
    open(file:string):void;
    getEntryCount():number;
    getEntry(e:string):IZipEntry;
    forEach(callback: (entry: IZipEntry) => void):void;
    close():void;
}

export class LayaDCCClient{
    static VERSION='1.0.0';
    private _frw:IGitFSFileIO;
    //是否只把请求的url转换成hash
    private _onlyTransUrl=false;
    private _gitfs:GitFS;
    //映射到dcc目录的地址头，如果没有，则按照http://*/算，所有的请求都裁掉主机地址
    private _pathMapToDCC='';
    //dcc的服务器根目录地址
    private _dccServer:string;
    private _logger:ICheckLog=null;
    dccPathInAssets='cache/dcc2.0'

    /**
     * 
     * @param frw 
     * @param dccurl dcc的服务器地址
     */
    constructor(frw:new ()=>IGitFSFileIO, dccurl:string, logger:ICheckLog=null){
        if(dccurl && !dccurl.endsWith('/')) dccurl+='/';
        this._dccServer=dccurl;
        this._frw = new frw();
        if(logger){
            this._logger=logger;
            logger.clear();
        }
        this.checkEnv();
    }

    checkEnv(){
        // if(!window.TextDecoder){
        //     alert('DCC需要TextDecoder');
        // }
    }

    get fileIO(){
        return this._frw;
    }

    private log(msg:string){
        console.log(msg);
        this._logger && this._logger.checkLog(msg);
    }

    set pathMapToDCC(v:string){
        this._pathMapToDCC=v;
    }
    
    get pathMapToDCC(){
        return this._pathMapToDCC;
    }

    //初始化，下载必须信息
    //headfile为null则不下载，仅仅使用本地缓存
    async init(headfile:string|null,cachePath:string){
        if(this._gitfs){
            throw '重复初始化'
        }
        await this._frw.init(this._dccServer,cachePath);

        //判断是不是新的安装
        if(window.conch){
            //如果是的话，拷贝出apk中的head
            let appres = new AppResReader_Native();
            //规则：如果第一次安装，直接使用apk内的，如果是覆盖安装，则比较时间差。比较的作用是防止万一没有网络的情况下，apk内的资源比较旧..
            try{
                let apphead = await appres.getRes(this.dccPathInAssets+'/head.json','buffer') as ArrayBuffer;
                if(apphead){
                    //暂时直接拷贝覆盖，应该也是正确的
                    await this._frw.write('head.json',apphead,true);
                }
            }catch(e){
                console.log('LayaDCCClient init error: no head.json in package')
            }
        }


        let rootNode:string;
        //本地记录的head信息
        let localRoot:string=null;
        try{
            //本地
            let localHeadStr = await this._frw.read('head.json','utf8',true) as string;
            let localHead = JSON.parse(localHeadStr) as RootDesc;
            localRoot = localHead.root;
            rootNode = localRoot;
        }catch(e){}


        //let frw = this._frw = new DCCClientFS_web_local();
        //下载head文件
        let remoteHead:RootDesc=null;
        let remoteHeadStr:string=null;
        try{
            if(headfile){
                let headResp = await this._frw.fetch(headfile);
                let tryCount=0;        
                while(!headResp.ok){
                    headResp = await this._frw.fetch(headfile);
                    tryCount++;
                    if(tryCount>10){
                        return false;
                    }
                    delay(100);
                }
                remoteHeadStr = await headResp.text();
                remoteHead = JSON.parse(remoteHeadStr);
                rootNode = remoteHead.root;
            }
        }catch(e){}
        
        if(!remoteHead && !localRoot)
            //如果本地和远程都没有dcc数据，则返回，不做dcc相关设置
            return false;

        let gitfs = this._gitfs = new GitFS( this._frw);

        //初始化apk包资源
        if(window.conch){
            let appResPack = new ObjPack_AppRes(this.dccPathInAssets);
            await appResPack.init();
            gitfs.addObjectPack(appResPack);
        }

        if( !localRoot || (remoteHead && localRoot!=remoteHead.root)){//本地不等于远端
            //处理打包
            if( remoteHead.treePackages.length){
                this.log('需要下载treenode')
                for(let packid of remoteHead.treePackages){
                    this.log(`下载treenode:${packid}`);
                    let resp = await this._frw.fetch(`${this._dccServer}packfile/tree-${packid}.idx`);
                    if(!resp.ok) throw 'download treenode idx error';
                    let idxs:{id:string,start:number,length:number}[] = JSON.parse(await resp.text());
                    //先判断所有的index是不是都有了,如果都有的就不下载了
                    //TODO 这个过程会不会很慢？还不如直接下载

                    let resp1 = await this._frw.fetch(`${this._dccServer}packfile/tree-${packid}.pack`);
                    if(!resp1.ok) throw 'download treenode pack error';
                    let buff = await resp1.arrayBuffer();
                    //把这些对象写到本地
                    for(let nodeinfo of idxs){
                        let nodebuff = buff.slice(nodeinfo.start, nodeinfo.start+nodeinfo.length);
                        await this._gitfs.saveObject(nodeinfo.id,nodebuff)
                    }
                }
            }
        }

        //初始化完成，记录head到本地
        await this._frw.write('head.json',remoteHeadStr,true);
        await gitfs.setRoot(rootNode);
        return true;
    }

    set onlyTransUrl(v:boolean){
        this._onlyTransUrl=v;
    }
    get onlyTransUrl(){
        return this._onlyTransUrl;
    }

    /**
     * 
     * @param url 用户认识的地址。如果是绝对地址，并且设置是映射地址，则计算一个相对地址。如果是相对地址，则直接使用
     * @returns 
     */
    async readFile(url:string):Promise<ArrayBuffer|null>{
        let gitfs = this._gitfs;
        if(!gitfs)return null;
        if( url.startsWith('http:')||url.startsWith('https:')||url.startsWith('file:')){//绝对路径
            if(!this._pathMapToDCC){
                url = (new URL(url)).pathname;;
            }else{
                if(!url.startsWith(this._pathMapToDCC)) return null;
                url = url.substring(this._pathMapToDCC.length);
            }
        }

        let buff = await gitfs.loadFileByPath(url,'buffer') as ArrayBuffer;
        return buff;
    }

    async getObjectUrl(objid:string){
        return this._gitfs.getObjUrl(objid)
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
    //初始话的时候已经保存head.json了所以这里不必更新
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
                //理论上不应该走到这里，应为visitAll的时候都下载了
                await this._frw.read( gitfs.getObjUrl(tree.sha),'buffer',false);
        },async (blob)=>{
            let id = toHex(blob.oid);
            if(!locals.has(id)){
                needUpdateFiles.push(id);
            }
        })
        //
        this.log(`updateAll need update ${needUpdateFiles.length}`);
        //needUpdateFiles.forEach(id=>{console.log(id);});
        progress&&progress(0);
        for(let i=0,n=needUpdateFiles.length; i<n; i++){
            let id = needUpdateFiles[i];
            //TODO 并发以提高效率
            await this._frw.read(gitfs.getObjUrl(id),'buffer',false);
            this.log(`updateAll: update obj:${id}`);
            progress&&progress(i/n);
        }
        progress&&progress(1);
    }

    /**
     * 根据zip更新
     * 这个会修改本地保存的root
     * @param zipfile 
     * @param progress 
     */
    async updateByZip(zipfile:string,zipClass:new()=>IZip, progress:(p:number)=>void){
        let zip = new zipClass();
        zip.open(zipfile);
        //TODO 数据太多的时候要控制并发
        zip.forEach(async entry=>{
            if(entry.entryName=='head.json'){
            }else{
                await this.addObject(entry.entryName,entry.getData())
            }
        })
        //写head
        let buf = zip.getEntry('head.json');
        await this._frw.write('head.json',buf.getData().buffer,true);
        //更新自己的root
        let localHeadStr = await this._frw.read('head.json','utf8',true) as string;
        let localHead = JSON.parse(localHeadStr) as RootDesc;        
        await this._gitfs.setRoot(localHead.root);
    }

    /**
     * 添加对象，可以用来做zip更新
     * @param objid 
     * @param content 
     * @returns 
     */
    async addObject(objid:string, content:ArrayBuffer){
        return this._gitfs.saveObject(objid,content);
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

    isFileChanged(url:string){

    }
}