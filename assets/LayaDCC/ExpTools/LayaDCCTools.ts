import { LayaDCC, Params } from "../common/LayaDCC";
//import AdmZip from "adm-zip"
import * as fs from 'fs'
import * as path from "path";
import * as os from 'os';
import { promisify } from 'util'
import { LayaDCCClient } from "../common/LayaDCCClient";
import { DCCClientFS_NodeJS } from "../common/DCCClientFS_NodeJS";
import { shasum, toHex } from "../common/gitfs/GitFSUtils";
import { DCCFS_NodeJS } from "../common/DCCFS_NodeJS";
import { IPackW } from "./DCCPackWriters";

function enumDccObjects(dccpath: string) {
    let ret: string[] = [];
    let objects = path.resolve(dccpath, 'objects');
    let idPres = fs.readdirSync(objects);
    for (let pre of idPres) {
        let cpath = objects + '/' + pre;
        let objs = fs.readdirSync(cpath);
        for (let o of objs) {
            ret.push(pre + o);
        }
    }
    return ret;
}

export class LayaDCCTools {
    static genDCC(srcpath: string, outpath: string, param: Params) {
    }

    //直接把一个dcc目录打包，使用当前的root
    static genZipPatch(dccpath: string) {
        //先检查是否有打包，如果有先解开
        let all = enumDccObjects(dccpath);
    }

    /**
     * 把一个目录打包成更新包
     * 这个不修改root，所以不做一致性保证，只是对象更新
     * @param dir 
     * @param outfile
     */
    static async genZipByPath(dir: string, outfile: string) {
        //针对这个目录执行一下生成dcc，然后打包所有的对象，最后删掉临时dcc目录

        //创建一个临时目录
        let dccoutBasepath = path.join(os.tmpdir(), 'layadcc');
        try {
            await promisify(fs.mkdir)(dccoutBasepath);
        } catch (e) { }        
        let dccout = path.join(dccoutBasepath, "_tempdccout_dir_pack");
        if(fs.existsSync(dccout)){
            //如果有这个目录先删掉
            fs.rmdirSync(dccout,{recursive:true});
        }
        await promisify(fs.mkdir)(dccout);

        //生成dcc
        let dcc = new LayaDCC();
        let params = new Params();
        params.mergeFile = false;
        dcc.params = params;
        params.dccout=dccout;
        await dcc.genDCC(dir);

        //打包结果
        let zip = new IEditor.ZipFileW(outfile);
        dcc.fileIO.enumCachedObjects((objid) => {
            let file = path.join(params.dccout, dcc.getObjectUrl(objid));
            let buf = fs.readFileSync(file);
            zip.addBuffer(objid, new Uint8Array(buf));
        })
        await zip.save(outfile);

        //删除临时dcc目录
        fs.rmdirSync(params.dccout, { recursive: true });
    }

    /**
     * 根据文件列表打包对象到dcczip文件
     * @param files 绝对文件名列表
     * @param outfile 
     */
    static async genPackByFileList(files:string[], outfile: string, packerCls:new()=>IPackW) {
        let packer = new packerCls();//IEditor.ZipFileW(outfile);
        let frw = new DCCFS_NodeJS();

        for(let f of files){
            let buff = await frw.read(f, 'buffer', true) as ArrayBuffer;
            let oid = await shasum(new Uint8Array(buff), false) as Uint8Array;
            let hash = toHex(oid);
            packer.addObject(hash,new Uint8Array(buff));
        }
        await packer.save(outfile);
    }

    //比较两个dcc目录，把差异（只是new增加的）打包，使用new的root作为root
    static async genZipByComparePath(dccold: string, dccnew: string, outPath: string, outFile?: string) {
        //创建一个临时目录
        let basepath = path.join(os.tmpdir(), 'layadcc');
        try {
            await promisify(fs.mkdir)(basepath);
        } catch (e) { }
        //由于有打包文件，因此需要用完整的dccclient，不能简单的遍历目录
        let dccclient1 = new LayaDCCClient(dccold, DCCClientFS_NodeJS);
        await dccclient1.init(path.join(dccold, 'head.json'), basepath + '/zip/cache1');
        let dccclientNew = new LayaDCCClient(dccnew, DCCClientFS_NodeJS);
        await dccclientNew.init(path.join(dccnew, 'head.json'), basepath + '/zip/cache2');

        let allold: string[] = [];
        let allnew: string[] = [];

        console.log('开始统计', dccold);
        await dccclient1.updateAll(null);   //需要保证有blob节点。由于有打包等问题，最好还是完全更新
        await dccclient1.fileIO.enumCachedObjects((objid) => { allold.push(objid); });
        console.log('开始统计', dccnew);
        await dccclientNew.updateAll(null);
        await dccclientNew.fileIO.enumCachedObjects((objid) => { allnew.push(objid); });

        console.log('比较差异...')
        let changed: string[] = [];
        let oldset = new Set();
        allold.forEach(id => { oldset.add(id); })
        allnew.forEach(id => {
            if (oldset.has(id)) return;
            changed.push(id);
        })
        console.log(`发现差异文件${changed.length}个.`)
        console.log('写文件...')

        fs.mkdirSync(outPath, { recursive: true });
        let zipPath = path.join(outPath, outFile ?? "dcc.zip");
        //const zip = new AdmZip();
        let zip = new IEditor.ZipFileW(zipPath);
        for (let objid of changed) {
            try {
                let file = path.join(dccnew, await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = fs.readFileSync(file);
                //zip.addFile(objid,buf);
                zip.addBuffer(objid, new Uint8Array(buf));
            } catch (e) {
                //由于打包了，dcc服务器目录可能缺少文件，所以在dcc客户端读取
                let file = path.join(dccnew, await dccclientNew.getObjectUrl(objid));
                console.log(file);
                let buf = await dccclientNew.fileIO.read(await dccclientNew.getObjectUrl(objid), 'buffer', false) as ArrayBuffer;
                //zip.addFile(objid,Buffer.from(buf));
                zip.addBuffer(objid, new Uint8Array(buf));
            }
        }
        //添加描述信息
        //zip.addLocalFile(path.join(dccnew,'head.json'));
        zip.addFile(path.join(dccnew, 'head.json'), 'head.json');
        //zip.writeZip(zipPath);
        await zip.save(zipPath);
        console.log('删除临时目录：', basepath);
        await promisify(fs.rmdir)(basepath, { recursive: true })
        console.log('完成')
        return zipPath;
    }

    static async getZipByRev(dcc: string, revold: number, revnew: number) {

    }
}