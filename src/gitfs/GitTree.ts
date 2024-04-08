//import { toHex } from "../utils/shasum";
//import { readUTF8, writeUTF8 } from "./GitIndex";

import { GitFS, IFileRW } from "./GitFS";
import { hashToArray, readUTF8, shasum, toHex, writeUTF8 } from "./GitFSInit";

export enum EntryType{
	TREE='tree',
	BLOB='blob',
	COMMIT='commit'	
}

export class TreeEntry {
	mode: string;
	path: string;
	oid: Uint8Array|null=null;	// 长度为20. null表示还不知道。 TODO 修改：刚开始是buffer，一旦下载了，就变成treeNode对象了，这样就不用维护两个东西
	packid:Uint8Array|null=null;	// 保留
	treeNode:TreeNode|null=null;	// 如果是目录的话，且目录被下载了，则指向目录的的treeNode
	owner!:TreeNode;	// 属于哪个Node
	type: EntryType;				// mode 对应的字符串， 
	flags=0;			// 一些标记。例如是否压缩，
	touchFlag=0;		// 同步时做删除标记用。运行时数据，随时在变
	fileMTime:Date;		// 对应文件的修改时间
	get idstring(){
		return toHex(this.oid!)
	}
	get isDir(){
		return this.mode.charAt(0)=='0';
	}
	static dirMode='040000';
	static blobMode = '100644';
	
	constructor(path:string, mode:string, oid:Uint8Array|null){
		this.path=path;
		this.mode=mode;
		this.type = mode2type(mode);
		this.oid=oid?new Uint8Array(oid):null;
	}

	// 为了调试方便，在命令行获取这个值就触发openNode
	get dbgGetTreeNode(){
		return this.get_treeNode();
	}

	async get_treeNode(){
		if(!this.treeNode){
			//TEST
			let win = window as any;
			if(win.gitfs && win.gitfs.gitfs){
				let gitfs = win.gitfs.gitfs as GitFS;
				this.treeNode = await gitfs.openNode(this);
			}
		}
		return this.treeNode;
	}

	modeToInt(){
		return parseInt(this.mode, 16);
	}
}

export class TreeNode{
	_entries:TreeEntry[]=[];
	parent:TreeNode|null=null;
	buff:Uint8Array|null=null; 	// 计算sha需要先转成buff。由于计算sha和提交都需要这个buff，所以，每次计算sha都会更新并保存这个buff。 如果有zip的话，这个是zip之后的
	sha:string|null=null;				// null或者'' 表示没有计算，或者原来的失效了，需要重新计算
	// 是否提交了。设置会变化的时候，会设置这个，提交完成后清理。避免重复统计和提交
	// 统计变化的时候设为false， push之后再次恢复为true
	//needCommit=true;
	// 这个是不保存的。只是上层设置
	candownload=true;
	canupload=true;
	//TODO 把当前的子目录也打包到这个node下
	packSubTreeNode=false;
	// 本节点建议预加载的节点。要同时下载
	//preloadNodes:ArrayBuffer;


	constructor(entries: Uint8Array|TreeEntry[] | null, parent:TreeNode|null, frw:IFileRW){
		this.parent=parent;
		if (entries) {
			if (entries instanceof Uint8Array){
				this.parseBuffer(entries,frw);
			}
			else if(Array.isArray(entries)){
				this._entries = (entries as Array<any>).map(nudgeIntoShape)
				// Tree entries are not sorted alphabetically in the usual sense (see `compareTreeEntryPath`)
				// but it is important later on that these be sorted in the same order as they would be returned from readdir.
				// 根据路径排序
				//this._entries.sort(comparePath)
			}
		}
	}

	get entries() {
		if(!this._entries) this._entries=[];
		return this._entries
	}

	private getParentEntry(node:TreeNode){
		if(node.parent){
			let es = node.parent.entries;
			for(let i=0,n=es.length; i<n; i++){
				if(es[i].treeNode==node) return es[i];
			}
		}
		return null;
	}

