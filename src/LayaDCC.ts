import * as path from "path";
import { NodejsFRW } from "./NodejsFRW";
import { TreeNode } from "./gitfs/GitTree";
import * as fs from 'fs'
import { promisify } from "util";
import { GitFS } from "./gitfs/GitFS";
import { RootDesc } from "./RootDesc";
import { shasum, toHex } from "./gitfs/GitFSUtils";

class Params{
    //如果为true则head.json会把版本号加到后面
    increaseFileName=false;
    //小于这个文件的合并
    fileToMerge=100*1024;
    //合并后的最大文件大小，不允许超过。
    mergedFileSize=1000*1024;
    dccout = "dccout";
    outfile='version'
    //用户需要指定版本号，这样可以精确控制。如果已经存在注意提醒
    version='1.0.1';  
    fast=true;
}

export class LayaDCC {
    private frw:NodejsFRW;
    private gitfs:GitFS;
    private config = new Params();
    private dccout:string;
    constructor() {

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

    injectToLayaDownloader(downloader:any){

    }

    /**
     * 生成目录p的dcc信息
     * 默认保存在当前目录的.dcc目录下
     * @param p 
     */
    async genDCC(p: string) {
        let dccout = this.dccout =  path.resolve(p, this.config.dccout)
        this.frw  = new NodejsFRW(dccout);
        this.gitfs = new GitFS(dccout,'',this.frw);
        
        console.log('v=', p);
        //得到最后一次提交的根
        //TODO 找到提交
        //先直接操作目录
        let lastVer:string;
        let rootNode:TreeNode;
        try{
            let headstr = await this.frw.read(this.config.outfile+'.json','utf8') as string;
            let headobj = JSON.parse(headstr) as RootDesc;
            lastVer = headobj.version||'1.0.0';
            rootNode = await this.gitfs.getTreeNode(headobj.root,null);
        }catch(e:any){
            rootNode = new TreeNode(null,null,this.frw);
        }

        //rootNode.
        if(!fs.existsSync( dccout)){
            //TODO 绝对路径的情况
            fs.mkdirSync(dccout);
        }
        let files = await this.walkDirectory(p,rootNode,this.config.fast,['.git','.gitignore','dccout']);
        console.log(files.length)
        console.log(files)
        //创建头文件
        let head = new RootDesc();
        head.root = rootNode.sha!;
        head.fileCounts = files.length;
        head.objPackages=[];
        head.time = new Date();
        head.version = this.config.version;

        //let headbuff = this.frw.textencode(JSON.stringify(head))
        //shasum(new Uint8Array(headbuff),true)
        //头，固定文件名
        await this.frw.writeToCommon(`${this.config.outfile}.json`,JSON.stringify(head),true);
        //版本文件
        await this.frw.writeToCommon(`${this.config.outfile}.${this.config.version}.json`,JSON.stringify(head),true);

        await this.mergeSmallFile(rootNode);
        //debugger;
    }

    private async saveTreePack(buff:ArrayBuffer,lenth:number,indexInfo:{id:string,start:number,length:number}[]){
        let dccout = this.dccout;
        let sha = await shasum(new Uint8Array(buff,lenth),true);
        let packfile = path.join(dccout,'packfile',`tree-${sha}.pack`);
        let indexfile = path.join(dccout,'packfile',`tree-${sha}.idx`);
        if(!fs.existsSync(path.join(dccout,'packfile'))){
            fs.mkdirSync(path.join(dccout,'packfile'));
        }
        await this.frw.write(packfile,buff.slice(0,lenth),true);
        await this.frw.write(indexfile,this.frw.textencode(JSON.stringify(indexInfo)),true);
        return packfile;
    }

    private async mergeSmallFile(rootNode:TreeNode){
        let dccout = this.dccout;
        let frw = this.frw;
        let gitfs = this.gitfs;
        let treeNodes:string[]=[];
        let blobNodes:string[]=[];
        let tree_packs:string[]=[];
        let blob_packs:string[]=[];

        //统计所有的treenode和blobnode,他们要分别打包
        await gitfs.visitAll(rootNode,(cnode)=>{
            treeNodes.push(cnode.sha!);
        },(entry)=>{
            blobNodes.push(toHex(entry.oid));
        })

        let treeSize=0;
        let reservBuff = new Uint8Array(this.config.mergedFileSize);
        let objInPacks:{id:string,start:number,length:number}[]=[];
        for(let i of treeNodes){
            let commitobjFile = gitfs.getObjUrl(i, GitFS.OBJSUBDIRNUM, false);
            let buff = await frw.read(commitobjFile, 'buffer') as ArrayBuffer;
            let size = buff.byteLength;
            if(treeSize+size<this.config.mergedFileSize){
                objInPacks.push({id:i,start:treeSize,length:size});
                reservBuff.set(new Uint8Array(buff),treeSize);
                treeSize+=size;
            }else{
                tree_packs.push(await this.saveTreePack(reservBuff,treeSize,objInPacks));
                treeSize=0;
                objInPacks.length=0;
            }
        }
        //剩下的写文件，计算hash
        tree_packs.push(await this.saveTreePack(reservBuff,treeSize,objInPacks));
        treeSize=0;
        objInPacks.length=0;


        //
        //合并小文件
        //直接遍历objects目录，顺序合并
        //结果记录下来即可
    }

    async checkoutTest(p: string,head:string){
        let dccout =  path.resolve(p, this.config.dccout)
        this.frw  = new NodejsFRW(dccout);
        this.gitfs = new GitFS(dccout,'',this.frw);
        try{
            let headstr = await this.frw.read(head,'utf8') as string;
            let headobj = JSON.parse(headstr) as RootDesc;
            let rootobj = await this.gitfs.getTreeNode(headobj.root,null)
            debugger;
        }catch(e:any){
            debugger;
        }
        debugger;
    }

    /**
     * 
     * @param dir 
     * @param node 
     * @param fast 
     * @param ignorePatterns 忽略目录或者文件，只是影响当前目录
     * @returns 
     */
    private async walkDirectory(dir: string, node:TreeNode,fast:boolean, ignorePatterns: string[]|null = null): Promise<string[]> {
        let files: string[] = [];
        const dirents = await promisify(fs.readdir)(dir, { withFileTypes: true });

        let ignorePath = path.join(dir, '.ignore');
        if (fs.existsSync(ignorePath)) {
            let ignoresstr = fs.readFileSync(ignorePath, 'utf-8');
            if (ignoresstr) {
                if(!ignorePatterns) ignorePatterns = [];
                ignoresstr.split('\n').forEach(ign => {
                    if (ign.endsWith('\r')) ign = ign.substring(0, ign.length - 1);
                    ignorePatterns!.push(ign);
                });
            }
        }

        for (const dirent of dirents) {
            let filename = dirent.name;
            const res = path.resolve(dir, filename);
            let entry = node.getEntry(filename);

            // 如果路径符合忽略模式，则跳过此路径
            if (ignorePatterns && ignorePatterns.some(pattern => filename==pattern)) {
                continue;
            }

            if (dirent.isDirectory()) {
                if(!entry){
                    // 如果目录不存在，创建一个
                    // 在当前node下添entry
                    entry = node.addEntry(filename, true, null);
                    let cNode = new TreeNode(null, node, this.frw);
                    // 在当前node添加entry
                    entry.treeNode = cNode;
                }else{
                    if(!entry.treeNode){
                        //有entry没有treenode，则表示可以加载
                        entry.treeNode = await this.gitfs.getTreeNode(toHex(entry.oid),null);
                    }
                }

                entry.touchFlag = 0;
                let rets = await this.walkDirectory(res,entry.treeNode!,fast,[]);
                files = files.concat(rets);
            } else {
                let check=true;
                let stat = fs.statSync(res);
                let fmtime = stat.mtime;
                if(entry){
                    if(fast){
                        if( stat.mtime<=entry.fileMTime){
                            check=false;
                        }
                    }
                }
                if(check){
                    let value = await this.frw.read(res,'buffer') as ArrayBuffer;
                    entry = await this.gitfs.setFileAtNode(node, filename, value);
                    entry.fileMTime = fmtime;
                }
                entry!.touchFlag=0;
                files.push(res);
            }
        }
        let buff = await node.toObject(this.frw);
        this.gitfs.saveObject(node.sha!,buff);
        return files;
    }    

    /**
     * 只要本版信息
     * 从roottree开始
     */
    private outCache(){

    }

}

