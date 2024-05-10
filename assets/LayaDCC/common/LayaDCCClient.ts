import { AppResReader_Native } from "./AppResReader_Native";
import { DCCConfig } from "./Config";
import { DCCClientFS_native } from "./DCCClientFS_native";
import { DCCClientFS_web } from "./DCCClientFS_web";
import { DCCDownloader } from "./DCCDownloader";
import { Env } from "./Env";
import { ObjPack_AppRes } from "./ObjPack_AppRes";
import { RootDesc } from "./RootDesc";
import { GitFS, IGitFSFileIO } from "./gitfs/GitFS";
import { toHex } from "./gitfs/GitFSUtils";

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//流程记录，可以用来做测试
export interface ICheckLog {
    enableLogCheck: boolean;
    checkLog(event: string): void;
    clear(): void;
}

export interface IZipEntry {
    entryName: string;
    getData(): Uint8Array;//Uint8Array比arraybuffer的优势是可以共享buffer
    isDirectory: boolean;
}
export interface IZip {
    open(file: string): void;
    getEntryCount(): number;
    getEntry(e: string): IZipEntry;
    forEach(callback: (entry: IZipEntry) => void): void;
    close(): void;
}

let DCCClientFS = {
    "layaNative": DCCClientFS_native,
    "web": DCCClientFS_web
}[Env.runtimeName];

export class LayaDCCClient {
    static VERSION = '1.0.0';
    private _frw: IGitFSFileIO;
    //是否只把请求的url转换成hash
    private _onlyTransUrl = false;
    private _gitfs: GitFS;
    //映射到dcc目录的地址头，如果没有，则按照http://*/算，所有的请求都裁掉主机地址
    private _pathMapToDCC = '';
    //dcc的服务器根目录地址
    private _dccServer: string;
    private _logger: ICheckLog = null;
    dccPathInAssets = 'cache/dcc2.0'
    //已经下载过的包，用来优化，避免重复下载，执行清理之后要清零
    private _loadedPacks: { [key: string]: number } = {}

    /**
     * 
     * @param frw 文件访问接口，不同的平台需要不同的实现。如果为null，则自动选择网页或者native两个平台
     * @param dccurl dcc的服务器地址
     */
    constructor(dccurl: string, frw: new () => IGitFSFileIO | null = null, logger: ICheckLog = null) {
        if (dccurl && !dccurl.endsWith('/')) dccurl += '/';
        this._dccServer = dccurl;

        if (!frw) frw = DCCClientFS;
        if (!frw) throw "没有正确的文件访问接口";

        this._frw = new frw();
        if (logger) {
            this._logger = logger;
            logger.clear();
        }
        this.checkEnv();
    }

    enableLog(b: boolean) {
        DCCConfig.log = b;
    }

    checkEnv() {
        //检查必须得native的接口
        if (window.conch) {
            if (!ZipFile) { throw 'native 环境不对' }
            if (!_XMLHttpRequest) { throw 'native 环境不对' }
            if (!conch.getCachePath) { throw 'native 环境不对' }
            if (!fs_exists) { throw 'native 环境不对' }
            if (!fs_mkdir) { throw 'native 环境不对' }
            if (!fs_readFileSync) { throw 'native 环境不对' }
            if (!fs_writeFileSync) { throw 'native 环境不对' }
            if (!fs_rm) { throw 'native 环境不对' }
            if (!fs_readdirSync) { throw 'native 环境不对' }
        }
    }

    get fileIO() {
        return this._frw;
    }

    private log(msg: string) {
        if (DCCConfig.log) console.log(msg);
        this._logger && this._logger.checkLog(msg);
    }

