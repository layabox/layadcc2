import { FileNode } from "./FSData";
import { CommitInfo, GitCommit } from "./GitCommit";
import { shasum, toHex } from "./GitFSInit";
import { TreeEntry, TreeNode } from "./GitTree";

export async function readBinFile(file: File) {
    return new Promise<ArrayBuffer|null>((res, rej) => {
        let reader = new FileReader();
        reader.onload = async (event) => {
            let value = (event.target as FileReader).result as ArrayBuffer;
            res(value);
        };
        reader.onerror = function (event) {
            res(null);
        };
        reader.readAsArrayBuffer(file);
    });
}

export interface IFileRW {
    read(url: string, encode: 'utf8' | 'buffer'): Promise<string | ArrayBuffer>;
    readSource(rurl:string, encode: 'utf8' | 'buffer'):Promise<string|ArrayBuffer>;
    write(url: string, content: string | ArrayBuffer, overwrite?:boolean): Promise<any>;
    //这个是给layame用的，本地无实际用途，直接写即可
    writeToCommon(url: string, content: ArrayBuffer, overwrite?:boolean): Promise<any>;
    isFileExist(url: string):Promise<boolean>;
    unzip(buff: ArrayBuffer): ArrayBuffer;
    zip(buff: ArrayBuffer): ArrayBuffer;
    textencode(text: string): ArrayBuffer;
    textdecode(buffer: ArrayBuffer, off: number): string;
    saveUserData(key:string, value:string):void;
    getUserData(key:string):string;
}

var PROJINFO = '.projinfo';

/**
 * 类似git的文件系统
 * 设置一个远端库的地址，然后通过相对地址的方式访问某个文件
 * 可以对目录进行各种操作
 * 可以与远端进行同步
 */
export class GitFS {
    // git库所在目录。里面有Objects目录。相当于git的.git目录
    private remoteRepoUrl: string;
    private userUrl:string; //保存head等用户信息的地方，可以通过filerw写。从uid开始的相对路径
    treeRoot = new TreeNode(null,null,null);
    // 当前准备提交的commit
    private curCommit = new CommitInfo();
    private frw: IFileRW;
    // 当前的修改
    private allchanges: TreeNode[] = [];
    // 有的库是别人的，只能读
    private readonly = false;
    private recentCommits:string[];

    private branch = 'master';
    static OBJSUBDIRNUM=1;
    static MAXFILESIZE = 32*1024*1024;

    static touchID=0;   // 更新标记
    user: string;       // 用户名。提交用。

    checkDownload=false;

    /**
     * 
     * @param repoUrl git库所在目录
     * @param userFile 保存head等用户信息的地方，以用户id开始的相对目录。可以通过filerw写
     * @param filerw 
     */
    constructor(repoUrl: string, userFile:string, filerw: IFileRW) {
        this.remoteRepoUrl = repoUrl;
        if (!repoUrl.endsWith('/')) this.remoteRepoUrl += '/';
        this.userUrl=userFile;
        this.frw = filerw;
    }

    /**
     * 得到相对于git目录的目录。
     * @param objid 
     * @param subdirnum  分成几个子目录
     * @param reltocommon 是否相对目录
     * @returns 
     */
    getObjUrl(objid: string,subdirnum:number, reltocommon:boolean){
        let ret = reltocommon?'':this.remoteRepoUrl;
        ret += 'objects/';
        let ostr = objid;
        for(let i=0; i<subdirnum;i++){
            let dir = ostr.substring(0,2);
            ostr = ostr.substring(2);
            ret+=dir;
            ret+='/';
        }
        ret+=ostr;
        return ret;
    }

    getCurCommit(){
        return this.curCommit.sha;
    }

    /**
     * 根据最新的commit初始化
     * @param commitHeadFile 
     */
    async initByLastCommit() {
        let commitid = await this.getCommitHead(this.userUrl+'?'+Date.now());// await this.frw.read(commitFileUrl, 'utf8') as string;
        return await this.initByCommitID(commitid);
    }

