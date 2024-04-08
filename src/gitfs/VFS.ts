import { FileNode } from "./FSData";
import { MemFSFileInfo } from "./MemFS";
import { setVFS } from "./VFSRoot";
import { WebPath } from "./WebPath";

export class EventHandler{
	caller:any;
	data:any|any[];
	once=false;
	func:Function;
}

export class EvtDispatcher {
    private _events: {[key:string]:EventHandler[]}|null;

    hasListener(type: string): boolean {
        var listener = this._events && this._events[type];
        return !!listener;
    }

    event(type: string, data: any = null): boolean {
        if (!this._events || !this._events[type]) return false;

        var listeners = this._events[type];
		for (var i = 0, n = listeners.length; i < n; i++) {
			var listener = listeners[i];
			if (listener) {
				let par = listener.data?
					(listener.data as any[]).concat(data)
					:( data.constructor==Array?data:[data]);
				listener.func.apply(listener.caller, par)
			}
			if (!listener || listener.once) {
				listeners.splice(i, 1);
				i--;
				n--;
			}
		}
		if (listeners.length === 0 && this._events) delete this._events[type];

        return true;
    }

    on(type: string, caller: any, listener: Function, args: any[]|null = null): EvtDispatcher {
        return this._createListener(type, caller, listener, args, false);
    }

    once(type: string, caller: any, listener: Function, args: any[]|null = null): EvtDispatcher {
        return this._createListener(type, caller, listener, args, true);
    }

    private _createListener(type: string, caller: any, listener: Function, args: any[]|null, once: boolean, offBefore = true): EvtDispatcher {
        //移除之前相同的监听
        offBefore && this.off(type, caller, listener, once);

		let handler = new EventHandler();
		handler.once = once;
		handler.caller=caller;
		handler.func=listener;
		handler.data = args;

        this._events || (this._events = {});

        let events = this._events;
        if (!events[type]) events[type] = [handler];
        else {
			events[type].push(handler);
        }
        return this;
    }

    off(type: string, caller: any, listener: Function|null, onceOnly = false): EvtDispatcher {
        if (!this._events || !this._events[type]) return this;
        let listeners = this._events[type];
        if (listeners != null) {
			let count = 0;
			let n = listeners.length;
			for (let i = 0 ; i < n; i++) {
				let item = listeners[i];
				if (!item) {
					count++;
					continue;
				}
				if (item && (!caller || item.caller === caller) && (listener == null || item.func === listener) && (!onceOnly || item.once)) {
					count++;
					listeners.splice(i,1);
					i--;
					n--;
				}
			}
			//如果全部移除，则删除索引
			if (count === n) delete this._events[type];
        }

        return this;
    }

    offAll(type: string|null = null): EvtDispatcher {
        var events = this._events;
        if (!events) return this;
        if (type) {
            this._recoverHandlers(events[type]);
            delete events[type];
        } else {
            for (var name in events) {
                this._recoverHandlers(events[name]);
            }
            this._events = null;
        }
        return this;
    }

    offAllCaller(caller: any): EvtDispatcher {
        if (caller && this._events) {
            for (var name in this._events) {
                this.off(name, caller, null);
            }
        }
        return this;
    }

    private _recoverHandlers(arr: any): void {
        if (!arr) return;
		for (var i = arr.length - 1; i > -1; i--) {
			if (arr[i]) {
				arr[i].recover();
				arr[i] = null;
			}
		}
    }
}


// 子成员只转换child
//var WatchInfoOfFileInfo=new WatchMemberRule(false,['child']);

export const enum VFSPATH{
	ASSETS='assets',
	WEBFS_ROOT='nativeFS',
	MEMFS_TEMP='/temp',
	UPLOADTEMP="/temp/upload/",
	MATERIALS='/assets/materials',
	TEXTURES='/assets/textures',
	THUMBNAIL='/assets/thumbnail',
	MODELS='/assets/models',
	EXPORTS='/assets/exports',
	IMPORTS='/assets/imports',
	LAYAME = '/layame',
	DROP='drop',
}

export interface IResMgr{
	loadRes(path:string):Promise<ArrayBuffer|string>;
}


/**
 * 文件系统
 * 多级目录分隔符仅支持 "\"
 * 除函数有说明外，所有函数均支持当前路径(传入值无"\")、绝对路径(以"\"开头)和相对路径(路径中包含"\")
 */