    set pathMapToDCC(v: string) {
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
    async init(headfile: string | null, cachePath: string) {
        if (this._gitfs) {
            throw '重复初始化'
        }
        await this._frw.init(this._dccServer, cachePath);

        //判断是不是新的安装
        if (window.conch) {
            //如果是的话，拷贝出apk中的head
            let appres = new AppResReader_Native();
            //规则：如果第一次安装，直接使用apk内的，如果是覆盖安装，则比较时间差。比较的作用是防止万一没有网络的情况下，apk内的资源比较旧..
            try {
                let apphead = await appres.getRes(this.dccPathInAssets + '/head.json', 'buffer') as ArrayBuffer;
                if (apphead) {
                    //暂时直接拷贝覆盖，应该也是正确的
                    await this._frw.write('head.json', apphead, true);
                }
            } catch (e) {
                DCCConfig.log && console.log('LayaDCCClient init error: no head.json in package')
            }
        }


        let rootNode: string;
        //本地记录的head信息
        let localRoot: string = null;
        try {
            //本地
            let localHeadStr = await this._frw.read('head.json', 'utf8', true) as string;
            let localHead = JSON.parse(localHeadStr) as RootDesc;
            localRoot = localHead.root;
            rootNode = localRoot;
        } catch (e) { }

        //本地记录的下载包信息
        try {
            let loadedpacks: string[] = [];
            loadedpacks = JSON.parse(await this._frw.read('downloaded_packs.json', 'utf8', true) as string);
            if (loadedpacks && loadedpacks.length) {
                for (let m of loadedpacks) {
                    this._loadedPacks[m] = 1;
                }
            }
        } catch (e) {
        }

        //let frw = this._frw = new DCCClientFS_web_local();
        //下载head文件
        let remoteHead: RootDesc = null;
        let remoteHeadStr: string = null;
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
        } catch (e) { }

        if (!remoteHead && !localRoot)
            //如果本地和远程都没有dcc数据，则返回，不做dcc相关设置
            return false;

        let gitfs = this._gitfs = new GitFS(this._frw);

        //初始化apk包资源
        if (window.conch) {
            let appResPack = new ObjPack_AppRes(this.dccPathInAssets);
            await appResPack.init();
            gitfs.addObjectPack(appResPack);
        }

        if (!localRoot || (remoteHead && localRoot != remoteHead.root)) {//本地不等于远端
            //处理打包
            if (remoteHead.treePackages.length) {
                this.log('需要下载treenode')
                for (let packid of remoteHead.treePackages) {
                    if (this._loadedPacks[packid]) {
                        this.log(`包已经下载过了${packid}`);
                        continue;
                    }
                    this.log(`下载treenode:${packid}`);
                    let resp = await this._frw.fetch(`${this._dccServer}packfile/tree-${packid}.idx`);
                    if (!resp.ok) throw 'download treenode idx error';
                    let idxs: { id: string, start: number, length: number }[] = JSON.parse(await resp.text());
                    //先判断所有的index是不是都有了,如果都有的就不下载了
                    //TODO 这个过程会不会很慢？还不如直接下载

                    let resp1 = await this._frw.fetch(`${this._dccServer}packfile/tree-${packid}.pack`);
                    if (!resp1.ok) throw 'download treenode pack error';
                    let buff = await resp1.arrayBuffer();
                    //把这些对象写到本地
                    for (let nodeinfo of idxs) {
                        let nodebuff = buff.slice(nodeinfo.start, nodeinfo.start + nodeinfo.length);
                        await this._gitfs.saveObject(nodeinfo.id, nodebuff)
                    }
                }
            }
        }

        //初始化完成，记录head到本地
        await this._frw.write('head.json', remoteHeadStr, true);
        await gitfs.setRoot(rootNode);
        //记录下载的包文件
        if (remoteHead) {
            for (let packid of remoteHead.treePackages) {
                this._loadedPacks[packid] = 1;
            }
            //记录下载包。TODO如果有动态下载，则都要记录
            await this._frw.write('downloaded_packs.json', JSON.stringify(Object.keys(this._loadedPacks)), true);
        }

        await this._frw.write('head.json', remoteHeadStr, true);

        return true;
    }

    set onlyTransUrl(v: boolean) {
        this._onlyTransUrl = v;
    }
    get onlyTransUrl() {
        return this._onlyTransUrl;
    }

    /**
     *  读取缓存中的一个文件，url是相对地址
     * @param url 用户认识的地址。如果是绝对地址，并且设置是映射地址，则计算一个相对地址。如果是相对地址，则直接使用
     * @returns 
     */
    async readFile(url: string): Promise<ArrayBuffer | null> {
        let gitfs = this._gitfs;
        if (!gitfs) throw 'dcc没有正确init';
        if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('file:')) {//绝对路径
            if (!this._pathMapToDCC) {
                url = (new URL(url)).pathname;;
            } else {
                if (!url.startsWith(this._pathMapToDCC)) return null;
                url = url.substring(this._pathMapToDCC.length);
            }
        }

