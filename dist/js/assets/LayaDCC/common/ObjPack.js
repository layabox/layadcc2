export class ObjPack {
    /**
     *
     * @param type
     * @param fs 读取整体包文件的。虽然只有读，但是为了通用（例如磁盘的，网络的，apk内的）还是用了IGitFSFileIO接口
     * @param packid
     */
    constructor(type, fs, packid) {
        this.packPath = 'packfile/';
        this._frw = fs;
        let pre = type == 'tree' ? 'tree-' : 'blob-';
        this._idxFile = this.packPath + pre + packid + '.idx';
        this._packFile = this.packPath + pre + packid + '.pack';
    }
    async init() {
        try {
            this.idxInfo = JSON.parse(await this._frw.read(this._idxFile, 'utf8', true));
        }
        catch (e) {
            throw 'open pack error';
            return false;
        }
        return true;
    }
    async has(oid) {
        const exists = this.idxInfo.some(info => info.id === oid);
        return exists;
    }
    async get(oid) {
        const objInfo = this.idxInfo.find(info => info.id === oid);
        if (!objInfo) {
            throw new Error(`Object ID ${oid} not found`);
        }
        //直接读取，如果文件大的话，应该考虑流式读取
        const rawData = await this.readPart(this._packFile, objInfo.start, objInfo.start + objInfo.length);
        return rawData;
    }
    async readPart(file, start, end) {
        const rawData = await this._frw.read(file, 'buffer', true);
        return rawData.slice(start, end);
    }
}
