import { LayaDCCTools } from "../assets/LayaDCC/ExpTools/LayaDCCTools";
import { DCCClientFS_NodeJS } from "../assets/LayaDCC/common/DCCClientFS_NodeJS";
import { DCCFS_NodeJS } from "../assets/LayaDCC/common/DCCFS_NodeJS";
import { LayaDCC, Params } from "../assets/LayaDCC/common/LayaDCC";
import { ICheckLog, LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";
import AdmZip from "adm-zip"

function verify(v:boolean, desc:string){
    if(!v) throw desc;
    console.log(`%cOK:${desc}`,'color: green;');
}

class TestCheckLog implements ICheckLog{
    enableLogCheck: boolean;
    private logs:string[]=[];
    checkLog(event: string): void {
        if(!this.enableLogCheck)return;
        
    }
    clear(): void {
        this.logs.length=0;
    }    

    has(msg:string){
        return this.logs.some(v=>v==msg);
    }
}
//utils
function getAbs(p:string){
    return Editor.projectPath+'/dcctest/'+p;
}
//

export class DCCAutoTest{
    static async run(){
        await test_nodePack_downloadOnce();
        await testZip();
    }
}

//第二次不会再次下载节点包
async function test_nodePack_downloadOnce(){
    let testdir_ver1 = Editor.projectPath+'/dcctest/ver1'
    let dcc = new LayaDCC();
    let param = new Params();
    param.version = '1.0.0';
    dcc.params = param;
    param.dccout = Editor.projectPath+'/dcctest/dccout'
    await dcc.genDCC(testdir_ver1);


    let urlbase = `file:///${Editor.projectPath}/dcctest/dccout/`;
    let dccurl = `file:///${Editor.projectPath}/dcctest/dccout/`
    let headFile = `file:///${Editor.projectPath}/dcctest/dccout/version.1.0.0.json`

    //let localFS = new DCCClientFS_NodeJS(dccCache);
    let dcc1 = new LayaDCCClient(DCCClientFS_NodeJS,dccurl);
    dcc1.onlyTransUrl=false;
    dcc1.pathMapToDCC= urlbase;

    let initok = await dcc1.init(headFile,null);
    if(!initok)
        return false;

    //这个不应该再次下载index包
    let logger = new TestCheckLog();
    let dcc2 = new LayaDCCClient(DCCClientFS_NodeJS,dccurl, logger);
    await dcc2.init(headFile,null);
    verify(!logger.has('需要下载treenode'),'不应该下载treenode包');
    logger.clear();
    let cont = (new TextDecoder()).decode(await dcc2.readFile('dir/txtindir.txt'));
    verify(cont=='txtindir.txt','文件内容不对');
    dcc2.pathMapToDCC='file:///a/b/';
    cont = (new TextDecoder()).decode(await dcc2.readFile('file:///a/b/dir/txtindir.txt'));
    verify(cont=='txtindir.txt','带目录替换的地址文件内容不对')

}

async function testZip(){
    let dcc = new LayaDCC();
    let param = new Params();
    dcc.params = param;
    param.dccout = Editor.projectPath+'/dcctest/dccout1'
    await dcc.genDCC(Editor.projectPath+'/dcctest/ver1');

    param.dccout = Editor.projectPath+'/dcctest/dccout2'
    dcc.params = param;
    await dcc.genDCC(Editor.projectPath+'/dcctest/ver2');

    let zipfile = await LayaDCCTools.genZipByComparePath(getAbs('dccout1'),getAbs('dccout2'));

    //检查zip内容
    let zip = new AdmZip(zipfile);
    verify(2==zip.getEntryCount(), '必须包含两个节点，一个是tree一个是blob');
    let cc = zip.getEntry("00c994feced3af6ee4d6190d59fb316df83e8e31").getData();
    verify((new TextDecoder()).decode(cc)=='ver2','文件内容不对');
}

async function ttt(){
    let testdir_ver1 = Editor.projectPath+'/dcctest/ver1'
    let dcc = new LayaDCC();
    let param = new Params();
    param.version = '1.0.0';
    dcc.params = param;
    param.dccout = Editor.projectPath+'/dcctest/dccout'
    await dcc.genDCC(testdir_ver1);


    let urlbase = `file:///${Editor.projectPath}/dcctest/dccout/`;
    let dccurl = `file:///${Editor.projectPath}/dcctest/dccout/`
    let headFile = `file:///${Editor.projectPath}/dcctest/dccout/version.1.0.0.json`

    //let localFS = new DCCClientFS_NodeJS(dccCache);
    let dcc1 = new LayaDCCClient(DCCClientFS_NodeJS,dccurl);
    dcc1.onlyTransUrl=false;
    dcc1.pathMapToDCC= urlbase;

    let initok = await dcc1.init(headFile,null);
    if(!initok)
        return false;

    //这个不应该再次下载index包
    let dcc2 = new LayaDCCClient(DCCClientFS_NodeJS,dccurl);
    dcc2.init(headFile,null);    
}