    async getCommitHead(url:string){
        let commit = await this.frw.readSource(url,'utf8') as string;
        if(commit){
            this.recentCommits = commit.split('\n');
            return this.recentCommits[0];
        }
        throw "no commit"
    }

    async initByCommitID(id:string){
        if(!id)return false;
        let cc = await this.getCommit(id);
        if(!cc) return false;
        let treeid = cc.commitinfo.tree;
        this.treeRoot = await this.getTreeNode(treeid, this.treeRoot);
        this.curCommit.tree = treeid;
        this.curCommit.parent = cc.commitinfo.parent;
        this.curCommit.commitMessage = cc.commitinfo.commitMessage;
        this.curCommit.sha = id;
        return true;
    }

    /**
     * 直接设置treeroot。例如不关心commit，只要某个版本的root
     * @param treeid 
     */
    async setRoot(treeid:string){
        this.treeRoot = await this.getTreeNode(treeid, this.treeRoot);
    }

    async toRev(rev:number){

    }

    async getCommit(objid: string) {
        let commitobjFile = this.getObjUrl(objid, GitFS.OBJSUBDIRNUM, false);// this.getObjUrl(objid);
        let buff = await this.frw.read(commitobjFile, 'buffer') as ArrayBuffer;
        let cc:GitCommit;
        if(buff){
            cc = new GitCommit(this.frw.unzip(buff), objid);
        }else{
            return null;
        }
        return cc;
    }

    /**
     * 加载.git目录下的所有的打包文件
     */
    async loadAllPack(){

    }
    
    /**
     * 从文件构造treeNode.
     * 注意没有设置parent
     * @param objid 
     * @param treeNode  如果设置了，就在这个对象上初始化
     * @returns 
     */
    async getTreeNode(objid: string, treeNode:TreeNode|null){
        if(!objid){
            // 创建空的
            return new TreeNode(null,null,this.frw);
        }
        let treepath = this.getObjUrl(objid, GitFS.OBJSUBDIRNUM, false);// this.getObjUrl(objid);
        let buff = await this.frw.read(treepath, 'buffer') as ArrayBuffer;
        if(!buff) throw "no treepath";
        let treebuff = new Uint8Array(buff);
        let ret = treeNode;
        if(!ret){
            ret = new TreeNode( treebuff, null,this.frw);
        }else{
            ret.parseBuffer(treebuff, this.frw);
        }
        ret.sha = objid;
        return ret!;
    }

    /**
     * 根据sha id得到文件内容。
     * @param objid   字符串或者arraybuffer表示的数字
     * @param encode 
     * @returns 
     */
    async getBlobNode(objid: string | Uint8Array, encode: 'utf8'): Promise<string>;
    async getBlobNode(objid: string | Uint8Array, encode: 'buffer'): Promise<ArrayBuffer>;    
    async getBlobNode(objid: string|Uint8Array, encode: 'utf8' | 'buffer'):Promise<string|ArrayBuffer> {
        let strid = objid as string;
        if(typeof(objid)!='string'){
            strid=toHex(objid);
        }
        let treepath = this.getObjUrl(strid, GitFS.OBJSUBDIRNUM, false);// this.getObjUrl(strid);
        let treebuff = await this.frw.read(treepath, 'buffer') as ArrayBuffer;
        if(!treebuff){
            console.log('download error:', strid);
            throw new Error('download error:'+strid);
        }
        let buff = this.frw.unzip(treebuff);

        //下载文件最好不校验。影响速度。
        if(this.checkDownload){
            let sum = await shasum(new Uint8Array(buff),true);
            if(sum!=strid){
                console.log('下载的文件校验错误:',strid,sum);
            }
        }

        if (encode == 'utf8') {
            let str = (new TextDecoder()).decode(buff);
            return str;
        } else {
            return buff;
        }
    }

