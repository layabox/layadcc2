import { LayaDCCTools } from "../assets/LayaDCC/ExpTools/LayaDCCTools";
import { DCCClientFS_NodeJS } from "../assets/LayaDCC/common/DCCClientFS_NodeJS";
import { DCCFS_NodeJS } from "../assets/LayaDCC/common/DCCFS_NodeJS";
import { LayaDCC, Params } from "../assets/LayaDCC/common/LayaDCC";
import { LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";

//utils
function getAbs(p:string){
    return Editor.projectPath+'/dcctest/'+p;
}
//

export class DCCAutoTest{
    static async run(){
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
    let dcc2 = new LayaDCCClient(DCCClientFS_NodeJS,dccurl);
    await dcc2.init(headFile,null);
    console.log((new TextDecoder()).decode(await dcc2.readFile('dir/txtindir.txt')));
    dcc2.pathMapToDCC='file:///a/b/';
    console.log((new TextDecoder()).decode(await dcc2.readFile('file:///a/b/dir/txtindir.txt')));

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

    await LayaDCCTools.genZipByComparePath(getAbs('dccout1'),getAbs('dccout2'))
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