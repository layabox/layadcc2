var filenodeid = 1;
/**
 * 这个表示具体的文件
 *
 * 文件也是一种资产，所以会有资产信息。
 *
 * 先做一个基于webFS的实现，以后考虑各种文件系统
 */
export class FileNode {
    constructor(name, isDirectory, parent) {
        this.id = filenodeid++;
        this.type = 0 /* FSType.WEBFS */;
        // 缓存的数据。文件本身的内容，或者目录内容对象
        this.data = null;
        // 缓存的数据。文件转成的对象。 具体类型外面知道
        this.cachedObject = null;
        // mode 采用gittree的标准
        this.mode = 0o100644;
        // 是否是目录。如果child有值的话，则一定是目录，如果没有值的话，看isDirectory，因为可能处于还没有加载的状态
        this.isDirectory = false;
        // 如果是目录的话，这个指向目录的实际内容
        this.child = {};
        // 上级目录。根目录的上级目录为null。文件的上级目录是所在目录，目录的上级目录就是上级目录
        this.parent = null;
        // TODO 以后去掉
        this.watchable = true;
        this.name = name;
        this.isDirectory = isDirectory;
        this.parent = parent;
        this.lastModifyTm = new Date();
        this.writeTm = new Date();
    }
    // 显式调用这个获得子目录内容， if( isDirectory && !child) getChild()
    // 1. 返回一个对象，这个对象在一个单独面板中显示，对象完成后会有数据变化通知
    async readChild() { }
    /**
     * 在当前目录下创建一个文件，并写入内容
     * @param file
     * @param data
     */
    async createFile(filename, data) { }
    /**
     * 加载文件的内容
     */
    async readFile(encode) { return ""; }
    /**
     * 更新自己的文件内容
     * @param data
     */
    async writeFile(data) { }
    /**
     * 在当前目录下删除文件
     * @param file
     */
    async rmFile(file) { }
    /**
     * 在当前目录下创建目录
     * @param name
     */
    async mkdir(name) { throw 'not implement'; }
    /**
     * 在当前目录下删除目录
     * @param name
     */
    async rmdir(name) { }
    addchild(name, fi) {
        this.child[name] = fi;
        fi.parent = this;
        return fi;
    }
    getFullPath() {
        let url = this.name;
        let p = this;
        while (p.parent) {
            p = p.parent;
            if (p.name == '/') {
                url = '/' + url;
            }
            else
                url = p.name + '/' + url;
        }
        return url;
    }
    /**
     * 路径上有不允许watch的都是false
     */
    ifWatchable() {
        if (!this.watchable)
            return false;
        let p = this.parent;
        while (p) {
            if (!p.watchable)
                return false;
            p = p.parent;
        }
        return true;
    }
    getChildById(id) {
        return this._getByID(this, id);
    }
    _getByID(node, id) {
        if (node.id === id)
            return node;
        let c = node.child;
        for (let m in c) {
            if (c[m]) {
                let r = this._getByID(c[m], id);
                if (r)
                    return r;
            }
        }
        return null;
    }
    *[Symbol.iterator]() {
        let allc = Object.keys(this.child);
        for (let entry of allc) {
            yield this.child[entry];
        }
    }
    async traverse(cb) {
        await this._traverse(cb, this);
    }
    async _traverse(cb, c) {
        let brk = false;
        if (!c)
            return;
        for await (const f of c) {
            if (f.isDirectory) {
                return await this._traverse(cb, f);
            }
            else {
                let r = cb(f);
                if (r == 'stop') {
                    brk = true;
                    break;
                }
            }
        }
        return brk ? 'stop' : '';
    }
}