    /**
     * 打开一个目录节点。
     * 下载对应的文件，得到此目录下的所有文件
     * @param node 
     * @returns 
     */
    async openNode(node:TreeEntry){
        if(node.treeNode) return node.treeNode;
        if(!(node instanceof TreeEntry)){
            console.error('openNode param error!')
        }
        // 没有treeNode表示还没有下载。下载构造新的node
        try{
            let nodebuff = await this.getBlobNode(node.idstring, 'buffer') as Uint8Array;
            let ret = new TreeNode(nodebuff, node.owner.parent, this.frw);
            node.treeNode=ret;
            ret.parent = node.owner;
            ret.sha = toHex(node.oid!);
            return ret;
        }catch(e){
            throw "open node error"
        }
    }

	/**
	 * 把所有的子目录收集起来
	 */
     async collectChildNode( nodes:TreeNode[]){
         this.visitAll(this.treeRoot, (node)=>{
            nodes.push(node);
         });

         let nodeids:string[]=[];
         let sum = 0;
         nodes.forEach( cn=>{
             sum += cn.buff!.byteLength;
             nodeids.push(cn.sha!);
         })

         let buff = new Uint8Array(sum);
         let st = 0;
         nodes.forEach(cn => {
             buff.set(cn.buff!, st);
             st += cn.buff!.byteLength;
         })

         // node附加这个buffer不必重新计算sha。唯一的问题就是如果校验会通不过
         // 读写带附加buffer的node都可以在这这个类里进行
	}

    async visitAll(node:TreeNode, cb:(cnode:TreeNode)=>void){
        cb(node);
		for await (const entry of node.entries) {
            if(entry.isDir){
                if(!entry.treeNode) await this.openNode(entry);
                await this.visitAll(entry.treeNode!, cb);
            }
		}
    }

    async loadFile(node:TreeEntry, encode:'utf8'|'buffer'):Promise<string|ArrayBuffer>;
    async loadFile(node:TreeNode, file:string, encode?:'utf8'|'buffer'):Promise<string|ArrayBuffer>;
    async loadFile(file:string, encode:'utf8'|'buffer'):Promise<string|ArrayBuffer>;
    async loadFile(node:TreeEntry|TreeNode|string, file?:string, encode?:'utf8'|'buffer'){
        let entry:TreeEntry;
        if(typeof node == 'string'){
            return await this.loadFileByPath(node,file as any);
        }else if(node instanceof TreeNode){
            entry = node.getEntry(file);
        }else if(node instanceof TreeEntry){
            entry=node;
            encode=file as any;
        }
        if(entry){
            return await this.getBlobNode(entry.idstring, encode)
        }else{
            console.log('没有这个文件:', file);
        }
        return null;
    }

    async loadFileByPath(file:string, encode:'utf8'|'buffer'){
        let entries:TreeEntry[]=[];
        if( await this.pathToEntries(file, entries)){
            let end = entries[entries.length-1];
            return await this.getBlobNode( end.idstring, encode);
        }
        return null;
    }

    async saveBlobNode(objid: string, content: ArrayBuffer, refname:string|null) {
        /*
        let exist = await this.frw.isFileExist(treepath);
        if(exist ){ 
            console.log('gitfs objid exist')
            return ;
        }
        */
       
       if(content.byteLength > GitFS.MAXFILESIZE){
           alert('文件太大，无法上传：'+refname+'\n限制为：'+GitFS.MAXFILESIZE/1024/1024+'M');
           return false;
        }
        await this.saveObject(objid,content);
        return true;
    }

    async saveObject(objid: string, content: ArrayBuffer){
        let treepath = this.getObjUrl(objid,GitFS.OBJSUBDIRNUM,true);
        //let ret = await this.frw.write(treepath, content);
        await this.frw.writeToCommon(treepath,content as ArrayBuffer);
    }

    /**
     * 计算buffer或者string的sha1值。
     * string的话，会先转成buffer
     * @param buff 
     * @returns 
     */
    async sha1(buff: ArrayBuffer | string) {
        if (typeof buff == 'string') {
            buff = (new TextEncoder()).encode(buff).buffer;
        }
        return await shasum(new Uint8Array(buff), true);
    }

