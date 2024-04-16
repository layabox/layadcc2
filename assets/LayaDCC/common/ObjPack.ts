import { IGitFSFileIO, IObjectPack } from "./gitfs/GitFS";

export class ObjPack implements IObjectPack{
    private _frw:IGitFSFileIO;
    private packPath = 'packfile/'
    private _idxFile:string;
    private _packFile:string;
    private idxInfo:{id:string,start:number,length:number}[];

    constructor(fs:IGitFSFileIO,packid:string){
        this._frw=fs;
        this._idxFile = this.packPath+'tree-'+packid+'.idx';
        this._packFile = this.packPath+'tree-'+packid+'.pack';
    }

    async init(): Promise<boolean> {
        try{
            this.idxInfo = JSON.parse(await this._frw.read(this._idxFile,'utf8') as string)
        }catch(e){
            throw 'open pack error';
            return false;
        }
        return true;
    }

    async has(oid: string) {
        const exists = this.idxInfo.some(info => info.id === oid);
        return exists;
    }

    async get(oid: string) {
        const objInfo = this.idxInfo.find(info => info.id === oid);
        if (!objInfo) {
            throw new Error(`Object ID ${oid} not found`);
        }
        //直接读取，如果文件大的话，应该考虑流式读取
        const rawData = await this.readPart(this._packFile, objInfo.start,objInfo.start+objInfo.length);
        return rawData;
    }

    private async readPart(file:string,start:number, end:number){
        const rawData = await this._frw.read(file, 'buffer') as ArrayBuffer;
        return rawData.slice(start,end)
    }
   
}