import { DCCPackW } from '../common/DCCPackRW.js';
import * as fs from 'fs';
export class PackWZip {
    constructor() {
        this.zip = new IEditor.ZipFileW('');
    }
    addObject(objid, buffer) {
        this.zip.addBuffer(objid, new Uint8Array(buffer));
    }
    async save(file) {
        this.zip.save(file);
    }
}
export class PackRaw {
    constructor() {
        this.pack = new DCCPackW();
    }
    addObject(objid, buffer) {
        this.pack.addObj(objid, buffer);
    }
    async save(file) {
        const [index, content] = this.pack.pack(null);
        let buff = this.pack.mergeIndexAndContent(index, content);
        fs.writeFileSync(file, Buffer.from(buff));
    }
}
