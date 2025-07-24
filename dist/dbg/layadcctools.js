/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LayaDCCTools: () => (/* binding */ LayaDCCTools)
/* harmony export */ });
/* harmony import */ var _common_LayaDCC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(17);
/* harmony import */ var os__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(os__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(util__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _common_LayaDCCClient__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(18);
/* harmony import */ var _common_DCCClientFS_NodeJS__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(27);
/* harmony import */ var _common_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(11);
/* harmony import */ var _common_DCCFS_NodeJS__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(4);
/* harmony import */ var _common_LayaDCCReader__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(28);










function enumDccObjects(dccpath) {
    let ret = [];
    let objects = path__WEBPACK_IMPORTED_MODULE_2__.resolve(dccpath, 'objects');
    let idPres = fs__WEBPACK_IMPORTED_MODULE_1__.readdirSync(objects);
    for (let pre of idPres) {
        let cpath = objects + '/' + pre;
        let objs = fs__WEBPACK_IMPORTED_MODULE_1__.readdirSync(cpath);
        for (let o of objs) {
            ret.push(pre + o);
        }
    }
    return ret;
}
class LayaDCCTools {
    static genDCC(srcpath, outpath, param) {
    }
    //直接把一个dcc目录打包，使用当前的root
    static genZipPatch(dccpath) {
        //先检查是否有打包，如果有先解开
        let all = enumDccObjects(dccpath);
    }
    /**
     * 把一个目录打包成更新包
     * 这个不修改root，所以不做一致性保证，只是对象更新
     * @param dir
     * @param outfile
     */
    static async genZipByPath(dir, outfile) {
        //针对这个目录执行一下生成dcc，然后打包所有的对象，最后删掉临时dcc目录
        //创建一个临时目录
        let dccoutBasepath = path__WEBPACK_IMPORTED_MODULE_2__.join(os__WEBPACK_IMPORTED_MODULE_3__.tmpdir(), 'layadcc');
        try {
            await (0,util__WEBPACK_IMPORTED_MODULE_4__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.mkdir)(dccoutBasepath);
        }
        catch (e) { }
        let dccout = path__WEBPACK_IMPORTED_MODULE_2__.join(dccoutBasepath, "_tempdccout_dir_pack");
        if (fs__WEBPACK_IMPORTED_MODULE_1__.existsSync(dccout)) {
            //如果有这个目录先删掉
            fs__WEBPACK_IMPORTED_MODULE_1__.rmdirSync(dccout, { recursive: true });
        }
        await (0,util__WEBPACK_IMPORTED_MODULE_4__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.mkdir)(dccout);
        //生成dcc
        let dcc = new _common_LayaDCC__WEBPACK_IMPORTED_MODULE_0__.LayaDCC();
        let params = new _common_LayaDCC__WEBPACK_IMPORTED_MODULE_0__.Params();
        params.mergeFile = false;
        dcc.params = params;
        params.dccout = dccout;
        await dcc.genDCC(dir);
        //打包结果
        let zip = new IEditor.ZipFileW(outfile);
        dcc.fileIO.enumCachedObjects((objid) => {
            let file = path__WEBPACK_IMPORTED_MODULE_2__.join(params.dccout, dcc.getObjectUrl(objid));
            let buf = fs__WEBPACK_IMPORTED_MODULE_1__.readFileSync(file);
            zip.addBuffer(objid, new Uint8Array(buf));
        });
        await zip.save(outfile);
        //删除临时dcc目录
        fs__WEBPACK_IMPORTED_MODULE_1__.rmdirSync(params.dccout, { recursive: true });
    }
    /**
     * 根据文件列表打包对象到dcczip文件
     * @param files 绝对文件名列表
     * @param outfile
     */
    static async genPackByFileList(files, outfile, packerCls) {
        let packer = new packerCls(); //IEditor.ZipFileW(outfile);
        let frw = new _common_DCCFS_NodeJS__WEBPACK_IMPORTED_MODULE_8__.DCCFS_NodeJS();
        for (let f of files) {
            let buff = await frw.read(f, 'buffer', true);
            let oid = await (0,_common_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.shasum)(new Uint8Array(buff), false);
            let hash = (0,_common_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.toHex)(oid);
            packer.addObject(hash, new Uint8Array(buff));
        }
        await packer.save(outfile);
    }
    //比较两个dcc目录，把差异（只是new增加的）打包，使用new的root作为root
    static async genZipByComparePath(dccold, dccnew, outPath, outFile) {
        //创建一个临时目录
        let basepath = path__WEBPACK_IMPORTED_MODULE_2__.join(os__WEBPACK_IMPORTED_MODULE_3__.tmpdir(), 'layadcc');
        try {
            await (0,util__WEBPACK_IMPORTED_MODULE_4__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.mkdir)(basepath);
        }
        catch (e) { }
        //由于有打包文件，因此需要用完整的dccclient，不能简单的遍历目录
        let dccclient1 = new _common_LayaDCCClient__WEBPACK_IMPORTED_MODULE_5__.LayaDCCClient(dccold, _common_DCCClientFS_NodeJS__WEBPACK_IMPORTED_MODULE_6__.DCCClientFS_NodeJS);
        await dccclient1.init(path__WEBPACK_IMPORTED_MODULE_2__.join(dccold, 'head.json'), basepath + '/zip/cache1');
        let dccclientNew = new _common_LayaDCCClient__WEBPACK_IMPORTED_MODULE_5__.LayaDCCClient(dccnew, _common_DCCClientFS_NodeJS__WEBPACK_IMPORTED_MODULE_6__.DCCClientFS_NodeJS);
        await dccclientNew.init(path__WEBPACK_IMPORTED_MODULE_2__.join(dccnew, 'head.json'), basepath + '/zip/cache2');
        let allold = [];
        let allnew = [];
        console.log('开始统计', dccold);
        await dccclient1.updateAll(null); //需要保证有blob节点。由于有打包等问题，最好还是完全更新
        await dccclient1.fileIO.enumCachedObjects((objid) => { allold.push(objid); });
        console.log('开始统计', dccnew);
        await dccclientNew.updateAll(null);
        await dccclientNew.fileIO.enumCachedObjects((objid) => { allnew.push(objid); });
        console.log('比较差异...');
        let changed = [];
        let oldset = new Set();
        allold.forEach(id => { oldset.add(id); });
        allnew.forEach(id => {
            if (oldset.has(id))
                return;
            changed.push(id);
        });
        console.log(`发现差异文件${changed.length}个.`);
        console.log('写文件...');
        fs__WEBPACK_IMPORTED_MODULE_1__.mkdirSync(outPath, { recursive: true });
        let zipPath = path__WEBPACK_IMPORTED_MODULE_2__.join(outPath, outFile !== null && outFile !== void 0 ? outFile : "dcc.zip");
        //const zip = new AdmZip();
        let zip = new IEditor.ZipFileW(zipPath);
        for (let objid of changed) {
            try {
                let file = path__WEBPACK_IMPORTED_MODULE_2__.join(dccnew, await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = fs__WEBPACK_IMPORTED_MODULE_1__.readFileSync(file);
                //zip.addFile(objid,buf);
                zip.addBuffer(objid, new Uint8Array(buf));
            }
            catch (e) {
                //由于打包了，dcc服务器目录可能缺少文件，所以在dcc客户端读取
                let file = path__WEBPACK_IMPORTED_MODULE_2__.join(dccnew, await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = await dccclientNew.fileIO.read(await dccclientNew.getObjectUrl(objid), 'buffer', false, null);
                //zip.addFile(objid,Buffer.from(buf));
                zip.addBuffer(objid, new Uint8Array(buf));
            }
        }
        //添加描述信息
        //zip.addLocalFile(path.join(dccnew,'head.json'));
        zip.addFile(path__WEBPACK_IMPORTED_MODULE_2__.join(dccnew, 'head.json'), 'head.json');
        //zip.writeZip(zipPath);
        await zip.save(zipPath);
        console.log('删除临时目录：', basepath);
        await (0,util__WEBPACK_IMPORTED_MODULE_4__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.rmdir)(basepath, { recursive: true });
        console.log('完成');
        return zipPath;
    }
    static async getZipByRev(dcc, revold, revnew) {
    }
    /**
     * 把一个版本展开
     * @param head
     */
    static async checkout(head, outdir) {
        if (!head.endsWith('.json')) {
            throw 'checkout的第一个参数是head文件';
        }
        fs__WEBPACK_IMPORTED_MODULE_1__.mkdirSync(outdir, { recursive: true });
        let dcc = new _common_LayaDCCReader__WEBPACK_IMPORTED_MODULE_9__.LayaDCCReader();
        await dcc.init(head);
        dcc.checkout(outdir);
    }
}


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LayaDCC: () => (/* binding */ LayaDCC),
/* harmony export */   Params: () => (/* binding */ Params),
/* harmony export */   getDiff: () => (/* binding */ getDiff)
/* harmony export */ });
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _DCCFS_NodeJS__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
/* harmony import */ var _gitfs_GitTree__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(util__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _gitfs_GitFS__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(9);
/* harmony import */ var _RootDesc__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(14);
/* harmony import */ var _gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(11);
/* harmony import */ var _ObjPack__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(15);
/* harmony import */ var _DCCObjectWrapper__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(16);










class Params {
    constructor() {
        this.mergeFile = false;
        this.mergeDir = false;
        //小于这个文件的合并
        this.fileToMerge = 100 * 1024;
        //合并后的最大文件大小，不允许超过。
        this.mergedFileSize = 1000 * 1024;
        this.dccout = "dccout";
        this.outfile = 'version';
        //用户需要指定版本号，这样可以精确控制。如果已经存在注意提醒
        this.version = '1.0.0';
        this.fast = true;
        //不保存文件，只是用来比较差异
        this.dontSaveBlobs = false;
        //忽略目录
        this.ignorePathes = [];
        this.progressCB = null;
        /**
         * 混淆秘钥，注意这个只能用于本地资源，dcc服务器不要加混淆
         * 可能得问题：
         * 1. 混淆之后文件名不再是hash值，无法判断是否要覆盖
         * 2. 服务器会有碎文件打包
         */
        this.xorKey = null;
    }
}
class LayaDCC {
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
        let dccout = this.dccout = path__WEBPACK_IMPORTED_MODULE_0__.resolve(p, this.config.dccout);
        this.frw = new _DCCFS_NodeJS__WEBPACK_IMPORTED_MODULE_1__.DCCFS_NodeJS();
        await this.frw.init(dccout, null);
        this.gitfs = new _gitfs_GitFS__WEBPACK_IMPORTED_MODULE_5__.GitFS(this.frw);
        if (this.config.dontSaveBlobs) {
            this.gitfs.saveBlob = false;
        }
        if (this.config.xorKey) {
            if (this.config.mergeFile) {
                throw "Once encryption is enabled, small file merging cannot be configured";
            }
            this.gitfs.objectEncrypter = {
                encode: (buff) => {
                    //如果需要加密。加密只影响object，且只有给app本地资源做，所以不考虑打包等问题
                    let head = new _DCCObjectWrapper__WEBPACK_IMPORTED_MODULE_9__.DCCObjectWrapper();
                    head.xorKey = this.config.xorKey;
                    return _DCCObjectWrapper__WEBPACK_IMPORTED_MODULE_9__.DCCObjectWrapper.wrapObject(buff, head).buffer;
                },
                decode: (buff) => {
                    return null;
                },
            };
        }
        //rootNode.
        if (!fs__WEBPACK_IMPORTED_MODULE_3__.existsSync(dccout)) {
            fs__WEBPACK_IMPORTED_MODULE_3__.mkdirSync(dccout, { recursive: true });
        }
        //revisions
        let revPath = path__WEBPACK_IMPORTED_MODULE_0__.join(dccout, 'revisions');
        if (!fs__WEBPACK_IMPORTED_MODULE_3__.existsSync(revPath)) {
            fs__WEBPACK_IMPORTED_MODULE_3__.mkdirSync(revPath);
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
                    let pack = new _ObjPack__WEBPACK_IMPORTED_MODULE_8__.ObjPack('tree', this.frw, packid);
                    await pack.init();
                    this.gitfs.addObjectPack(pack);
                }
            }
            rootNode = await this.gitfs.getTreeNode(headobj.root, null);
        }
        catch (e) {
            rootNode = new _gitfs_GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode(null, null, this.frw);
        }
        //当前修订版。修订版只要内容变了就会增加，与用户设置的版本无关
        let lastRev = 0;
        let lastRevRoot = null;
        try {
            lastRev = parseInt(fs__WEBPACK_IMPORTED_MODULE_3__.readFileSync(path__WEBPACK_IMPORTED_MODULE_0__.join(revPath, 'head.txt'), 'utf-8'));
            if (lastRev >= 0) {
                lastRevRoot = fs__WEBPACK_IMPORTED_MODULE_3__.readFileSync(path__WEBPACK_IMPORTED_MODULE_0__.join(revPath, `${lastRev}.txt`), 'utf-8');
            }
            if (!lastRevRoot) {
                lastRev = 0;
            }
        }
        catch (e) { }
        let ignores = ['.git', '.gitignore', 'dccout', '.dcc', '.svn'];
        if (this.config.ignorePathes) {
            ignores.concat(this.config.ignorePathes);
        }
        let files = await this.syncWithDir(p, rootNode, this.config.fast, ignores);
        //console.log(files.length)
        //console.log(files)
        //更新修订版本
        if (rootNode.sha !== lastRevRoot) {
            //有变化
            fs__WEBPACK_IMPORTED_MODULE_3__.writeFileSync(path__WEBPACK_IMPORTED_MODULE_0__.join(revPath, 'head.txt'), `${lastRev + 1}`); //当前版本
            fs__WEBPACK_IMPORTED_MODULE_3__.writeFileSync(path__WEBPACK_IMPORTED_MODULE_0__.join(revPath, `${lastRev + 1}.txt`), rootNode.sha); //当前版本对应的root
        }
        //创建头文件
        let head = new _RootDesc__WEBPACK_IMPORTED_MODULE_6__.RootDesc();
        head.root = rootNode.sha;
        head.fileCounts = files.length;
        head.objPackages = [];
        head.time = new Date();
        head.version = this.config.version;
        head.dccVersion = 1;
        this.config.desc && (head.desc = this.config.desc);
        //
        //let headbuff = this.frw.textencode(JSON.stringify(head))
        //shasum(new Uint8Array(headbuff),true)
        //头，固定文件名
        //await this.frw.write(`${this.config.outfile}.json`,JSON.stringify(head),true);
        //合并文件
        let merges = await this.mergeSmallFile(rootNode, false, false);
        if (merges)
            head.treePackages = merges.tree_packs;
        //版本文件
        await this.frw.write('head.json', JSON.stringify(head), true); //这个要用固定名称，与配置无关
        await this.frw.write(`${this.config.outfile}.${this.config.version}.json`, JSON.stringify(head), true);
        //debugger;
    }
    async saveTreePack(buff, lenth, indexInfo) {
        let dccout = this.dccout;
        let sha = await (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.shasum)(new Uint8Array(buff, lenth), true);
        let packfile = path__WEBPACK_IMPORTED_MODULE_0__.join(dccout, 'packfile', `tree-${sha}.pack`);
        let indexfile = path__WEBPACK_IMPORTED_MODULE_0__.join(dccout, 'packfile', `tree-${sha}.idx`);
        if (!fs__WEBPACK_IMPORTED_MODULE_3__.existsSync(path__WEBPACK_IMPORTED_MODULE_0__.join(dccout, 'packfile'))) {
            fs__WEBPACK_IMPORTED_MODULE_3__.mkdirSync(path__WEBPACK_IMPORTED_MODULE_0__.join(dccout, 'packfile'));
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
        if (!this.config.mergeFile && !this.config.mergeDir)
            return null;
        //统计所有的treenode和blobnode,他们要分别打包
        await gitfs.visitAll(rootNode, async (cnode, entry) => {
            treeNodes.push(cnode.sha);
        }, async (entry) => {
            blobNodes.push((0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.toHex)(entry.oid));
        }, null);
        if (this.config.mergeDir) {
            //过滤重复文件。例如内容完全相同的两个目录，会记录多次
            if (treeNodes.length)
                treeNodes = [...new Set(treeNodes)];
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
        }
        if (this.config.mergeFile) {
            if (blobNodes.length)
                blobNodes = [...new Set(blobNodes)];
            //
            //合并小文件
            //直接遍历objects目录，顺序合并
        }
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
        const dirents = await (0,util__WEBPACK_IMPORTED_MODULE_4__.promisify)(fs__WEBPACK_IMPORTED_MODULE_3__.readdir)(dir, { withFileTypes: true });
        let ignorePath = path__WEBPACK_IMPORTED_MODULE_0__.join(dir, '.ignore');
        if (fs__WEBPACK_IMPORTED_MODULE_3__.existsSync(ignorePath)) {
            let ignoresstr = fs__WEBPACK_IMPORTED_MODULE_3__.readFileSync(ignorePath, 'utf-8');
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
        node.entries.forEach(e => {
            //清理touch标记。如果后面设置1了，表示使用，那么是0的就是要删除的
            e.touchFlag = 0;
        });
        for (const dirent of dirents) {
            let filename = dirent.name;
            const res = path__WEBPACK_IMPORTED_MODULE_0__.resolve(dir, filename);
            if (this.config.progressCB) {
                this.config.progressCB(res, 0);
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
                    let cNode = new _gitfs_GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode(null, node, this.frw);
                    // 在当前node添加entry
                    entry.treeNode = cNode;
                }
                else {
                    if (!entry.treeNode) {
                        //有entry没有treenode，则表示可以加载
                        try {
                            entry.treeNode = await this.gitfs.getTreeNode((0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.toHex)(entry.oid), null);
                        }
                        catch (e) {
                            //获得treenode失败了，很大可能是目录内容改变了，所以需要重新生成
                            let cNode = new _gitfs_GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode(null, node, this.frw);
                            // 在当前node添加entry
                            entry.treeNode = cNode;
                            node.needSha();
                        }
                    }
                }
                entry.touchFlag = 1;
                let rets = await this.syncWithDir(res, entry.treeNode, fast, []);
                entry.oid = (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.hashToArray)(entry.treeNode.sha);
                files = files.concat(rets);
            }
            else {
                let check = true;
                //let stat = fs.statSync(res);
                //let fmtime = stat.mtime;
                // if (entry) {
                //     if (fast) {
                //         if (stat.mtime <= entry.fileMTime) {
                //             check = false;
                //         }
                //     }
                // }
                if (check) {
                    let value = await this.frw.read(res, 'buffer', true);
                    entry = await this.gitfs.setFileAtNode(node, filename, value);
                    entry.fileMTime = new Date(0); // fmtime;    不保存时间了，只要内容
                }
                entry.touchFlag = 1;
                files.push(res);
            }
        }
        //处理删除的
        node.clearUntouched();
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
LayaDCC.VERSION = '1.1.0';
/**
 * 为了便于处理，把gitfs的节点转换成这个
 */
class RTNode {
    constructor(name, id, parent, type) {
        this.child = {};
        this.name = name;
        this.id = id;
        this.type = type;
        this.parent = parent;
        if (parent) {
            parent.child[name] = this;
            this.fullPath = parent.fullPath + name + (type == 'dir' ? '/' : '');
        }
        else {
            this.fullPath = '/';
        }
    }
}
async function getDiff(git1, git2) {
    let renames = [];
    let modifies = [];
    let deletes = [];
    //添加的文件。如果是添加了引用。del, add, 是重命名， 然后添加引用 add
    let addes = [];
    //id到目录的映射，可能会一对多
    let idMap = {};
    //老的idmap，用来判断是不是增加对象了
    let idMapOld = {};
    function checkNodeDel(id, fullpath) {
        if (!idMap[id])
            idMap[id] = [];
        idMap[id].push({ path: fullpath, op: 'del' });
    }
    let root1 = git1.treeRoot.rtData = new RTNode('/', git1.treeRoot.sha, null, 'dir');
    await git1.visitAll(git1.treeRoot, async (node, entry) => {
        checkNodeDel(node.sha, node.fullPath);
        idMapOld[node.sha] = '';
        if (entry)
            node.rtData = new RTNode(entry.path, node.sha, entry.owner.rtData, 'dir');
    }, async (blobEntry) => {
        let id = (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.toHex)(blobEntry.oid);
        let path = blobEntry.owner.fullPath + blobEntry.path;
        checkNodeDel(id, path);
        new RTNode(blobEntry.path, id, blobEntry.owner.rtData, 'file');
        idMapOld[id] = '';
    }, null);
    function checkNodeAdd(id, fullpath) {
        //这个表示原来有没有，如果有的话，再次add就是addref
        let has = false;
        if (!idMap[id])
            idMap[id] = [];
        else {
            has = true; //即使抵消了，也表示原来是有的
            let lastop = idMap[id];
            for (let i = 0, n = lastop.length; i < n; i++) {
                let info = lastop[i];
                if (info.op == 'del') {
                    if (info.path != fullpath) {
                        //改名，删掉
                        renames.push({ old: info.path, new: fullpath });
                    }
                    else {
                        //没有改名，抵消
                    }
                    lastop.splice(i, 1); //把del删除了
                    //新的就不添加了，表示没有增加这个对象
                    return;
                }
            }
        }
        idMap[id].push({ path: fullpath, op: has ? 'addref' : 'add' });
    }
    let root2 = git2.treeRoot.rtData = new RTNode('/', git2.treeRoot.sha, null, 'dir');
    await git2.visitAll(git2.treeRoot, async (node, entry) => {
        let id = node.sha;
        checkNodeAdd(id, node.fullPath);
        if (entry)
            node.rtData = new RTNode(entry.path, node.sha, entry.owner.rtData, 'dir');
    }, async (blobEntry) => {
        let id = (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.toHex)(blobEntry.oid);
        let path = blobEntry.owner.fullPath + blobEntry.path;
        checkNodeAdd(id, path);
        new RTNode(blobEntry.path, id, blobEntry.owner.rtData, 'file');
    }, null);
    function delInIdMap(id, path, op) {
        let idinfo = idMap[id];
        if (idinfo && idinfo.length) {
            for (let i = 0; i < idinfo.length; i++) {
                let ops = idinfo[i];
                if (ops.path == path && ops.op == op) {
                    idinfo.splice(i, 1);
                    i--;
                }
            }
        }
    }
    //统计修改的文件
    function _visitRTNode(node, oldNode) {
        if (oldNode) {
            if (node.id != oldNode.id) {
                //id变了，应该是修改了
                //是否是新的。如果这个id在idmap中则是新的
                //改名的不在idmap中
                //注意，如果新的文件是新版的某个文件的引用，也算是newfile
                modifies.push({ path: node.fullPath, newfile: !idMapOld[node.id] });
                delInIdMap(oldNode.id, node.fullPath, 'del');
                delInIdMap(node.id, node.fullPath, 'add');
                delInIdMap(node.id, node.fullPath, 'addref'); //添加的文件有可能是addref
            }
        }
        if (node.type == 'file')
            return;
        for (let c in node.child) {
            _visitRTNode(node.child[c], oldNode ? oldNode.child[c] : null);
        }
    }
    _visitRTNode(root2, root1);
    //统计添加和删除的文件
    for (let i in idMap) {
        let idInfo = idMap[i];
        for (let ii = 0, n = idInfo.length; ii < n; ii++) {
            let fileInfo = idInfo[ii];
            switch (fileInfo.op) {
                case 'del':
                    deletes.push(fileInfo.path);
                    break;
                case 'add':
                    addes.push({ path: fileInfo.path, newfile: true });
                    break;
                case 'addref':
                    addes.push({ path: fileInfo.path, newfile: false });
                    break;
            }
        }
    }
    return { add: addes, del: deletes, modify: modifies, rename: renames };
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
async function getDiffObjects(git1, git2) {
    let oldset = new Set();
    let changed = [];
    await git1.visitAll(git1.treeRoot, async (node, entry) => {
        oldset.add(node.sha);
    }, async (entry) => {
        oldset.add((0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.toHex)(entry.oid));
    }, null);
    await git2.visitAll(git2.treeRoot, async (node, entry) => {
        let id = node.sha;
        if (!oldset.has(id))
            changed.push(id);
    }, async (entry) => {
        let id = (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_7__.toHex)(entry.oid);
        if (!oldset.has(id))
            changed.push(id);
    }, null);
    console.log('changed:', changed);
}


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCFS_NodeJS: () => (/* binding */ DCCFS_NodeJS)
/* harmony export */ });
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(util__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var zlib__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var zlib__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(zlib__WEBPACK_IMPORTED_MODULE_3__);




class DCCFS_NodeJS {
    constructor() {
        //basedir是dcc根目录。当生成的时候是dcc的输出目录。当客户端的时候是缓存目录
        this.repoPath = '';
    }
    fetch(url) {
        throw new Error("Method not implemented.");
    }
    async init(repoPath, cachePath) {
        this.repoPath = repoPath;
    }
    //这个不是客户端读写，所以onlylocal没有用
    async read(url, encode, onlylocal) {
        if (!path__WEBPACK_IMPORTED_MODULE_2__.isAbsolute(url)) {
            url = path__WEBPACK_IMPORTED_MODULE_2__.join(this.repoPath, url);
        }
        if (encode === 'buffer') {
            const buffer = await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.readFile)(url);
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }
        else {
            return (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.readFile)(url, 'utf8');
        }
    }
    async write(url, content, overwrite) {
        if (path__WEBPACK_IMPORTED_MODULE_2__.isAbsolute(url)) {
            url = path__WEBPACK_IMPORTED_MODULE_2__.relative(this.repoPath, url);
        }
        let paths = url.split('/');
        paths.pop();
        let absfile = path__WEBPACK_IMPORTED_MODULE_2__.resolve(this.repoPath, url);
        let abspath = path__WEBPACK_IMPORTED_MODULE_2__.resolve(this.repoPath, paths.join('/'));
        try {
            if (!overwrite && fs__WEBPACK_IMPORTED_MODULE_1__.existsSync(absfile))
                return;
            await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.access)(abspath);
        }
        catch (e) {
            await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.mkdir)(abspath, { recursive: true });
        }
        if (content instanceof ArrayBuffer) {
            return (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.writeFile)(absfile, Buffer.from(content));
        }
        await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.writeFile)(absfile, content);
    }
    async isFileExist(url) {
        try {
            await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.access)(url, fs__WEBPACK_IMPORTED_MODULE_1__.constants.F_OK);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    unzip(buff) {
        if (!(buff instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        const buffer = Buffer.from(buff);
        return (0,zlib__WEBPACK_IMPORTED_MODULE_3__.gunzipSync)(buffer).buffer;
    }
    zip(buff) {
        if (!(buff instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        const buffer = Buffer.from(buff);
        return (0,zlib__WEBPACK_IMPORTED_MODULE_3__.gzipSync)(buffer).buffer;
    }
    textencode(text) {
        return Buffer.from(text, 'utf-8').buffer;
    }
    textdecode(buffer, off) {
        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        return Buffer.from(buffer).toString('utf-8', off);
    }
    async mv(src, dst) {
        return (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.rename)(src, dst);
    }
    rm(url) {
        let absfile = path__WEBPACK_IMPORTED_MODULE_2__.resolve(this.repoPath, url);
        return (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.rm)(absfile);
    }
    async enumCachedObjects(callback) {
        let objects = path__WEBPACK_IMPORTED_MODULE_2__.join(this.repoPath, 'objects');
        let idPres = fs__WEBPACK_IMPORTED_MODULE_1__.readdirSync(objects);
        for (let pre of idPres) {
            let cpath = objects + '/' + pre;
            let objs = fs__WEBPACK_IMPORTED_MODULE_1__.readdirSync(cpath);
            for (let o of objs) {
                callback(pre + o);
            }
        }
    }
}


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EntryType: () => (/* binding */ EntryType),
/* harmony export */   TreeEntry: () => (/* binding */ TreeEntry),
/* harmony export */   TreeNode: () => (/* binding */ TreeNode)
/* harmony export */ });
/* harmony import */ var _GitFS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _GitFSUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);


var EntryType;
(function (EntryType) {
    EntryType["TREE"] = "tree";
    EntryType["BLOB"] = "blob";
    EntryType["COMMIT"] = "commit";
})(EntryType || (EntryType = {}));
class TreeEntry {
    get idstring() {
        return (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.toHex)(this.oid);
    }
    get isDir() {
        return this.mode.charAt(0) == '0';
    }
    constructor(path, mode, oid) {
        this.packid = null; // 保留
        this.treeNode = null; // 如果是目录的话，且目录被下载了，则指向目录的的treeNode
        this.flags = 0; // 一些标记。例如是否压缩，
        this.touchFlag = 0; // 同步时做删除标记用。运行时数据，随时在变
        this.path = path;
        this.mode = mode;
        this.type = mode2type(mode);
        this.oid = oid ? new Uint8Array(oid) : TreeEntry.InvalidOID;
    }
    // 为了调试方便，在命令行获取这个值就触发openNode
    get dbgGetTreeNode() {
        return this.get_treeNode();
    }
    async get_treeNode() {
        if (!this.treeNode) {
            //TEST
            let win = window;
            if (win.gitfs && win.gitfs.gitfs) {
                let gitfs = win.gitfs.gitfs;
                this.treeNode = await gitfs.openNode(this);
            }
        }
        return this.treeNode;
    }
    modeToInt() {
        return parseInt(this.mode, 16);
    }
}
TreeEntry.dirMode = '040000';
TreeEntry.blobMode = '100644';
TreeEntry.InvalidOID = new Uint8Array(20);
class TreeNode {
    constructor(entries, parent, frw) {
        this._entries = [];
        this.parent = null;
        this.buff = null; // 计算sha需要先转成buff。由于计算sha和提交都需要这个buff，所以，每次计算sha都会更新并保存这个buff。 如果有zip的话，这个是zip之后的
        this.sha = null; // null或者'' 表示没有计算，或者原来的失效了，需要重新计算
        this.rtData = null;
        this.parent = parent;
        if (entries) {
            if (entries instanceof Uint8Array) {
                this.parseBuffer(entries, frw);
            }
            else if (Array.isArray(entries)) {
                this._entries = entries.map(nudgeIntoShape);
                // Tree entries are not sorted alphabetically in the usual sense (see `compareTreeEntryPath`)
                // but it is important later on that these be sorted in the same order as they would be returned from readdir.
                // 根据路径排序
                //this._entries.sort(comparePath)
            }
        }
    }
    get entries() {
        if (!this._entries)
            this._entries = [];
        return this._entries;
    }
    clearUntouched() {
        let lefted = [];
        this.entries.forEach(e => {
            //清理touch标记。如果后面设置1了，表示使用，那么是0的就是要删除的
            if (e.touchFlag == 1) {
                lefted.push(e);
            }
        });
        this._entries = lefted;
    }
    getParentEntry(node) {
        if (node.parent) {
            let es = node.parent.entries;
            for (let i = 0, n = es.length; i < n; i++) {
                if (es[i].treeNode == node)
                    return es[i];
            }
        }
        return null;
    }
    /**
     *
     * @param node 要查询的节点
     * @param path 在node的基础上附加的
     * @returns
     */
    _getFullPath(node, path) {
        let entry = this.getParentEntry(node);
        if (entry) {
            let nodePath = entry.path + (entry.isDir ? '/' : '');
            let curPath = nodePath + (path ? path : '');
            return this._getFullPath(node.parent, curPath);
        }
        else {
            return '/' + (path ? path : '');
        }
    }
    get fullPath() {
        return this._getFullPath(this, null);
    }
    //得到名字为name的子目录
    getEntry(name) {
        let ents = this._entries;
        for (let i = 0, n = ents.length; i < n; i++) {
            if (ents[i].path === name)
                return ents[i];
        }
        return null;
    }
    addEntry(name, isDir, oid) {
        let entry = new TreeEntry(name, isDir ? TreeEntry.dirMode : TreeEntry.blobMode, oid ? oid.slice(0) : null);
        entry.owner = this;
        //entry.treeNode=this;
        this.entries.push(entry);
        // 修改了，要清理sha
        this.needSha();
        return entry;
    }
    /**
     * 删除某个文件或者目录
     * 只是从entries中删除，不是物理删除
     * @param name
     * @returns
     */
    rmEntry(name) {
        let idx = -1;
        if (typeof name == 'string') {
            idx = this.entries.findIndex(value => { return value.path == name; });
        }
        else if (name instanceof TreeEntry) {
            idx = this.entries.indexOf(name);
        }
        if (idx >= 0) {
            this.entries.splice(idx, 1);
            this.needSha();
            return true;
        }
        return false;
    }
    *[Symbol.iterator]() {
        for (const entry of this._entries) {
            yield entry;
        }
    }
    /**
     * 设置sha无效。
     * 会通知到所有的父节点
     * @returns
     */
    needSha() {
        // 下面的判断不合理。有些情况下并不是needSha给这两个赋值。例如刚创建就没有。所以先不要这个优化
        //if(this.sha==null&&this.buff==null)
        //	return;
        this.sha = null;
        this.buff = null;
        if (this.parent) {
            this.parent.needSha();
        }
    }
    // 需要更新本节点的sha
    isNeedSha() {
        return (!this.sha) || (!this.buff);
    }
    /**
     * 更新自己包括子的sha，同时记录变化的节点，用来push
     * 这个每次提交的时候，只允许执行一次，放到生成commit的地方
     */
    async updateAllSha(frw, changed) {
        // 先计算子，再计算自己
        let entries = this.entries;
        for (let i = 0, n = entries.length; i < n; i++) {
            let entry = entries[i];
            let treenode = entry.treeNode;
            if (treenode) {
                let sha = await treenode.updateAllSha(frw, changed);
                entry.oid = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.hashToArray)(sha);
            }
        }
        if (this.isNeedSha()) { //如果sha值需要计算，则可能是需要commit的
            await this.toObject(frw); // 这里会计算自己节点的sha
            //if(this.needCommit){// 通过这个标记避免重复push。 可能多次需要计算sha，但是commit只记录一次
            changed.push(this);
            //	this.needCommit=false;
            //}
        }
        return this.sha;
    }
    parse_tree(buffer) {
        let entries = this._entries;
        let cursor = 5; // 从 'tree '后开始
        let nullchar = buffer.indexOf(0, cursor);
        if (nullchar === -1) {
            console.error('tree后面没有找到0，格式不对');
            return null;
        }
        let strLen = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.readUTF8)(new Uint8Array(buffer.buffer.slice(cursor, nullchar)));
        let len = parseInt(strLen);
        cursor = nullchar + 1;
        //对齐
        cursor = (cursor + 3) & ~3;
        while (cursor < buffer.length) {
            // mode name\0hash 所以先找空格，再找\0
            const space = buffer.indexOf(32, cursor);
            if (space === -1) {
                throw new Error(`GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`);
            }
            const nullchar = buffer.indexOf(0, cursor);
            if (nullchar === -1) {
                throw new Error(`GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next null character.`);
            }
            let mode = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.readUTF8)(new Uint8Array(buffer.buffer.slice(cursor, space))); //  buffer.slice(cursor, space).toString('utf8')
            if (mode === '40000')
                mode = '040000'; // makes it line up neater in printed output
            const type = mode2type(mode);
            const path = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.readUTF8)(new Uint8Array(buffer.buffer.slice(space + 1, nullchar))); //  buffer.slice(space + 1, nullchar).toString('utf8')
            if (path.includes('\\') || path.includes('/')) {
                throw 'unsafe path:' + path;
            }
            const oid = new Uint8Array(buffer.buffer.slice(nullchar + 1, nullchar + 21));
            cursor = nullchar + 21;
            //time
            cursor = (cursor + 3) & ~3;
            let tmArray = new Uint32Array(buffer.buffer, cursor, 2);
            let high = tmArray[0];
            let low = tmArray[1];
            let time = new Date(high * 0x100000000 + low);
            cursor += 8;
            let entry = new TreeEntry(path, mode, oid);
            entry.fileMTime = time;
            entry.owner = this;
            entry.type = type;
            //entry.treeNode=this;
            entries.push(entry);
        }
        // 根据路径排序
        //entries.sort(comparePath)
        return entries;
    }
    parseBuffer(zippedbuffer, frw) {
        this.buff = zippedbuffer;
        let buffer;
        if (_GitFS__WEBPACK_IMPORTED_MODULE_0__.GitFS.zip) {
            buffer = new Uint8Array(frw.unzip(zippedbuffer.buffer));
        }
        else {
            buffer = new Uint8Array(zippedbuffer.buffer);
        }
        let entries = this._entries; //: TreeEntry[] = []
        entries.length = 0;
        //前面必须是tree
        if ((buffer[0] == 0x74 && buffer[1] == 0x72 && buffer[2] == 0x65 && buffer[3] == 0x65 && buffer[4] == 0x20)) { //'tree '
            return this.parse_tree(buffer);
        }
        else
            return null;
    }
    // 保存成一个buffer
    async toObject(frw) {
        // Adjust the sort order to match git's
        const entries = this._entries ? [...this._entries] : [];
        entries.sort(compareTreeEntryPath);
        let totallen = 0;
        let entrylen = 0;
        entries.map(entry => {
            let mode = entry.mode.replace(/^0/, '');
            entrylen += mode.length;
            entrylen += 1; //空格
            let length = new TextEncoder().encode(entry.path).length;
            entrylen += length; //entry.path.length;
            entrylen += 1; //0
            entrylen += 20;
            //对齐
            entrylen = (entrylen + 3) & ~3;
            entrylen += 8; //time
        });
        totallen = (5 + entrylen.toString().length + 1);
        //对齐
        totallen = ((totallen + 3) & ~3) + entrylen;
        let retbuf = new Uint8Array(totallen);
        let cursor = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.writeUTF8)(retbuf, 'tree ', 0);
        cursor += (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.writeUTF8)(retbuf, entrylen.toString(), cursor);
        retbuf[cursor] = 0;
        cursor += 1;
        //对齐
        cursor = (cursor + 3) & ~3;
        entries.map(entry => {
            var _a;
            let mode = entry.mode.replace(/^0/, '');
            cursor += (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.writeUTF8)(retbuf, mode, cursor);
            retbuf[cursor] = 0x20;
            cursor += 1;
            cursor += (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.writeUTF8)(retbuf, entry.path, cursor);
            retbuf[cursor] = 0;
            cursor += 1;
            if (entry.oid && entry.oid != TreeEntry.InvalidOID) {
                if (!(entry.oid instanceof Uint8Array)) {
                    throw 'oid type error';
                }
                retbuf.set(entry.oid, cursor);
            }
            else if ((_a = entry.treeNode) === null || _a === void 0 ? void 0 : _a.sha) {
                let oid = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.hashToArray)(entry.treeNode.sha);
                if (oid.byteLength != 20) {
                    throw 'oid length error';
                }
                retbuf.set(oid, cursor);
            }
            cursor += 20;
            //对齐一下
            cursor = (cursor + 3) & ~3;
            // 使用位操作将64位时间戳拆分为两个32位的数值
            let mtime = entry.fileMTime ? entry.fileMTime.valueOf() : 0;
            let high = Math.floor(mtime / 0x100000000); // 获取高32位
            let low = mtime & 0xFFFFFFFF; // 获取低32位		
            let timeArr = new Uint32Array(retbuf.buffer, cursor, 2);
            timeArr[0] = high;
            timeArr[1] = low;
            cursor += 8;
        });
        if (frw && _GitFS__WEBPACK_IMPORTED_MODULE_0__.GitFS.zip) {
            retbuf = new Uint8Array(frw.zip(retbuf.buffer));
        }
        this.sha = await (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.shasum)(retbuf, true);
        this.buff = retbuf;
        return retbuf;
    }
}
function compareStrings(a, b) {
    // https://stackoverflow.com/a/40355107/2168416
    return -(a < b) || +(a > b);
}
function comparePath(a, b) {
    return compareStrings(a.path, b.path);
}
function compareTreeEntryPath(a, b) {
    // Git sorts tree entries as if there is a trailing slash on directory names.
    return compareStrings(appendSlashIfDir(a), appendSlashIfDir(b));
}
function appendSlashIfDir(entry) {
    return entry.mode === '040000' ? entry.path + '/' : entry.path;
}
function mode2type(mode) {
    // prettier-ignore
    switch (mode) {
        case '040000': return EntryType.TREE;
        case '100644': return EntryType.BLOB;
        case '100755': return EntryType.BLOB;
        case '120000': return EntryType.BLOB;
        case '160000': return EntryType.COMMIT;
    }
    throw new Error(`Unexpected GitTree entry mode: ${mode}`);
}
let reg_dir = /^0?4.*/;
let reg_nexe = /^1006.*/;
let reg_exe = /^1007.*/;
let reg_slink = /^120.*/;
let reg_commit = /^160.*/;
function limitModeToAllowed(mode) {
    if (typeof mode === 'number') {
        mode = mode.toString(8);
    }
    if (mode.match(reg_dir))
        return '040000'; // Directory
    if (mode.match(reg_nexe))
        return '100644'; // Regular non-executable file
    if (mode.match(reg_exe))
        return '100755'; // Regular executable file
    if (mode.match(reg_slink))
        return '120000'; // Symbolic link
    if (mode.match(reg_commit))
        return '160000'; // Commit (git submodule reference)
    throw new Error(`Could not understand file mode: ${mode}`);
}
function nudgeIntoShape(entry) {
    entry.mode = limitModeToAllowed(entry.mode); // index
    if (!entry.type) {
        entry.type = mode2type(entry.mode); // index
    }
    return entry;
}


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GitFS: () => (/* binding */ GitFS),
/* harmony export */   readBinFile: () => (/* binding */ readBinFile)
/* harmony export */ });
/* harmony import */ var _GitCommit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(10);
/* harmony import */ var _GitFSUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);
/* harmony import */ var _GitTree__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);



