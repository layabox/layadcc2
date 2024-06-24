import * as path from "path";
import { DCCFS_NodeJS } from "./DCCFS_NodeJS";
import { TreeEntry, TreeNode } from "./gitfs/GitTree";
import * as fs from 'fs'
import { promisify } from "util";
import { GitFS } from "./gitfs/GitFS";
import { RootDesc } from "./RootDesc";
import { hashToArray, shasum, toHex } from "./gitfs/GitFSUtils";
import { ObjPack } from "./ObjPack";
import { DCCObjectWrapper } from "./DCCObjectWrapper";

export class Params {
    mergeFile = false;
    //小于这个文件的合并
    fileToMerge = 100 * 1024;
    //合并后的最大文件大小，不允许超过。
    mergedFileSize = 1000 * 1024;
    dccout = "dccout";
    outfile = 'version'
    //用户需要指定版本号，这样可以精确控制。如果已经存在注意提醒
    version = '1.0.0';
    fast = true;
    //不保存文件，只是用来比较差异
    dontSaveBlobs=false;
    progressCB:(curfile:string,percent:number)=>void=null;
    /**
     * 混淆秘钥，注意这个只能用于本地资源，dcc服务器不要加混淆
     * 可能得问题：
     * 1. 混淆之后文件名不再是hash值，无法判断是否要覆盖
     * 2. 服务器会有碎文件打包
     */
    xorKey: Uint8Array = null;
    desc: string;
}

export class LayaDCC {
    private frw: DCCFS_NodeJS;
    private gitfs: GitFS;
    private config = new Params();
    private dccout: string;
    constructor() {
    }

    set params(p: Params) {
        this.config = p;
    }

    /**
     * 生成目录p的dcc信息
     * 默认保存在当前目录的dccout目录下
     * @param p 针对这个目录生成dcc
     */
    async genDCC(p: string) {
        let dccout = this.dccout = path.resolve(p, this.config.dccout)
        this.frw = new DCCFS_NodeJS();
        await this.frw.init(dccout, null);
        this.gitfs = new GitFS(this.frw);
        if (this.config.xorKey) {
            if (this.config.mergeFile) {
                throw "Once encryption is enabled, small file merging cannot be configured";
            }
            this.gitfs.objectEncrypter = {
                encode: (buff: ArrayBuffer) => {
                    //如果需要加密。加密只影响object，且只有给app本地资源做，所以不考虑打包等问题
                    let head = new DCCObjectWrapper();
                    head.xorKey = this.config.xorKey;
                    return DCCObjectWrapper.wrapObject(buff, head).buffer;
                },
                decode: (buff: ArrayBuffer) => {
                    return null;
                },
            }
        }

        //rootNode.
        if (!fs.existsSync(dccout)) {
            fs.mkdirSync(dccout, { recursive: true });
        }

        //revisions
        let revPath = path.join(dccout, 'revisions');
        if (!fs.existsSync(revPath)) {
            fs.mkdirSync(revPath);
        }

        //得到最后一次提交的根
        //先直接操作目录
        //let lastVer:string;
        let rootNode: TreeNode;
        try {
            let headstr = await this.frw.read('head.json', 'utf8', true) as string;
            let headobj = JSON.parse(headstr) as RootDesc;
            //打包文件
            if (headobj.treePackages) {
                for (let packid of headobj.treePackages) {
                    let pack = new ObjPack('tree', this.frw, packid);
                    await pack.init();
                    this.gitfs.addObjectPack(pack);
                }
            }
            rootNode = await this.gitfs.getTreeNode(headobj.root, null);
        } catch (e: any) {
            rootNode = new TreeNode(null, null, this.frw);
        }


        //当前修订版。修订版只要内容变了就会增加，与用户设置的版本无关
        let lastRev = 0;
        let lastRevRoot: string = null;
        try {
            lastRev = parseInt(fs.readFileSync(path.join(revPath, 'head.txt'), 'utf-8'));
            if (lastRev >= 0) {
                lastRevRoot = fs.readFileSync(path.join(revPath, `${lastRev}.txt`), 'utf-8')
            }
            if (!lastRevRoot) {
                lastRev = 0;
            }
        } catch (e) { }

        let files = await this.syncWithDir(p, rootNode, this.config.fast, ['.git', '.gitignore', 'dccout']);
        //console.log(files.length)
        //console.log(files)
        //更新修订版本
        if (rootNode.sha !== lastRevRoot) {
            //有变化
            fs.writeFileSync(path.join(revPath, 'head.txt'), `${lastRev + 1}`);//当前版本
            fs.writeFileSync(path.join(revPath, `${lastRev + 1}.txt`), rootNode.sha)//当前版本对应的root
        }

        //创建头文件
        let head = new RootDesc();
        head.root = rootNode.sha;
        head.fileCounts = files.length;
        head.objPackages = [];
        head.time = new Date();
        head.version = this.config.version;
        this.config.desc && (head.desc = this.config.desc);

        //
        //let headbuff = this.frw.textencode(JSON.stringify(head))
        //shasum(new Uint8Array(headbuff),true)
        //头，固定文件名
        //await this.frw.write(`${this.config.outfile}.json`,JSON.stringify(head),true);

        //合并文件
        if (this.config.mergeFile) {
            let merges = await this.mergeSmallFile(rootNode, false, false);
            head.treePackages = merges.tree_packs;
        }
        //版本文件
        await this.frw.write('head.json', JSON.stringify(head), true);//这个要用固定名称，与配置无关
        await this.frw.write(`${this.config.outfile}.${this.config.version}.json`, JSON.stringify(head), true);
        //debugger;
    }

