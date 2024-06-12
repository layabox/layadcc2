/**
 * web端的dcc文件接口
 *
 */
import { DCCConfig } from "./Config";
import { Env } from "./Env";
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
export class DCCClientFS_native {
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
        DCCConfig.log && console.log('DCCClientFS: path=' + conch.getCachePath());
    }
    //远程下载
    async fetch(url) {
        let ret = await myFetch(url);
        return {
            ok: !!ret,
            arrayBuffer: async () => { return ret; },
            text: async () => { return Env.dcodeUtf8(ret); }
        };
    }
    async read(url, encode, onlylocal) {
        //先从本地读取，如果没有就从远程下载
        let ret;
        try {
            ret = fs_readFileSync(this.getAbsPath(url));
            if (ret && encode == 'utf8') {
                ret = Env.dcodeUtf8(ret);
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
                }
                else {
                    ret = await resp.arrayBuffer();
                }
                await this.write(url, ret);
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
        return Env.dcodeUtf8(buffer);
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
