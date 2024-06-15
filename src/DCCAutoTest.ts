import { LayaDCCTools } from "../assets/LayaDCC/ExpTools/LayaDCCTools";
import { DCCClientFS_NodeJS } from "../assets/LayaDCC/common/DCCClientFS_NodeJS";
import { DCCFS_NodeJS } from "../assets/LayaDCC/common/DCCFS_NodeJS";
import { LayaDCC, Params } from "../assets/LayaDCC/common/LayaDCC";
import { ICheckLog, LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";
import AdmZip from "adm-zip"
import * as fs from 'fs'
import * as path from "path";
import * as os from 'os';
import { Zip_Native } from "../assets/LayaDCC/common/Zip_Native";
import { Zip_Nodejs } from "./Zip_NodeJS";


function verify(v: boolean, desc: string) {
    if (!v) throw desc;
    console.log(`%cOK:${desc}`, 'color: green;');
}

function decode(buf: Buffer | ArrayBuffer) {
    return (new TextDecoder()).decode(buf);
}

class TestCheckLog implements ICheckLog {
    enableLogCheck: boolean;
    private logs: string[] = [];
    checkLog(event: string): void {
        if (!this.enableLogCheck) return;

    }
    clear(): void {
        this.logs.length = 0;
    }

    has(msg: string) {
        return this.logs.some(v => v == msg);
    }
}
//utils
function getAbs(p: string) {
    return Editor.projectPath + '/dcctest/' + p;
}
//

export class DCCAutoTest {
    @IEditor.onLoad
    static init1() {
    }

    @IEditor.menu('App/tool/DCCTest')
    async testDCC() {
        await DCCAutoTest.run();
    }

    static async run() {
        await testGenDCCEncrypt();
        await testCheckout();
        await testNullDCCHead();
        await testGenDCC();
        await test_nodePack_downloadOnce();
        await testZip();
        await testZip1();
    }
}

async function testCheckout() {
    await LayaDCCTools.checkout('D:/work/ideproj/DCCPlugin/release/windows/dcc/head.json', 'd:/temp/checkout');
}

async function testNullDCCHead() {
    debugger;
    let dcc1 = new LayaDCCClient("", DCCClientFS_NodeJS);
    dcc1.onlyTransUrl = false;

    let initok = await dcc1.init('', null);
    if (!initok)
        return false;

}

async function testGenDCC() {
    let dir = Editor.projectPath + '/dcctest/dynamic/resexample';
    let subdir = dir + '/dir'
    if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, { recursive: true });
    }
    verify(!fs.existsSync(dir), '测试目录要不存在');
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(subdir, { recursive: true });
    //生成dcc
    fs.writeFileSync(path.join(dir, 'rootText.txt'), 'file in root',);
    fs.writeFileSync(path.join(subdir, 'subDirText.txt'), 'file in subdir');

    let dccdir = Editor.projectPath + '/dcctest/dynamic/dccout';
    if (fs.existsSync(dccdir)) {
        fs.rmdirSync(dccdir, { recursive: true });
    }
    verify(!fs.existsSync(dccdir), 'dcc输出目录要为空');

    let dcc = new LayaDCC();
    let param = new Params();
    param.version = '1.0.0';
    dcc.params = param;
    param.dccout = dccdir;
    await dcc.genDCC(dir);

    let head = JSON.parse(fs.readFileSync(path.join(dccdir, 'head.json'), { encoding: 'utf8' }));
    let root1 = head.root;
    //修改文件内容，再次生成
    fs.writeFileSync(path.join(subdir, 'subDirText1.txt'), 'file2 in subdir');
    param.version = '2.0.0';
    dcc.params = param;
    param.dccout = dccdir;
    await dcc.genDCC(dir);
    head = JSON.parse(fs.readFileSync(path.join(dccdir, 'head.json'), { encoding: 'utf8' }));
    verify(head.root != root1, "root要改变");

    let dcc2 = new LayaDCCClient(dccdir, DCCClientFS_NodeJS, null);
    verify(await dcc2.init(path.join(dccdir, 'head.json'), null), "dcc初始化");
    let buf = await dcc2.readFile('dir/subDirText1.txt');
    let c = (new TextDecoder()).decode(new Uint8Array(buf));
    verify(c == 'file2 in subdir', '打开新的文件成功')

}