    /**
     * 把一个文件或者路径转换成entry列表
     * @param path  相对路径
     */
    async pathToEntries(path:string, entrylist:TreeEntry[]){
        let pathes = path.split('/');
        let cNode = this.treeRoot;
        entrylist.length=0;
        // 定位到节点
        for await (let path of pathes){
        //for (let i = 0, n = pathes.length; i < n; i++) {
            if (path == '') continue;  // 第一个/，以及中间会有的 //
            if (path == '.') continue;
            if (path == '..') {
                cNode = cNode.parent;
            }
            let entry = cNode.getEntry(path);
            if(!entry){
                return false;
            }

            entrylist.push(entry);
            if( entry.isDir && ! (cNode = entry.treeNode)){
                // 如果是目录，下载节点
                cNode = await this.openNode(entry)
            }
        }

        return true;
    }

    /**
     * 根据一个长路径找到或者创建对应的node。
     * 
     * @param path 例如 '/Assets/env/' 只能是路径，不能是文件
     */
    async getNodeByPath(path:string, create=false, startNode:TreeNode|null=null){
        let pathes = path.split('/');
        let cNode = startNode || this.treeRoot;
        // 定位到path指定的节点
        for (let i = 0, n = pathes.length; i < n; i++) {
            let path = pathes[i];
            if (path == '') continue;  // 第一个/，以及中间会有的 //
            if (path == '.') continue;
            if (path == '..') {
                cNode = cNode.parent;
            }
            let entry = cNode.getEntry(path);
            // 当前目录是否存在
            if (entry) {
                if(!entry.treeNode){
                    cNode = await this.openNode(entry);
                }else{
                    cNode = entry.treeNode;
                }
            } else {
                if(create){
                    // 如果目录不存在，创建一个
                    // 在当前node添加entry
                    let entry = cNode.addEntry(path, true, null);
                    // 由于是目录，添加新的节点
                    cNode = new TreeNode(null, cNode, this.frw);
                    entry.treeNode=cNode;
                    cNode.needSha();
                }else
                    return null;
            }
        }
        return cNode;
    }

    /**
     * 在指定的TreeNode下面添加一个文件
     * @param node 
     * @param name      文件名。无目录
     * @param content 
     */
    async setFileAtNode(node:TreeNode, name:string, content: string | ArrayBuffer | File){
        //if(!node) return null;
        let buff: ArrayBuffer;
        if (content instanceof ArrayBuffer) {
            buff = content;
        } else if (content instanceof File) {
            buff = await readBinFile(content) as ArrayBuffer
        }else{
            //string
            buff = (new TextEncoder()).encode(content).buffer;
        }
        //let zipedbuff = this.frw.zip(buff);
        // 计算文件的sha值
        let oid = await shasum(new Uint8Array(buff), false) as Uint8Array;
        let hash = toHex(oid);
        let entry = node.getEntry(name);
        if (entry) {  // 如果entry已经存在，说明是替换
            // 看是否修改
            let shastr = toHex(entry.oid!);
            if (shastr === hash) {
                console.log('文件没有修改。');
                return entry;
            }
            // 文件修改了。
            entry.oid = oid;
            node.needSha();
        } else {
            // 如果entry不存在，则要创建新的
            entry = node.addEntry(name, false, oid);
        }
        console.log('[gitfs] 提交变化文件:',node.fullPath+'/'+name);
        if(!await this.saveBlobNode(hash, buff, node.fullPath+'/'+name)){
            // 上传失败。设置一个无效的oid。避免形成永久性错误。
            entry.oid!.fill(0);  
        }
        return entry;
    }

