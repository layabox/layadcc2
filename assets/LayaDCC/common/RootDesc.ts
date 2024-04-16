export class RootDesc{
    //根的id。这里不记revision是为了使用方便，省的再次下载
    root:string;
    //revision:number;
    //附加的对象包
    objPackages:string[];
    //文件总数。用于集中下载计算进度
    fileCounts=0;
    time:Date;
    version='1.0.0';    //上一次的id
    parentVersion:string;
    desc:string;
}