    private async saveTreePack(buff: ArrayBuffer, lenth: number, indexInfo: { id: string, start: number, length: number }[]) {
        let dccout = this.dccout;
        let sha = await shasum(new Uint8Array(buff, lenth), true) as string;
        let packfile = path.join(dccout, 'packfile', `tree-${sha}.pack`);
        let indexfile = path.join(dccout, 'packfile', `tree-${sha}.idx`);
        if (!fs.existsSync(path.join(dccout, 'packfile'))) {
            fs.mkdirSync(path.join(dccout, 'packfile'));
        }
        await this.frw.write(packfile, buff.slice(0, lenth), true);
        await this.frw.write(indexfile, JSON.stringify(indexInfo), true);
        return sha;
    }

    /**
     * 合并小文件。
     * 注意：
     * 如果dcc目录包含多个版本，则不要删除合并的原文件，否则会影响别的版本
     * 或者做成多层，底层的合并是上层不可见的，这时候才可以删除原始文件
     * @param rootNode 
     * @param rmMergedTreeNode 
     * @param rmMergedObjNode 
     * @returns 
     */
    private async mergeSmallFile(rootNode: TreeNode, rmMergedTreeNode: boolean, rmMergedObjNode: boolean) {
        let dccout = this.dccout;
        let frw = this.frw;
        let gitfs = this.gitfs;
        let treeNodes: string[] = [];
        let blobNodes: string[] = [];
        let tree_packs: string[] = [];
        let blob_packs: string[] = [];

        //统计所有的treenode和blobnode,他们要分别打包
        await gitfs.visitAll(rootNode, async (cnode,entry) => {
            treeNodes.push(cnode.sha!);
        }, async (entry) => {
            blobNodes.push(toHex(entry.oid));
        },null)

        //过滤重复文件。例如内容完全相同的两个目录，会记录多次
        if (treeNodes.length) treeNodes = [... new Set(treeNodes)];
        if (blobNodes.length) blobNodes = [... new Set(blobNodes)];

        let treeSize = 0;
        let reservBuff = new Uint8Array(this.config.mergedFileSize);
        let objInPacks: { id: string, start: number, length: number }[] = [];
        for (let i of treeNodes) {
            let objFile = gitfs.getObjUrl(i);
            let buff = await frw.read(objFile, 'buffer', true) as ArrayBuffer;
            let size = buff.byteLength;
            if (treeSize + size < this.config.mergedFileSize) {
                objInPacks.push({ id: i, start: treeSize, length: size });
                reservBuff.set(new Uint8Array(buff), treeSize);
                treeSize += size;
            } else {
                tree_packs.push(await this.saveTreePack(reservBuff, treeSize, objInPacks));
                treeSize = 0;
                objInPacks.length = 0;

                objInPacks.push({ id: i, start: treeSize, length: size });
                reservBuff.set(new Uint8Array(buff), treeSize);
                treeSize += size;
            }
            if (rmMergedTreeNode) {
                //console.log('rm:', objFile)
                await this.frw.rm(objFile);
            }
        }
        //剩下的写文件，计算hash
        tree_packs.push(await this.saveTreePack(reservBuff, treeSize, objInPacks));
        treeSize = 0;
        objInPacks.length = 0;


        //
        //合并小文件
        //直接遍历objects目录，顺序合并
        //结果记录下来即可
        return { tree_packs }
    }