    /**
     * 
     * @param path 是绝对路径或者从根开始相对
     * @param content 
     *  如果是File的话，立即上传，本地不保留
     */
    async setFile(path: string, content: string | ArrayBuffer | File) {
        let buff: ArrayBuffer;
        if (typeof content === 'string') {
            buff = (new TextEncoder()).encode(content).buffer;
        } else if (content instanceof ArrayBuffer) {
            buff = content;
        } else if (content instanceof File) {
            buff = await readBinFile(content)
        }else{
            return;
        }

        //let zipedbuff = this.frw.zip(buff);
        // 计算文件的sha值
        let oid = await shasum(new Uint8Array(buff), false);
        let hash = toHex(oid);

        let pathes = path.split('/');
        let cNode = this.treeRoot;
        // 定位到path指定的节点
        for (let i = 0, n = pathes.length; i < n; i++) {
            let path = pathes[i];
            if (path == '') continue;  // 第一个/，以及中间会有的 //
            if (path == '.') continue;
            if (path == '..') {
                cNode = cNode.parent;
            }
            let entry = cNode.getEntry(path);
            let isDir = i < n - 1;
            if (isDir) {
                // 当前目录是否存在
                if (entry) {
                    //let shastr = toHex(entry.oid);
                    if(!entry.treeNode){
                        // 没有treeNode表示还没有下载。下载构造新的node
                        cNode = await this.openNode(entry);
                    }else{
                        cNode = entry.treeNode;
                    }
                } else {
                    // 如果目录不存在，创建一个
                    // 在当前node添加entry
                    let entry = cNode.addEntry(path, true, null);
                    // 由于是目录，添加新的节点
                    cNode = new TreeNode(null, cNode, this.frw);
                    entry.treeNode=cNode;
                }
            } else {
                // 如果是文件的话
                if (entry) {  // 如果entry已经存在，说明是替换
                    // 看是否修改
                    let shastr = toHex(entry.oid!);
                    if (shastr === hash) {
                        console.log('文件没有修改。');
                        return;
                    }
                    // 文件修改了。
                    entry.oid = oid;
                    cNode.needSha();
                } else {
                    // 如果entry不存在，则要创建新的
                    entry = cNode.addEntry(path, false, oid);
                }

                // 文件没有treeNode属性需要特殊处理。由于oid已经设置成最新的了，下面 updateSha会忽略他
                await this.saveBlobNode(hash, buff, entry.path);
                // 记录需要上传的文件。是否需要立即上传
                // 修改所有节点的sha。记录变化的节点。这个最后push的时候再做
                // await this.treeRoot.updateAllSha(this.frw,this.allchanges);
            }
        }
    }

    async addNativeFile(hNative:any,curdir:string){
        let file: File = (hNative instanceof File)?hNative:await hNative.getFile()
		return new Promise<boolean>((res,rej)=>{
			let reader = new FileReader();
			reader.onload = async (event)=>{
				let value = (event.target as FileReader).result;
                // 计算sha的值
                await this.setFile(curdir, value as ArrayBuffer);
                //let sha = await shasum(new Uint8Array(value as ArrayBuffer))
				res(true);
			};
			reader.onerror = function (event) {
				//readerOnError(event, file, fileReaderType);
				res(false);
			};
			reader.readAsArrayBuffer(file);
		});
    }

    async readNative(hNative:any, type:'buffer'|'utf8'):Promise<string|ArrayBuffer>{
        let file: File = (hNative instanceof File)?hNative:await hNative.getFile()
		return new Promise<string|ArrayBuffer>((res,rej)=>{
			let reader = new FileReader();
			reader.onload = async (event)=>{
				let value = (event.target as FileReader).result;
			    res(value);
			};
			reader.onerror = function (event) {
				//readerOnError(event, file, fileReaderType);
				res(null);
			};
            if(type==='buffer')
			    reader.readAsArrayBuffer(file);
            else
                reader.readAsText(file);
		});
    }

    async addNativeFileAtNode(hNative:any, node:TreeNode, name:string){
        let value = await this.readNative(hNative, 'buffer') as ArrayBuffer;
        let entry = await this.setFileAtNode(node, name, value as ArrayBuffer);
        return entry;
    }    

    /**
     * 把native目录下的文件都设置到curdir目录下
     * @param hnative   FileSystemDirectoryHandle native文件系统的handle
     * @param curdir  当前目录。在当前目录下增加entry（不含entry目录名）
     * @param includeEntryName
     * @param sync  是否保持与这个目录同步。同步的意思就是会删掉本地没有的文件
     */
    async addNativeDir(hnative: any, curdir:string, includeEntryName=false, sync=false) {
        let handle = hnative;
        if(!curdir.endsWith('/')) curdir+='/';
        if(includeEntryName){
            curdir+=hnative.name;
            curdir+='/';
        }

        // 直接添加curdir的child
        for await (const hChild of handle.values()) {
            let name = hChild.name;
            if (hChild.kind === "directory") {
                await this.addNativeDir( hChild, curdir+name+'/',false);
            } else {
                let fileH = await handle.getFileHandle(name);
                await this.addNativeFile(fileH, curdir+name);
            }
        }
    }