async function readBinFile(file) {
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
    /**
     *
     * @param repoUrl git库所在目录
     * @param filerw
     */
    constructor(filerw) {
        //private userUrl:string; //保存head等用户信息的地方，可以通过filerw写。从uid开始的相对路径
        this.treeRoot = new _GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode(null, null, null);
        // 当前准备提交的commit
        this.curCommit = new _GitCommit__WEBPACK_IMPORTED_MODULE_0__.CommitInfo();
        // 当前的修改
        this.allchanges = [];
        this.checkDownload = true;
        this._objectPacks = [];
        this.objectEncrypter = null;
        this.saveBlob = true;
        //读的防抖
        this._pending = new Map();
        this.frw = filerw;
    }
    async read(path, type, onlylocal, contentChecker) {
        const key = `${path}-${type}`;
        // 如果已经有相同的请求在进行中，等待它完成
        if (this._pending.has(key)) {
            return this._pending.get(key);
        }
        try {
            const promise = this.frw.read(path, type, onlylocal, contentChecker);
            this._pending.set(key, promise);
            const result = await promise;
            return result;
        }
        finally {
            this._pending.delete(key);
        }
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
        let commit = await this.frw.read(url, 'utf8', false, null);
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
        let buff = await this.frw.read(commitobjFile, 'buffer', false, null);
        let cc;
        if (buff) {
            cc = new _GitCommit__WEBPACK_IMPORTED_MODULE_0__.GitCommit(this.frw.unzip(buff), objid);
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
            return new _GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode(null, null, this.frw);
        }
        let treepath = this.getObjUrl(objid);
        let buff;
        //先从包中查找。反正不存在新旧问题，先找包逻辑简单，因为frw.read会有下载过程，如果先frw.read会导致即使包里有也会下载
        for (let pack of this._objectPacks) {
            if (!pack)
                continue;
            if (await pack.has(objid)) {
                buff = await pack.get(objid);
            }
            if (buff)
                break;
        }
        try {
            if (!buff) {
                //buff = await this.frw.read(treepath, 'buffer', false, this.checkDownload ? async (buff) => {
                buff = await this.read(treepath, 'buffer', false, this.checkDownload ? async (buff) => {
                    if (!buff || buff.byteLength <= 0)
                        return false;
                    let sum = await (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.shasum)(new Uint8Array(buff), true);
                    if (sum == objid)
                        return true;
                    console.error(`下载内容检查错误,文件：${treepath}下载内容校验为:${sum}`);
                    return false;
                } : null);
            }
        }
        catch (e) { }
        //不知道为什么，有时候会返回长度为0的buffer，所以需要判断一下
        if (!buff || buff.byteLength == 0) {
            throw "no treepath";
        }
        let treebuff = new Uint8Array(buff);
        let ret = treeNode;
        if (!ret) {
            ret = new _GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode(treebuff, null, this.frw);
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
            strid = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.toHex)(objid);
        }
        let objpath = this.getObjUrl(strid);
        let buff = null;
        for (let pack of this._objectPacks) {
            if (!pack)
                continue;
            if (await pack.has(strid)) {
                buff = await pack.get(strid);
            }
            if (buff)
                break;
        }
        try {
            if (!buff) {
                let objbuff = await this.read(objpath, 'buffer', false, this.checkDownload ? async (buff) => {
                    let sum = await (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.shasum)(new Uint8Array(buff), true);
                    if (sum == objid)
                        return true;
                    console.error(`下载内容检查错误,文件：${objpath}下载内容校验为:${sum}`);
                    return false;
                } : null);
                if (objbuff) {
                    buff = GitFS.zip ? this.frw.unzip(objbuff) : objbuff;
                }
            }
        }
        catch (e) {
        }
        if (!buff) {
            throw new Error('download error:' + strid);
        }
        //下载文件最好不校验。影响速度。
        //校验写到下载过程中了，以保证写入缓存的是正确的
        // if (this.checkDownload) {
        //     let sum = await shasum(new Uint8Array(buff), true);
        //     if (sum != strid) {
        //         console.log('下载的文件校验错误:', strid, sum);
        //     }
        // }
        if (encode == 'utf8') {
            let str = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.readUTF8)(buff);
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
        if (!(node instanceof _GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeEntry)) {
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
    async visitAll(node, treecb, blobcb, inEntry, openNode = true) {
        await treecb(node, inEntry);
        for await (const entry of node.entries) {
            if (entry.isDir) {
                try {
                    if (!entry.treeNode && openNode)
                        await this.openNode(entry);
                    if (entry.treeNode)
                        await this.visitAll(entry.treeNode, treecb, blobcb, entry, openNode);
                }
                catch (e) {
                    //失败了可能是遍历本地目录，但是本地还没有下载，没有设置远程或者访问远程失败
                    //在没有网的情况下容易出
                    console.log('openNode error:', (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.toHex)(entry.oid));
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
        else if (node instanceof _GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode) {
            entry = node.getEntry(file);
        }
        else if (node instanceof _GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeEntry) {
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
    /**
     * 根据一个普通url加载文件内容
     * @param file 相对路径，这里认为是相对于库的根目录，可以有/
     * @param encode
     * @returns
     */
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
        if (this.saveBlob)
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
        return await (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.shasum)(new Uint8Array(buff), true);
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
            if (!cNode)
                return false;
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
            let objid = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.toHex)(last.oid);
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
                    cNode = new _GitTree__WEBPACK_IMPORTED_MODULE_2__.TreeNode(null, cNode, this.frw);
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
        let oid = await (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.shasum)(new Uint8Array(buff), false);
        let hash = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.toHex)(oid);
        let entry = node.getEntry(name);
        if (entry) { // 如果entry已经存在，说明是替换
            // 看是否修改
            let shastr = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.toHex)(entry.oid);
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
        let p = node.fullPath;
        if (!p.endsWith('/'))
            p += '/';
        if (!await this.saveBlobNode(hash, buff, p + name)) {
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
                let shaonline = (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.toHex)(f.oid);
                if (filenode) {
                    let fc = await filenode.readFile('buffer');
                    shalocal = await (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_1__.shasum)(fc, true);
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
        let cmtinfo = new _GitCommit__WEBPACK_IMPORTED_MODULE_0__.CommitInfo();
        cmtinfo.commitMessage = msg;
        cmtinfo.author = this.user;
        cmtinfo.author_timestamp = new Date();
        cmtinfo.parent = this.curCommit.sha;
        //await this.treeRoot.updateAllSha(this.frw,this.allchanges);
        cmtinfo.tree = this.treeRoot.sha;
        console.log('[gitfs] makecommit tree:', this.treeRoot.sha);
        let cmt = new _GitCommit__WEBPACK_IMPORTED_MODULE_0__.GitCommit(cmtinfo, 'nosha');
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
GitFS.zip = false;
GitFS.touchID = 0; // 更新标记


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CommitInfo: () => (/* binding */ CommitInfo),
/* harmony export */   GitCommit: () => (/* binding */ GitCommit)
/* harmony export */ });
/* harmony import */ var _GitFSUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

class CommitInfo {
    constructor() {
        this.parent = '0';
    }
}
/**
 * 把commitinfo转成buffer
 * 从buffer中还原出commitinfo
 */
class GitCommit {
    constructor(buff, sha) {
        if (buff instanceof ArrayBuffer) {
            this.commitinfo = new CommitInfo();
            this.parse(buff);
            this.commitinfo.sha = sha;
        }
        else {
            this.commitinfo = buff;
        }
    }
    readString(buff, off, len) {
        let l = (len > 0 ? len : buff.byteLength);
        buff = buff.slice(off, off + l);
        let newbuff = new Uint8Array(buff);
        return (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_0__.readUTF8)(newbuff);
    }
    strToBuff(str) {
        return (new TextEncoder()).encode(str);
    }
    getStrLen(buff, off, maxlen = -1) {
        let l = 0;
        for (let i = 0; i < maxlen; i++) {
            if (buff[off + i] === 0)
                break;
            l++;
        }
        return l;
    }
    parse(buff) {
        let commitinfo = this.commitinfo;
        // 是个buffer，但是buffer中保存的是字符串
        let u8buff = new Uint8Array(buff);
        let curptr = 0;
        let head = this.readString(u8buff, curptr, 7);
        if (head !== 'commit ')
            return false;
        curptr += 7;
        let length = this.readString(u8buff, curptr, this.getStrLen(u8buff, curptr, 100));
        let lenlen = length.length;
        curptr += (lenlen + 1);
        let content = this.readString(u8buff, curptr, parseInt(length));
        let treepos = content.indexOf('tree ');
        if (treepos < 0)
            return false;
        let treeid = content.substr(treepos + 5, 40);
        commitinfo.tree = treeid;
        let parentpos = content.indexOf('parent ', treepos + 40);
        if (parentpos < 0)
            return false;
        let parentid = content.substr(parentpos + 7, 40);
        commitinfo.parent = parentid;
        commitinfo.commitMessage = content.substr(parentpos + 7 + 40 + 1);
        return true;
    }
    idbuffToString(id) {
        if (id instanceof ArrayBuffer) {
            return (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_0__.toHex)(new Uint8Array(id));
        }
        else if (id instanceof Uint8Array) {
            return (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_0__.toHex)(id);
        }
        return id;
    }
    formatDate(d) {
        return d.getFullYear() + '-'
            + (d.getMonth() + 1) + '-'
            + d.getDate() + ' '
            + d.getHours() + ':'
            + d.getMinutes() + ':'
            + d.getSeconds();
    }
    async toBuffer(frw) {
        let treeid = this.idbuffToString(this.commitinfo.tree);
        let parentid = this.commitinfo.parent ? (this.idbuffToString(this.commitinfo.parent)) : null;
        let str = 'commit ';
        let strcontent = '';
        strcontent += 'tree ' + treeid + '\a';
        if (parentid) {
            strcontent += 'parent ' + parentid + '\a';
        }
        strcontent += 'author ' + this.commitinfo.author + ' ' + this.formatDate(this.commitinfo.author_timestamp) + ' ' + '\n\n ' + this.commitinfo.commitMessage + '\n';
        //                                        Date,               时区    
        let len = (new TextEncoder()).encode(strcontent).length; // strcontent.length;
        str += len;
        str += '\0';
        str += strcontent;
        // 把字符串转成buffer
        let buff = this.strToBuff(str);
        if (frw.zip) {
            buff = new Uint8Array(frw.zip(buff));
        }
        /*
        // 压缩
        var deflate = new (window as any).pako.Deflate();
        deflate.push(buff, true);//true表示完了
        if (deflate.err) {
            console.error(deflate.msg);
        } else {
        }
        */
        this.commitinfo.sha = await (0,_GitFSUtils__WEBPACK_IMPORTED_MODULE_0__.shasum)(buff, true);
        return buff;
    }
}


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   hashToArray: () => (/* binding */ hashToArray),
/* harmony export */   readUTF8: () => (/* binding */ readUTF8),
/* harmony export */   shasum: () => (/* binding */ shasum),
/* harmony export */   toHex: () => (/* binding */ toHex),
/* harmony export */   writeUTF8: () => (/* binding */ writeUTF8)
/* harmony export */ });
/* harmony import */ var _Env__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12);
/* harmony import */ var _sha1__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/**
 * GitFS依赖的东西。
 *
 */


function readUTF8(buf) {
    return _Env__WEBPACK_IMPORTED_MODULE_0__.Env.dcodeUtf8(buf);
}
// 返回写了多少
function writeUTF8(buf, str, off) {
    let strbuf = new TextEncoder().encode(str);
    buf.set(strbuf, off);
    return strbuf.length;
}
let supportsSubtleSHA1 = null;
/**
 * 把一个Uint8Array转成16进制字符串。没有0x
 * @param buffer
 * @returns
 */
function toHex(buffer) {
    let hex = '';
    for (const byte of new Uint8Array(buffer)) {
        if (byte < 16)
            hex += '0';
        hex += byte.toString(16);
    }
    return hex;
}
function hashToArray(hash) {
    const paddedHex = hash.padStart(40, '0');
    //let len = hash.length/2;
    let ret = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
        ret[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
    }
    return ret;
}
/**
 * 计算一个buffer的sha1值，返回的是40个字符串表示的20个字节数据
 * @param buffer
 * @returns
 */
async function shasum(buffer, tostring = true) {
    if (supportsSubtleSHA1 === null) {
        supportsSubtleSHA1 = await testSubtleSHA1();
    }
    return supportsSubtleSHA1 ? subtleSHA1(buffer, tostring) : shasumSync(buffer, tostring);
}
function shasumSync(data, tostring = true) {
    let ret;
    if (tostring) {
        ret = (0,_sha1__WEBPACK_IMPORTED_MODULE_1__.createHash)().update(data).digest('hex');
    }
    else {
        ret = (0,_sha1__WEBPACK_IMPORTED_MODULE_1__.createHash)().update(data).digest();
    }
    return ret;
}
async function subtleSHA1(buffer, tostring = true) {
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', buffer));
    if (tostring)
        return toHex(hash);
    return hash;
}
async function testSubtleSHA1() {
    try {
        const hash = await subtleSHA1(new Uint8Array([]));
        if (hash === 'da39a3ee5e6b4b0d3255bfef95601890afd80709')
            return true;
    }
    catch (_) {
        // no bother
    }
    return false;
}
/*
function encodeUTF8(s) {
    var i, r = [], c, x;
    for (i = 0; i < s.length; i++)
        if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
        else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
        else {
            if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
                c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                    r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
            else r.push(0xE0 + (c >> 12 & 0xF));
            r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
        };
    return r;
};
*/


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Env: () => (/* binding */ Env)
/* harmony export */ });
var isNode = typeof window == 'undefined' && typeof global == 'object';
class Env {
    static get runtimeName() {
        if (isNode)
            return 'node';
        if (window.conch) {
            return 'layaNative';
        }
        return 'web';
    }
    static isNative() { }
    static isWeb() { }
    static isNode() { }
    //根据不同的平台实现
    static dcodeUtf8(buf) {
        if (isNode) {
            return (new TextDecoder()).decode(buf);
        }
        else {
            if (window.conch) {
                //return conch.bufferToString(buf);
                let str = decodeBuffer(buf);
                return str;
            }
            else {
                return (new TextDecoder()).decode(buf);
            }
        }
    }
}
function decodeBuffer(buf) {
    let len = buf.byteLength;
    let pos = 0;
    var v = "", max = len, c, c2, c3, f = String.fromCharCode;
    var u = new Uint8Array(buf), i = 0;
    var strs = [];
    var n = 0;
    strs.length = 1000;
    while (pos < max) {
        c = u[pos++];
        if (c < 0x80) {
            if (c != 0)
                //v += f(c);\
                strs[n++] = f(c);
        }
        else if (c < 0xE0) {
            //v += f(((c & 0x3F) << 6) | (u[_pos_++] & 0x7F));
            strs[n++] = f(((c & 0x3F) << 6) | (u[pos++] & 0x7F));
        }
        else if (c < 0xF0) {
            c2 = u[pos++];
            //v += f(((c & 0x1F) << 12) | ((c2 & 0x7F) << 6) | (u[_pos_++] & 0x7F));
            strs[n++] = f(((c & 0x1F) << 12) | ((c2 & 0x7F) << 6) | (u[pos++] & 0x7F));
        }
        else {
            c2 = u[pos++];
            c3 = u[pos++];
            //v += f(((c & 0x0F) << 18) | ((c2 & 0x7F) << 12) | ((c3 << 6) & 0x7F) | (u[_pos_++] & 0x7F));
            const _code = ((c & 0x0F) << 18) | ((c2 & 0x7F) << 12) | ((c3 & 0x7F) << 6) | (u[pos++] & 0x7F);
            if (_code >= 0x10000) {
                const _offset = _code - 0x10000;
                const _lead = 0xd800 | (_offset >> 10);
                const _trail = 0xdc00 | (_offset & 0x3ff);
                strs[n++] = f(_lead);
                strs[n++] = f(_trail);
            }
            else {
                strs[n++] = f(_code);
            }
        }
        i++;
    }
    strs.length = n;
    return strs.join('');
}


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createHash: () => (/* binding */ createHash)
/* harmony export */ });
// https://github.com/kawanet/sha1-uint8array/edit/main/lib/sha1-uint8array.ts
/**
 * sha1-uint8array.ts
 */