async function testGenDCCEncrypt() {
/*
测试本地资源的加密
1. 模拟app环境，所以需要一个假的conch
2. LayaDCCClient的缓存目录
*/
    let dir = Editor.projectPath + '/dcctest/dynamic/resexample';
    let subdir = dir + '/dir'
    if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, { recursive: true });
    }
    verify(!fs.existsSync(dir), '测试目录要不存在');
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(subdir, { recursive: true });
    //生成dcc
    fs.writeFileSync(path.join(dir, 'rootText.txt'), 'file in root',);
    fs.writeFileSync(path.join(subdir, 'subDirText.txt'), 'file in subdir');

    let dccdir = Editor.projectPath + '/dcctest/dynamic/dccout';
    if (fs.existsSync(dccdir)) {
        fs.rmdirSync(dccdir, { recursive: true });
    }
    verify(!fs.existsSync(dccdir), 'dcc输出目录要为空');

    let dcc = new LayaDCC();
    let param = new Params();
    param.version = '1.0.0';
    dcc.params = param;
    param.dccout = dccdir;
    //打包本地资源不要合并
    param.mergeFile=false;
    param.xorKey = Buffer.from('ffffxxxx');
    await dcc.genDCC(dir);

    //模拟contch环境
    let win = window as any;
    win.conch = {
        readFileFromAsset:(file:string, encode:'string'|'utf8')=>{
            let f = file.replace('cache/dcc2.0',dccdir);
            let nbuff =  fs.readFileSync(f);
            let buff = nbuff.buffer.slice(nbuff.byteOffset,nbuff.byteOffset+nbuff.length);

            if(encode=='string'){
                return (new TextDecoder()).decode(buff);
            }
            return buff;
        },
        getCachePath:()=>{
            debugger;
        }
    };
    Object.assign(win,
        {ZipFile:{},
        _XMLHttpRequest:{},
        fs_exists:()=>{debugger;},
        fs_mkdir:()=>{debugger;},
        fs_readFileSync:()=>{debugger;},
        fs_writeFileSync:()=>{debugger;},
        fs_rm:()=>{debugger;},
        fs_readdirSync:()=>{debugger;}
    })

    let dcc2 = new LayaDCCClient(null, DCCClientFS_NodeJS, null);
    verify(await dcc2.init(null, null), "dcc初始化");
    let buf = await dcc2.readFile('dir/subDirText.txt');
    let c = (new TextDecoder()).decode(new Uint8Array(buf));
    verify(c == 'file in subdir', '打开新的文件成功')

    delete win.conch;
    delete win.ZipFile;
    delete win._XMLHttpRequest;
    delete win.fs_exists;
    delete win.fs_mkdir;
    delete win.fs_readdirSync;
    delete win.fs_writeFileSync;
    delete win.fs_rm;
    delete win.fs_readdirSync;

}


//第二次不会再次下载节点包
async function test_nodePack_downloadOnce() {
    let testdir_ver1 = Editor.projectPath + '/dcctest/ver1'
    let dcc = new LayaDCC();
    let param = new Params();
    param.version = '1.0.0';
    dcc.params = param;
    param.dccout = Editor.projectPath + '/dcctest/dccout'
    await dcc.genDCC(testdir_ver1);


    let urlbase = `file:///${Editor.projectPath}/dcctest/dccout/`;
    let dccurl = `file:///${Editor.projectPath}/dcctest/dccout/`
    let headFile = `file:///${Editor.projectPath}/dcctest/dccout/version.1.0.0.json`

    //let localFS = new DCCClientFS_NodeJS(dccCache);
    let dcc1 = new LayaDCCClient(dccurl, DCCClientFS_NodeJS);
    dcc1.onlyTransUrl = false;
    dcc1.pathMapToDCC = urlbase;

    let initok = await dcc1.init(headFile, null);
    if (!initok)
        return false;

    //这个不应该再次下载index包
    let logger = new TestCheckLog();
    let dcc2 = new LayaDCCClient(dccurl, DCCClientFS_NodeJS, logger);
    await dcc2.init(headFile, null);
    verify(!logger.has('需要下载treenode'), '不应该下载treenode包');
    logger.clear();
    let cont = decode(await dcc2.readFile('dir/txtindir.txt'));
    verify(cont == 'txtindir.txt', '文件内容不对');
    dcc2.pathMapToDCC = 'file:///a/b/';
    cont = decode(await dcc2.readFile('file:///a/b/dir/txtindir.txt'));
    verify(cont == 'txtindir.txt', '带目录替换的地址文件内容不对')

    let b1 = await dcc2.hasFile('dd/c.png')
    verify(b1==false,'这个文件应该不存在');
    let b2 = await dcc2.hasFile('file:///a/b/dir/txtindir.txt')
    verify(b2,'这个文件应该存在');
}

