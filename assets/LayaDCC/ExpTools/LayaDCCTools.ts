import { Params } from "../common/LayaDCC";
//import AdmZip from "adm-zip"
import * as fs from 'fs'
import * as path from "path";
import * as os from 'os';
import {promisify} from 'util'
import { LayaDCCClient } from "../common/LayaDCCClient";
import { DCCClientFS_NodeJS } from "../common/DCCClientFS_NodeJS";

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
        //先检查是否有打包，如果有先解开
        let all = enumDccObjects(dccpath);
    }

    //比较两个dcc目录，把差异（只是new增加的）打包，使用new的root作为root
    static async genZipByComparePath(dccold:string, dccnew:string,outPath:string,outFile?:string){
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
        await dccclient1.updateAll(null);   //需要保证有blob节点。由于有打包等问题，最好还是完全更新
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

        fs.mkdirSync(outPath,{recursive:true});
        let zipPath = path.join(outPath,outFile??"dcc.zip");
        //const zip = new AdmZip();
        let zip = new IEditor.ZipFileW(zipPath);
        for(let objid of changed){
            try{
                let file = path.join(dccnew,await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = fs.readFileSync(file);
                //zip.addFile(objid,buf);
                zip.addBuffer(objid, new Uint8Array(buf));
            }catch(e){
                //由于打包了，dcc服务器目录可能缺少文件，所以在dcc客户端读取
                let file = path.join(dccnew,await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = await dccclientNew.fileIO.read(await dccclientNew.getObjectUrl(objid),'buffer',false) as ArrayBuffer;
                //zip.addFile(objid,Buffer.from(buf));
                zip.addBuffer(objid,new Uint8Array(buf));
            }
        }
        //添加描述信息
        //zip.addLocalFile(path.join(dccnew,'head.json'));
        zip.addFile(path.join(dccnew,'head.json'),'head.json');
        //zip.writeZip(zipPath);
        await zip.save(zipPath);
        console.log('删除临时目录：', basepath);
        await promisify(fs.rmdir)(basepath,{recursive:true})
        console.log('完成')
        return zipPath;
    }

    static async getZipByRev(dcc:string, revold:number, revnew:number){

    }
}