const K = [
    0x5a827999 | 0,
    0x6ed9eba1 | 0,
    0x8f1bbcdc | 0,
    0xca62c1d6 | 0,
];
const algorithms = {
    sha1: 1,
};
function createHash(algorithm) {
    if (algorithm && !algorithms[algorithm] && !algorithms[algorithm.toLowerCase()]) {
        throw new Error("Digest method not supported");
    }
    return new Hash();
}
class Hash {
    constructor() {
        this.A = 0x67452301 | 0;
        this.B = 0xefcdab89 | 0;
        this.C = 0x98badcfe | 0;
        this.D = 0x10325476 | 0;
        this.E = 0xc3d2e1f0 | 0;
        this._size = 0;
        this._sp = 0; // surrogate pair
        if (!sharedBuffer || sharedOffset >= 8000 /* N.allocTotal */) {
            sharedBuffer = new ArrayBuffer(8000 /* N.allocTotal */);
            sharedOffset = 0;
        }
        this._byte = new Uint8Array(sharedBuffer, sharedOffset, 80 /* N.allocBytes */);
        this._word = new Int32Array(sharedBuffer, sharedOffset, 20 /* N.allocWords */);
        sharedOffset += 80 /* N.allocBytes */;
    }
    update(data) {
        // data: string
        if ("string" === typeof data) {
            return this._utf8(data);
        }
        // data: undefined
        if (data == null) {
            throw new TypeError("Invalid type: " + typeof data);
        }
        const byteOffset = data.byteOffset;
        const length = data.byteLength;
        let blocks = (length / 64 /* N.inputBytes */) | 0;
        let offset = 0;
        // longer than 1 block
        if (blocks && !(byteOffset & 3) && !(this._size % 64 /* N.inputBytes */)) {
            const block = new Int32Array(data.buffer, byteOffset, blocks * 16 /* N.inputWords */);
            while (blocks--) {
                this._int32(block, offset >> 2);
                offset += 64 /* N.inputBytes */;
            }
            this._size += offset;
        }
        // data: TypedArray | DataView
        const BYTES_PER_ELEMENT = data.BYTES_PER_ELEMENT;
        if (BYTES_PER_ELEMENT !== 1 && data.buffer) {
            const rest = new Uint8Array(data.buffer, byteOffset + offset, length - offset);
            return this._uint8(rest);
        }
        // no more bytes
        if (offset === length)
            return this;
        // data: Uint8Array | Int8Array
        return this._uint8(data, offset);
    }
    _uint8(data, offset) {
        const { _byte, _word } = this;
        const length = data.length;
        offset = offset | 0;
        while (offset < length) {
            const start = this._size % 64 /* N.inputBytes */;
            let index = start;
            while (offset < length && index < 64 /* N.inputBytes */) {
                _byte[index++] = data[offset++];
            }
            if (index >= 64 /* N.inputBytes */) {
                this._int32(_word);
            }
            this._size += index - start;
        }
        return this;
    }
    _utf8(text) {
        const { _byte, _word } = this;
        const length = text.length;
        let surrogate = this._sp;
        for (let offset = 0; offset < length;) {
            const start = this._size % 64 /* N.inputBytes */;
            let index = start;
            while (offset < length && index < 64 /* N.inputBytes */) {
                let code = text.charCodeAt(offset++) | 0;
                if (code < 0x80) {
                    // ASCII characters
                    _byte[index++] = code;
                }
                else if (code < 0x800) {
                    // 2 bytes
                    _byte[index++] = 0xC0 | (code >>> 6);
                    _byte[index++] = 0x80 | (code & 0x3F);
                }
                else if (code < 0xD800 || code > 0xDFFF) {
                    // 3 bytes
                    _byte[index++] = 0xE0 | (code >>> 12);
                    _byte[index++] = 0x80 | ((code >>> 6) & 0x3F);
                    _byte[index++] = 0x80 | (code & 0x3F);
                }
                else if (surrogate) {
                    // 4 bytes - surrogate pair
                    code = ((surrogate & 0x3FF) << 10) + (code & 0x3FF) + 0x10000;
                    _byte[index++] = 0xF0 | (code >>> 18);
                    _byte[index++] = 0x80 | ((code >>> 12) & 0x3F);
                    _byte[index++] = 0x80 | ((code >>> 6) & 0x3F);
                    _byte[index++] = 0x80 | (code & 0x3F);
                    surrogate = 0;
                }
                else {
                    surrogate = code;
                }
            }
            if (index >= 64 /* N.inputBytes */) {
                this._int32(_word);
                _word[0] = _word[16 /* N.inputWords */];
            }
            this._size += index - start;
        }
        this._sp = surrogate;
        return this;
    }
    _int32(data, offset) {
        let { A, B, C, D, E } = this;
        let i = 0;
        offset = offset | 0;
        while (i < 16 /* N.inputWords */) {
            W[i++] = swap32(data[offset++]);
        }
        for (i = 16 /* N.inputWords */; i < 80 /* N.workWords */; i++) {
            W[i] = rotate1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]);
        }
        for (i = 0; i < 80 /* N.workWords */; i++) {
            const S = (i / 20) | 0;
            const T = (rotate5(A) + ft(S, B, C, D) + E + W[i] + K[S]) | 0;
            E = D;
            D = C;
            C = rotate30(B);
            B = A;
            A = T;
        }
        this.A = (A + this.A) | 0;
        this.B = (B + this.B) | 0;
        this.C = (C + this.C) | 0;
        this.D = (D + this.D) | 0;
        this.E = (E + this.E) | 0;
    }
    digest(encoding) {
        const { _byte, _word } = this;
        let i = (this._size % 64 /* N.inputBytes */) | 0;
        _byte[i++] = 0x80;
        // pad 0 for current word
        while (i & 3) {
            _byte[i++] = 0;
        }
        i >>= 2;
        if (i > 14 /* N.highIndex */) {
            while (i < 16 /* N.inputWords */) {
                _word[i++] = 0;
            }
            i = 0;
            this._int32(_word);
        }
        // pad 0 for rest words
        while (i < 16 /* N.inputWords */) {
            _word[i++] = 0;
        }
        // input size
        const bits64 = this._size * 8;
        const low32 = (bits64 & 0xffffffff) >>> 0;
        const high32 = (bits64 - low32) / 0x100000000;
        if (high32)
            _word[14 /* N.highIndex */] = swap32(high32);
        if (low32)
            _word[15 /* N.lowIndex */] = swap32(low32);
        this._int32(_word);
        return (encoding === "hex") ? this._hex() : this._bin();
    }
    _hex() {
        const { A, B, C, D, E } = this;
        return hex32(A) + hex32(B) + hex32(C) + hex32(D) + hex32(E);
    }
    _bin() {
        const { A, B, C, D, E, _byte, _word } = this;
        _word[0] = swap32(A);
        _word[1] = swap32(B);
        _word[2] = swap32(C);
        _word[3] = swap32(D);
        _word[4] = swap32(E);
        return _byte.slice(0, 20);
    }
}
const W = new Int32Array(80 /* N.workWords */);
let sharedBuffer;
let sharedOffset = 0;
const hex32 = num => (num + 0x100000000).toString(16).substr(-8);
const swapLE = (c => (((c << 24) & 0xff000000) | ((c << 8) & 0xff0000) | ((c >> 8) & 0xff00) | ((c >> 24) & 0xff)));
const swapBE = (c => c);
const swap32 = isBE() ? swapBE : swapLE;
const rotate1 = num => (num << 1) | (num >>> 31);
const rotate5 = num => (num << 5) | (num >>> 27);
const rotate30 = num => (num << 30) | (num >>> 2);
function ft(s, b, c, d) {
    if (s === 0)
        return (b & c) | ((~b) & d);
    if (s === 2)
        return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
}
function isBE() {
    const buf = new Uint8Array(new Uint16Array([0xFEFF]).buffer); // BOM
    return (buf[0] === 0xFE);
}


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RootDesc: () => (/* binding */ RootDesc)
/* harmony export */ });
class RootDesc {
    constructor() {
        //文件总数。用于集中下载计算进度
        this.fileCounts = 0;
        this.version = '1.0.0'; //上一次的id
        this.dccVersion = 1;
    }
}


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ObjPack: () => (/* binding */ ObjPack)
/* harmony export */ });
class ObjPack {
    /**
     *
     * @param type
     * @param fs 读取整体包文件的。虽然只有读，但是为了通用（例如磁盘的，网络的，apk内的）还是用了IGitFSFileIO接口
     * @param packid
     */
    constructor(type, fs, packid) {
        this.packPath = 'packfile/';
        this._frw = fs;
        let pre = type == 'tree' ? 'tree-' : 'blob-';
        this._idxFile = this.packPath + pre + packid + '.idx';
        this._packFile = this.packPath + pre + packid + '.pack';
    }
    async init() {
        try {
            this.idxInfo = JSON.parse(await this._frw.read(this._idxFile, 'utf8', true, null));
        }
        catch (e) {
            throw 'open pack error';
            return false;
        }
        return true;
    }
    async has(oid) {
        const exists = this.idxInfo.some(info => info.id === oid);
        return exists;
    }
    async get(oid) {
        const objInfo = this.idxInfo.find(info => info.id === oid);
        if (!objInfo) {
            throw new Error(`Object ID ${oid} not found`);
        }
        //直接读取，如果文件大的话，应该考虑流式读取
        const rawData = await this.readPart(this._packFile, objInfo.start, objInfo.start + objInfo.length);
        return rawData;
    }
    async readPart(file, start, end) {
        const rawData = await this._frw.read(file, 'buffer', true, null);
        return rawData.slice(start, end);
    }
}


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCObjectWrapper: () => (/* binding */ DCCObjectWrapper)
/* harmony export */ });
/**
 * 混淆文件
 */
