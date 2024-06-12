import AdmZip from "adm-zip";
export class Zip_Nodejs {
    open(file) {
        this.zip = new AdmZip(file);
    }
    close() {
    }
    getEntryCount() {
        return this.zip.getEntryCount();
    }
    getEntry(e) {
        return this.zip.getEntry(e);
    }
    forEach(callback) {
        this.zip.forEach(callback);
    }
}
