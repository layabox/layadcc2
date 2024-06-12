export class ZipFileReader {
    read() {
        let zip = new ZipFile();
        zip.setSrc('');
        zip.forEach((id, name, dir, sz) => {
            if (!dir) {
                let buf = zip.readFile(id);
            }
        });
        zip.close();
    }
}
