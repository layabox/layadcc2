import { CommitInfo, GitCommit } from "./GitCommit";
import { readUTF8, shasum, toHex } from "./GitFSUtils";
import { TreeEntry, TreeNode } from "./GitTree";
export async function readBinFile(file) {
    return new Promise((res, rej) => {
        let reader = new FileReader();
        reader.onload = async (event) => {
            let value = event.target.result;
            res(value);
        };
        reader.onerror = function (event) {
            res(null);
        };
        reader.readAsArrayBuffer(file);
    });
}
var PROJINFO = '.projinfo';
/**
 * 类似git的文件系统
 * 设置一个远端库的地址，然后通过相对地址的方式访问某个文件
 * 可以对目录进行各种操作
 * 可以与远端进行同步
 */
class GitFS {
    ;
    /**
     *
     * @param repoUrl git库所在目录
     * @param filerw
     */
    constructor(filerw) {
        //private userUrl:string; //保存head等用户信息的地方，可以通过filerw写。从uid开始的相对路径
        this.treeRoot = new TreeNode(null, null, null);
        // 当前准备提交的commit
        this.curCommit = new CommitInfo();
        // 当前的修改
        this.allchanges = [];
        this.checkDownload = false;
        this._objectPacks = [];
        this.objectEncrypter = null;
        this.frw = filerw;
    }
    addObjectPack(pack, first = false) {
        let idx = this._objectPacks.indexOf(pack);
        if (idx < 0) {
            if (first) {
                this._objectPacks.splice(0, 0, pack);
            }
            this._objectPacks.push(pack);
        }
    }
    removeObjectPack(pack) {
        let idx = this._objectPacks.indexOf(pack);
        if (idx >= 0) {
            this._objectPacks.splice(idx, 1);
        }
    }
    clearObjectPack() {
        this._objectPacks.length = 0;
    }
    /**
     * 得到相对于git目录的目录。
     * @param objid
     * @param subdirnum  分成几个子目录
     * @returns
     */
    getObjUrl(objid) {
        let subdirnum = GitFS.OBJSUBDIRNUM;
        let ret = 'objects/';
        let ostr = objid;
        for (let i = 0; i < subdirnum; i++) {
            let dir = ostr.substring(0, 2);
            ostr = ostr.substring(2);
            ret += dir;
            ret += '/';
        }
        ret += ostr;
        return ret;
    }
    getCurCommit() {
        return this.curCommit.sha;
    }
    /**
     * 根据最新的commit初始化
     * @param commitHeadFile
     */
    async initByLastCommit() {
        // let commitid = await this.getCommitHead(this.userUrl+'?'+Date.now());// await this.frw.read(commitFileUrl, 'utf8') as string;
        // return await this.initByCommitID(commitid);
    }
    async getCommitHead(url) {
        let commit = await this.frw.read(url, 'utf8', false);
        if (commit) {
            this.recentCommits = commit.split('\n');
            return this.recentCommits[0];
        }
        throw "no commit";
    }
    async initByCommitID(id) {
        if (!id)
            return false;
        let cc = await this.getCommit(id);
        if (!cc)
            return false;
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
    async setRoot(treeid) {
        try {
            //getTreeNode失败要throw，但是root这里可以不存在，相当于没有gitfs
            this.treeRoot = await this.getTreeNode(treeid, this.treeRoot);
        }
        catch (e) {
            this.treeRoot = null;
        }
        return !!this.treeRoot;
    }
    async toRev(rev) {
    }
    async getCommit(objid) {
        let commitobjFile = this.getObjUrl(objid);
        let buff = await this.frw.read(commitobjFile, 'buffer', false);
        let cc;
        if (buff) {
            cc = new GitCommit(this.frw.unzip(buff), objid);
        }
        else {
            return null;
        }
        return cc;
    }
    /**
     * 加载.git目录下的所有的打包文件
     */
    async loadAllPack() {
    }
    /**
     * 从文件构造treeNode.
     * 注意没有设置parent
     * @param objid
     * @param treeNode  如果设置了，就在这个对象上初始化
     * @returns
     */
    async getTreeNode(objid, treeNode) {
        if (!objid) {
            // 创建空的
            return new TreeNode(null, null, this.frw);
        }
        let treepath = this.getObjUrl(objid);
        let buff;
        try {
            buff = await this.frw.read(treepath, 'buffer', false);
        }
        catch (e) { }
        if (!buff) {
            //从所有的包中查找
            for (let pack of this._objectPacks) {
                if (!pack)
                    continue;
                if (await pack.has(objid)) {
                    buff = await pack.get(objid);
                }
                if (buff)
                    break;
            }
            if (!buff)
                throw "no treepath";
        }
        let treebuff = new Uint8Array(buff);
        let ret = treeNode;
        if (!ret) {
            ret = new TreeNode(treebuff, null, this.frw);
        }
        else {
            ret.parseBuffer(treebuff, this.frw);
        }
        ret.sha = objid;
        return ret;
    }
    /**
     * 根据sha id得到文件内容。
     * @param objid   字符串或者arraybuffer表示的数字
     * @param encode
     * @returns
     */
    async getBlobNode(objid, encode) {
        let strid = objid;
        if (typeof (objid) != 'string') {
            strid = toHex(objid);
        }
        let objpath = this.getObjUrl(strid);
        let buff = null;
        try {
            let objbuff = await this.frw.read(objpath, 'buffer', false);
            if (objbuff) {
                buff = GitFS.zip ? this.frw.unzip(objbuff) : objbuff;
            }
        }
        catch (e) {
        }
        if (!buff) {
            for (let pack of this._objectPacks) {
                if (!pack)
                    continue;
                if (await pack.has(strid)) {
                    buff = await pack.get(strid);
                }
                if (buff)
                    break;
            }
            if (!buff) {
                throw new Error('download error:' + strid);
            }
        }
        //下载文件最好不校验。影响速度。
        if (this.checkDownload) {
            let sum = await shasum(new Uint8Array(buff), true);
            if (sum != strid) {
                console.log('下载的文件校验错误:', strid, sum);
            }
        }
        if (encode == 'utf8') {
            let str = readUTF8(buff);
            return str;
        }
        else {
            return buff;
        }
    }
    /**
     * 打开一个目录节点。
     * 下载对应的文件，得到此目录下的所有文件
     * @param node
     * @returns
     */
    async openNode(node) {
        if (node.treeNode)
            return node.treeNode;
        if (!(node instanceof TreeEntry)) {
            console.error('openNode param error!');
        }
        // 没有treeNode表示还没有下载。下载构造新的node
        try {
            if (node.isDir) {
                let ret = await this.getTreeNode(node.idstring, null);
                node.treeNode = ret;
                ret.parent = node.owner;
                return ret;
            }
            else
                return null;
        }
        catch (e) {
            throw "open node error";
        }
    }
    async visitAll(node, treecb, blobcb) {
        await treecb(node);
        for await (const entry of node.entries) {
            if (entry.isDir) {
                try {
                    if (!entry.treeNode)
                        await this.openNode(entry);
                    await this.visitAll(entry.treeNode, treecb, blobcb);
                }
                catch (e) {
                    //失败了可能是遍历本地目录，但是本地还没有下载，没有设置远程或者访问远程失败
                    //在没有网的情况下容易出
                    console.log('openNode error:', toHex(entry.oid));
                }
            }
            else {
                await blobcb(entry);
            }
        }
    }
    async loadFile(node, file, encode) {
        let entry;
        if (typeof node == 'string') {
            return await this.loadFileByPath(node, file);
        }
        else if (node instanceof TreeNode) {
            entry = node.getEntry(file);
        }
        else if (node instanceof TreeEntry) {
            entry = node;
            encode = file;
        }
        if (entry) {
            return await this.getBlobNode(entry.idstring, encode);
        }
        else {
            console.log('没有这个文件:', file);
        }
        return null;
    }
    async loadFileByPath(file, encode) {
        let entries = [];
        if (await this.pathToEntries(file, entries)) {
            let end = entries[entries.length - 1];
            return await this.getBlobNode(end.idstring, encode);
        }
        return null;
    }
    async saveBlobNode(objid, content, refname) {
        /*
        let exist = await this.frw.isFileExist(treepath);
        if(exist ){
            console.log('gitfs objid exist')
            return ;
        }
        */
        if (content.byteLength > GitFS.MAXFILESIZE) {
            alert('文件太大，无法上传：' + refname + '\n限制为：' + GitFS.MAXFILESIZE / 1024 / 1024 + 'M');
            return false;
        }
        await this.saveObject(objid, content);
        return true;
    }
    async saveObject(objid, content) {
        let treepath = this.getObjUrl(objid);
        //let ret = await this.frw.write(treepath, content);
        if (this.objectEncrypter) {
            content = this.objectEncrypter.encode(content);
        }
        // 由于有可能会有加密的开关，当文件存在的时候，如果不覆盖可能会有问题，先全部覆盖把
        await this.frw.write(treepath, content, true);
    }
    /**
     * 计算buffer或者string的sha1值。
     * string的话，会先转成buffer
     * @param buff
     * @returns
     */
    async sha1(buff) {
        if (typeof buff == 'string') {
            buff = (new TextEncoder()).encode(buff).buffer;
        }
        return await shasum(new Uint8Array(buff), true);
    }
    /**
     * 把一个文件或者路径转换成entry列表
     * @param path  相对路径
     */
    async pathToEntries(path, entrylist) {
        let pathes = path.split('/');
        let cNode = this.treeRoot;
        entrylist.length = 0;
        // 定位到节点
        for await (let path of pathes) {
            //for (let i = 0, n = pathes.length; i < n; i++) {
            if (path == '')
                continue; // 第一个/，以及中间会有的 //
            if (path == '.')
                continue;
            if (path == '..') {
                cNode = cNode.parent;
            }
            let entry = cNode.getEntry(path);
            if (!entry) {
                return false;
            }
            entrylist.push(entry);
            if (entry.isDir && !(cNode = entry.treeNode)) {
                // 如果是目录，下载节点
                cNode = await this.openNode(entry);
            }
        }
        return true;
    }
    async pathToObjPath(relUrl) {
        let entries = [];
        if (await this.pathToEntries(relUrl, entries)) {
            let last = entries[entries.length - 1];
            let objid = toHex(last.oid);
            let path = this.getObjUrl(objid);
            return path;
        }
        else {
            return null;
        }
    }
    /**
     * 根据一个长路径找到或者创建对应的node。
     *
     * @param path 例如 '/Assets/env/' 只能是路径，不能是文件
     */
    async getNodeByPath(path, create = false, startNode = null) {
        let pathes = path.split('/');
        let cNode = startNode || this.treeRoot;
        // 定位到path指定的节点
        for (let i = 0, n = pathes.length; i < n; i++) {
            let path = pathes[i];
            if (path == '')
                continue; // 第一个/，以及中间会有的 //
            if (path == '.')
                continue;
            if (path == '..') {
                cNode = cNode.parent;
            }
            let entry = cNode.getEntry(path);
            // 当前目录是否存在
            if (entry) {
                if (!entry.treeNode) {
                    cNode = await this.openNode(entry);
                }
                else {
                    cNode = entry.treeNode;
                }
            }
            else {
                if (create) {
                    // 如果目录不存在，创建一个
                    // 在当前node添加entry
                    let entry = cNode.addEntry(path, true, null);
                    // 由于是目录，添加新的节点
                    cNode = new TreeNode(null, cNode, this.frw);
                    entry.treeNode = cNode;
                    cNode.needSha();
                }
                else
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
    async setFileAtNode(node, name, content) {
        //if(!node) return null;
        let buff;
        if (content instanceof ArrayBuffer) {
            buff = content;
        }
        else if (content instanceof File) {
            buff = await readBinFile(content);
        }
        else {
            //string
            buff = (new TextEncoder()).encode(content).buffer;
        }
        //let zipedbuff = this.frw.zip(buff);
        // 计算文件的sha值
        let oid = await shasum(new Uint8Array(buff), false);
        let hash = toHex(oid);
        let entry = node.getEntry(name);
        if (entry) { // 如果entry已经存在，说明是替换
            // 看是否修改
            let shastr = toHex(entry.oid);
            if (shastr === hash) {
                //console.log('文件没有修改。');
                return entry;
            }
            // 文件修改了。
            entry.oid = oid;
            node.needSha();
        }
        else {
            // 如果entry不存在，则要创建新的
            entry = node.addEntry(name, false, oid);
        }
        //console.debug('[gitfs] 提交变化文件:', node.fullPath + '/' + name);
        if (!await this.saveBlobNode(hash, buff, node.fullPath + '/' + name)) {
            // 上传失败。设置一个无效的oid。避免形成永久性错误。
            entry.oid.fill(0);
        }
        return entry;
    }
    /**
     * 把gitfsNode下载到localNode中
     * @param gitfsNode
     * @param localNode
     */
    async checkoutToLocal(gitfsNode, localNode) {
        if (!localNode.child || Object.keys(localNode.child).length === 0) {
            await localNode.readChild();
        }
        for (let f of gitfsNode) {
            let pathname = f.path;
            // 如果是目录，就创建目录
            if (f.isDir) {
                let fsnode = await localNode.mkdir(pathname);
                let nextgitfsNode = gitfsNode.getEntry(pathname);
                if (!nextgitfsNode) {
                    console.error('gitfs 没有这个节点:', pathname);
                    return;
                }
                if (!nextgitfsNode.treeNode) {
                    await this.openNode(nextgitfsNode);
                }
                await this.checkoutToLocal(nextgitfsNode.treeNode, fsnode);
            }
            else {
                // 先看文件內容是否相同
                let filenode = localNode.child[pathname];
                let shalocal;
                let shaonline = toHex(f.oid);
                if (filenode) {
                    let fc = await filenode.readFile('buffer');
                    shalocal = await shasum(fc, true);
                    if (shalocal == shaonline) {
                        continue;
                    }
                }
                // 文件不相同，下载远端文件
                if (shaonline == '0000000000000000000000000000000000000000') {
                    console.warn('错误文件：', pathname);
                    continue;
                }
                let fscontent = await this.getBlobNode(f.oid, 'buffer');
                if (fscontent) {
                    console.log('gitfs update file:', localNode.getFullPath() + '/' + pathname);
                    await localNode.createFile(pathname, fscontent);
                }
                else {
                    console.error('下载文件失败。');
                }
            }
        }
    }
    /**
     * rename('Assets/models/a.lm', 'b.lm')
     *
     * @param path 相对路径
     * @param newname 新的名字
     */
    async rename(path, newname) {
        let entries = [];
        if (await this.pathToEntries(path, entries)) {
            let end = entries[entries.length - 1];
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
    async remove(path) {
        let entries = [];
        if (await this.pathToEntries(path, entries)) {
            let end = entries[entries.length - 1];
            return end.owner.rmEntry(end);
        }
        return false;
    }
    async removeObject(oid) {
        let url = this.getObjUrl(oid);
        await this.frw.rm(url);
    }
    /**
     * 把某个文件或者目录拷贝到另外一个目录中
     * @param dstNode
     * @param srcentry
     */
    copy(dstNode, srcentry) {
        dstNode.addEntry(srcentry.path, srcentry.isDir, srcentry.oid);
    }
    async makeCommit(msg) {
        // 注意，这时候的sha必须要已经计算了
        if (!this.treeRoot.sha) {
            console.error('[gitfs] makecommit 需要先计算sha');
            return null;
        }
        if (this.curCommit.tree == this.treeRoot.sha) {
            console.log('[gitfs] makecommit parent 和现在的相同');
            return null;
        }
        let cmtinfo = new CommitInfo();
        cmtinfo.commitMessage = msg;
        cmtinfo.author = this.user;
        cmtinfo.author_timestamp = new Date();
        cmtinfo.parent = this.curCommit.sha;
        //await this.treeRoot.updateAllSha(this.frw,this.allchanges);
        cmtinfo.tree = this.treeRoot.sha;
        console.log('[gitfs] makecommit tree:', this.treeRoot.sha);
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
    async push(commitmsg, rootpash) {
        // await this.treeRoot.updateAllSha(this.frw,this.allchanges);
        // let allchanges = this.allchanges;
        // let n = allchanges.length;
        // if (n <= 0) return null;
        // let root = this.treeRoot;
        // let findroot = false;   // root必须包含在变化列表中
        // for (let i = 0; i < n; i++) {
        //     let cchange = allchanges[i];
        //     if (cchange == root) {
        //         findroot = true;
        //     }
        //     // 上传变化的节点
        //     console.log('[gitfs] 提交变化目录:', cchange.fullPath, cchange.sha);
        //     // buff在updateAllSha的时候已经创建了。
        //     await this.saveBlobNode(cchange.sha!, cchange.buff!.buffer, cchange.fullPath);
        //     //cchange.needCommit=true;
        // }
        // //
        // if (!findroot) {
        //     console.error('变换节点没有找到root！');
        // }
        // // 清零
        // this.allchanges.length = 0;
        // // 提交commit
        // let buff = await this.makeCommit(commitmsg);
        // if(!buff) return;
        // console.log('[gitfs] 提交commit',this.curCommit.sha);
        // // 写文件
        // await this.saveBlobNode(this.curCommit.sha, buff.buffer, 'commit');
        // let recent=this.recentCommits;
        // if(!recent){
        //     recent = this.recentCommits=[];
        // }
        // recent.splice(0,0,this.curCommit.sha);
        // if(recent.length>20)recent.length=20;
        // //TEMP TODO 发版以后恢复
        // recent.length=1;
        // console.log('[gitfs] 写head');
        // // 把当前commit提交。 先用覆盖的方式。这种是常态
        // let headfile = this.userUrl;    // 这个由于有cdn，需要通过源站访问。注意这里是相对的
        // let recentstr = recent.join('\n');
        // let ret = await this.frw.write(headfile, recentstr, true) as any;
        // if(ret.ret!=0){
        //     // 覆盖失败了，创建
        //     ret = await this.frw.write(headfile, recentstr, false) as any;
        //     if(ret.ret!=0){
        //         console.error('[gitfs] 上传head失败')
        //     }
        // }
        // rootpash && await this.saveHeadToLocal(this.curCommit.sha!,rootpash);
        // console.log('同步完成! head=',this.curCommit.sha);
        // return this.curCommit.sha;
    }
    //TODO 保存head应该带目录。否则一旦切换不同的目录会导致出问题（保存的是最新的，但是选中的目录实际是旧的）
    async saveHeadToLocal(commit, fs) {
        //this.frw.saveUserData(this.name+'_'+this.branch+'_head', commit);
        if (typeof (commit) == 'object') {
            commit = JSON.stringify(commit);
        }
        let git = await fs.mkdir(PROJINFO);
        await git.createFile('head', commit);
    }
    async getHeadFromLocal(fs) {
        await fs.readChild();
        let git = fs.child[PROJINFO];
        if (!git)
            return null;
        await git.readChild();
        let head = git.child['head'];
        if (!head)
            return head;
        return head.readFile('utf8');
        //return this.frw.getUserData(this.name+'_'+this.branch+'_head');
    }
    printCommit(cmt) {
        console.log('-----------------------------');
        console.log(cmt.commitMessage, cmt.sha, cmt.tree);
    }
    async printLog(num) {
        let curCommit = this.curCommit;
        this.printCommit(curCommit);
        for (let i = 0; i < num; i++) {
            let par = curCommit.parent;
            if (!par)
                break;
            if (par == '0')
                break;
            let pcommit = await this.getCommit(par);
            if (pcommit) {
                this.printCommit(pcommit.commitinfo);
                curCommit = pcommit.commitinfo;
            }
            else {
                break;
            }
        }
    }
}
GitFS.OBJSUBDIRNUM = 1;
GitFS.MAXFILESIZE = 32 * 1024 * 1024;
GitFS.zip = false;
GitFS.touchID = 0; // 更新标记
export { GitFS };