class DCCObjectWrapper {
    constructor() {
        this.version = 1;
        this.xorKey = null;
    }
    static wrapObject(buff, head) {
        let headLen = 8 //flag
            + 4 //version
            + 8 //key  固定为8
            + 4; //datalen
        let retBuff = new Uint8Array(buff.byteLength + headLen);
        retBuff.set(DCCObjectWrapper.FLAG, 0);
        let bufw = new DataView(retBuff.buffer);
        bufw.setUint32(8, head.version, true);
        retBuff.set(head.xorKey || new Uint8Array(8), 12);
        bufw.setUint32(20, buff.byteLength, true);
        DCCObjectWrapper.xorEncryptArrayBuffer(buff, 0, head.xorKey, retBuff.buffer, 24);
        return retBuff;
    }
    static unwrapObject(buff, head) {
        let flags = new Uint8Array(buff, 0, 8);
        let isDCC = true;
        for (let i = 0; i < 8; i++) {
            if (flags[i] != DCCObjectWrapper.FLAG[i]) {
                isDCC = false;
                break;
            }
        }
        if (!isDCC) {
            //console.log('unwrapObject error: not a layadcc file');
            return null;
        }
        let bufw = new DataView(buff);
        let version = head.version = bufw.getUint32(8, true);
        switch (version) {
            //todo
        }
        let key = new Uint8Array(buff, 12, 8);
        let dataLen = bufw.getUint32(20, true);
        let encrypted = false;
        for (let i = 0; i < key.length; i++) {
            if (key[i] != 0) {
                encrypted = true;
                break;
            }
        }
        if (encrypted) {
            head.xorKey = key;
            let retBuff = DCCObjectWrapper.xorEncryptArrayBuffer(buff, 24, key, null, 0).buffer;
            return retBuff;
        }
        else {
            head.xorKey = null;
            let retBuff = buff.slice(24);
            if (retBuff.byteLength != dataLen) {
                throw 'unmatched size';
            }
            return retBuff;
        }
    }
    static xorEncryptArrayBuffer(inputBuffer, inputBufferOff, key, outbuff, outbuffOff) {
        if (key.length !== 8) {
            throw new Error("Key must be exactly 8 characters long.");
        }
        const inputData = new Uint8Array(inputBuffer, inputBufferOff);
        const outputData = outbuff ? new Uint8Array(outbuff, outbuffOff) : new Uint8Array(inputData.length);
        //const keyData = new Uint8Array(Buffer.from(key)); // Convert string key to Uint8Array
        for (let i = 0; i < inputData.length; i++) {
            outputData[i] = inputData[i] ^ key[i % key.length];
        }
        return outputData;
    }
}
DCCObjectWrapper.FLAG = new Uint8Array([108, 97, 121, 97, 100, 99, 99, 50]); //layadcc2