    /**
     * 把gitfsNode下载到localNode中
     * @param gitfsNode 
     * @param localNode 
     */
     async checkoutToLocal(gitfsNode:TreeNode, localNode:FileNode){
		if (!localNode.child || Object.keys(localNode.child).length === 0) {
			await localNode.readChild();
		}
        for( let f of gitfsNode){
            let pathname = f.path;
            // 如果是目录，就创建目录
            if(f.isDir){
                let fsnode = await localNode.mkdir(pathname) as FileNode;
                let nextgitfsNode = gitfsNode.getEntry(pathname);
                if(!nextgitfsNode){
                    console.error('gitfs 没有这个节点:', pathname);
                    return;
                }
                if(!nextgitfsNode.treeNode){
                    await this.openNode(nextgitfsNode);
                }
                await this.checkoutToLocal(nextgitfsNode.treeNode!,fsnode);
            }else{
                // 先看文件內容是否相同
                let  filenode = localNode.child[pathname];
                let shalocal:string;
                let shaonline = toHex(f.oid!);
                if(filenode){
                    let fc = await filenode.readFile('buffer');
                    shalocal = await shasum(fc,true) as string;
                    if( shalocal== shaonline){
                        continue;
                    }
                }
                // 文件不相同，下载远端文件
                if(shaonline=='0000000000000000000000000000000000000000'){
                    console.warn('错误文件：',pathname);
                    continue;
                }
                let fscontent = await this.getBlobNode(f.oid!,'buffer');
                if(fscontent){
                    console.log('gitfs update file:',localNode.getFullPath()+'/'+pathname);
                    await localNode.createFile(pathname, fscontent);
                }
                else{
                    console.error('下载文件失败。')
                }
            }
        }
    }


    /**
     * 提交本地目录的变化。
     * 如果需要更新的话，先更新
     * @param hnative 为空的话，则选择一个
     */
    async commitNativeDir(hnative:any,alertnotify=true){
        // let webfsFileNode = new WebFSFileNode(hnative, 'na', true, null);
        // if(!hnative){
        //     await webfsFileNode.selectWebFSPath();
        // }
        // webfsFileNode.name=webfsFileNode.handle.name;

        // // 先检查是否需要更新
        // await this.initByLastCommit();
        // // 查看当前根目录下是否有commit信息
        // let curHead = await this.getHeadFromLocal(webfsFileNode);
        // if(curHead!=this.curCommit.sha){
        //     // 检查commit是否比较老
        //     if(!confirm('本地文件比较老，需要先更新。'))
        //         return;
        //     console.log('开始更新...');
        //     await this.checkoutToLocal(this.treeRoot, webfsFileNode);
        // }
        // await this.commitNativeDirAtNode(webfsFileNode.handle, this.treeRoot,true);
        // this.curCommit.sha && await this.saveHeadToLocal(this.curCommit.sha,webfsFileNode);
        // alertnotify&&alert('commit ok');
    }

    // async commitLocal(msg:string, fsnode:WebFSFileNode){
    //     if(!fsnode){
    //         fsnode = new WebFSFileNode(null, 'notuse', true, null);
    //         await fsnode.selectWebFSPath();
    //     }
    //     await this.commitNativeDir(fsnode.handle,false);
    //     let commit = await this.push('同步:\n' + (msg ? msg : '') + '\n', fsnode);
    //     return commit;
    // }

