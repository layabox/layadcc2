import { IZip, IZipEntry } from "../assets/LayaDCC/common/LayaDCCClient";
import AdmZip from "adm-zip"

export class Zip_Nodejs implements IZip{
    private zip:AdmZip;

    open(file: string): void {
        this.zip = new AdmZip(file);
    }
    close(){
    }

    getEntryCount(): number {
        return this.zip.getEntryCount();
    }

    getEntry(e: string): IZipEntry {
        return this.zip.getEntry(e)
    }
    
    forEach(callback: (entry: IZipEntry) => void): void {
        this.zip.forEach(callback);
    }

}