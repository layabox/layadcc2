import { IZip, IZipEntry } from "./LayaDCCClient";

class ZipEntry_Native implements IZipEntry {
    entryName: string;
    isDirectory: boolean;
    zip: ZipFile;
    id: number;
    getData(): Uint8Array {
        if (this.id < 0 && this.entryName) {
            return new Uint8Array(this.zip.readAsArrayBufferByName(this.entryName));
        }
        return new Uint8Array(this.zip.readFile(this.id));
    }
    constructor(zip: ZipFile, name: string, isDir: boolean, id: number) {
        this.zip = zip;
        this.entryName = name;
        this.isDirectory = isDir;
        this.id = id;
    }
}
export class Zip_Native implements IZip {
    private zip: ZipFile;

    open(file: string): void {
        this.zip = new ZipFile();
        this.zip.setSrc(file);
    }
    close() {
        this.zip.close();
    }

    getEntryCount(): number {
        let cnt = 0;
        this.zip.forEach((id, name, dir, sz) => {
            cnt++;
        })
        return cnt;
    }

    getEntry(e: string): IZipEntry {
        //TODO dir怎么办
        return new ZipEntry_Native(this.zip, e, false, -1);
    }

    forEach(callback: (entry: IZipEntry) => void): void {
        this.zip.forEach((id, name, dir, sz) => {
            callback(new ZipEntry_Native(this.zip, name, dir, id));
        })
    }

}