    /**
     * 根据dir来生成对应的object对象保存起来
     * @param dir 
     * @param node 
     * @param fast 
     * @param ignorePatterns 忽略目录或者文件，只是影响当前目录
     * @returns 
     */
    private async syncWithDir(dir: string, node: TreeNode, fast: boolean, ignorePatterns: string[] | null = null): Promise<string[]> {
        let files: string[] = [];
        const dirents = await promisify(fs.readdir)(dir, { withFileTypes: true });

        let ignorePath = path.join(dir, '.ignore');
        if (fs.existsSync(ignorePath)) {
            let ignoresstr = fs.readFileSync(ignorePath, 'utf-8');
            if (ignoresstr) {
                if (!ignorePatterns) ignorePatterns = [];
                ignoresstr.split('\n').forEach(ign => {
                    if (ign.endsWith('\r')) ign = ign.substring(0, ign.length - 1);
                    ignorePatterns!.push(ign);
                });
            }
        }

        node.entries.forEach(e=>{
            //清理touch标记。如果后面设置1了，表示使用，那么是0的就是要删除的
            e.touchFlag=0;
        });

        for (const dirent of dirents) {
            let filename = dirent.name;
            const res = path.resolve(dir, filename);
            if(this.config.progressCB){
                this.config.progressCB(res,0);
            }
            let entry = node.getEntry(filename);

            // 如果路径符合忽略模式，则跳过此路径
            if (ignorePatterns && ignorePatterns.some(pattern => filename == pattern)) {
                continue;
            }

            if (dirent.isDirectory()) {
                if (!entry) {
                    // 如果treenode中没有记录这个entry，创建一个
                    // 在当前node下添entry
                    entry = node.addEntry(filename, true, null);
                    let cNode = new TreeNode(null, node, this.frw);
                    // 在当前node添加entry
                    entry.treeNode = cNode;
                } else {
                    if (!entry.treeNode) {
                        //有entry没有treenode，则表示可以加载
                        try {
                            entry.treeNode = await this.gitfs.getTreeNode(toHex(entry.oid), null);
                        } catch (e) {
                            //获得treenode失败了，很大可能是目录内容改变了，所以需要重新生成
                            let cNode = new TreeNode(null, node, this.frw);
                            // 在当前node添加entry
                            entry.treeNode = cNode;
                            node.needSha();
                        }
                    }
                }

                entry.touchFlag = 1;
                let rets = await this.syncWithDir(res, entry.treeNode!, fast, []);
                entry.oid = hashToArray(entry.treeNode.sha);
                files = files.concat(rets);
            } else {
                let check = true;
                let stat = fs.statSync(res);
                let fmtime = stat.mtime;
                if (entry) {
                    if (fast) {
                        if (stat.mtime <= entry.fileMTime) {
                            check = false;
                        }
                    }
                }
                if (check) {
                    let value = await this.frw.read(res, 'buffer', true) as ArrayBuffer;
                    entry = await this.gitfs.setFileAtNode(node, filename, value);
                    entry.fileMTime = fmtime;
                }
                entry.touchFlag = 1;
                files.push(res);
            }
        }

        //处理删除的
        node.clearUntouched();

        let buff: Uint8Array = await node.toObject(this.frw);
        await this.gitfs.saveObject(node.sha!, buff.buffer);
        return files;
    }

    /**
     * 把某个版本解开到某个目录
     * @param outpath 
     */
    async checkout(rev: number, outpath: string) {
        let gitfs = this.gitfs;
        await gitfs.checkoutToLocal(null, null);
    }

    get fileIO() {
        return this.frw;
    }

    //获取某个对象（用hash表示的文件或者目录）在缓存中的地址
    getObjectUrl(objid: string) {
        return this.gitfs.getObjUrl(objid)
    }

    /**
     * 把一个相对目录转换成对象目录
     * @param path 相对目录
     * @returns 对象目录，相对dcc根目录
     */
    async transUrl(path: string) {
        let gitfs = this.gitfs;
        if (!gitfs) return null;

        let objpath = await gitfs.pathToObjPath(path);
        if (!objpath) {
            return null;
        }
        return objpath;
    }
}

/**
 * 为了便于处理，把gitfs的节点转换成这个
 */
class RTNode{
    id:string;
    type:'dir'|'file';
    name:string;
    fullPath:string;
    child:{[key:string]:RTNode}={};
    parent:RTNode;
    constructor(name:string,id:string,parent:RTNode,type:'dir'|'file'){
        this.name=name;
        this.id=id;
        this.type=type;
        this.parent=parent;
        if(parent){
            parent.child[name]=this;
            this.fullPath = parent.fullPath+name +(type=='dir'?'/':'');
        }else{
            this.fullPath='/';
        }
    }
}

