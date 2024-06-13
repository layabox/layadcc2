import { DCCFS_NodeJS } from './DCCFS_NodeJS.js';
import { ObjPack } from './ObjPack.js';
import { GitFS } from './gitfs/GitFS.js';
import * as fs from 'fs';
import * as path from "path";
import { toHex } from './gitfs/GitFSUtils.js';
export class LayaDCCReader {
    async init(dirOrHead) {
        let rootNode;
        let repoDir = dirOrHead;
        let head = 'head.json';
        if (dirOrHead.endsWith('.json')) {
            let p = Math.max(dirOrHead.lastIndexOf('/'), dirOrHead.lastIndexOf('\\'));
            repoDir = dirOrHead.substring(0, p);
            head = dirOrHead.substring(p + 1);
        }
        this.frw = new DCCFS_NodeJS();
        await this.frw.init(repoDir, null);
        this.gitfs = new GitFS(this.frw);
        try {
            let headstr = await this.frw.read(head, 'utf8', true);
            let headobj = JSON.parse(headstr);
            //打包文件
            if (headobj.treePackages) {
                for (let packid of headobj.treePackages) {
                    let pack = new ObjPack('tree', this.frw, packid);
                    await pack.init();
                    this.gitfs.addObjectPack(pack);
                }
            }
            //rootNode = await this.gitfs.getTreeNode(headobj.root, null);
            let b = await this.gitfs.setRoot(headobj.root);
        }
        catch (e) {
        }
    }
    async checkout(outdir) {
        let frw = this.frw;
        //遍历节点，保存成文件
        await this.gitfs.visitAll(this.gitfs.treeRoot, async (cnode) => {
            let cdir = path.join(outdir, cnode.fullPath);
            if (!fs.existsSync(cdir))
                fs.mkdirSync(cdir);
        }, async (entry) => {
            let id = toHex(entry.oid);
            if (entry.owner) {
                let fpath = path.join(outdir, entry.owner.fullPath, entry.path);
                let filebuff = await frw.read(await this.gitfs.getObjUrl(id), 'buffer', true);
                fs.writeFileSync(fpath, Buffer.from(filebuff));
                if (entry.fileMTime)
                    fs.utimesSync(fpath, entry.fileMTime, entry.fileMTime);
                console.log('checkout file:', fpath);
            }
        });
    }
}