    /**
     * 同步一个本地目录。
     * 忽略本地目录的名字，直接把本地目录的子与node的子比较
     * @param hnative 
     * @param node 
     * @param sync  是否完全同步。即删掉本地没有的文件
     */
    async commitNativeDirAtNode(hnative: any, node:TreeNode, sync=false) {
        if(sync){
            node.entries.forEach(e=>{
                e.touchFlag=1;
            })
        }

        // 查找.ignore文件
        let ignores:string[]=[];
        for await (const hChild of hnative.values()) {
            if (hChild.kind === "file"){
                if(hChild.name==='.ignore'){
                    let ignoresstr = await this.readNative(hChild,'utf8') as string;
                    if(ignoresstr){
                        ignoresstr.split('\n').forEach(ign=>{
                            if(ign.endsWith('\r')) ign = ign.substr(0,ign.length-1);
                            ignores.push(ign);
                        });
                    }
                    break;
                }
            }
        }

        for await (const hChild of hnative.values()) {
            let name = hChild.name;
            if(ignores && ignores.length>0 && ignores.includes(name))
                continue;

            let entry = node.getEntry(name);
            if (hChild.kind === "directory") {
                if(name==='.git') continue;
                if(name===PROJINFO) continue;
                let cNode:TreeNode;
                if (entry) {
                    //let shastr = toHex(entry.oid);
                    if(!entry.treeNode){
                        // 没有treeNode表示还没有下载。下载构造新的node
                        cNode = await this.openNode(entry);
                    }else{
                        cNode = entry.treeNode;
                    }
                } else {
                    // 如果目录不存在，创建一个
                    // 在当前node下添entry
                    entry = node.addEntry(name, true, null);
                    cNode = new TreeNode(null, node, this.frw);
                    // 在当前node添加entry
                    entry.treeNode=cNode;
                }
                entry.touchFlag=0;
                await this.commitNativeDirAtNode( hChild, cNode,sync);
            } else {
                //let fileH = await hnative.getFileHandle(name);
                //let entry = await this.addNativeFileAtNode(fileH, node, name);
                let entry = await this.addNativeFileAtNode(hChild, node, name);
                entry.touchFlag=0;
            }
        }

        if(sync){
            // 
            let rmFiles:string[]=[];
            node.entries.forEach(e=>{
                if(e.touchFlag==1)
                    rmFiles.push(e.path);
            })
            rmFiles.forEach(rmf=>{
                node.rmEntry(rmf);
            });
        }
    }

    /**
     * rename('Assets/models/a.lm', 'b.lm')
     * 
     * @param path 相对路径
     * @param newname 新的名字
     */
    async rename(path:string, newname:string) {
        let entries:TreeEntry[]=[];
        if( await this.pathToEntries(path, entries)){
            let end = entries[entries.length-1];
            end.path = newname;
            end.owner.needSha();
            return true;
        }
        return false;
    }

    /**
     * remove('Assets/models/a.lm')
     * 
     * @param path  相对路径
     */
    async remove(path:string) {
        let entries:TreeEntry[]=[];
        if( await this.pathToEntries(path, entries)){
            let end = entries[entries.length-1];
            return end.owner.rmEntry(end);
        }
        return false;
    }

    /**
     * 把某个文件或者目录拷贝到另外一个目录中
     * @param dstNode 
     * @param srcentry 
     */
    copy(dstNode:TreeNode, srcentry:TreeEntry){
        dstNode.addEntry( srcentry.path, srcentry.isDir, srcentry.oid);
    }

    private async makeCommit(msg: string) {
        // 注意，这时候的sha必须要已经计算了
        if(!this.treeRoot.sha){
            console.error('[gitfs] makecommit 需要先计算sha');
            return null;
        }
        if(this.curCommit.tree==this.treeRoot.sha){
            console.log('[gitfs] makecommit parent 和现在的相同');
            return null;
        }
        let cmtinfo = new CommitInfo();
        cmtinfo.commitMessage = msg;
        cmtinfo.author = this.user;
        cmtinfo.author_timestamp=new Date();
        cmtinfo.parent = this.curCommit.sha;
        //await this.treeRoot.updateAllSha(this.frw,this.allchanges);
        cmtinfo.tree = this.treeRoot.sha;
        console.log('[gitfs] makecommit tree:',this.treeRoot.sha);
        let cmt = new GitCommit(cmtinfo, 'nosha');
        let buff = await cmt.toBuffer(this.frw);
        this.curCommit = cmtinfo;
        return buff;
    }