	/**
	 * 
	 * @param node 要查询的节点
	 * @param path 
	 * @returns 
	 */
	private _getFullPath(node:TreeNode, path:string|null):string{
		let parent = this.getParentEntry(node);
		if(parent){
			let strpath = path?(parent.path+'/'+path):parent.path;
			return this._getFullPath(node.parent!, strpath);
		}
		return path||'/';
	}

	get fullPath(){
		return this._getFullPath(this,null);
	}

	getEntry(name:string){
		let ents = this._entries;
		for(let i=0,n=ents.length; i<n; i++){
			if(ents[i].path===name) return ents[i];
		}
		return null;
	}

	addEntry(name:string, isDir:boolean, oid:Uint8Array|null){
		let entry = new TreeEntry(name,isDir?TreeEntry.dirMode:TreeEntry.blobMode, oid?oid.slice(0):null);
		entry.owner=this;
		//entry.treeNode=this;
		this.entries.push(entry);
		// 修改了，要清理sha
		this.needSha();
		return entry;
	}

	/**
	 * 删除某个文件或者目录
	 * 只是从entries中删除，不是物理删除
	 * @param name 
	 * @returns 
	 */
	rmEntry(name:string|TreeEntry){
		let idx=-1;
		if(typeof name=='string'){
			idx = this.entries.findIndex(value=>{ return value.path==name; });
		}else if(name instanceof TreeEntry){
			idx = this.entries.indexOf(name);
		}
		if(idx>=0){
			this.entries.splice(idx,1);
			this.needSha();
			return true;
		}
		return false;
	}

	*[Symbol.iterator]() {
		for (const entry of this._entries) {
			yield entry
		}
	}

	/**
	 * 设置sha无效。
	 * 会通知到所有的父节点
	 * @returns 
	 */
	needSha(){
		// 下面的判断不合理。有些情况下并不是needSha给这两个赋值。例如刚创建就没有。所以先不要这个优化
		//if(this.sha==null&&this.buff==null)
		//	return;
		this.sha=null;
		this.buff=null;
		if(this.parent){
			this.parent.needSha();
		}
	}

	// 需要更新本节点的sha
	isNeedSha(){
		return (!this.sha)||(!this.buff);
	}

	/**
	 * 更新自己包括子的sha，同时记录变化的节点，用来push
	 * 这个每次提交的时候，只允许执行一次，放到生成commit的地方
	 */
	async updateAllSha(frw:IFileRW, changed:TreeNode[]){
		// 先计算子，再计算自己
		let entries = this.entries;
		for(let i=0, n=entries.length; i<n; i++){
			let entry = entries[i];
			let treenode = entry.treeNode;
			if(treenode ){
				let sha = await treenode.updateAllSha(frw, changed);
				entry.oid = hashToArray(sha);
			}
		}

		if(this.isNeedSha()){//如果sha值需要计算，则可能是需要commit的
			await this.toObject(frw);	// 这里会计算自己节点的sha
			//if(this.needCommit){// 通过这个标记避免重复push。 可能多次需要计算sha，但是commit只记录一次
				changed.push(this);
			//	this.needCommit=false;
			//}
		}
		return this.sha!;
	}


