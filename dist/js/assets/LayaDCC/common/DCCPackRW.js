import { hashToArray, toHex } from "./gitfs/GitFSUtils";
export class DCCPackR {
    split(buff) {
        let buffu32 = new Uint32Array(buff, 0, 3); //必须指定3个，因为buff可能不是4的倍数
        let ver = buffu32[0];
        let datalen = buffu32[1];
        let error = 0;
        if (buff.byteLength != datalen + 4) {
            error = 1;
            return [null, null, error];
        }
        let indexLen = buffu32[2];
        if (indexLen % 28 != 0)
            throw "bad buffer";
        let indexNum = indexLen / 28;
        let indices = [];
        let idxPos = 12;
        for (let i = 0; i < indexNum; i++) {
            let idstr = toHex(new Uint8Array(buff, idxPos, 20));
            idxPos += 20;
            let start = (new Uint32Array(buff, idxPos, 4))[0];
            idxPos += 4;
            let length = (new Uint32Array(buff, idxPos, 4))[0];
            idxPos += 4;
            indices.push({ id: idstr, start, length });
        }
        return [indices, buff, error];
    }
}
export class DCCPackW {
    constructor() {
        //没有提供indexObj的清理，不允许重复使用
        this.indexObj = {};
    }
    addObj(objid, buf) {
        this.indexObj[objid] = buf.slice(0);
    }
    //从节点考虑的话，还是不要有状态了，不要用this
    pack(indexObj) {
        if (!indexObj)
            indexObj = this.indexObj;
        let indexes = [];
        let buffLen = 0;
        for (let obj in indexObj) {
            let buff = indexObj[obj];
            if (buff)
                buffLen += buff.byteLength;
        }
        let packbuff = new Uint8Array(buffLen);
        let curpos = 0;
        for (let obj in indexObj) {
            let buff = indexObj[obj];
            if (!buff)
                continue;
            packbuff.set(new Uint8Array(buff), curpos);
            indexes.push({ id: obj, start: curpos, length: buff.byteLength });
            curpos += buff.byteLength;
        }
        return [indexes, packbuff.buffer];
    }
    mergeIndexAndContent(index, content) {
        let indexBuff;
        if (index instanceof ArrayBuffer) {
            indexBuff = index;
        }
        else {
            let itemLen = 20 + 4 + 4;
            let indexBuffsz = index.length * itemLen; //id,start,length
            let indexbuf = new Uint8Array(indexBuffsz);
            let int32buf = new Uint32Array(indexbuf.buffer);
            for (let i = 0, n = index.length; i < n; i++) {
                const { id, start, length } = index[i];
                indexbuf.set(hashToArray(id), i * itemLen);
                int32buf[i * itemLen / 4 + 5] = start;
                int32buf[i * itemLen / 4 + 6] = length;
            }
            indexBuff = indexbuf.buffer;
        }
        let ver = 1;
        let indexlength = indexBuff.byteLength;
        let mergeBuff = new Uint8Array(12 + indexBuff.byteLength + content.byteLength);
        let buffW = new DataView(mergeBuff.buffer);
        buffW.setUint32(0, ver, true);
        buffW.setUint32(4, mergeBuff.byteLength - 4, true); //记录长度以便检查下载是否正确
        buffW.setUint32(8, indexlength, true); //
        mergeBuff.set(new Uint8Array(indexBuff), 12);
        mergeBuff.set(new Uint8Array(content), indexBuff.byteLength + 12);
        return mergeBuff.buffer;
    }
}