/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("os");

/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LayaDCCClient: () => (/* binding */ LayaDCCClient)
/* harmony export */ });
/* harmony import */ var _AppResReader_Native__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(19);
/* harmony import */ var _Config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20);
/* harmony import */ var _DCCClientFS_native__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(21);
/* harmony import */ var _DCCClientFS_web__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22);
/* harmony import */ var _DCCDownloader__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(24);
/* harmony import */ var _Env__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(12);
/* harmony import */ var _ObjPack_AppRes__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(25);
/* harmony import */ var _gitfs_GitFS__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(9);
/* harmony import */ var _gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(11);
/* harmony import */ var _DCCPackRW__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(26);










function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let DCCClientFS = {
    "layaNative": _DCCClientFS_native__WEBPACK_IMPORTED_MODULE_2__.DCCClientFS_native,
    "web": _DCCClientFS_web__WEBPACK_IMPORTED_MODULE_3__.DCCClientFS_web,
    "node": null, //web不能包含node相关
}[_Env__WEBPACK_IMPORTED_MODULE_5__.Env.runtimeName];
class LayaDCCClient {
    /**
     *
     * @param frw 文件访问接口，不同的平台需要不同的实现。如果为null，则自动选择网页或者native两个平台
     * @param dccurl dcc的服务器地址
     */
    constructor(dccurl, frw = null, logger = null) {
        //是否只把请求的url转换成hash
        this._onlyTransUrl = false;
        //映射到dcc目录的地址头，如果没有，则按照http://*/算，所有的请求都裁掉主机地址
        this._pathMapToDCC = '';
        this._logger = null;
        this.dccPathInAssets = 'cache/dcc2.0';
        //已经下载过的包，用来优化，避免重复下载，执行清理之后要清零
        this._loadedPacks = {};
        //是否检查下载内容。
        this._checkDownload = true;
        if (dccurl && !dccurl.endsWith('/'))
            dccurl += '/';
        this._dccServer = dccurl;
        if (!frw)
            frw = DCCClientFS;
        if (!frw)
            throw "没有正确的文件访问接口";
        this._frw = new frw();
        if (logger) {
            this._logger = logger;
            logger.clear();
        }
        this.checkEnv();
    }
    enableLog(b) {
        _Config__WEBPACK_IMPORTED_MODULE_1__.DCCConfig.log = b;
    }
    checkEnv() {
        //检查必须得native的接口
        if (window.conch) {
            if (!ZipFile) {
                throw 'native 环境不对';
            }
            if (!_XMLHttpRequest) {
                throw 'native 环境不对';
            }
            if (!conch.getCachePath) {
                throw 'native 环境不对';
            }
            if (!fs_exists) {
                throw 'native 环境不对';
            }
            if (!fs_mkdir) {
                throw 'native 环境不对';
            }
            if (!fs_readFileSync) {
                throw 'native 环境不对';
            }
            if (!fs_writeFileSync) {
                throw 'native 环境不对';
            }
            if (!fs_rm) {
                throw 'native 环境不对';
            }
            if (!fs_readdirSync) {
                throw 'native 环境不对';
            }
        }
    }
    get fileIO() {
        return this._frw;
    }
    log(msg) {
        if (_Config__WEBPACK_IMPORTED_MODULE_1__.DCCConfig.log)
            console.log(msg);
        this._logger && this._logger.checkLog(msg);
    }
    set pathMapToDCC(v) {
        this._pathMapToDCC = v;
    }
    get pathMapToDCC() {
        return this._pathMapToDCC;
    }
    /**
     * 初始化，下载必须信息
     * @param headfile dcc根文件，这个文件作为入口，用来同步本地缓存。如果为null则仅仅使用本地缓存
     * @param cachePath 这个暂时设置为null即可
     * @returns
     */
    async init(headfile, cachePath) {
        if (this._gitfs) {
            throw '重复初始化';
        }
        await this._frw.init(this._dccServer, cachePath);
        //判断是不是新的安装
        if (window.conch) {
            //如果是的话，拷贝出apk中的head
            let appres = new _AppResReader_Native__WEBPACK_IMPORTED_MODULE_0__.AppResReader_Native();
            //规则：如果第一次安装，直接使用apk内的，如果是覆盖安装，则比较时间差。比较的作用是防止万一没有网络的情况下，apk内的资源比较旧..
            try {
                let apphead = await appres.getRes(this.dccPathInAssets + '/head.json', 'buffer');
                if (apphead) {
                    //暂时直接拷贝覆盖，应该也是正确的
                    await this._frw.write('head.json', apphead, true);
                }
            }
            catch (e) {
                _Config__WEBPACK_IMPORTED_MODULE_1__.DCCConfig.log && console.log('LayaDCCClient init error: no head.json in package');
            }
        }
        let rootNode;
        //本地记录的head信息
        let localRoot = null;
        try {
            //本地
            let localHeadStr = await this._frw.read('head.json', 'utf8', true, null);
            let localHead = JSON.parse(localHeadStr);
            localRoot = localHead.root;
            rootNode = localRoot;
        }
        catch (e) { }
        //本地记录的下载包信息
        try {
            let loadedpacks = [];
            let str1 = await this._frw.read('downloaded_packs.json', 'utf8', true, null);
            if (str1) {
                loadedpacks = JSON.parse(str1);
                if (loadedpacks && loadedpacks.length) {
                    for (let m of loadedpacks) {
                        this._loadedPacks[m] = 1;
                    }
                }
            }
        }
        catch (e) {
        }
        //let frw = this._frw = new DCCClientFS_web_local();
        //下载head文件
        let remoteHead = null;
        let remoteHeadStr = null;
        try {
            if (headfile) {
                let headResp = await this._frw.fetch(headfile);
                let tryCount = 0;
                while (!headResp.ok) {
                    headResp = await this._frw.fetch(headfile);
                    tryCount++;
                    if (tryCount > 10) {
                        return false;
                    }
                    delay(100);
                }
                remoteHeadStr = await headResp.text();
                remoteHead = JSON.parse(remoteHeadStr);
                rootNode = remoteHead.root;
            }
        }
        catch (e) { }
        if (!remoteHead && !localRoot)
            //如果本地和远程都没有dcc数据，则返回，不做dcc相关设置
            return false;
        let gitfs = this._gitfs = new _gitfs_GitFS__WEBPACK_IMPORTED_MODULE_7__.GitFS(this._frw);
        gitfs.checkDownload = this._checkDownload;
        //初始化apk包资源
        if (window.conch) {
            let appResPack = new _ObjPack_AppRes__WEBPACK_IMPORTED_MODULE_6__.ObjPack_AppRes(this.dccPathInAssets);
            await appResPack.init();
            gitfs.addObjectPack(appResPack);
        }
        if (!localRoot || (remoteHead && localRoot != remoteHead.root)) { //本地不等于远端
            //处理打包
            if (LayaDCCClient.enableMergeDir && remoteHead.treePackages && remoteHead.treePackages.length) {
                this.log('需要下载treenode');
                for (let packid of remoteHead.treePackages) {
                    if (this._loadedPacks[packid]) {
                        this.log(`包已经下载过了${packid}`);
                        continue;
                    }
                    this.log(`下载treenode:${packid}`);
                    let resp = await this._frw.fetch(`${this._dccServer}packfile/tree-${packid}.idx`);
                    if (!resp.ok)
                        throw 'download treenode idx error';
                    let idxs = JSON.parse(await resp.text());
                    //先判断所有的index是不是都有了,如果都有的就不下载了
                    //TODO 这个过程会不会很慢？还不如直接下载
                    let resp1 = await this._frw.fetch(`${this._dccServer}packfile/tree-${packid}.pack`);
                    if (!resp1.ok)
                        throw 'download treenode pack error';
                    let buff = await resp1.arrayBuffer();
                    //把这些对象写到本地
                    for (let nodeinfo of idxs) {
                        let nodebuff = buff.slice(nodeinfo.start, nodeinfo.start + nodeinfo.length);
                        await this._gitfs.saveObject(nodeinfo.id, nodebuff);
                    }
                }
            }
        }
        //初始化完成，记录head到本地
        try {
            if (!await gitfs.setRoot(rootNode))
                return false;
            //记录下载的包文件
            if (remoteHead && remoteHead.treePackages) {
                for (let packid of remoteHead.treePackages) {
                    this._loadedPacks[packid] = 1;
                }
                //记录下载包。TODO如果有动态下载，则都要记录
                await this._frw.write('downloaded_packs.json', JSON.stringify(Object.keys(this._loadedPacks)), true);
            }
            if (remoteHeadStr)
                await this._frw.write('head.json', remoteHeadStr, true);
        }
        catch (e) {
            //例如root不存在：先有资源，后来有删除了资源
            return false;
        }
        return true;
    }
    set onlyTransUrl(v) {
        this._onlyTransUrl = v;
    }
    get onlyTransUrl() {
        return this._onlyTransUrl;
    }
    set checkDownload(v) {
        this._checkDownload = v;
        if (this._gitfs) {
            this._gitfs.checkDownload = v;
        }
    }
    get checkDownload() {
        return this._checkDownload;
    }
    async unpackBuffer(idxs, buff, offset = 0) {
        //把这些对象写到本地
        for (let nodeinfo of idxs) {
            let nodebuff = buff.slice(nodeinfo.start + offset, nodeinfo.start + offset + nodeinfo.length);
            await this._gitfs.saveObject(nodeinfo.id, nodebuff);
        }
    }
    /**
     * 本地是否缓存了某个文件
     * 注意这个会引起下载路径节点
     * @param url
     * @returns
     */
    async hasFile(url) {
        let gitfs = this._gitfs;
        if (!gitfs)
            throw 'dcc没有正确init';
        if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('file:')) { //绝对路径
            if (!this._pathMapToDCC) {
                url = (new URL(url)).pathname;
                ;
            }
            else {
                if (!url.startsWith(this._pathMapToDCC))
                    return false;
                url = url.substring(this._pathMapToDCC.length);
            }
        }
        let objPath = await gitfs.pathToObjPath(url);
        if (!objPath)
            return false;
        return await this._frw.isFileExist(objPath);
    }
    /**
     *  读取缓存中的一个文件，url是相对地址或者绝对地址
     * @param url 用户认识的地址。如果是绝对地址，并且设置是映射地址，则计算一个相对地址。如果是相对地址，则直接使用
     * @returns
     *  如果没有设置映射到dcc的地址，则直接取此文件的相对路径，如果设置了映射地址，则截掉映射地址
     */
    async readFile(url) {
        let gitfs = this._gitfs;
        if (!gitfs)
            throw 'dcc没有正确init';
        if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('file:')) { //绝对路径
            if (!this._pathMapToDCC) {
                url = (new URL(url)).pathname;
                ;
            }
            else {
                if (!url.startsWith(this._pathMapToDCC))
                    return null;
                url = url.substring(this._pathMapToDCC.length);
            }
        }
        let buff = await gitfs.loadFileByPath(url, 'buffer');
        return buff;
    }
    _getRUrl(url) {
        let gitfs = this._gitfs;
        if (!gitfs)
            throw 'dcc没有正确init';
        if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('file:')) { //绝对路径
            if (!this._pathMapToDCC) {
                url = (new URL(url)).pathname;
                ;
            }
            else {
                if (!url.startsWith(this._pathMapToDCC))
                    return null;
                url = url.substring(this._pathMapToDCC.length);
            }
        }
        return url;
    }
    //获取某个对象（用hash表示的文件或者目录）在缓存中的地址
    async getObjectUrl(objid) {
        return this._gitfs.getObjUrl(objid);
    }
    /**
     * 把一个原始地址转换成cache服务器对象地址
     * 如果库中没有，则直接返回原来的url
     * @param url 原始资源地址
     * @returns
     */
    async transUrl(url) {
        let oriUrl = url;
        let gitfs = this._gitfs;
        if (!gitfs)
            return oriUrl;
        if (!this._pathMapToDCC) {
            url = (new URL(url)).pathname;
            ;
        }
        else {
            if (!url.startsWith(this._pathMapToDCC))
                return url;
            url = url.substring(this._pathMapToDCC.length);
        }
        let objpath = await gitfs.pathToObjPath(url);
        if (!objpath) {
            return oriUrl;
        }
        return this._frw.repoPath + objpath;
    }
    /**
     * 与DCC服务器同步本版本的所有文件。
     * 可以用这个函数来实现集中下载。
     *
     * @param progress 进度回调，从0到1
     * 注意：在开始同步之前可能会有一定的延迟，这期间会进行目录节点的下载。不过目前的实现这一步在init的时候就完成了
     *
     */
    async updateAll(progress) {
        let gitfs = this._gitfs;
        //为了能统计，需要先下载所有的目录节点，这段时间是无法统计的
        //先统计本地已经存在的
        let locals = new Set();
        await this._frw.enumCachedObjects((objid) => {
            locals.add(objid);
        });
        //遍历file
        let needUpdateFiles = [];
        //统计所有树上的
        await gitfs.visitAll(gitfs.treeRoot, async (tree, entry) => {
            //下载
            if (!locals.has(tree.sha))
                //理论上不应该走到这里，应为visitAll的时候都下载了
                await this._frw.read(gitfs.getObjUrl(tree.sha), 'buffer', false, null);
        }, async (blob) => {
            let id = (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_8__.toHex)(blob.oid);
            if (!locals.has(id)) {
                needUpdateFiles.push(id);
            }
        }, null);
        //
        this.log(`updateAll need update ${needUpdateFiles.length}`);
        //needUpdateFiles.forEach(id=>{console.log(id);});
        progress && progress(0);
        for (let i = 0, n = needUpdateFiles.length; i < n; i++) {
            let id = needUpdateFiles[i];
            //TODO 并发以提高效率
            await this._frw.read(gitfs.getObjUrl(id), 'buffer', false, null);
            this.log(`updateAll: update obj:${id}`);
            progress && progress(i / n);
        }
        progress && progress(1);
    }
    /**
     * 根据指定的zip文件更新本地缓存。
     * 这个zip文件可以通过DCC插件的补丁生成工具来生成。
     *
     * 这个会修改本地保存的root
     * @param zipfile 打补丁的zip文件，注意这里必须是本地目录，所以需要自己实现下载zip到本地之后才能调用这个函数。
     * @param progress 进度提示，暂时没有实现。
     */
    async updateByZip(zipfile, zipClass, progress) {
        let zip = new zipClass();
        zip.open(zipfile);
        //TODO 数据太多的时候要控制并发
        zip.forEach(async (entry) => {
            if (entry.entryName == 'head.json') {
            }
            else {
                await this.addObject(entry.entryName, entry.getData());
            }
        });
        //写head。zip中可能没有head.json，例如只是某个目录，这时候就不要更新root了
        try {
            let buf = zip.getEntry('head.json');
            await this._frw.write('head.json', buf.getData().buffer, true);
            //更新自己的root
            let localHeadStr = await this._frw.read('head.json', 'utf8', true, null);
            let localHead = JSON.parse(localHeadStr);
            await this._gitfs.setRoot(localHead.root);
        }
        catch (e) {
        }
    }
    //利用一个pack文件更新，这个pack包含idx,文件内容。
    async updateByPack(pack, unpacker) {
        let indices;
        let packBuff;
        let content;
        if (typeof pack == 'string') {
            let res = await this._frw.fetch(pack);
            packBuff = await res.arrayBuffer();
        }
        else if (pack instanceof ArrayBuffer) {
            packBuff = pack;
        }
        else {
            throw "bad param";
        }
        let packR = unpacker ? new unpacker() : new _DCCPackRW__WEBPACK_IMPORTED_MODULE_9__.DCCPackR();
        const [ind, cont, error] = packR.split(packBuff);
        indices = ind;
        content = cont;
        for (let nodeinfo of indices) {
            let nodebuff = content.slice(nodeinfo.start, nodeinfo.start + nodeinfo.length);
            await this._gitfs.saveObject(nodeinfo.id, nodebuff);
        }
    }
    /**
     * 添加对象，可以用来做zip更新
     * @param objid
     * @param content
     * @returns
     */
    async addObject(objid, content) {
        return this._gitfs.saveObject(objid, content);
    }
    /**
     * 清理缓存。
     * 根据根文件遍历所有本版本依赖的文件，删除不属于本版本的缓存文件
     */
    async clean() {
        let gitfs = this._gitfs;
        //遍历file
        let files = new Set();
        //统计所有树上的
        await gitfs.visitAll(gitfs.treeRoot, async (tree, entry) => {
            files.add(tree.sha);
        }, async (blob) => {
            files.add((0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_8__.toHex)(blob.oid));
        }, null, false);
        //统计所有的本地保存的
        //不在树上的全删掉
        let removed = [];
        let dbgRemovdeFile = [];
        await this._frw.enumCachedObjects((objid) => {
            if (!files.has(objid)) {
                removed.push(objid);
            }
        });
        //
        for (let id of removed) {
            if (_Config__WEBPACK_IMPORTED_MODULE_1__.DCCConfig.log) {
                console.log('清理节点:', id);
            }
            gitfs.removeObject(id);
        }
        //由于下载包在清理以后无法维护，简单的就是全部删除
        this._loadedPacks = {};
        await this._frw.write('downloaded_packs.json', '{}', true);
    }
    async visitAll(treecb, blobcb) {
        await this._gitfs.visitAll(this._gitfs.treeRoot, treecb, blobcb, null);
    }
    //插入到laya引擎的下载流程，实现下载的接管
    injectToLaya() {
        if (!this._downloader) {
            this._downloader = new _DCCDownloader__WEBPACK_IMPORTED_MODULE_4__.DCCDownloader(this, this._logger);
        }
        this._downloader.injectToLaya();
    }
    //取消对laya下载引擎的插入
    removeFromLaya() {
        if (!this._downloader)
            return;
        this._downloader.removeFromLaya();
    }
    /**
     * 插入到runtime中.
     * 这个是替换 window.downloadfile 函数，因为加载引擎是通过项目的 index.js中的loadLib函数实现的，
     * 而loadLib函数就是调用的 window.downloadfile
     * 所以为了有效，这个最好是写在 apploader.js最后加载index.js的地方，或者在 项目index.js的最开始的地方
     */
    injectToNativeFileReader() {
        if (!this._downloader) {
            this._downloader = new _DCCDownloader__WEBPACK_IMPORTED_MODULE_4__.DCCDownloader(this, this._logger);
        }
        this._downloader.injectToNativeFileReader();
    }
    removeFromNative() {
        if (!this._downloader)
            return;
        this._downloader.removeFromNative();
    }
    /**
     *
     * @param url
     * @param callToC
     * @param data 目前是c++那边传过来的一个数据，必须在调用callToC的时候作为第一个参数传回去
     */
    _jsdown(url, cbObj) {
        if (this.onlyTransUrl) {
            this.transUrl(url).then((url) => {
                //@ts-ignore
                conch.downloadNoCache(url, () => { }, (buff, localip, svip) => {
                    //下载完成
                    cbObj.onDownloadEnd(buff, '');
                }, () => { });
            });
        }
        else {
            (async () => {
                //得到相对路径
                let rUrl = this._getRUrl(url);
                if (rUrl) {
                    //如果是归dcc管理
                    let buff = await this.readFile(url);
                    if (buff) {
                        let svObjUrl = await this.transUrl(url);
                        let rpath = svObjUrl.substring(this._dccServer.length);
                        let localPath = conch.getCachePath() + '/' + rpath;
                        cbObj.onDownloadEnd(buff, localPath);
                        return;
                    }
                }
                //失败了,没有转换成功，或者dcc中没有这个文件，直接下载
                this.log("直接下载:" + url);
                //@ts-ignore
                conch.downloadNoCache(url, () => { }, (buff, localip, svip) => {
                    //下载完成
                    cbObj.onDownloadEnd(buff, '');
                }, () => { });
            })();
        }
    }
    injectToNative3() {
        //@ts-ignore
        conch.setDownloader(this._jsdown.bind(this));
    }
}
LayaDCCClient.VERSION = '1.0.0';
LayaDCCClient.enableMergeDir = true;
function injectToLayaByInitCallback() {
    Laya.addInitCallback && Laya.addInitCallback(async () => {
        let PlayerConfig = Laya.PlayerConfig;
        //window.dcc 如果是native则有全局的dcc对象
        if (!window.dcc && PlayerConfig && PlayerConfig.dcc && PlayerConfig.dcc.enable) {
            let dccConfig = PlayerConfig.dcc;
            let dcc = new LayaDCCClient(Laya.URL.formatURL(dccConfig.DCCServer || ".dcc"));
            dcc.pathMapToDCC = Laya.URL.formatURL('');
            let initok = await dcc.init(Laya.URL.formatURL(dccConfig.head || '.dcc/head.json'), null);
            if (initok) {
                dcc.injectToLaya();
            }
        }
    });
}
//如果是ide构建的项目，可以直接根据playerconfig来初始化dcc
if (globalThis.Laya) {
    injectToLayaByInitCallback();
}


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AppResReader_Native: () => (/* binding */ AppResReader_Native),
/* harmony export */   FileIO_AppRes: () => (/* binding */ FileIO_AppRes)
/* harmony export */ });
class AppResReader_Native {
    //注意这里的file是相对于资源目录的，windows下是debug目录，android下是？？？
    async getRes(file, encode) {
        return conch.readFileFromAsset(file, encode);
    }
}
//这个封装是为了方便，给ObjPack使用
class FileIO_AppRes {
    constructor(cachePath) {
        this.repoPath = cachePath;
    }
    init(repoPath, cachePath) {
        throw new Error("Method not implemented.");
    }
    fetch(url) {
        throw new Error("Method not implemented.");
    }
    async read(url, encode, onlylocal) {
        let path = this.repoPath + '/' + url;
        return conch.readFileFromAsset(path, encode);
    }
    write(url, content, overwrite) {
        throw new Error("Method not implemented.");
    }
    isFileExist(url) {
        throw new Error("Method not implemented.");
    }
    unzip(buff) {
        throw new Error("Method not implemented.");
    }
    zip(buff) {
        throw new Error("Method not implemented.");
    }
    textencode(text) {
        throw new Error("Method not implemented.");
    }
    textdecode(buffer, off) {
        throw new Error("Method not implemented.");
    }
    rm(url) {
        throw new Error("Method not implemented.");
    }
    enumCachedObjects(callback) {
        throw new Error("Method not implemented.");
    }
    mv(src, dst) {
        throw new Error("Method not implemented.");
    }
}


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCConfig: () => (/* binding */ DCCConfig)
/* harmony export */ });
class DCCConfig {
}
DCCConfig.log = false;


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCClientFS_native: () => (/* binding */ DCCClientFS_native)
/* harmony export */ });
/* harmony import */ var _Config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);
/* harmony import */ var _Env__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(12);
/**
 * web端的dcc文件接口
 *
 */


