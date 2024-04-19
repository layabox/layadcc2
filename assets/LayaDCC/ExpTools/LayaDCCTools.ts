import { LayaDCC, Params } from "../common/LayaDCC";
import * as AdmZip from "adm-zip"
import * as fs from 'fs'
import * as path from "path";

function enumDccObjects(dccpath:string){
    let ret:string[]=[];
    let objects = path.resolve(dccpath,'objects');
    let idPres = fs.readdirSync(objects);
    for(let pre of idPres){
        let cpath = objects+'/'+pre;
        let objs = fs.readdirSync(cpath);
        for(let o of objs){
            ret.push(pre+o);
        }
    }
    return ret;
}

export class LayaDCCTools{
    static genDCC(srcpath:string, outpath:string, param:Params){

    }

    //直接把一个dcc目录打包，使用当前的root
    static genZipPatch(dccpath:string){
        let all = enumDccObjects(dccpath);

    }

    //比较两个dcc目录，把差异（只是new增加的）打包，使用new的root
    static async genZipByComp(dccold:string, dccnew:string){
        console.log('开始统计',dccold);
        let allold=enumDccObjects(dccold);
        console.log('开始统计',dccnew);
        let allnew=enumDccObjects(dccnew);
        console.log('比较差异...')

        let changed:string[]=[];
        let oldset = new Set();
        allold.forEach(id=>{oldset.add(id);})
        allnew.forEach(id=>{
            if(oldset.has(id)) return;
            changed.push(id);
        })
        console.log(`发现差异文件${changed.length}个.`)
        console.log('写文件...')
        console.log('完成')

    }

    static async getZipByRev(dcc:string, revold:number, revnew:number){

    }

    zip(){
        const zip = new AdmZip();
        zip.addFile("textfile.txt", Buffer.from("This is the content of text file", "utf-8"));

        // 添加一个已存在的文件
        zip.addLocalFile("/path/to/file.txt");
        
        // 将ZIP文件保存到磁盘
        zip.writeZip(/*target path*/"./path/to/createdZip.zip");        
    }
}