class ZipEntry_Native {
    getData() {
        if (this.id < 0 && this.entryName) {
            return new Uint8Array(this.zip.readAsArrayBufferByName(this.entryName));
        }
        return new Uint8Array(this.zip.readFile(this.id));
    }
    constructor(zip, name, isDir, id) {
        this.zip = zip;
        this.entryName = name;
        this.isDirectory = isDir;
        this.id = id;
    }
}
export class Zip_Native {
    open(file) {
        this.zip = new ZipFile();
        this.zip.setSrc(file);
    }
    close() {
        this.zip.close();
    }
    getEntryCount() {
        let cnt = 0;
        this.zip.forEach((id, name, dir, sz) => {
            cnt++;
        });
        return cnt;
    }
    getEntry(e) {
        //TODO dir怎么办
        return new ZipEntry_Native(this.zip, e, false, -1);
    }
    forEach(callback) {
        this.zip.forEach((id, name, dir, sz) => {
            callback(new ZipEntry_Native(this.zip, name, dir, id));
        });
    }
}