function myFetch(url, encode = 'buffer') {
    return new Promise((resolve, reject) => {
        const xhr = new _XMLHttpRequest();
        if (encode == 'utf8')
            xhr.responseTypeCode = 1;
        else
            xhr.responseTypeCode = 5;
        // 设置请求的方法和URL
        xhr._open('GET', url, true);
        xhr.setPostCB((result) => {
            let cc = xhr; //保持一下xhr，避免被释放，否则回来之后xhr已经被释放了
            resolve(result);
        }, (e1) => {
            resolve(null);
        });
        xhr.getData(url);
    });
}
//访问服务器文件的接口。只要读就行了
class DCCClientFS_native {
    getAbsPath(path) {
        let cachePath = conch.getCachePath();
        if (path.includes(':/') || path.includes(':\\')) {
            return path;
        }
        else {
            if (!cachePath.endsWith('/')) {
                cachePath += '/';
            }
            return cachePath + path;
        }
    }
    //file是相对cache的目录
    makeDirsInCachePath(file) {
        file = file.replace(/\\/g, '/');
        //file = file.replaceAll('\\','/'); 当前native不支持replaceAll
        let paths = file.split('/');
        paths.pop(); //去掉文件
        if (paths.length <= 0)
            return;
        let cpath = this.getAbsPath('');
        for (let p of paths) {
            cpath = cpath + '/' + p;
            if (!fs_exists(cpath)) {
                fs_mkdir(cpath);
            }
        }
    }
    async init(repoPath, cachePath) {
        if (repoPath && !repoPath.endsWith('/'))
            repoPath += '/';
        this.repoPath = repoPath;
        //创建基本目录
        let objpath = this.getAbsPath('objects');
        if (!fs_exists(objpath)) {
            fs_mkdir(objpath);
        }
        _Config__WEBPACK_IMPORTED_MODULE_0__.DCCConfig.log && console.log('DCCClientFS: path=' + conch.getCachePath());
    }
    //远程下载
    async fetch(url) {
        return new Promise((res, rej) => {
            //@ts-ignore
            conch.downloadNoCache(url, () => { }, (buff, localip, svip) => {
                //下载完成
                res({
                    ok: !!buff,
                    arrayBuffer: async () => { return buff; },
                    text: async () => { return _Env__WEBPACK_IMPORTED_MODULE_1__.Env.dcodeUtf8(buff); }
                });
            }, () => { });
        });
    }
    async read(url, encode, onlylocal, contentChecker) {
        //先从本地读取，如果没有就从远程下载
        let ret;
        try {
            ret = fs_readFileSync(this.getAbsPath(url));
            if (ret && encode == 'utf8') {
                ret = _Env__WEBPACK_IMPORTED_MODULE_1__.Env.dcodeUtf8(ret);
            }
        }
        catch (e) {
        }
        if (!ret) {
            if (onlylocal)
                return null;
            if (this.repoPath) {
                let resp = await this.fetch(this.repoPath + url);
                if (encode == 'utf8') {
                    ret = await resp.text();
                    await this.write(url, ret);
                }
                else {
                    ret = await resp.arrayBuffer();
                    let contOK = (!contentChecker) || (await contentChecker(ret));
                    if (contOK) {
                        await this.write(url, ret);
                    }
                }
            }
        }
        return ret;
    }
    //write只能往本地写
    async write(url, content, overwrite) {
        //确保路径都存在
        this.makeDirsInCachePath(url);
        url = this.getAbsPath(url);
        if (!overwrite && fs_exists(url)) {
            return;
        }
        fs_writeFileSync(url, content);
    }
    //只能判断本地的
    async isFileExist(url) {
        return Promise.resolve().then(() => { return fs_exists(url); });
    }
    async mv(src, dst) {
        throw 'native no mv';
    }
    unzip(buff) {
        throw new Error("Method not implemented.");
    }
    zip(buff) {
        throw new Error("Method not implemented.");
    }
    textencode(text) {
        return new TextEncoder().encode(text);
    }
    textdecode(buffer, off) {
        return _Env__WEBPACK_IMPORTED_MODULE_1__.Env.dcodeUtf8(buffer);
    }
    async rm(url) {
        url = this.getAbsPath(url);
        fs_rm(url);
    }
    //如果希望遍历服务器端的怎么办
    async enumCachedObjects(callback) {
        let objects = this.getAbsPath('objects');
        let idPres = fs_readdirSync(objects);
        for (let pre of idPres) {
            let cpath = objects + '/' + pre;
            let objs = fs_readdirSync(cpath);
            for (let o of objs) {
                callback(pre + o);
            }
        }
    }
}


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCClientFS_web: () => (/* binding */ DCCClientFS_web)
/* harmony export */ });
/* harmony import */ var _IndexDBFileRW__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(23);
/**
 * web端的dcc文件接口
 *
 */

