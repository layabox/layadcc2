import { IFileRW } from "./gitfs/GitFS";
import {promisify} from 'util'
import * as fs from 'fs'
import { gunzipSync, gzipSync } from "zlib";
import path = require("path");

export class NodejsFRW implements IFileRW{
    private _baseDir='';
    constructor(basedir:string){
        this._baseDir=basedir;
    }
    async read(url:string, encode:'utf8'|'buffer') {
        if (encode === 'buffer') {
            const buffer = await promisify(fs.readFile)(url);
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }else{
            return  promisify(fs.readFile)(url, 'utf8');
        } 
    }

    async readSource(rurl:string, encode:'utf8'|'buffer') {
        // Assumed same as read; adjust according to specific differences
        return this.read(rurl, encode);
    }

    async write(url: string, content: string | ArrayBuffer, overwrite?:boolean) {
        if (!overwrite && fs.existsSync(url)) {
            throw new Error("File already exists");
        }

        if (content instanceof ArrayBuffer) {
            return promisify(fs.writeFile)(url, Buffer.from(content));
        }

        await promisify(fs.writeFile)(url, content);
    }

    async writeToCommon(url: string, content: string | ArrayBuffer, overwrite?:boolean) {
        let paths = url.split('/');
        paths.pop();
        let absfile = path.resolve(this._baseDir,url);
        let abspath = path.resolve(this._baseDir,paths.join('/'))
        try{
            if(!overwrite && fs.existsSync(absfile))
                return;
            await promisify(fs.access)(abspath)
        }catch(e:any){
            await promisify(fs.mkdir)(abspath,{recursive:true});
        }
        await this.write( absfile, content, overwrite);
    }

    async isFileExist(url: string) {
        try {
            await promisify(fs.access)(url, fs.constants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    }

    unzip(buff: ArrayBuffer) {
        if (!(buff instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        const buffer = Buffer.from(buff);
        return gunzipSync(buffer).buffer;
    }

    zip(buff: ArrayBuffer) {
        if (!(buff instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        const buffer = Buffer.from(buff);
        return gzipSync(buffer).buffer;
    }

    textencode(text: string) {
        return Buffer.from(text, 'utf-8').buffer;
    }

    textdecode(buffer: ArrayBuffer, off: number) {
        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error("Input must be an ArrayBuffer.");
        }
        return Buffer.from(buffer).toString('utf-8', off);
    }

    saveUserData(key:string, value:string) {
        // Implement based on where you want to store the user data, e.g., an in-memory object, a file, or a database
        console.log(`Saving user data: ${key} = ${value}`);
    }

    getUserData(key:string) {
        // Implement based on where you are storing user data
        console.log(`Getting user data for key: ${key}`);
        return '';
    }    
}