async function testZip() {
    let dcc = new LayaDCC();
    let param = new Params();
    dcc.params = param;
    param.dccout = Editor.projectPath + '/dcctest/dccout1'
    await dcc.genDCC(Editor.projectPath + '/dcctest/ver1');
    let bb = fs.readFileSync(path.join(Editor.projectPath + '/dcctest/dccout1', 'objects/69', '3253c6c7bb2298e1cf9e7768f5f8342dea87ea'));
    verify(!!bb, '不能缺少blob')


    param.dccout = Editor.projectPath + '/dcctest/dccout2'
    dcc.params = param;
    await dcc.genDCC(Editor.projectPath + '/dcctest/ver2');

    let zipfile = await LayaDCCTools.genZipByComparePath(getAbs('dccout1'), getAbs('dccout2'), Editor.projectPath + '/dcctest/');

    //检查zip内容
    let zip = new AdmZip(zipfile);
    verify(3 == zip.getEntryCount(), '必须包含两个节点，一个是tree一个是blob，再加一个描述');
    let cc = zip.getEntry("00c994feced3af6ee4d6190d59fb316df83e8e31").getData();
    verify(decode(cc) == 'ver2', '文件内容不对');

    let root = JSON.parse(decode(zip.getEntry('head.json').getData())).root;
    verify(root == '00bda77c303e822e9501198a639ee3cab0da538f', '必须包含新版的root')

    //应用zip
    let dccurl = getAbs('dccout1');
    let client = new LayaDCCClient(dccurl, DCCClientFS_NodeJS);
    let iniok = await client.init(path.join(dccurl, 'head.json'), null);
    verify(iniok, 'initok')
    await client.updateAll(null);
    await client.updateByZip(zipfile, window.conch ? Zip_Native : Zip_Nodejs, null);
    await client.clean();
    //let headAfterUpdate = await client.readFile('head.json');
    //head.json不是gitfs的，需要底层访问
    let headAfterUpdate = await client.fileIO.read('head.json', 'utf8', true) as string;
    let headobj = JSON.parse(headAfterUpdate)
    verify(headobj.root == '00bda77c303e822e9501198a639ee3cab0da538f', 'updateByZip 要更新head.json');
}

/**
 * 对同一个目录生成dcc，然后计算zip应该为空
 */
async function testZip1() {
    let dcc = new LayaDCC();
    let param = new Params();
    dcc.params = param;
    param.dccout = Editor.projectPath + '/dcctest/dccout3'
    await dcc.genDCC(Editor.projectPath + '/dcctest/ver1');


    param.dccout = Editor.projectPath + '/dcctest/dccout4'
    dcc.params = param;
    await dcc.genDCC(Editor.projectPath + '/dcctest/ver1');

    let zipfile = await LayaDCCTools.genZipByComparePath(getAbs('dccout3'), getAbs('dccout4'), Editor.projectPath + '/dcctest/', 'zzz.zip');

    //检查zip内容
    let zip = new AdmZip(zipfile);
    verify(1 == zip.getEntryCount(), '相同目录生成的zi里面只有一个head.json');

    zipfile = await LayaDCCTools.genZipByComparePath(getAbs('dccout3'), getAbs('dccout3'), Editor.projectPath + '/dcctest/', 'zzz.zip');
    zip = new AdmZip(zipfile);
    verify(1 == zip.getEntryCount(), '相同目录生成的zi里面只有一个head.json');
}

async function ttt() {
    let testdir_ver1 = Editor.projectPath + '/dcctest/ver1'
    let dcc = new LayaDCC();
    let param = new Params();
    param.version = '1.0.0';
    dcc.params = param;
    param.dccout = Editor.projectPath + '/dcctest/dccout'
    await dcc.genDCC(testdir_ver1);


    let urlbase = `file:///${Editor.projectPath}/dcctest/dccout/`;
    let dccurl = `file:///${Editor.projectPath}/dcctest/dccout/`
    let headFile = `file:///${Editor.projectPath}/dcctest/dccout/version.1.0.0.json`

    //let localFS = new DCCClientFS_NodeJS(dccCache);
    let dcc1 = new LayaDCCClient(dccurl, DCCClientFS_NodeJS);
    dcc1.onlyTransUrl = false;
    dcc1.pathMapToDCC = urlbase;

    let initok = await dcc1.init(headFile, null);
    if (!initok)
        return false;

    //这个不应该再次下载index包
    let dcc2 = new LayaDCCClient(dccurl, DCCClientFS_NodeJS);
    dcc2.init(headFile, null);
}