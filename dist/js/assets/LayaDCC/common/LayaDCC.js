import * as path from "path";
import { DCCFS_NodeJS } from './DCCFS_NodeJS.js';
import { TreeNode } from './gitfs/GitTree.js';
import * as fs from 'fs';
import { promisify } from "util";
import { GitFS } from './gitfs/GitFS.js';
import { RootDesc } from './RootDesc.js';
import { hashToArray, shasum, toHex } from './gitfs/GitFSUtils.js';
import { ObjPack } from './ObjPack.js';
import { DCCObjectWrapper } from './DCCObjectWrapper.js';
export class Params {
    constructor() {
        this.mergeFile = false;
        //小于这个文件的合并
        this.fileToMerge = 100 * 1024;
        //合并后的最大文件大小，不允许超过。
        this.mergedFileSize = 1000 * 1024;
        this.dccout = "dccout";
        this.outfile = 'version';
        //用户需要指定版本号，这样可以精确控制。如果已经存在注意提醒
        this.version = '1.0.0';
        this.fast = true;
        /**
         * 混淆秘钥，注意这个只能用于本地资源，dcc服务器不要加混淆
         * 可能得问题：
         * 1. 混淆之后文件名不再是hash值，无法判断是否要覆盖
         * 2. 服务器会有碎文件打包
         */
        this.xorKey = null;
    }
}
export class LayaDCC {
    constructor() {
        this.config = new Params();
    }
    set params(p) {
        this.config = p;
    }
    /**
     * 生成目录p的dcc信息
     * 默认保存在当前目录的dccout目录下
     * @param p 针对这个目录生成dcc
     */
    async genDCC(p) {
        let dccout = this.dccout = path.resolve(p, this.config.dccout);
        this.frw = new DCCFS_NodeJS();
        await this.frw.init(dccout, null);
        this.gitfs = new GitFS(this.frw);
        if (this.config.xorKey) {
            if (this.config.mergeFile) {
                throw "Once encryption is enabled, small file merging cannot be configured";
            }
            this.gitfs.objectEncrypter = {
                encode: (buff) => {
                    //如果需要加密。加密只影响object，且只有给app本地资源做，所以不考虑打包等问题
                    let head = new DCCObjectWrapper();
                    head.xorKey = this.config.xorKey;
                    return DCCObjectWrapper.wrapObject(buff, head).buffer;
                },
                decode: (buff) => {
                    return null;
                },
            };
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
        let rootNode;
        try {
            let headstr = await this.frw.read('head.json', 'utf8', true);
            let headobj = JSON.parse(headstr);
            //打包文件
            if (headobj.treePackages) {
                for (let packid of headobj.treePackages) {
                    let pack = new ObjPack('tree', this.frw, packid);
                    await pack.init();
                    this.gitfs.addObjectPack(pack);
                }
            }
            rootNode = await this.gitfs.getTreeNode(headobj.root, null);
        }
        catch (e) {
            rootNode = new TreeNode(null, null, this.frw);
        }
        //当前修订版。修订版只要内容变了就会增加，与用户设置的版本无关
        let lastRev = 0;
        let lastRevRoot = null;
        try {
            lastRev = parseInt(fs.readFileSync(path.join(revPath, 'head.txt'), 'utf-8'));
            if (lastRev >= 0) {
                lastRevRoot = fs.readFileSync(path.join(revPath, `${lastRev}.txt`), 'utf-8');
            }
            if (!lastRevRoot) {
                lastRev = 0;
            }
        }
        catch (e) { }
        let files = await this.syncWithDir(p, rootNode, this.config.fast, ['.git', '.gitignore', 'dccout']);
        //console.log(files.length)
        //console.log(files)
        //更新修订版本
        if (rootNode.sha !== lastRevRoot) {
            //有变化
            fs.writeFileSync(path.join(revPath, 'head.txt'), `${lastRev + 1}`); //当前版本
            fs.writeFileSync(path.join(revPath, `${lastRev + 1}.txt`), rootNode.sha); //当前版本对应的root
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
        await this.frw.write('head.json', JSON.stringify(head), true); //这个要用固定名称，与配置无关
        await this.frw.write(`${this.config.outfile}.${this.config.version}.json`, JSON.stringify(head), true);
        //debugger;
    }
    async saveTreePack(buff, lenth, indexInfo) {
        let dccout = this.dccout;
        let sha = await shasum(new Uint8Array(buff, lenth), true);
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
    async mergeSmallFile(rootNode, rmMergedTreeNode, rmMergedObjNode) {
        let dccout = this.dccout;
        let frw = this.frw;
        let gitfs = this.gitfs;
        let treeNodes = [];
        let blobNodes = [];
        let tree_packs = [];
        let blob_packs = [];
        //统计所有的treenode和blobnode,他们要分别打包
        await gitfs.visitAll(rootNode, async (cnode) => {
            treeNodes.push(cnode.sha);
        }, async (entry) => {
            blobNodes.push(toHex(entry.oid));
        });
        //过滤重复文件。例如内容完全相同的两个目录，会记录多次
        if (treeNodes.length)
            treeNodes = [...new Set(treeNodes)];
        if (blobNodes.length)
            blobNodes = [...new Set(blobNodes)];
        let treeSize = 0;
        let reservBuff = new Uint8Array(this.config.mergedFileSize);
        let objInPacks = [];
        for (let i of treeNodes) {
            let objFile = gitfs.getObjUrl(i);
            let buff = await frw.read(objFile, 'buffer', true);
            let size = buff.byteLength;
            if (treeSize + size < this.config.mergedFileSize) {
                objInPacks.push({ id: i, start: treeSize, length: size });
                reservBuff.set(new Uint8Array(buff), treeSize);
                treeSize += size;
            }
            else {
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
        return { tree_packs };
    }
    /**
     * 根据dir来生成对应的object对象保存起来
     * @param dir
     * @param node
     * @param fast
     * @param ignorePatterns 忽略目录或者文件，只是影响当前目录
     * @returns
     */
    async syncWithDir(dir, node, fast, ignorePatterns = null) {
        let files = [];
        const dirents = await promisify(fs.readdir)(dir, { withFileTypes: true });
        let ignorePath = path.join(dir, '.ignore');
        if (fs.existsSync(ignorePath)) {
            let ignoresstr = fs.readFileSync(ignorePath, 'utf-8');
            if (ignoresstr) {
                if (!ignorePatterns)
                    ignorePatterns = [];
                ignoresstr.split('\n').forEach(ign => {
                    if (ign.endsWith('\r'))
                        ign = ign.substring(0, ign.length - 1);
                    ignorePatterns.push(ign);
                });
            }
        }
        for (const dirent of dirents) {
            let filename = dirent.name;
            const res = path.resolve(dir, filename);
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
                }
                else {
                    if (!entry.treeNode) {
                        //有entry没有treenode，则表示可以加载
                        try {
                            entry.treeNode = await this.gitfs.getTreeNode(toHex(entry.oid), null);
                        }
                        catch (e) {
                            //获得treenode失败了，很大可能是目录内容改变了，所以需要重新生成
                            let cNode = new TreeNode(null, node, this.frw);
                            // 在当前node添加entry
                            entry.treeNode = cNode;
                            node.needSha();
                        }
                    }
                }
                entry.touchFlag = 0;
                let rets = await this.syncWithDir(res, entry.treeNode, fast, []);
                entry.oid = hashToArray(entry.treeNode.sha);
                files = files.concat(rets);
            }
            else {
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
                    let value = await this.frw.read(res, 'buffer', true);
                    entry = await this.gitfs.setFileAtNode(node, filename, value);
                    entry.fileMTime = fmtime;
                }
                entry.touchFlag = 0;
                files.push(res);
            }
        }
        let buff = await node.toObject(this.frw);
        await this.gitfs.saveObject(node.sha, buff.buffer);
        return files;
    }
    /**
     * 把某个版本解开到某个目录
     * @param outpath
     */
    async checkout(rev, outpath) {
        let gitfs = this.gitfs;
        await gitfs.checkoutToLocal(null, null);
    }
    get fileIO() {
        return this.frw;
    }
    //获取某个对象（用hash表示的文件或者目录）在缓存中的地址
    getObjectUrl(objid) {
        return this.gitfs.getObjUrl(objid);
    }
    /**
     * 把一个相对目录转换成对象目录
     * @param path 相对目录
     * @returns 对象目录，相对dcc根目录
     */
    async transUrl(path) {
        let gitfs = this.gitfs;
        if (!gitfs)
            return null;
        let objpath = await gitfs.pathToObjPath(path);
        if (!objpath) {
            return null;
        }
        return objpath;
    }
}
