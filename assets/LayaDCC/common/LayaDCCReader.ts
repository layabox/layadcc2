import { DCCFS_NodeJS } from "./DCCFS_NodeJS";
import { ObjPack } from "./ObjPack";
import { RootDesc } from "./RootDesc";
import { GitFS } from "./gitfs/GitFS";
import * as fs from 'fs'
import * as path from "path";
import { toHex } from "./gitfs/GitFSUtils";
import { TreeNode } from "./gitfs/GitTree";

export class LayaDCCReader {
    private frw: DCCFS_NodeJS;
    private _gitfs: GitFS;

    async init(dirOrHead: string) {
        let repoDir = dirOrHead;
        let head = 'head.json'
        if (dirOrHead.endsWith('.json')) {
            let p = Math.max(dirOrHead.lastIndexOf('/'), dirOrHead.lastIndexOf('\\'));
            repoDir = dirOrHead.substring(0, p);
            head = dirOrHead.substring(p + 1);
        }

        this.frw = new DCCFS_NodeJS();
        await this.frw.init(repoDir, null);
        this._gitfs = new GitFS(this.frw);
        try {
            let headstr = await this.frw.read(head, 'utf8', true) as string;
            let headobj = JSON.parse(headstr) as RootDesc;
            //打包文件
            if (headobj.treePackages) {
                for (let packid of headobj.treePackages) {
                    let pack = new ObjPack('tree', this.frw, packid);
                    await pack.init();
                    this._gitfs.addObjectPack(pack);
                }
            }
            //rootNode = await this.gitfs.getTreeNode(headobj.root, null);
            let b = await this._gitfs.setRoot(headobj.root);
        } catch (e: any) {
        }
    }

    async checkout(outdir: string) {
        let frw = this.frw;
        //遍历节点，保存成文件
        await this._gitfs.visitAll(this._gitfs.treeRoot, async (cnode,entry) => {
            let cdir = path.join(outdir, cnode.fullPath);
            if (!fs.existsSync(cdir))
                fs.mkdirSync(cdir);
        }, async (entry) => {
            let id = toHex(entry.oid);
            if (entry.owner) {
                let fpath = path.join(outdir, entry.owner.fullPath, entry.path);
                let filebuff = await frw.read(await this._gitfs.getObjUrl(id), 'buffer', true) as ArrayBuffer;
                fs.writeFileSync(fpath, Buffer.from(filebuff));
                if(entry.fileMTime)
                    fs.utimesSync(fpath, entry.fileMTime, entry.fileMTime);
                console.log('checkout file:', fpath);
            }
        },null);
    }

    get gitfs(){
        return this._gitfs;
    }
}
