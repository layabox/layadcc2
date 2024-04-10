import { FileNode, FSType } from "./FSData";

/**
 * 内存文件系统
 */
export class MemFSFileInfo extends FileNode {
	constructor(name: string, isDirectory: boolean, parent: MemFSFileInfo|null) {
		super(name, isDirectory, parent);
		this.type = FSType.MEM;
	}
	// 显式调用这个获得子目录内容， if( isDirectory && !child) getChild()
	// 1. 返回一个对象，这个对象在一个单独面板中显示，对象完成后会有数据变化通知
	async readChild() { }

	/**
	 * 在当前目录下创建目录
	 * @param name 
	 */
	async mkdir(name: string) {
		return this.mkdirSync(name);
	}

	mkdirSync(name:string):FileNode{
		if (!this.isDirectory) {
			throw `${this.name} not a dir`;
		}
		if (!!this.child[name]) {
			console.error(`mkdir: ${name}: File exists`);
			throw `mkdir: ${name}: File exists`;
		}
		return this.addchild(name, new MemFSFileInfo(name, true, this));
	}

	/**
	 * 在当前目录下删除目录
	 * @param name 
	 */
	async rmdir(name: string) {
		// TODO 递归调用删除通知
		if (!this.isDirectory) {
			throw `${this.name} not a dir`;
		}
		if (!this.child[name]) {
			console.error(`rmdir: ${name}: No such file or dirctory`);
			return;
		}
		if (!this.child[name].isDirectory) {
			throw `rmdir: ${name} is not dirctory`;
		}
		delete this.child[name];
	}

	/**
	 * 在当前目录下创建一个文件，并写入内容
	 * @param file 
	 * @param data 
	 */
	async createFile(filename: string, data: string | ArrayBuffer) {
		this.createFileSync(filename,data);
	}

	createFileSync(filename: string, data: string | ArrayBuffer) {
		if (!this.isDirectory) {
			throw `${this.name} not a dir`;
		}
		if (this.child[filename]) {
			console.error(`文件 ${filename} 已存在，请使用 writeFile ，默认执行 writeFile`);
			this.child[filename].writeFile(data);
			return;
		}
		let fi = new MemFSFileInfo(filename, false, this);
		this.addchild(filename, fi);
		fi.writeFile(data);
	}	

	/**
	 * 加载文件的内容
	 */
	async readFile(encode: 'utf8' | 'buffer' | 'img' | 'image') {
		if (this.isDirectory) {
			throw `rmfile: ${this.name} is dirctory`;
		}
		if( encode=='utf8' && typeof(this.data)!='string'){
			if(this.data instanceof ArrayBuffer){
				return (new TextDecoder()).decode(new Uint8Array(this.data));
			}else{
				console.error('请求读取string，但是文件不是string类型',this.getFullPath());
			}
		}
		return this.data;
	}

	/**
	 * 更新自己的文件内容
	 * @param data 
	 */
	async writeFile(data: string | ArrayBuffer) {
		if (this.isDirectory) {
			throw `writeFile: ${this.name} is dirctory`;
		}
		if( (data as Object).constructor==String ||(data as Object).constructor==ArrayBuffer){
			this.data = data;
			this.onFileChange();
		}else{
			console.error('write file 错误，不支持的数据类型 ', data)
			throw '写文件不支持的数据类型'
		}
	}

	async rmFile(filename: string) {
		if (!this.isDirectory) {
			throw `${this.name} not a dir`;
		}
		if (!this.child[filename]) {
			console.error(`rmfile: ${filename}: No such file or dirctory`);
			return;
		}
		if (this.child[filename].isDirectory) {
			throw `rmfile: ${filename} is dirctory`;
		}
		delete this.child[filename];
	}

	/**
	 * 获取所有文件列表
	 */
	getAllFile() {
		let fileObj = {
			"/": {}
		};
		getFolderList(this, fileObj["/"]);
		function getFolderList(fi: FileNode, obj:any) {
			let child = fi.child;
			let filenames = Object.keys(child);
			let name, data;
			for (let i = 0, len = filenames.length; i < len; i++) {
				name = filenames[i];
				if (child[name].isDirectory) {
					obj[name] = {};
					getFolderList(child[name], obj[name]);
				} else {
					let data = child[name].data;
					if ("string" === typeof data) {
						data = data.slice(0, 20);
					} else {
						data = `name=${name}`;
					}
					obj[name] = data;
				}
			}
		}
		console.log(JSON.stringify(fileObj, null, 4));
		return fileObj;
	}
}