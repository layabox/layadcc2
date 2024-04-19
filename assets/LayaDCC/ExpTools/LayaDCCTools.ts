import { LayaDCC, Params } from "../common/LayaDCC";
import AdmZip from "adm-zip"
import * as fs from 'fs'
import * as path from "path";
import * as os from 'os';
import {promisify} from 'util'
import { LayaDCCClient } from "../common/LayaDCCClient";
import { DCCClientFS_NodeJS } from "../common/DCCClientFS_NodeJS";
import { cwd } from "process";

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

    ttt(){

// 创建一个临时目录
fs.mkdtemp(path.join(os.tmpdir(), 'your-prefix-'), (err, directory) => {
    if (err) throw err;
    console.log(`临时目录已创建在 ${directory}`);
  
    // 在这里执行你的操作...
  
    // 操作完成后，删除临时目录
    fs.rmdir(directory, { recursive: true }, (err) => {
      if (err) throw err;
      console.log('临时目录已删除');
    });
  });        
    }

    //比较两个dcc目录，把差异（只是new增加的）打包，使用new的root作为root
    static async genZipByComparePath(dccold:string, dccnew:string){
        debugger;
        //创建一个临时目录
        let basepath = path.join(os.tmpdir(), 'layadcc');
        try{
        await promisify(fs.mkdir)(basepath) ;
        }catch(e){}
        //由于有打包文件，因此需要用完整的dccclient，不能简单的遍历目录
        let dccclient1 = new LayaDCCClient(DCCClientFS_NodeJS,dccold);
        await dccclient1.init(path.join(dccold,'head.json'), basepath+'/zip/cache1');
        let dccclientNew = new LayaDCCClient(DCCClientFS_NodeJS,dccnew);
        await dccclientNew.init(path.join(dccnew,'head.json'), basepath+'/zip/cache2');
        
        let allold:string[]=[];
        let allnew:string[]=[];

        console.log('开始统计',dccold);
        //TODO 不对，没有统计blob文件
        await dccclient1.updateAll(null);   //由于有打包等问题，最好还是完全更新
        await dccclient1.fileIO.enumCachedObjects((objid)=>{allold.push(objid);});
        console.log('开始统计',dccnew);
        await dccclientNew.updateAll(null);
        await dccclientNew.fileIO.enumCachedObjects((objid)=>{allnew.push(objid);});
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
        const zip = new AdmZip();
        for(let objid of changed){
            try{
                let file = path.join(dccnew,await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = fs.readFileSync(file);
                zip.addFile(objid,buf);
            }catch(e){
                //由于打包了，dcc服务器目录可能缺少文件，所以在dcc客户端读取
                let file = path.join(dccnew,await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = await dccclientNew.fileIO.read(await dccclientNew.getObjectUrl(objid),'buffer',false) as ArrayBuffer;
                zip.addFile(objid,Buffer.from(buf));
            }
        }
        zip.writeZip('d:/temp/dcc.zip');
        console.log('完成')

        await promisify(fs.rmdir)(basepath,{recursive:true})
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