//访问服务器文件的接口。只要读就行了
class DCCClientFS_web {
    async init(repoPath, cachePath) {
        if (repoPath && !repoPath.endsWith('/'))
            repoPath += '/';
        this.repoPath = repoPath;
        this.dbfile = new _IndexDBFileRW__WEBPACK_IMPORTED_MODULE_0__.IndexDBFileRW();
        await this.dbfile.init('', '');
    }
    async xhrWithProgressTimeout(url, options = {}, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            let timeoutId;
            function resetTimeout() {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    xhr.abort();
                    reject(new Error('Timeout: No data received for an extended period'));
                }, timeout);
            }
            xhr.onprogress = (event) => {
                if (event.loaded > 0) {
                    resetTimeout();
                }
            };
            xhr.onload = () => {
                clearTimeout(timeoutId);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                }
                else {
                    reject(new Error(`HTTP error! status: ${xhr.status}`));
                }
            };
            xhr.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('Network error'));
            };
            xhr.open(options.method || 'GET', url);
            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }
            // 设置初始超时
            resetTimeout();
            xhr.send(options.body);
        });
    }
    async fetch(url, timeout = 0) {
        //return this.xhrWithProgressTimeout(url,{},timeout)
        return await fetch(url);
    }
    async read(url, encode, onlylocal, contentChecker) {
        //先从本地读取，如果没有就从远程下载
        let ret;
        try {
            ret = await this.dbfile.read(url, encode, true);
            if (!ret) {
                console.error("从indexdb读取到了null", url);
            }
        }
        catch (e) {
            if (onlylocal)
                return null;
            if (this.repoPath) {
                let resp = await fetch(this.repoPath + url);
                if (!resp.ok) {
                    console.error('下载错误：', this.repoPath + url, resp.status, resp.statusText);
                }
                if (encode == 'utf8') {
                    ret = await resp.text();
                    try {
                        await this.dbfile.write(url, ret);
                    }
                    catch (e) {
                        console.log('write db error:', url);
                        return ret;
                    }
                }
                else {
                    ret = await resp.arrayBuffer();
                    try {
                        let contOK = (!contentChecker) || (await contentChecker(ret));
                        if (contOK) {
                            await this.dbfile.write(url, ret);
                        }
                    }
                    catch (e) {
                        console.error('write db error:', url);
                        return ret;
                    }
                }
            }
        }
        return ret;
    }
    //write只能往本地写
    async write(url, content, overwrite) {
        if (!overwrite && await this.dbfile.isFileExist(url)) {
            return;
        }
        this.dbfile.write(url, content);
    }
    //只能判断本地的
    async isFileExist(url) {
        return await this.dbfile.isFileExist(url);
    }
    async mv(src, dst) {
        await this.dbfile.mv(src, dst);
    }
    unzip(buff) {
        throw new Error("Method not implemented.");
    }
    zip(buff) {
        throw new Error("Method not implemented.");
    }
    textencode(text) {
        return new TextEncoder().encode(text);
    }
    textdecode(buffer, off) {
        return new TextDecoder().decode(buffer);
    }
    async rm(url) {
        await this.dbfile.rm(url);
    }
    //如果希望遍历服务器端的怎么办
    async enumCachedObjects(callback) {
        await this.dbfile.enumCachedObjects(callback);
    }
}


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IndexDBFileRW: () => (/* binding */ IndexDBFileRW)
/* harmony export */ });
class IndexDBFileRW {
    constructor() {
        this.repoPath = '';
        this.dbName = 'filesDB';
        this.storeName = 'files';
        this.dbVersion = 1;
        this.db = null;
        // 初始化数据库
        //this.initDB();
    }
    fetch(url) {
        throw new Error("Method not implemented.");
    }
    async init(repoPath, cachePath) {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.error("Your browser doesn't support IndexedDB");
                reject("Your browser doesn't support IndexedDB"); // 使用 reject 报告错误
                return;
            }
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = (event) => {
                console.error('Database error: ', event.target.error);
                reject(event.target.error); // 使用 reject 报告错误
            };
            request.onsuccess = (event) => {
                this.db = event.target.result; // 成功设置数据库实例
                resolve(); // 成功时调用 resolve
            };
            // 创建对象存储只发生在首次或版本有变化时
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore(this.storeName, { keyPath: 'url' });
                // 注意：在 onupgradeneeded 中不需要调用 resolve 或 reject
                // 因为它通常会在 onsuccess 或 onerror 之前触发
            };
        });
    }
    async read(url, encode, onlylocal) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction([this.storeName]);
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(url);
            request.onerror = function (event) {
                reject('Unable to retrieve data');
            };
            request.onsuccess = function (event) {
                if (request.result && request.result.content) {
                    const result = request.result.content;
                    if (typeof result == 'string') {
                        if (encode === 'utf8')
                            resolve(result);
                        else {
                            resolve(new TextEncoder().encode(result));
                        }
                    }
                    else {
                        //保存的是buffer
                        if (encode == 'buffer')
                            resolve(result);
                        else {
                            resolve(new TextDecoder().decode(result));
                        }
                    }
                }
                else {
                    reject('URL not found');
                }
            };
        });
    }
    async write(url, content, overwrite = true) {
        return new Promise(async (resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            if (!overwrite) {
                const request = objectStore.get(url);
                request.onsuccess = () => {
                    if (request.result) {
                        reject('File already exists and overwrite is false');
                        return;
                    }
                    else {
                        this.storeData(objectStore, url, content, resolve, reject);
                    }
                };
            }
            else {
                this.storeData(objectStore, url, content, resolve, reject);
            }
        });
    }
    storeData(store, url, content, resolve, reject) {
        let data = { url: url, content: content };
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Could not write to store');
    }
    async isFileExist(url) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction([this.storeName]);
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(url);
            request.onsuccess = () => {
                resolve(!!request.result);
            };
            request.onerror = () => {
                reject('Could not check file existence');
            };
        });
    }
    // 空实现，示例中跳过加密解密及编码解码部分
    unzip(buff) {
        return buff;
    }
    zip(buff) {
        return buff;
    }
    textencode(text) {
        return new TextEncoder().encode(text);
    }
    textdecode(buffer, off = 0) {
        return new TextDecoder().decode(buffer);
    }
    async mv(src, dst) {
        try {
            const data = await this.read(src, 'buffer', true);
            await this.write(dst, data);
            await this.delete(src);
        }
        catch (error) {
            throw new Error('Move operation failed');
        }
    }
    async delete(url) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const request = this.db.transaction([this.storeName], 'readwrite')
                .objectStore(this.storeName)
                .delete(url);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Delete operation failed: ' + event);
        });
    }
    async rm(url) {
        await this.delete(url);
    }
    async enumCachedObjects(callback) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            // 创建一个用于读写的事务来访问文件存储
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            // 打开具有游标的请求来遍历所有记录
            const request = objectStore.openCursor();
            request.onerror = function (event) {
                console.error('Error reading data.');
                reject('Failed to open cursor on object store');
            };
            request.onsuccess = async (event) => {
                const cursor = request.result;
                if (cursor) {
                    let key = cursor.key;
                    if (key.startsWith('objects/')) {
                        key = key.substring(8);
                        key = key.replace(/\//g, '');
                        callback(key);
                    }
                    cursor.continue();
                }
                else {
                    // 如果没有更多数据（即 cursor 为 null），完成遍历
                    resolve();
                }
            };
        });
    }
    async deleteAllFiles() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            // 创建一个用于读写的事务来访问文件存储
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            // 打开具有游标的请求来遍历所有记录
            const request = objectStore.openCursor();
            request.onerror = function (event) {
                console.error('Error reading data.');
                reject('Failed to open cursor on object store');
            };
            request.onsuccess = async (event) => {
                const cursor = request.result;
                if (cursor) {
                    // 如果有数据，则删除当前对象，并继续
                    objectStore.delete(cursor.key).onsuccess = function () {
                        console.log(`Deleted file with url: ${cursor.key}`);
                    };
                    cursor.continue();
                }
                else {
                    // 如果没有更多数据（即 cursor 为 null），完成遍历
                    console.log('No more entries!');
                    resolve();
                }
            };
        });
    }
}


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCDownloader: () => (/* binding */ DCCDownloader)
/* harmony export */ });
/* harmony import */ var _Env__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12);

class DCCDownloader {
    constructor(dcc, logger = null) {
        this.dcc = dcc;
        this._logger = logger;
    }
    //插入到laya引擎的下载流程，实现下载的接管
    injectToLaya() {
        if (this.myDownloader && Laya.Loader.downloader == this.myDownloader)
            return;
        this.originDownloader = Laya.Loader.downloader;
        let downloader = this.myDownloader = new Laya.Downloader();
        downloader.audio = this.audio.bind(this);
        downloader.image = this.image.bind(this);
        downloader.common = this.common.bind(this);
        downloader.imageWithBlob = this.imageWithBlob.bind(this);
        downloader.imageWithWorker = this.imageWithWorker.bind(this);
        Laya.Loader.downloader = downloader;
    }
    //取消对laya下载引擎的插入
    removeFromLaya() {
        //这里有问题，如果已经形成链了，则不能直接这么做
        //形成链就是有多个dccclient，每个负责一部分映射
        if (Laya.Loader.downloader == this.myDownloader) {
            Laya.Loader.downloader = this.originDownloader;
        }
    }
    /**
     * 插入到runtime中.
     * 这个是替换 window.downloadfile 函数，因为加载引擎是通过项目的 index.js中的loadLib函数实现的，
     * 而loadLib函数就是调用的 window.downloadfile
     * 所以为了有效，这个最好是写在 apploader.js最后加载index.js的地方，或者在 项目index.js的最开始的地方
     */
    injectToNativeFileReader() {
        let win = window;
        if (win.downloadfile == this.myNativeDownloadFunc)
            return;
        this.originNativeDownloader = win.downloadfile;
        this.myNativeDownloadFunc = (url, force, onok, onerr) => {
            let q = url.indexOf('?');
            if (q > 0) {
                url = url.substring(0, q);
            }
            this.dcc.readFile(url).then(v => {
                onok(_Env__WEBPACK_IMPORTED_MODULE_0__.Env.dcodeUtf8(v));
            }, reason => {
                onerr();
            });
        };
        win.downloadfile = this.myNativeDownloadFunc;
    }
    removeFromNative() {
        let win = window;
        if (win.downloadfile == this.myNativeDownloadFunc) {
            win.downloadfile = this.originNativeDownloader;
        }
    }
    imageWithBlob(owner, blob, originalUrl, onProgress, onComplete) {
        this._logger && this._logger.checkLog(`download:imageWithBlob:${originalUrl}`);
        this.originDownloader.imageWithBlob.call(this.originDownloader, owner, blob, originalUrl, onProgress, onComplete);
    }
    imageWithWorker(owner, url, originalUrl, onProgress, onComplete) {
        this._logger && this._logger.checkLog(`download:imageWithWorker:${originalUrl}`);
        this.originDownloader.imageWithWorker.call(this.originDownloader, owner, url, originalUrl, onProgress, onComplete);
    }
    audio(owner, url, originalUrl, onProgress, onComplete) {
        this._logger && this._logger.checkLog(`download:audio:${originalUrl}`);
        this.originDownloader.audio.call(this.originDownloader, owner, url, originalUrl, onProgress, onComplete);
    }
    common(owner, url, originalUrl, contentType, onProgress, onComplete) {
        this._logger && this._logger.checkLog(`download:common:${originalUrl}`);
        let promise;
        if (this.dcc.onlyTransUrl) {
            promise = this.dcc.transUrl(url);
            this._logger && this._logger.checkLog(`download:common:onlyTransUrl:${originalUrl}`);
        }
        else {
            promise = (async () => {
                let buff = await this.dcc.readFile(url);
                if (!buff) {
                    this._logger && this._logger.checkLog(`download:common:readFile(${url}) error`);
                    return url;
                }
                else {
                    this._logger && this._logger.checkLog(`download:common:readFile(${url}) OK`);
                }
                switch (contentType) {
                    case 'text':
                        onComplete(_Env__WEBPACK_IMPORTED_MODULE_0__.Env.dcodeUtf8(buff));
                        return null;
                    case 'json':
                        onComplete(JSON.parse(_Env__WEBPACK_IMPORTED_MODULE_0__.Env.dcodeUtf8(buff)));
                        return null;
                    case 'arraybuffer':
                        onComplete(buff);
                        return null;
                    default:
                        var blob = new Blob([buff], { type: 'application/octet-binary' });
                        return window.URL.createObjectURL(blob);
                }
            })();
        }
        promise.then(transed => {
            if (transed) {
                this.originDownloader.common.call(this.originDownloader, owner, transed, originalUrl, contentType, onProgress, onComplete);
                this._logger && this._logger.checkLog(`download:common:originCommon(${originalUrl})`);
            }
        });
    }
    image(owner, url, originalUrl, onProgress, onComplete) {
        let promise;
        if (this.dcc.onlyTransUrl) {
            promise = this.dcc.transUrl(url);
        }
        else {
            promise = (async () => {
                let buff = await this.dcc.readFile(url);
                if (!buff)
                    return url;
                var blob = new Blob([buff], { type: 'application/octet-binary' });
                return window.URL.createObjectURL(blob);
            })();
        }
        promise.then(transed => {
            this.originDownloader.image.call(this.originDownloader, owner, transed, originalUrl, onProgress, onComplete);
        });
    }
}


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ObjPack_AppRes: () => (/* binding */ ObjPack_AppRes)
/* harmony export */ });
/* harmony import */ var _AppResReader_Native__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(19);
/* harmony import */ var _Config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20);
/* harmony import */ var _DCCObjectWrapper__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
/* harmony import */ var _ObjPack__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(15);




/**
 * 保存在apk资源中的对象包
 * 对android来说是相对于assets目录
 * 对ios来说是相对于resource目录
 */
