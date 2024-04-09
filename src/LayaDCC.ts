import * as path from "path";
import { NodejsFRW } from "./NodejsFRW";
import { TreeNode } from "./gitfs/GitTree";
import * as fs from 'fs'
import { promisify } from "util";
import { GitFS } from "./gitfs/GitFS";
import { RootDesc } from "./RootDesc";
import { toHex } from "./gitfs/GitFSUtils";

class Params{
    //如果为true则head.json会把版本号加到后面
    increaseFileName=false;
    //小于这个文件的合并
    fileToMerge=100*1024;
    //合并后的最大文件大小
    mergedFileSize=1000*1024;
    dccout = "dccout";
    outfile='version'
}

export class LayaDCC {
    private frw:NodejsFRW;
    private gitfs:GitFS;
    private config = new Params();
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

    /**
     * 生成目录p的dcc信息
     * 默认保存在当前目录的.dcc目录下
     * @param p 
     */
    async genDCC(p: string) {
        let dccout =  path.resolve(p, this.config.dccout)
        this.frw  = new NodejsFRW(dccout);
        this.gitfs = new GitFS(dccout,'',this.frw);
        
        console.log('v=', p);
        //得到最后一次提交的根
        //TODO 找到提交
        //先直接操作目录
        let lastVer=-1;
        let rootNode:TreeNode;
        try{
            let headstr = await this.frw.read(this.config.outfile+'.json','utf8') as string;
            let headobj = JSON.parse(headstr) as RootDesc;
            lastVer = headobj.version||1;
            rootNode = await this.gitfs.getTreeNode(headobj.root,null);
        }catch(e:any){
            rootNode = new TreeNode(null,null,this.frw);
        }

        //rootNode.

        if(!fs.existsSync( dccout)){
            //TODO 绝对路径的情况
            fs.mkdirSync(dccout);
        }
        let files = await this.walkDirectory(p,rootNode,false,['.git','.gitignore','dccout']);
        console.log(files.length)
        console.log(files)
        //创建头文件
        let head = new RootDesc();
        head.root = rootNode.sha!;
        head.fileCounts = files.length;
        head.objPackages=[];
        head.time = new Date();
        head.version = lastVer+1;
        if(lastVer>=0){
            //这个表示已经有记录了
            try{
                await this.frw.mv( path.join(dccout,`${this.config.outfile}.json`), path.join(dccout,`${this.config.outfile}_${lastVer}.json`));
            }catch(e:any){
                debugger;
            }
        }
        //let headbuff = this.frw.textencode(JSON.stringify(head))
        //shasum(new Uint8Array(headbuff),true)
        await this.frw.writeToCommon(`${this.config.outfile}.json`,JSON.stringify(head),true);
        
        debugger;
    }

    private mergeSmallFile(){
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

