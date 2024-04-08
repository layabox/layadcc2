import * as path from "path";
import { NodejsFRW } from "./NodejsFRW";
import { TreeNode } from "./gitfs/GitTree";
import * as fs from 'fs'
import { promisify } from "util";
import { GitFS } from "./gitfs/GitFS";


class FSInterface {
    mkdir() { }
    rmdir() { }
    createFile() { }
    rmFile() { }
    readDir() { }
    readFile() { }
}


//遍历节点树，决定合并策略并合并
class FileObjectMerger {

}

export class LayaDCC {
    private frw:NodejsFRW;
    private _dccout='dccout';
    private gitfs:GitFS;
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
        let dccout =  path.resolve(p, this._dccout)
        this.frw  = new NodejsFRW(dccout);
        this.gitfs = new GitFS(dccout,'',this.frw);
        console.log('v=', p);
        //得到最后一次提交的根
        //TODO 找到提交
        //先直接操作目录
        let rootNode = new TreeNode(null,null,this.frw);
        //rootNode.

        if(!fs.existsSync( dccout)){
            //TODO 绝对路径的情况
            fs.mkdirSync(dccout);
        }
        let files = await this.walkDirectory1(p,rootNode,false,['.git','.gitignore','dccout']);
        console.log(files.length)
        console.log(files)
        debugger;
    }

    private async walkDirectory(dir: string, ignorePatterns: string[] = []): Promise<string[]> {
        let files: string[] = [];
        const dirents = await promisify(fs.readdir)(dir, { withFileTypes: true });

        for (const dirent of dirents) {
            const res = path.resolve(dir, dirent.name);

            // 如果路径符合忽略模式，则跳过此路径
            if (ignorePatterns.some(pattern => res.includes(pattern))) {
                continue;
            }

            if (dirent.isDirectory()) {
                files = files.concat(await this.walkDirectory(res, ignorePatterns));
            } else {
                files.push(res);
            }
        }

        return files;
    }

    /**
     * 
     * @param dir 
     * @param node 
     * @param fast 
     * @param ignorePatterns 忽略目录或者文件，只是影响当前目录
     * @returns 
     */
    private async walkDirectory1(dir: string, node:TreeNode,fast:boolean, ignorePatterns: string[]|null = null): Promise<string[]> {
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
            if(!entry){
                //TODO 创建
            }

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
                }

                entry.touchFlag = 0;
                let rets = await this.walkDirectory1(res,entry.treeNode!,fast,[]);
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
        return files;
    }    

    /**
     * 只要本版信息
     * 从roottree开始
     */
    private outCache(){

    }


    /**
     * 提交一个本地目录。
     * 忽略本地目录的名字，直接把本地目录的子与node的子比较
     * @param hnative 
     * @param node  库中的根节点
     */
    private async commitDir(dir: string, node: TreeNode) {
        node.entries.forEach(e => {
            e.touchFlag = 1;
        });

        // 处理.ignore文件
        let ignores: string[] = [];
        let ignorePath = path.join(dir, '.ignore');
        if (fs.existsSync(ignorePath)) {
            let ignoresstr = fs.readFileSync(ignorePath, 'utf-8');
            if (ignoresstr) {
                ignoresstr.split('\n').forEach(ign => {
                    if (ign.endsWith('\r')) ign = ign.substring(0, ign.length - 1);
                    ignores.push(ign);
                });
            }
        }


        for await (const hChild of hnative.values()) {
            let name = hChild.name;
            if (ignores && ignores.length > 0 && ignores.includes(name))
                continue;

            let entry = node.getEntry(name);
            if (hChild.kind === "directory") {
                if (name === '.git') continue;
                if (name === PROJINFO) continue;
                let cNode: TreeNode;
                if (entry) {
                    //let shastr = toHex(entry.oid);
                    if (!entry.treeNode) {
                        // 没有treeNode表示还没有下载。下载构造新的node
                        cNode = await this.openNode(entry);
                    } else {
                        cNode = entry.treeNode;
                    }
                } else {
                    // 如果目录不存在，创建一个
                    // 在当前node下添entry
                    entry = node.addEntry(name, true, null);
                    cNode = new TreeNode(null, node, this.frw);
                    // 在当前node添加entry
                    entry.treeNode = cNode;
                }
                entry.touchFlag = 0;
                await this.commitDir(hChild, cNode, gc);
            } else {
                //let fileH = await hnative.getFileHandle(name);
                //let entry = await this.addNativeFileAtNode(fileH, node, name);
                let entry = await this.addFileToNode(hChild, node, name);
                entry.touchFlag = 0;
            }
        }

        let rmFiles: string[] = [];
        node.entries.forEach(e => {
            if (e.touchFlag == 1)
                rmFiles.push(e.path);
        })
        rmFiles.forEach(rmf => {
            node.rmEntry(rmf);
        });
    }
}