class ObjPack_AppRes {
    //path是相对于资源根目录的路径
    constructor(path = 'cache') {
        this.resReader = new _AppResReader_Native__WEBPACK_IMPORTED_MODULE_0__.AppResReader_Native();
        this.treePacks = [];
        this.blobPacks = [];
        if (path.startsWith('/'))
            path = path.substring(1);
        if (path.endsWith('/'))
            path = path.substring(0, path.length - 1);
        this.cachePath = path;
    }
    async init() {
        //读取head，看有没有打包的文件
        try {
            let frw = new _AppResReader_Native__WEBPACK_IMPORTED_MODULE_0__.FileIO_AppRes(this.cachePath);
            let head = await frw.read('head.json', 'utf8', true);
            if (!head)
                return false;
            let headobj = JSON.parse(head);
            if (headobj.treePackages) {
                for (let tpack of headobj.treePackages) {
                    let pack = new _ObjPack__WEBPACK_IMPORTED_MODULE_3__.ObjPack('tree', frw, tpack);
                    await pack.init();
                    this.treePacks.push(pack);
                }
            }
            if (headobj.objPackages) {
                for (let bpack of headobj.objPackages) {
                    let pack = new _ObjPack__WEBPACK_IMPORTED_MODULE_3__.ObjPack('blob', frw, bpack);
                    await pack.init();
                    this.blobPacks.push(pack);
                }
            }
        }
        catch (e) {
            return false;
        }
        return true;
    }
    async has(oid) {
        let path = this.cachePath + '/objects/' + oid.substring(0, 2) + '/' + oid.substring(2);
        //先判断包中有没有
        for (let pack of this.treePacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                return true;
            }
        }
        for (let pack of this.blobPacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                return true;
            }
        }
        let buff = await this.resReader.getRes(path, 'buffer');
        return !!buff;
    }
    async get(oid) {
        let buff = await this._get(oid);
        let head = new _DCCObjectWrapper__WEBPACK_IMPORTED_MODULE_2__.DCCObjectWrapper();
        let decryptBuff = _DCCObjectWrapper__WEBPACK_IMPORTED_MODULE_2__.DCCObjectWrapper.unwrapObject(buff, head);
        if (!decryptBuff) {
            return buff;
        }
        return decryptBuff;
    }
    async _get(oid) {
        let path = this.cachePath + '/objects/' + oid.substring(0, 2) + '/' + oid.substring(2);
        //先判断包中有没有
        let buff;
        for (let pack of this.treePacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                buff = await pack.get(oid);
            }
            if (buff) {
                DCCLog(`Get Object from TreePack:${oid}`);
                return buff;
            }
        }
        for (let pack of this.blobPacks) {
            if (!pack)
                continue;
            if (await pack.has(oid)) {
                buff = await pack.get(oid);
            }
            if (buff) {
                DCCLog(`Get Object from TreePack:${oid}`);
                return buff;
            }
        }
        return await this.resReader.getRes(path, 'buffer');
    }
}
function DCCLog(msg) {
    if (_Config__WEBPACK_IMPORTED_MODULE_1__.DCCConfig.log) {
        console.log(msg);
    }
}


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCPackR: () => (/* binding */ DCCPackR),
/* harmony export */   DCCPackW: () => (/* binding */ DCCPackW)
/* harmony export */ });
/* harmony import */ var _gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

class DCCPackR {
    split(buff) {
        let buffu32 = new Uint32Array(buff, 0, 3); //必须指定3个，因为buff可能不是4的倍数
        let ver = buffu32[0];
        let datalen = buffu32[1];
        let error = 0;
        if (buff.byteLength != datalen + 4) {
            error = 1;
            return [null, null, error];
        }
        let indexLen = buffu32[2];
        if (indexLen % 28 != 0)
            throw "bad buffer";
        let indexNum = indexLen / 28;
        let indices = [];
        let idxPos = 12;
        for (let i = 0; i < indexNum; i++) {
            let idstr = (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_0__.toHex)(new Uint8Array(buff, idxPos, 20));
            idxPos += 20;
            let start = (new Uint32Array(buff, idxPos, 4))[0] + indexLen + 12;
            idxPos += 4;
            let length = (new Uint32Array(buff, idxPos, 4))[0];
            idxPos += 4;
            indices.push({ id: idstr, start, length });
        }
        return [indices, buff, error];
    }
}
class DCCPackW {
    constructor() {
        //没有提供indexObj的清理，不允许重复使用
        this.indexObj = {};
    }
    addObj(objid, buf) {
        this.indexObj[objid] = buf.slice(0);
    }
    //从节点考虑的话，还是不要有状态了，不要用this
    pack(indexObj) {
        if (!indexObj)
            indexObj = this.indexObj;
        let indexes = [];
        let buffLen = 0;
        for (let obj in indexObj) {
            let buff = indexObj[obj];
            if (buff)
                buffLen += buff.byteLength;
        }
        let packbuff = new Uint8Array(buffLen);
        let curpos = 0;
        for (let obj in indexObj) {
            let buff = indexObj[obj];
            if (!buff)
                continue;
            packbuff.set(new Uint8Array(buff), curpos);
            indexes.push({ id: obj, start: curpos, length: buff.byteLength });
            curpos += buff.byteLength;
        }
        return [indexes, packbuff.buffer];
    }
    mergeIndexAndContent(index, content) {
        let indexBuff;
        if (index instanceof ArrayBuffer) {
            indexBuff = index;
        }
        else {
            let itemLen = 20 + 4 + 4;
            let indexBuffsz = index.length * itemLen; //id,start,length
            let indexbuf = new Uint8Array(indexBuffsz);
            let int32buf = new Uint32Array(indexbuf.buffer);
            for (let i = 0, n = index.length; i < n; i++) {
                const { id, start, length } = index[i];
                indexbuf.set((0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_0__.hashToArray)(id), i * itemLen);
                int32buf[i * itemLen / 4 + 5] = start;
                int32buf[i * itemLen / 4 + 6] = length;
            }
            indexBuff = indexbuf.buffer;
        }
        let ver = 1;
        let indexlength = indexBuff.byteLength;
        let mergeBuff = new Uint8Array(12 + indexBuff.byteLength + content.byteLength);
        let buffW = new DataView(mergeBuff.buffer);
        buffW.setUint32(0, ver, true);
        buffW.setUint32(4, mergeBuff.byteLength - 4, true); //记录长度以便检查下载是否正确
        buffW.setUint32(8, indexlength, true); //
        mergeBuff.set(new Uint8Array(indexBuff), 12);
        mergeBuff.set(new Uint8Array(content), indexBuff.byteLength + 12);
        return mergeBuff.buffer;
    }
}


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DCCClientFS_NodeJS: () => (/* binding */ DCCClientFS_NodeJS)
/* harmony export */ });
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var util__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(util__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _Env__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);




/**
 * 客户端使用的基于nodejs的文件接口
 * 主要是封装了一个缓存目录
 *
 */
class DCCClientFS_NodeJS {
    constructor() {
        this.cachePath = 'd:/temp/dcctest/cache/';
    }
    async init(repoPath, cachePath) {
        this.repoPath = repoPath;
        if (cachePath)
            this.cachePath = cachePath;
        await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.mkdir)(path__WEBPACK_IMPORTED_MODULE_2__.join(this.cachePath, 'objects'), { recursive: true });
    }
    async read(url, encode, onlylocal, contentChecker) {
        //先从本地读取，如果没有就从远程下载
        if (path__WEBPACK_IMPORTED_MODULE_2__.isAbsolute(url)) {
            throw 'DCCClientFS_NodeJS 只支持读取相对目录';
        }
        let ret;
        let absLocal = path__WEBPACK_IMPORTED_MODULE_2__.join(this.cachePath, url);
        try {
            ret = await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.readFile)(absLocal);
            if (encode == 'utf8') {
                ret = _Env__WEBPACK_IMPORTED_MODULE_3__.Env.dcodeUtf8(ret);
            }
        }
        catch (e) {
        }
        if (!ret) {
            if (onlylocal)
                return null;
            if (this.repoPath) {
                let resp = await this.fetch(this.repoPath + url);
                if (encode == 'utf8') {
                    ret = await resp.text();
                    await this.write(url, ret);
                }
                else {
                    ret = await resp.arrayBuffer();
                    let contOK = (!contentChecker) || (await contentChecker(ret));
                    if (contOK) {
                        await this.write(url, ret);
                    }
                }
            }
        }
        return ret;
    }
    async fetch(url) {
        //测试用：只是本地
        if (url.startsWith('file:///')) {
            url = url.replace('file:///', '');
        }
        if (path__WEBPACK_IMPORTED_MODULE_2__.isAbsolute(url)) {
            let buf = fs__WEBPACK_IMPORTED_MODULE_1__.readFileSync(url);
            return {
                ok: true,
                arrayBuffer: async () => { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); },
                text: async () => { return (new TextDecoder()).decode(buf); }
            };
        }
        throw 'xx1';
    }
    //这个与DCCFS_Nodejs不同，那个是生成，这个是保存到缓存
    async write(url, content, overwrite) {
        if (path__WEBPACK_IMPORTED_MODULE_2__.isAbsolute(url)) {
            throw 'only rel';
            //url = path.relative(this.cachePath,url);
        }
        let paths = url.split('/');
        paths.pop();
        let absfile = path__WEBPACK_IMPORTED_MODULE_2__.resolve(this.cachePath, url);
        let abspath = path__WEBPACK_IMPORTED_MODULE_2__.resolve(this.cachePath, paths.join('/'));
        try {
            if (!overwrite && fs__WEBPACK_IMPORTED_MODULE_1__.existsSync(absfile))
                return;
            await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.access)(abspath);
        }
        catch (e) {
            await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.mkdir)(abspath, { recursive: true });
        }
        if (content instanceof ArrayBuffer) {
            return (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.writeFile)(absfile, Buffer.from(content));
        }
        await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.writeFile)(absfile, content);
    }
    async enumCachedObjects(callback) {
        let objects = path__WEBPACK_IMPORTED_MODULE_2__.join(this.cachePath, 'objects');
        let idPres = fs__WEBPACK_IMPORTED_MODULE_1__.readdirSync(objects);
        for (let pre of idPres) {
            let cpath = objects + '/' + pre;
            let objs = fs__WEBPACK_IMPORTED_MODULE_1__.readdirSync(cpath);
            for (let o of objs) {
                callback(pre + o);
            }
        }
    }
    rm(url) {
        let absfile = path__WEBPACK_IMPORTED_MODULE_2__.resolve(this.cachePath, url);
        return (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.rm)(absfile);
    }
    async isFileExist(url) {
        try {
            if (!path__WEBPACK_IMPORTED_MODULE_2__.isAbsolute(url)) {
                url = path__WEBPACK_IMPORTED_MODULE_2__.join(this.cachePath, url);
            }
            await (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.access)(url, fs__WEBPACK_IMPORTED_MODULE_1__.constants.F_OK);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    unzip(buff) {
        throw new Error("Method not implemented.");
    }
    zip(buff) {
        throw new Error("Method not implemented.");
    }
    textencode(text) {
        return Buffer.from(text, 'utf-8').buffer;
    }
    textdecode(buffer, off) {
        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        return Buffer.from(buffer).toString('utf-8', off);
    }
    mv(src, dst) {
        return (0,util__WEBPACK_IMPORTED_MODULE_0__.promisify)(fs__WEBPACK_IMPORTED_MODULE_1__.rename)(src, dst);
    }
}


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LayaDCCReader: () => (/* binding */ LayaDCCReader)
/* harmony export */ });
/* harmony import */ var _DCCFS_NodeJS__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var _ObjPack__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(15);
/* harmony import */ var _gitfs_GitFS__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(3);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(11);






class LayaDCCReader {
    async init(dirOrHead) {
        let repoDir = dirOrHead;
        let head = 'head.json';
        if (dirOrHead.endsWith('.json')) {
            let p = Math.max(dirOrHead.lastIndexOf('/'), dirOrHead.lastIndexOf('\\'));
            repoDir = dirOrHead.substring(0, p);
            head = dirOrHead.substring(p + 1);
        }
        this.frw = new _DCCFS_NodeJS__WEBPACK_IMPORTED_MODULE_0__.DCCFS_NodeJS();
        await this.frw.init(repoDir, null);
        this._gitfs = new _gitfs_GitFS__WEBPACK_IMPORTED_MODULE_2__.GitFS(this.frw);
        try {
            let headstr = await this.frw.read(head, 'utf8', true);
            let headobj = JSON.parse(headstr);
            //打包文件
            if (headobj.treePackages) {
                for (let packid of headobj.treePackages) {
                    let pack = new _ObjPack__WEBPACK_IMPORTED_MODULE_1__.ObjPack('tree', this.frw, packid);
                    await pack.init();
                    this._gitfs.addObjectPack(pack);
                }
            }
            //rootNode = await this.gitfs.getTreeNode(headobj.root, null);
            let b = await this._gitfs.setRoot(headobj.root);
        }
        catch (e) {
        }
    }
    async checkout(outdir) {
        let frw = this.frw;
        //遍历节点，保存成文件
        await this._gitfs.visitAll(this._gitfs.treeRoot, async (cnode, entry) => {
            let cdir = path__WEBPACK_IMPORTED_MODULE_4__.join(outdir, cnode.fullPath);
            if (!fs__WEBPACK_IMPORTED_MODULE_3__.existsSync(cdir))
                fs__WEBPACK_IMPORTED_MODULE_3__.mkdirSync(cdir);
        }, async (entry) => {
            let id = (0,_gitfs_GitFSUtils__WEBPACK_IMPORTED_MODULE_5__.toHex)(entry.oid);
            if (entry.owner) {
                let fpath = path__WEBPACK_IMPORTED_MODULE_4__.join(outdir, entry.owner.fullPath, entry.path);
                let filebuff = await frw.read(await this._gitfs.getObjUrl(id), 'buffer', true);
                fs__WEBPACK_IMPORTED_MODULE_3__.writeFileSync(fpath, Buffer.from(filebuff));
                if (entry.fileMTime)
                    fs__WEBPACK_IMPORTED_MODULE_3__.utimesSync(fpath, entry.fileMTime, entry.fileMTime);
                console.log('checkout file:', fpath);
            }
        }, null);
    }
    get gitfs() {
        return this._gitfs;
    }
}


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PackRaw: () => (/* binding */ PackRaw),
/* harmony export */   PackWZip: () => (/* binding */ PackWZip)
/* harmony export */ });
/* harmony import */ var _common_DCCPackRW__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_1__);


class PackWZip {
    constructor() {
        this.zip = new IEditor.ZipFileW('');
    }
    addObject(objid, buffer) {
        this.zip.addBuffer(objid, new Uint8Array(buffer));
    }
    async save(file) {
        this.zip.save(file);
    }
}
class PackRaw {
    constructor() {
        this.pack = new _common_DCCPackRW__WEBPACK_IMPORTED_MODULE_0__.DCCPackW();
    }
    addObject(objid, buffer) {
        this.pack.addObj(objid, buffer);
    }
    async save(file) {
        const [index, content] = this.pack.pack(null);
        let buff = this.pack.mergeIndexAndContent(index, content);
        fs__WEBPACK_IMPORTED_MODULE_1__.writeFileSync(file, Buffer.from(buff));
    }
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LayaDCC: () => (/* reexport safe */ _LayaDCC__WEBPACK_IMPORTED_MODULE_1__.LayaDCC),
/* harmony export */   LayaDCCTools: () => (/* reexport safe */ _ExpTools_LayaDCCTools__WEBPACK_IMPORTED_MODULE_0__.LayaDCCTools),
/* harmony export */   PackRaw: () => (/* reexport safe */ _ExpTools_DCCPackWriters__WEBPACK_IMPORTED_MODULE_2__.PackRaw),
/* harmony export */   Params: () => (/* reexport safe */ _LayaDCC__WEBPACK_IMPORTED_MODULE_1__.Params)
/* harmony export */ });
/* harmony import */ var _ExpTools_LayaDCCTools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _LayaDCC__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _ExpTools_DCCPackWriters__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(29);




})();

window.layadcctools = __webpack_exports__;
/******/ })()
;