    /**
     * 把变化推送到服务器
     * 如果没有变化立即返回
     * 
     * @param rootpash 通过同步本地文件执行的push，这时候需要记录一个head。如果是程序动态创建的，则不要记录head，否则会在提交资源的时候被冲掉
     */
    async push(commitmsg:string, rootpash:FileNode) {
        await this.treeRoot.updateAllSha(this.frw,this.allchanges);
        let allchanges = this.allchanges;
        let n = allchanges.length;
        if (n <= 0) return null;

        let root = this.treeRoot;
        let findroot = false;   // root必须包含在变化列表中
        for (let i = 0; i < n; i++) {
            let cchange = allchanges[i];
            if (cchange == root) {
                findroot = true;
            }
            // 上传变化的节点
            console.log('[gitfs] 提交变化目录:', cchange.fullPath, cchange.sha);
            // buff在updateAllSha的时候已经创建了。
            await this.saveBlobNode(cchange.sha!, cchange.buff!.buffer, cchange.fullPath);
            //cchange.needCommit=true;
        }
        //
        if (!findroot) {
            console.error('变换节点没有找到root！');
        }
        // 清零
        this.allchanges.length = 0;

        // 提交commit
        let buff = await this.makeCommit(commitmsg);
        if(!buff) return;
        console.log('[gitfs] 提交commit',this.curCommit.sha);
        // 写文件
        await this.saveBlobNode(this.curCommit.sha, buff.buffer, 'commit');

        let recent=this.recentCommits;
        if(!recent){
            recent = this.recentCommits=[];
        }
        recent.splice(0,0,this.curCommit.sha);
        if(recent.length>20)recent.length=20;

        //TEMP TODO 发版以后恢复
        recent.length=1;

        console.log('[gitfs] 写head');
        // 把当前commit提交。 先用覆盖的方式。这种是常态
        let headfile = this.userUrl;    // 这个由于有cdn，需要通过源站访问。注意这里是相对的
        let recentstr = recent.join('\n');
        let ret = await this.frw.write(headfile, recentstr, true) as any;
        if(ret.ret!=0){
            // 覆盖失败了，创建
            ret = await this.frw.write(headfile, recentstr, false) as any;
            if(ret.ret!=0){
                console.error('[gitfs] 上传head失败')
            }
        }
        rootpash && await this.saveHeadToLocal(this.curCommit.sha!,rootpash);
        console.log('同步完成! head=',this.curCommit.sha);
        return this.curCommit.sha;
    }


    //TODO 保存head应该带目录。否则一旦切换不同的目录会导致出问题（保存的是最新的，但是选中的目录实际是旧的）
    async saveHeadToLocal(commit:string|Object, fs:FileNode){
        //this.frw.saveUserData(this.name+'_'+this.branch+'_head', commit);
        if(typeof(commit)=='object'){
            commit = JSON.stringify(commit);
        }
        let git = await fs.mkdir(PROJINFO);
        await git.createFile('head',commit as string);
    }

    async getHeadFromLocal(fs:FileNode){
        await fs.readChild();
        let git = fs.child[PROJINFO];
        if(!git) return null;
        await git.readChild();
        let head = git.child['head'];
        if(!head) return head;
        return head.readFile('utf8');
        //return this.frw.getUserData(this.name+'_'+this.branch+'_head');
    }

    private printCommit(cmt:CommitInfo){
        console.log('-----------------------------')
        console.log(cmt.commitMessage, cmt.sha, cmt.tree);
    }

    async printLog(num: number) {
        let curCommit = this.curCommit;
        this.printCommit(curCommit);
        for (let i = 0; i < num; i++) {
            let par = curCommit.parent;
            if (!par) break;
            if(par=='0') break;
            let pcommit = await this.getCommit(par)
            if (pcommit) {
                this.printCommit(pcommit.commitinfo);
                curCommit = pcommit.commitinfo;
            }else{
                break;
            }
        }
    }
}