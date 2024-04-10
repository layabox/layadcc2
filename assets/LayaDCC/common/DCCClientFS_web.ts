/**
 * web端的dcc文件接口
 * 
 */

import { IFileRW } from "./gitfs/GitFS";

export class DCCClientFS_web_local implements IFileRW{
    read(url: string, encode: "utf8" | "buffer"): Promise<string | ArrayBuffer> {
        throw new Error("Method not implemented.");
    }
    readSource(rurl: string, encode: "utf8" | "buffer"): Promise<string | ArrayBuffer> {
        throw new Error("Method not implemented.");
    }
    write(url: string, content: string | ArrayBuffer, overwrite?: boolean): Promise<any> {
        throw new Error("Method not implemented.");
    }
    writeToCommon(url: string, content: ArrayBuffer, overwrite?: boolean): Promise<any> {
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
    saveUserData(key: string, value: string): void {
        throw new Error("Method not implemented.");
    }
    getUserData(key: string): string {
        throw new Error("Method not implemented.");
    }
    mv(src: string, dst: string): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    
}

//访问服务器文件的接口。只要读就行了
export class DCCClientFS_web_remote implements IFileRW{
    async read(url: string, encode: "utf8" | "buffer"): Promise<string | ArrayBuffer> {
        let resp = await fetch(url);
        if(encode=='utf8') return await resp.text();
        else return await resp.arrayBuffer();
    }
    readSource(rurl: string, encode: "utf8" | "buffer"): Promise<string | ArrayBuffer> {
        throw new Error("Method not implemented.");
    }
    write(url: string, content: string | ArrayBuffer, overwrite?: boolean): Promise<any> {
        throw new Error("Method not implemented.");
    }
    writeToCommon(url: string, content: ArrayBuffer, overwrite?: boolean): Promise<any> {
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
    saveUserData(key: string, value: string): void {
        throw new Error("Method not implemented.");
    }
    getUserData(key: string): string {
        throw new Error("Method not implemented.");
    }
    mv(src: string, dst: string): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

}