	parse_tree(buffer:Uint8Array){
		let entries = this._entries		
		let cursor = 5;	// 从 'tree '后开始
		let nullchar = buffer.indexOf(0, cursor);
		if (nullchar === -1) {
			console.error('tree后面没有找到0，格式不对')
			return;
		}
		let strLen = readUTF8(new Uint8Array(buffer.buffer.slice(cursor, nullchar)));
		let len = parseInt(strLen);
		cursor = nullchar + 1;
	
		while (cursor < buffer.length) {
			// mode name\0hash 所以先找空格，再找\0
			const space = buffer.indexOf(32, cursor)
			if (space === -1) {
				throw new Error(`GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`)
			}
			const nullchar = buffer.indexOf(0, cursor)
			if (nullchar === -1) {
				throw new Error(`GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next null character.`)
			}
			let mode = readUTF8(new Uint8Array(buffer.buffer.slice(cursor, space)));//  buffer.slice(cursor, space).toString('utf8')
			if (mode === '40000') mode = '040000' // makes it line up neater in printed output
			const type = mode2type(mode)
			const path = readUTF8(new Uint8Array(buffer.buffer.slice(space + 1, nullchar)));//  buffer.slice(space + 1, nullchar).toString('utf8')
	
			if (path.includes('\\') || path.includes('/')) {
				throw 'unsafe path:' + path;
			}

			const oid = new Uint8Array(buffer.buffer.slice(nullchar + 1, nullchar + 21));
			cursor = nullchar + 21;
			let entry = new TreeEntry(path,mode,oid);
			entry.owner=this;
			entry.type=type;
			//entry.treeNode=this;
			entries.push( entry);
		}

		// 根据路径排序
		//entries.sort(comparePath)
		return entries
	}

	/**
	 * 
	 * @param buffer 
	 */
	parse_Tree(buffer:Uint8Array){
		let cursor = 8; 	//'Tree    '
		let wreader = new DataView(buffer.buffer);
		let len = wreader.getUint32(cursor,true);	// len:uint32
		// mode: uint32
		// oid: char[20]
		// path: len:uint16, ...
	}

	parseBuffer(zippedbuffer: Uint8Array, frw:IFileRW) {
		this.buff=zippedbuffer;
        let buffer = new Uint8Array(frw.unzip(zippedbuffer));

		let entries = this._entries;//: TreeEntry[] = []
		entries.length=0;

		//前面必须是tree
		if ((buffer[0] == 0x74 && buffer[1] == 0x72 && buffer[2] == 0x65 && buffer[3] == 0x65 && buffer[4] == 0x20)) {//'tree '
			return this.parse_tree(buffer);
		}
		if ((buffer[0] == 84 && buffer[1] == 0x72 && buffer[2] == 0x65 && buffer[3] == 0x65 && buffer[4] == 0x20)) {//'Tree '
			return this.parse_Tree(buffer);
		}

	}	

	// 保存成一个buffer
	async toObject(frw:IFileRW, zip = true) {
		// Adjust the sort order to match git's
		const entries = this._entries?[...this._entries]:[];
		entries.sort(compareTreeEntryPath)

		let totallen = 0;
		let entrylen = 0;

		entries.map(entry => {
			let mode = entry.mode.replace(/^0/, '');
			entrylen += mode.length;
            entrylen += 1;	//空格
            let length = new TextEncoder().encode(entry.path).length;
			entrylen += length;//entry.path.length;
			entrylen += 1;//0
			entrylen += 20;
		});
		totallen = 5 + entrylen.toString().length + 1 + entrylen;
		let retbuf = new Uint8Array(totallen);
		let cursor = writeUTF8(retbuf, 'tree ', 0);
		cursor += writeUTF8(retbuf, entrylen.toString(), cursor);
		retbuf[cursor] = 0; cursor += 1;
		entries.map(entry => {
			let mode = entry.mode.replace(/^0/, '');
			cursor += writeUTF8(retbuf, mode, cursor);
			retbuf[cursor] = 0x20; cursor += 1;
			cursor += writeUTF8(retbuf, entry.path, cursor);
			retbuf[cursor] = 0; cursor += 1;
			if(!(entry.oid instanceof Uint8Array)){
				throw 'oid type error';
			}
			retbuf.set(entry.oid, cursor);
			cursor += 20;
		});

		if (frw && zip) {
			retbuf = new Uint8Array(frw.zip(retbuf));
		}
		this.sha = await shasum(retbuf,true) as string;
		this.buff = retbuf;
		return retbuf;
	}

