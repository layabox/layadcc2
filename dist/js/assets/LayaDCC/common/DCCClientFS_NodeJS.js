import { promisify } from 'util';
import * as fs from 'fs';
import * as path from "path";
import { Env } from './Env';
/**
 * 客户端使用的基于nodejs的文件接口
 * 主要是封装了一个缓存目录
 *
 */
export class DCCClientFS_NodeJS {
    constructor() {
        this.cachePath = 'd:/temp/dcctest/cache/';
    }
    async init(repoPath, cachePath) {
        this.repoPath = repoPath;
        if (cachePath)
            this.cachePath = cachePath;
        await promisify(fs.mkdir)(path.join(this.cachePath, 'objects'), { recursive: true });
    }
    async read(url, encode, onlylocal) {
        //先从本地读取，如果没有就从远程下载
        if (path.isAbsolute(url)) {
            throw 'DCCClientFS_NodeJS 只支持读取相对目录';
        }
        let ret;
        let absLocal = path.join(this.cachePath, url);
        try {
            ret = await promisify(fs.readFile)(absLocal);
            if (encode == 'utf8') {
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
    async fetch(url) {
        //测试用：只是本地
        if (url.startsWith('file:///')) {
            url = url.replace('file:///', '');
        }
        if (path.isAbsolute(url)) {
            let buf = fs.readFileSync(url);
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
        if (path.isAbsolute(url)) {
            throw 'only rel';
            //url = path.relative(this.cachePath,url);
        }
        let paths = url.split('/');
        paths.pop();
        let absfile = path.resolve(this.cachePath, url);
        let abspath = path.resolve(this.cachePath, paths.join('/'));
        try {
            if (!overwrite && fs.existsSync(absfile))
                return;
            await promisify(fs.access)(abspath);
        }
        catch (e) {
            await promisify(fs.mkdir)(abspath, { recursive: true });
        }
        if (content instanceof ArrayBuffer) {
            return promisify(fs.writeFile)(absfile, Buffer.from(content));
        }
        await promisify(fs.writeFile)(absfile, content);
    }
    async enumCachedObjects(callback) {
        let objects = path.join(this.cachePath, 'objects');
        let idPres = fs.readdirSync(objects);
        for (let pre of idPres) {
            let cpath = objects + '/' + pre;
            let objs = fs.readdirSync(cpath);
            for (let o of objs) {
                callback(pre + o);
            }
        }
    }
    rm(url) {
        let absfile = path.resolve(this.cachePath, url);
        return promisify(fs.rm)(absfile);
    }
    async isFileExist(url) {
        try {
            await promisify(fs.access)(url, fs.constants.F_OK);
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
        return promisify(fs.rename)(src, dst);
    }
}