export class VFS  extends EvtDispatcher {

	root = new MemFSFileInfo('/', true, null);
	// root = new WebFSFileInfo(null, "/", true, null);

	// 当前路径
	curDir: FileNode;

	private _enableWatch=true;

	constructor() {
		super();
		this.curDir = this.root;
		setVFS(this);
	}

	/**
	 * 创建目录
	 * @param dir 
	 */
	async mkdir(dir: string) {
		let lastDir = this.curDir;
		await this.cd(dir, null, true);
		this.curDir = lastDir;
	}

	/**
	 * 删除目录
	 * @param dir 
	 */
	async rmdir(dir: string) {
		let lastDir = this.curDir;
		let dirname,
			basename = dir;
		if (dir.includes("/")) {
			dirname = WebPath.dirname(dir);
			basename = WebPath.basename(dir);
			await this.cd(dirname, null, false);
		}
		await this.curDir.rmdir(basename);
		this.curDir = lastDir;
	}

	/**
	 * 创建一个文件，并写入内容
	 * @param filepath 
	 * @param data 
	 */
	async createFile(filepath: string, data: string | ArrayBuffer) {
		return await this.save(filepath, data, true);
	}

	/**
	 * 更新文件内容
	 * @param f 
	 * @param data 
	 */
	async writefile(filepath: string, data: string | ArrayBuffer) {
		await this.save(filepath, data, false);
	}

	/**
	 * 读取文件的内容
	 * @param filepath 
	 * @param data 
	 * @param encode 
	 */
	async readfile(filepath: string, encode: 'utf8' | 'buffer' | 'img' | 'image') {
		return await this.load(filepath, encode);
	}

	/**
	 * 删除文件
	 * @param filepath 
	 */
	async rmFile(filepath: string) {
		let lastDir = this.curDir;
		let dirname,
			basename = filepath;
		if (filepath.includes("/")) {
			dirname = WebPath.dirname(filepath);
			basename = WebPath.basename(filepath);
			await this.cd(dirname, null, false);
		}
		this.curDir.rmFile(basename);
		this.curDir = lastDir;
	}

	link(node:FileNode, linkto:FileNode){
		node.child = linkto.child;
	}

	async copyfile(file:FileNode, dstpath:FileNode){
		if(!file||!file.data)	return;
		await dstpath.createFile(file.name, file.data);
	}

	/**
	 * 拷贝两个目录
	 * @param dst 
	 * @param src 
	 * @param rmsrc  	是否删除源目录
	 * @param r 		是否递归
	 */
	async copydir(dst:FileNode, src:FileNode, rmsrc=false, r=true){
		if(!dst) return;
		if(!src) return;
		let c = src.child;
		for(let i in c){
			let cf = src.child[i];
			if(cf.isDirectory){
				await dst.mkdir(cf.name);
				await this.copydir(dst.child[cf.name], cf)
			}else{
				await this.copyfile(cf,dst)
			}
		}
	}

	/**
	 * 
	 * @param path 必须是根目录开始
	 */
	getNode(path:string){
		let paths = path.split(/[\/\\]/);
		let len = paths.length;
		let cp:FileNode = this.root;

		for (let i = 0; i < len; i++) {
			let c = paths[i];
			if(c=='') continue;
			cp = cp.child[c];
			if(!cp) return null;
		}
		return cp;
	}