	/**
	 * 如果所有的子加起来不到100k，则都加到一起
	 * 
	 */
	async mergeChild(){

	}
	
	/**
	 * 限制每个文件占用<40字节
	 * 兼容性考虑：需要满足向上兼容，老版本也要能打开新版数据，维持链的完整
	 * @param frw 
	 * @param zip 
	 * @returns 
	 */
	async toBuffer(frw:IFileRW, zip = true) {
		const entries = this._entries;
		//entries.sort(compareTreeEntryPath)

		let totallen = 8+4;	// 'Tree   '+totalLen
		let entrylen = entries.length;	// 用写这个么？

		// 基本块：entries
		// nameid, start, length
		// 

		entries.map(entry => {
			totallen+=4;	//mode:uint32
			totallen+=20;	//oid:char[20]
			totallen+=2;	//pathlen:u16
            totallen += new TextEncoder().encode(entry.path).length;
		});
		let retbuf = new Uint8Array(totallen);
		let bufw = new DataView(retbuf.buffer);
		writeUTF8(retbuf, 'Tree    ', 0);
		bufw.setUint32(8,totallen,true);
		let cursor=12;

		entries.map(entry => {
			// mode
			bufw.setUint32(cursor, entry.modeToInt(), true);
			cursor+=4;
			if(!(entry.oid instanceof Uint8Array)){
				throw 'oid type error';
			}
			// hash
			retbuf.set(entry.oid,cursor);
			cursor+=20;

			// pathlen
			let pathlen = entry.path.length;
			bufw.setUint16(cursor,pathlen,true);
			cursor+=2;

			// path
			cursor += writeUTF8(retbuf, entry.path, cursor);
			cursor+=pathlen;
		});

		if (frw && zip) {
			retbuf = new Uint8Array(frw.zip(retbuf));
		}
		this.sha = await shasum(retbuf,true) as string;
		this.buff = retbuf;
		return retbuf;
	}	
}

function compareStrings(a: string, b: string) {
	// https://stackoverflow.com/a/40355107/2168416
	return -(a < b) || +(a > b)
}

function comparePath(a: TreeEntry, b: TreeEntry) {
	return compareStrings(a.path, b.path)
}

function compareTreeEntryPath(a: TreeEntry, b: TreeEntry) {
	// Git sorts tree entries as if there is a trailing slash on directory names.
	return compareStrings(appendSlashIfDir(a), appendSlashIfDir(b))
}

function appendSlashIfDir(entry: TreeEntry) {
	return entry.mode === '040000' ? entry.path + '/' : entry.path
}

function mode2type(mode: string) {
	// prettier-ignore
	switch (mode) {
		case '040000': return EntryType.TREE;
		case '100644': return EntryType.BLOB;
		case '100755': return EntryType.BLOB;
		case '120000': return EntryType.BLOB;
		case '160000': return EntryType.COMMIT;
	}
	throw new Error(`Unexpected GitTree entry mode: ${mode}`)
}

let reg_dir    = /^0?4.*/;
let reg_nexe   = /^1006.*/;
let reg_exe    = /^1007.*/;
let reg_slink  = /^120.*/;
let reg_commit = /^160.*/;

function limitModeToAllowed(mode: number | string) {
	if (typeof mode === 'number') {
		mode = mode.toString(8)
	}
	if (mode.match(reg_dir)) return '040000' // Directory
	if (mode.match(reg_nexe)) return '100644' // Regular non-executable file
	if (mode.match(reg_exe)) return '100755' // Regular executable file
	if (mode.match(reg_slink)) return '120000' // Symbolic link
	if (mode.match(reg_commit)) return '160000' // Commit (git submodule reference)
	throw new Error(`Could not understand file mode: ${mode}`)
}

function nudgeIntoShape(entry:TreeEntry) {
	entry.mode = limitModeToAllowed(entry.mode) // index
	if (!entry.type) {
		entry.type = mode2type(entry.mode) // index
	}
	return entry
}
