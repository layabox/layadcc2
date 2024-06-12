/**
 * 混淆文件
 */
class DCCObjectWrapper {
    constructor() {
        this.version = 1;
        this.xorKey = null;
    }
    static wrapObject(buff, head) {
        let headLen = 8 //flag
            + 4 //version
            + 8 //key  固定为8
            + 4; //datalen
        let retBuff = new Uint8Array(buff.byteLength + headLen);
        retBuff.set(DCCObjectWrapper.FLAG, 0);
        let bufw = new DataView(retBuff.buffer);
        bufw.setUint32(8, head.version, true);
        retBuff.set(head.xorKey || new Uint8Array(8), 12);
        bufw.setUint32(20, buff.byteLength, true);
        DCCObjectWrapper.xorEncryptArrayBuffer(buff, 0, head.xorKey, retBuff.buffer, 24);
        return retBuff;
    }
    static unwrapObject(buff, head) {
        let flags = new Uint8Array(buff, 0, 8);
        let isDCC = true;
        for (let i = 0; i < 8; i++) {
            if (flags[i] != DCCObjectWrapper.FLAG[i]) {
                isDCC = false;
                break;
            }
        }
        if (!isDCC) {
            //console.log('unwrapObject error: not a layadcc file');
            return null;
        }
        let bufw = new DataView(buff);
        let version = head.version = bufw.getUint32(8, true);
        switch (version) {
            //todo
        }
        let key = new Uint8Array(buff, 12, 8);
        let dataLen = bufw.getUint32(20, true);
        let encrypted = false;
        for (let i = 0; i < key.length; i++) {
            if (key[i] != 0) {
                encrypted = true;
                break;
            }
        }
        if (encrypted) {
            head.xorKey = key;
            let retBuff = DCCObjectWrapper.xorEncryptArrayBuffer(buff, 24, key, null, 0).buffer;
            return retBuff;
        }
        else {
            head.xorKey = null;
            let retBuff = buff.slice(24);
            if (retBuff.byteLength != dataLen) {
                throw 'unmatched size';
            }
            return retBuff;
        }
    }
    static xorEncryptArrayBuffer(inputBuffer, inputBufferOff, key, outbuff, outbuffOff) {
        if (key.length !== 8) {
            throw new Error("Key must be exactly 8 characters long.");
        }
        const inputData = new Uint8Array(inputBuffer, inputBufferOff);
        const outputData = outbuff ? new Uint8Array(outbuff, outbuffOff) : new Uint8Array(inputData.length);
        //const keyData = new Uint8Array(Buffer.from(key)); // Convert string key to Uint8Array
        for (let i = 0; i < inputData.length; i++) {
            outputData[i] = inputData[i] ^ key[i % key.length];
        }
        return outputData;
    }
}
DCCObjectWrapper.FLAG = new Uint8Array([108, 97, 121, 97, 100, 99, 99, 50]); //layadcc2
export { DCCObjectWrapper };