	/**
	 * 跳到某个目录下。
	 * 为了方便，目录也可以是文件
	 * @param path 路径或者文件。如果是文件的话，则目录调整到文件所在目录
	 * @param formatedPath 如果提供这个参数，就会返回实际经过的路径
	 * @param create  如果不存在的话，就创建
	 */
	async cd(path: string, formatedPath?: FileNode[]|null, create = false) {
		if (formatedPath) formatedPath.length = 0;
		if (path === '/') {
			// 回到根目录，这个容易
			this.curDir = this.root;
			if (formatedPath) formatedPath.push(this.root);
			return this.root;
		}

		// 如果是个绝对路径
		if (path[0] === '/') {
			// 去掉根目录
			path = path.substr(1);
			this.curDir = this.root;
		}

		let cDir:FileNode|null = this.curDir;
		formatedPath && formatedPath.push(cDir);
		let paths = path.split(/[\/\\]/);
		let len = paths.length;
		for (let i = 0; i < len; i++) {
			if (!cDir.isDirectory) {
				throw 'not dir';
			}

			let cp = paths[i];
			// 由于不规范可能会有 // 分隔形成的空字符串
			if (cp.length <= 0) continue;
			if (cp == '.') continue;
			if (cp == '..') {
				cDir = cDir.parent;
				formatedPath && formatedPath.pop();
				if (!cDir) {
					throw 'parent not exist'
				}
				continue;
			}

			if (!cDir.child[cp]) {
				if (create) {
					//throw '还没有实现';
					//TODO 如果是webfs就真的创建，如果都是远端的，则创建一个对象就行了
					await cDir.mkdir(cp);
					cDir = cDir.child[cp];
				} else {
					console.log('no dir ',cp)
					throw 'no dir '+cp;
				}
			} else {
				cDir = cDir.child[cp];
			}

			if (!cDir.isDirectory && i == len - 1) {
				// url的最后一个是文件，则正常停止。回退到目录
				cDir = cDir.parent;
				break;
			}

			formatedPath && formatedPath.push(cDir);

			// 目录还没有加载，加载他
			if (cDir.isDirectory && !cDir.child) {
				await cDir.readChild();
			}
		}
		this.curDir = cDir!;
		return cDir!;
	}

	private _getFileName(url: string) {
		let lastSp = Math.max(url.lastIndexOf('/'), url.lastIndexOf('\\'));
		if (lastSp < 0) return url;
		return url.substr(lastSp + 1);
	}

	async load(url: string, encode: 'utf8' | 'buffer' | 'img' | 'image') {
		// 拆分出文件和路径
		// 由于是异步的 ,保存和恢复路径就变得不可靠了，所以不要做了。
		//let lastDir = this.curDir;		
		let curdir:FileNode;
		try {
			// 由于是异步的，这里必须立即保存到curdir中，this.curDir随时会被别人修改
			curdir = await this.cd(url, null);
		} catch (e) {
			return null;
		}
		let filename = this._getFileName(url);
		let finfo = curdir.child[filename];
		if (!finfo) {
			throw 'no this file';
		}
		let ret = await finfo.readFile(encode);
		// 恢复原来的当前路径。
		//this.curDir = lastDir;
		return ret;
	}

	/**
	 * 保存文件内容
	 * @param url 
	 * @param data 
	 * @param create 
	 */
	async save(url: string, data: any, create: boolean = false) {
		// 有异步操作，保存恢复lastdir是不合理的
		//let lastDir = this.curDir;
		let filename = this._getFileName(url);
		let path = url.substr(0, url.length - filename.length - 1);
		let curdir = await this.cd(path, null, create);
		if (create && curdir.child[filename]) {
			create = false;
		}
		if (create) {
			await curdir.createFile(filename, data);
		} else {
			let fileinfo = curdir.child[filename];
			if (!fileinfo) {
				throw `file ${filename} is not exist`;
			}
			await fileinfo.writeFile(data);
		}
		//this.curDir = lastDir;
		return curdir.child[filename];
	}

	/**
	 * 获取当前场景所有文件列表
	 */
	async getAllFile() {
		return await this.root.getAllFile();
	}

	printAllFiles(){
		let c = this.root;
		let ret = {};
		let curobj = ret;
		this._printAllFiles(c,ret);
		(ret as any).__proto__ =null;
		return ret;
	}

	private _printAllFiles(node:FileNode, curobj:any){
		for(let f in node.child){
			let cnode = node.child[f];
			if(cnode.isDirectory){
				let cobj = curobj[f]={};
				(cobj as any).__proto__ =null;
				this._printAllFiles(cnode, cobj);
			}else{
				curobj[f]=cnode;
			}
		}
	}

	set enableWatch(b:boolean){
		this._enableWatch=b;
	}
	get enableWatch(){
		return this._enableWatch
	}

	//以后可能要换成异步的。
	traverse(cb:(f:FileNode)=>string, c:FileNode|null){
		if(!c) return;
		for( let f of c){
			if(f.isDirectory){
				this.traverse(cb,f);
			}else{
				let r = cb(f);
				if(r=='stop') break;
			}
		}
	}

}