        let buff = await gitfs.loadFileByPath(url, 'buffer') as ArrayBuffer;
        return buff;
    }

    //获取某个对象（用hash表示的文件或者目录）在缓存中的地址
    async getObjectUrl(objid: string) {
        return this._gitfs.getObjUrl(objid)
    }

    /**
     * 把一个原始地址转换成cache服务器对象地址
     * @param url 原始资源地址
     * @returns 
     */
    async transUrl(url: string) {
        let gitfs = this._gitfs;
        if (!gitfs) return url;

        if (!this._pathMapToDCC) {
            url = (new URL(url)).pathname;;
        } else {
            if (!url.startsWith(this._pathMapToDCC)) return url;
            url = url.substring(this._pathMapToDCC.length);
        }

        let objpath = await gitfs.pathToObjPath(url);
        if (!objpath) {
            return url;
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
    async updateAll(progress: (p: number) => void) {
        let gitfs = this._gitfs;
        //为了能统计，需要先下载所有的目录节点，这段时间是无法统计的

        //先统计本地已经存在的
        let locals: Set<string> = new Set();
        await this._frw.enumCachedObjects((objid) => {
            locals.add(objid);
        })

        //遍历file
        let needUpdateFiles: string[] = [];
        //统计所有树上的
        await gitfs.visitAll(gitfs.treeRoot, async (tree) => {
            //下载
            if (!locals.has(tree.sha))
                //理论上不应该走到这里，应为visitAll的时候都下载了
                await this._frw.read(gitfs.getObjUrl(tree.sha), 'buffer', false);
        }, async (blob) => {
            let id = toHex(blob.oid);
            if (!locals.has(id)) {
                needUpdateFiles.push(id);
            }
        })
        //
        this.log(`updateAll need update ${needUpdateFiles.length}`);
        //needUpdateFiles.forEach(id=>{console.log(id);});
        progress && progress(0);
        for (let i = 0, n = needUpdateFiles.length; i < n; i++) {
            let id = needUpdateFiles[i];
            //TODO 并发以提高效率
            await this._frw.read(gitfs.getObjUrl(id), 'buffer', false);
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
    async updateByZip(zipfile: string, zipClass: new () => IZip, progress: (p: number) => void) {
        let zip = new zipClass();
        zip.open(zipfile);
        //TODO 数据太多的时候要控制并发
        zip.forEach(async entry => {
            if (entry.entryName == 'head.json') {
            } else {
                await this.addObject(entry.entryName, entry.getData())
            }
        })
        //写head。zip中可能没有head.json，例如只是某个目录，这时候就不要更新root了
        try {
            let buf = zip.getEntry('head.json');
            await this._frw.write('head.json', buf.getData().buffer, true);
            //更新自己的root
            let localHeadStr = await this._frw.read('head.json', 'utf8', true) as string;
            let localHead = JSON.parse(localHeadStr) as RootDesc;
            await this._gitfs.setRoot(localHead.root);
        } catch (e) {

        }
    }

    /**
     * 添加对象，可以用来做zip更新
     * @param objid 
     * @param content 
     * @returns 
     */
    private async addObject(objid: string, content: ArrayBuffer) {
        return this._gitfs.saveObject(objid, content);
    }

    /**
     * 清理缓存。
     * 根据根文件遍历所有本版本依赖的文件，删除不属于本版本的缓存文件
     */
    async clean() {
        let gitfs = this._gitfs;
        //遍历file
        let files: Set<string> = new Set()
        //统计所有树上的
        await gitfs.visitAll(gitfs.treeRoot, async (tree) => {
            files.add(tree.sha);
        }, async (blob) => {
            files.add(toHex(blob.oid));
        })
        //统计所有的本地保存的
        //不在树上的全删掉
        let removed: string[] = [];
        let dbgRemovdeFile: string[] = [];
        await this._frw.enumCachedObjects((objid) => {
            if (!files.has(objid)) {
                removed.push(objid);
            }
        })
        //
        for (let id of removed) {
            if (DCCConfig.log) {
                console.log('清理节点:', id);
            }
            gitfs.removeObject(id);
        }
        //由于下载包在清理以后无法维护，简单的就是全部删除
        this._loadedPacks = {};
        await this._frw.write('downloaded_packs.json', '{}', true);
    }

    private _downloader: DCCDownloader;
    //插入到laya引擎的下载流程，实现下载的接管
    injectToLaya() {
        if (!this._downloader) {
            this._downloader = new DCCDownloader(this, this._logger);
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
            this._downloader = new DCCDownloader(this, this._logger);
        }
        this._downloader.injectToNativeFileReader();
    }
    removeFromNative() {
        if (!this._downloader) return;
        this._downloader.removeFromNative();
    }

}