export async function getDiff(git1:GitFS, git2:GitFS){
    let renames:{old:string,new:string}[]=[];
    let modifies:{path:string, newfile:boolean}[]=[];
    let deletes:string[]=[];
    //添加的文件。如果是添加了引用。del, add, 是重命名， 然后添加引用 add
    let addes:{path:string,newfile:boolean}[]=[];

    //id到目录的映射，可能会一对多
    let idMap:{[key:string]:{path:string,op:string}[]}={};
    //老的idmap，用来判断是不是增加对象了
    let idMapOld:{[key:string]:string}={}
    function checkNodeDel(id:string, fullpath:string){
        if(!idMap[id]) idMap[id]=[];
        idMap[id].push({path:fullpath,op:'del'});
    }

    let root1 = git1.treeRoot.rtData = new RTNode('/',git1.treeRoot.sha,null,'dir');
    await git1.visitAll(git1.treeRoot,async (node:TreeNode,entry:TreeEntry)=>{
        checkNodeDel(node.sha,node.fullPath);
        idMapOld[node.sha]='';
        if(entry) node.rtData = new RTNode(entry.path, node.sha, entry.owner.rtData,'dir');
    }, async (blobEntry)=>{
        let id = toHex(blobEntry.oid);
        let parpath = blobEntry.owner.fullPath;
        if(parpath=='/') parpath='';
        let path = parpath+'/'+ blobEntry.path;
        checkNodeDel(id,path);
        new RTNode(blobEntry.path,id,blobEntry.owner.rtData,'file');
        idMapOld[id]='';
    },null);

    function checkNodeAdd(id:string, fullpath:string){
        //这个表示原来有没有，如果有的话，再次add就是addref
        let has=false;
        if(!idMap[id]) idMap[id]=[];
        else{
            has=true;//即使抵消了，也表示原来是有的
            let lastop = idMap[id];
            for(let i=0,n=lastop.length; i<n; i++){
                let info = lastop[i];
                if(info.op=='del'){
                    if(info.path!=fullpath){
                        //改名，删掉
                        renames.push({old:info.path,new:fullpath});
                    }else{
                        //没有改名，抵消
                    }
                    lastop.splice(i,1);//把del删除了
                    //新的就不添加了，表示没有增加这个对象
                    return;
                }
            }
        }
        idMap[id].push({path:fullpath,op:has?'addref':'add'});
    }

    let root2 = git2.treeRoot.rtData = new RTNode('/', git2.treeRoot.sha,null,'dir');
    await git2.visitAll(git2.treeRoot,async (node:TreeNode,entry:TreeEntry)=>{
        let id = node.sha;
        checkNodeAdd(id,node.fullPath);
        if(entry) node.rtData = new RTNode(entry.path, node.sha, entry.owner.rtData,'dir');
    }, async (blobEntry)=>{
        let id = toHex(blobEntry.oid);
        let parpath = blobEntry.owner.fullPath;
        if(parpath=='/') parpath='';
        let path = parpath+'/'+ blobEntry.path;
        checkNodeAdd(id,path);
        new RTNode(blobEntry.path, id,blobEntry.owner.rtData,'file');
    }, null);

    //统计修改的文件
    function _visitRTNode(node:RTNode,oldNode:RTNode){
        if(oldNode){
            if(node.id!=oldNode.id){
                //id变了，应该是修改了
                //是否是新的。如果这个id在idmap中则是新的
                //改名的不在idmap中
                modifies.push({path:node.fullPath,newfile:!idMapOld[node.id]})
            }
        }
        if(node.type=='file')
            return;
        for(let c in node.child){
            _visitRTNode(node.child[c], oldNode?oldNode.child[c]:null);
        }
    }
    _visitRTNode(root2,root1);

    //统计添加和删除的文件
    for(let i in idMap){
        let idInfo = idMap[i];
        for(let ii=0, n=idInfo.length; ii<n; ii++){
            let fileInfo = idInfo[ii];
            switch(fileInfo.op){
                case 'del':
                    deletes.push(fileInfo.path);
                    break;
                case 'add':
                    addes.push({path:fileInfo.path,newfile:true});
                    break;
                case 'addref':
                    addes.push({path:fileInfo.path,newfile:false});
                    break;
            }
        }
    }

    return {add:addes,del:deletes,modify:modifies,rename:renames};

/*
    modified:path,newfile?  没有的话，就是指向了别的文件
    del:path,delobj?    没有的话，就是删除引用
    add:path,newfile    没有的话，就是增加引用
    rename:pathold, pathnew

    都是文件，不是目录

*/
}

/**
 * 返回git2-git1的增加的对象列表
 * @param git1 
 * @param git2 
 */
async function getDiffObjects(git1:GitFS, git2:GitFS ){
    let oldset = new Set();
    let changed: string[] = [];

    await git1.visitAll(git1.treeRoot,async (node:TreeNode,entry:TreeEntry)=>{
        oldset.add(node.sha);
    }, async (entry)=>{
        oldset.add(toHex(entry.oid));
    },null);

    await git2.visitAll(git2.treeRoot,async (node:TreeNode,entry:TreeEntry)=>{
        let id = node.sha;
        if (!oldset.has(id))
            changed.push(id);
    }, async (entry)=>{
        let id = toHex(entry.oid);
        if (!oldset.has(id))
            changed.push(id);
    },null);

    console.log('changed:',changed);

}