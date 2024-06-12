export class RootDesc {
    constructor() {
        //文件总数。用于集中下载计算进度
        this.fileCounts = 0;
        this.version = '1.0.0'; //上一次的id
    }
}
