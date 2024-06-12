export class AppResReader_Native {
    //注意这里的file是相对于资源目录的，windows下是debug目录，android下是？？？
    async getRes(file, encode) {
        return conch.readFileFromAsset(file, encode);
    }
}
//这个封装是为了方便，给ObjPack使用
export class FileIO_AppRes {
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
