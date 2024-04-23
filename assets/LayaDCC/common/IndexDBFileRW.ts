import { IGitFSFileIO } from "./gitfs/GitFS";

export class IndexDBFileRW implements IGitFSFileIO {
    private dbName: string;
    private storeName: string;
    private dbVersion: number;
    private db: IDBDatabase | null;
    repoPath='';
    constructor() {
        this.dbName = 'filesDB';
        this.storeName = 'files';
        this.dbVersion = 1;
        this.db = null;
        // 初始化数据库
        //this.initDB();
    }
    
    fetch(url: string): Promise<Response> {
        throw new Error("Method not implemented.");
    }
    async init(repoPath:string,cachePath:string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!window.indexedDB) {
                console.error("Your browser doesn't support IndexedDB");
                reject("Your browser doesn't support IndexedDB"); // 使用 reject 报告错误
                return;
            }
    
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = (event) => {
                console.error('Database error: ', (event.target as IDBRequest).error);
                debugger;
                reject((event.target as IDBRequest).error); // 使用 reject 报告错误
            };
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result; // 成功设置数据库实例
                resolve(); // 成功时调用 resolve
            };
            // 创建对象存储只发生在首次或版本有变化时
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                db.createObjectStore(this.storeName, { keyPath: 'url' });
                // 注意：在 onupgradeneeded 中不需要调用 resolve 或 reject
                // 因为它通常会在 onsuccess 或 onerror 之前触发
            };
        });
    }

    async read(url: string, encode: 'utf8' | 'buffer',onlylocal:boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction([this.storeName]);
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(url);
            request.onerror = function(event) {
                reject('Unable to retrieve data');
                debugger;
            };
            request.onsuccess = function(event) {
                if (request.result && request.result.content) {
                    const result: ArrayBuffer = request.result.content;
                    if(typeof result == 'string'){
                        if(encode==='utf8') resolve(result);
                        else{
                            resolve(new TextEncoder().encode(result));
                        }
                    }else{
                        //保存的是buffer
                        if(encode=='buffer') resolve(result);
                        else{
                            resolve(new TextDecoder().decode(result));
                        }
                    }
                } else {
                    reject('URL not found');
                }
            };
        });
    }
    async write(url: string, content: string | ArrayBuffer, overwrite = true): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            if (!overwrite) {
                const request = objectStore.get(url);
                request.onsuccess = () => {
                    if (request.result) {
                        reject('File already exists and overwrite is false');
                        return;
                    } else {
                        this.storeData(objectStore, url, content, resolve, reject);
                    }
                };
            } else {
                this.storeData(objectStore, url, content, resolve, reject);
            }
        });
    }
    private storeData(store: IDBObjectStore, url: string, content: string | ArrayBuffer, resolve: (value?: void | PromiseLike<void>) => void, reject: (reason?: any) => void) {
        let data = { url: url, content: content };
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Could not write to store');
    }
    async isFileExist(url: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const transaction = this.db.transaction([this.storeName]);
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(url);
            request.onsuccess = () => {
                resolve(!!request.result);
            };
            request.onerror = () => {
                reject('Could not check file existence');
            };
        });
    }
    // 空实现，示例中跳过加密解密及编码解码部分
    unzip(buff: ArrayBuffer): ArrayBuffer {
        return buff;
    }
    zip(buff: ArrayBuffer): ArrayBuffer {
        return buff;
    }
    textencode(text: string): ArrayBuffer {
        return new TextEncoder().encode(text);
    }
    textdecode(buffer: ArrayBuffer, off: number = 0): string {
        return new TextDecoder().decode(buffer);
    }
    async mv(src: string, dst: string): Promise<void> {
        try {
            const data = await this.read(src, 'buffer',true);
            await this.write(dst, data as ArrayBuffer);
            await this.delete(src);
        } catch (error) {
            throw new Error('Move operation failed');
        }
    }
    private async delete(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            const request = this.db.transaction([this.storeName], 'readwrite')
                              .objectStore(this.storeName)
                              .delete(url);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Delete operation failed: ' + event);
        });
    }

    async rm(url:string):Promise<void>{
        await this.delete(url);
    }

    async enumCachedObjects(callback:(objid:string)=>void):Promise<void>{
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
    
            // 创建一个用于读写的事务来访问文件存储
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
    
            // 打开具有游标的请求来遍历所有记录
            const request = objectStore.openCursor();
            
            request.onerror = function(event) {
                console.error('Error reading data.');
                reject('Failed to open cursor on object store');
            };
    
            request.onsuccess = async (event) => {
                const cursor = request.result;
                if (cursor) {
                    let key = cursor.key as string;
                    if(key.startsWith('objects/')){
                        key = key.substring(8);
                        key = key.replaceAll('/','');
                        callback(key);
                    }
                    cursor.continue();
                } else {
                    // 如果没有更多数据（即 cursor 为 null），完成遍历
                    resolve();
                }
            };
        });
    }

    async deleteAllFiles(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
    
            // 创建一个用于读写的事务来访问文件存储
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
    
            // 打开具有游标的请求来遍历所有记录
            const request = objectStore.openCursor();
            
            request.onerror = function(event) {
                console.error('Error reading data.');
                reject('Failed to open cursor on object store');
            };
    
            request.onsuccess = async (event) => {
                const cursor = request.result;
                if (cursor) {
                    // 如果有数据，则删除当前对象，并继续
                    objectStore.delete(cursor.key).onsuccess = function() {
                        console.log(`Deleted file with url: ${cursor.key}`);
                    };
                    cursor.continue();
                } else {
                    // 如果没有更多数据（即 cursor 为 null），完成遍历
                    console.log('No more entries!');
                    resolve();
                }
            };
        });
    }    
}