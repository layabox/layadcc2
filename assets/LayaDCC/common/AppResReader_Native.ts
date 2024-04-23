import { IGitFSFileIO } from "./gitfs/GitFS";

export class AppResReader_Native{
    //注意这里的file是相对于资源目录的，windows下是debug目录，android下是？？？
    async getRes(file:string, encode:'utf8'|'buffer'){
        return conch.readFileFromAsset(file,encode)
    }
}

//这个封装是为了方便，给ObjPack使用
export class FileIO_AppRes implements IGitFSFileIO{
    repoPath: string;
    constructor(cachePath:string){
        this.repoPath=cachePath;
    }
    init(repoPath: string, cachePath: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    fetch(url: string): Promise<Response> {
        throw new Error("Method not implemented.");
    }

    async read(url: string, encode: "utf8" | "buffer", onlylocal: boolean): Promise<string | ArrayBuffer> {
        let path = this.repoPath+'/'+url;
        return conch.readFileFromAsset(path,encode)
    }
    
    write(url: string, content: string | ArrayBuffer, overwrite?: boolean): Promise<any> {
        throw new Error("Method not implemented.");
    }
    isFileExist(url: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    unzip(buff: ArrayBuffer): ArrayBuffer {
        throw new Error("Method not implemented.");
    }
    zip(buff: ArrayBuffer): ArrayBuffer {
        throw new Error("Method not implemented.");
    }
    textencode(text: string): ArrayBuffer {
        throw new Error("Method not implemented.");
    }
    textdecode(buffer: ArrayBuffer, off: number): string {
        throw new Error("Method not implemented.");
    }
    rm(url: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    enumCachedObjects(callback: (objid: string) => void): Promise<void> {
        throw new Error("Method not implemented.");
    }
    mv(src: string, dst: string): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
}