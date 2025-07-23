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
