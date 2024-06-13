/**
 * web端的dcc文件接口
 *
 */
import { IndexDBFileRW } from './IndexDBFileRW.js';
//访问服务器文件的接口。只要读就行了
export class DCCClientFS_web {
    async init(repoPath, cachePath) {
        if (repoPath && !repoPath.endsWith('/'))
            repoPath += '/';
        this.repoPath = repoPath;
        this.dbfile = new IndexDBFileRW();
        await this.dbfile.init('', '');
    }
    async fetch(url) {
        return await fetch(url);
    }
    async read(url, encode, onlylocal) {
        //先从本地读取，如果没有就从远程下载
        let ret;
        try {
            ret = await this.dbfile.read(url, encode, true);
        }
        catch (e) {
            if (onlylocal)
                return null;
            if (this.repoPath) {
                let resp = await fetch(this.repoPath + url);
                if (encode == 'utf8') {
                    ret = await resp.text();
                    await this.dbfile.write(url, ret);
                }
                else {
                    ret = await resp.arrayBuffer();
                    await this.dbfile.write(url, ret);
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
