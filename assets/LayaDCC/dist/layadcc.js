!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.layadcc=e():t.layadcc=e()}(self,(()=>(()=>{"use strict";var t={d:(e,r)=>{for(var i in r)t.o(r,i)&&!t.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:r[i]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{LayaDCCClient:()=>Z});class r{async getRes(t,e){return conch.readFileFromAsset(t,e)}}class i{repoPath;constructor(t){this.repoPath=t}init(t,e){throw new Error("Method not implemented.")}fetch(t){throw new Error("Method not implemented.")}async read(t,e,r){let i=this.repoPath+"/"+t;return conch.readFileFromAsset(i,e)}write(t,e,r){throw new Error("Method not implemented.")}isFileExist(t){throw new Error("Method not implemented.")}unzip(t){throw new Error("Method not implemented.")}zip(t){throw new Error("Method not implemented.")}textencode(t){throw new Error("Method not implemented.")}textdecode(t,e){throw new Error("Method not implemented.")}rm(t){throw new Error("Method not implemented.")}enumCachedObjects(t){throw new Error("Method not implemented.")}mv(t,e){throw new Error("Method not implemented.")}}class n{static log=!0}class o{static get runtimeName(){return window.conch?"layaNative":"web"}static isNative(){}static isWeb(){}static isNode(){}static dcodeUtf8(t){if(window.conch){let e=function(t){let e=0;var r,i,n=t.byteLength,o=String.fromCharCode,a=new Uint8Array(t),s=[],l=0;for(s.length=1e3;e<n;)if((r=a[e++])<128)0!=r&&(s[l++]=o(r));else if(r<224)s[l++]=o((63&r)<<6|127&a[e++]);else if(r<240)i=a[e++],s[l++]=o((31&r)<<12|(127&i)<<6|127&a[e++]);else{const t=(15&r)<<18|(127&(i=a[e++]))<<12|(127&a[e++])<<6|127&a[e++];if(t>=65536){const e=t-65536,r=55296|e>>10,i=56320|1023&e;s[l++]=o(r),s[l++]=o(i)}else s[l++]=o(t)}return s.length=l,s.join("")}(t);return e}return(new TextDecoder).decode(t)}}class a{dbName;storeName;dbVersion;db;repoPath="";constructor(){this.dbName="filesDB",this.storeName="files",this.dbVersion=1,this.db=null}fetch(t){throw new Error("Method not implemented.")}async init(t,e){return new Promise(((t,e)=>{if(!window.indexedDB)return console.error("Your browser doesn't support IndexedDB"),void e("Your browser doesn't support IndexedDB");const r=indexedDB.open(this.dbName,this.dbVersion);r.onerror=t=>{console.error("Database error: ",t.target.error),e(t.target.error)},r.onsuccess=e=>{this.db=e.target.result,t()},r.onupgradeneeded=t=>{t.target.result.createObjectStore(this.storeName,{keyPath:"url"})}}))}async read(t,e,r){return new Promise(((r,i)=>{if(!this.db)return void i("Database not initialized");const n=this.db.transaction([this.storeName]).objectStore(this.storeName).get(t);n.onerror=function(t){i("Unable to retrieve data")},n.onsuccess=function(t){if(n.result&&n.result.content){const t=n.result.content;r("string"==typeof t?"utf8"===e?t:(new TextEncoder).encode(t):"buffer"==e?t:(new TextDecoder).decode(t))}else i("URL not found")}}))}async write(t,e,r=!0){return new Promise((async(i,n)=>{if(!this.db)return void n("Database not initialized");const o=this.db.transaction([this.storeName],"readwrite").objectStore(this.storeName);if(r)this.storeData(o,t,e,i,n);else{const r=o.get(t);r.onsuccess=()=>{r.result?n("File already exists and overwrite is false"):this.storeData(o,t,e,i,n)}}}))}storeData(t,e,r,i,n){let o={url:e,content:r};const a=t.put(o);a.onsuccess=()=>i(),a.onerror=()=>n("Could not write to store")}async isFileExist(t){return new Promise(((e,r)=>{if(!this.db)return void r("Database not initialized");const i=this.db.transaction([this.storeName]).objectStore(this.storeName).get(t);i.onsuccess=()=>{e(!!i.result)},i.onerror=()=>{r("Could not check file existence")}}))}unzip(t){return t}zip(t){return t}textencode(t){return(new TextEncoder).encode(t)}textdecode(t,e=0){return(new TextDecoder).decode(t)}async mv(t,e){try{const r=await this.read(t,"buffer",!0);await this.write(e,r),await this.delete(t)}catch(t){throw new Error("Move operation failed")}}async delete(t){return new Promise(((e,r)=>{if(!this.db)return void r("Database not initialized");const i=this.db.transaction([this.storeName],"readwrite").objectStore(this.storeName).delete(t);i.onsuccess=()=>e(),i.onerror=t=>r("Delete operation failed: "+t)}))}async rm(t){await this.delete(t)}async enumCachedObjects(t){return new Promise(((e,r)=>{if(!this.db)return void r("Database not initialized");const i=this.db.transaction([this.storeName],"readwrite").objectStore(this.storeName).openCursor();i.onerror=function(t){console.error("Error reading data."),r("Failed to open cursor on object store")},i.onsuccess=async r=>{const n=i.result;if(n){let e=n.key;e.startsWith("objects/")&&(e=e.substring(8),e=e.replaceAll("/",""),t(e)),n.continue()}else e()}}))}async deleteAllFiles(){return new Promise(((t,e)=>{if(!this.db)return void e("Database not initialized");const r=this.db.transaction([this.storeName],"readwrite").objectStore(this.storeName),i=r.openCursor();i.onerror=function(t){console.error("Error reading data."),e("Failed to open cursor on object store")},i.onsuccess=async e=>{const n=i.result;n?(r.delete(n.key).onsuccess=function(){console.log(`Deleted file with url: ${n.key}`)},n.continue()):(console.log("No more entries!"),t())}}))}}class s{originDownloader;dcc;originNativeDownloader;myNativeDownloadFunc;myDownloader;_logger;constructor(t,e=null){this.dcc=t,this._logger=e}injectToLaya(){if(this.myDownloader&&Laya.Loader.downloader==this.myDownloader)return;this.originDownloader=Laya.Loader.downloader;let t=this.myDownloader=new Laya.Downloader;t.audio=this.audio.bind(this),t.image=this.image.bind(this),t.common=this.common.bind(this),t.imageWithBlob=this.imageWithBlob.bind(this),t.imageWithWorker=this.imageWithWorker.bind(this),Laya.Loader.downloader=t}removeFromLaya(){Laya.Loader.downloader==this.myDownloader&&(Laya.Loader.downloader=this.originDownloader)}injectToNativeFileReader(){let t=window;t.downloadfile!=this.myNativeDownloadFunc&&(this.originNativeDownloader=t.downloadfile,this.myNativeDownloadFunc=(t,e,r,i)=>{let n=t.indexOf("?");n>0&&(t=t.substring(0,n)),this.dcc.readFile(t).then((t=>{r(o.dcodeUtf8(t))}),(t=>{i()}))},t.downloadfile=this.myNativeDownloadFunc)}removeFromNative(){let t=window;t.downloadfile==this.myNativeDownloadFunc&&(t.downloadfile=this.originNativeDownloader)}imageWithBlob(t,e,r,i,n){this._logger&&this._logger.checkLog(`download:imageWithBlob:${r}`),this.originDownloader.imageWithBlob.call(this.originDownloader,t,e,r,i,n)}imageWithWorker(t,e,r,i,n){this._logger&&this._logger.checkLog(`download:imageWithWorker:${r}`),this.originDownloader.imageWithWorker.call(this.originDownloader,t,e,r,i,n)}audio(t,e,r,i,n){this._logger&&this._logger.checkLog(`download:audio:${r}`),this.originDownloader.audio.call(this.originDownloader,t,e,r,i,n)}common(t,e,r,i,n,a){let s;this._logger&&this._logger.checkLog(`download:common:${r}`),this.dcc.onlyTransUrl?(s=this.dcc.transUrl(e),this._logger&&this._logger.checkLog(`download:common:onlyTransUrl:${r}`)):s=(async()=>{let t=await this.dcc.readFile(e);if(!t)return this._logger&&this._logger.checkLog(`download:common:readFile(${e}) error`),e;switch(this._logger&&this._logger.checkLog(`download:common:readFile(${e}) OK`),i){case"text":return a(o.dcodeUtf8(t)),null;case"json":return a(JSON.parse(o.dcodeUtf8(t))),null;case"arraybuffer":return a(t),null;default:var r=new Blob([t],{type:"application/octet-binary"});return window.URL.createObjectURL(r)}})(),s.then((e=>{e&&(this.originDownloader.common.call(this.originDownloader,t,e,r,i,n,a),this._logger&&this._logger.checkLog(`download:common:originCommon(${r})`))}))}image(t,e,r,i,n){let o;o=this.dcc.onlyTransUrl?this.dcc.transUrl(e):(async()=>{let t=await this.dcc.readFile(e);if(!t)return e;var r=new Blob([t],{type:"application/octet-binary"});return window.URL.createObjectURL(r)})(),o.then((e=>{this.originDownloader.image.call(this.originDownloader,t,e,r,i,n)}))}}class l{_frw;packPath="packfile/";_idxFile;_packFile;idxInfo;constructor(t,e,r){this._frw=e;let i="tree"==t?"tree-":"blob-";this._idxFile=this.packPath+i+r+".idx",this._packFile=this.packPath+i+r+".pack"}async init(){try{this.idxInfo=JSON.parse(await this._frw.read(this._idxFile,"utf8",!0))}catch(t){throw"open pack error"}return!0}async has(t){return this.idxInfo.some((e=>e.id===t))}async get(t){const e=this.idxInfo.find((e=>e.id===t));if(!e)throw new Error(`Object ID ${t} not found`);return await this.readPart(this._packFile,e.start,e.start+e.length)}async readPart(t,e,r){return(await this._frw.read(t,"buffer",!0)).slice(e,r)}}class h{cachePath;resReader=new r;treePacks=[];blobPacks=[];constructor(t="cache"){t.startsWith("/")&&(t=t.substring(1)),t.endsWith("/")&&(t=t.substring(0,t.length-1)),this.cachePath=t}async init(){try{let t=new i(this.cachePath),e=await t.read("head.json","utf8",!0),r=JSON.parse(e);if(r.treePackages)for(let e of r.treePackages){let r=new l("tree",t,e);await r.init(),this.treePacks.push(r)}if(r.objPackages)for(let e of r.objPackages){let r=new l("blob",t,e);await r.init(),this.blobPacks.push(r)}}catch(t){return!1}return!0}async has(t){let e=this.cachePath+"/objects/"+t.substring(0,2)+"/"+t.substring(2);for(let e of this.treePacks)if(e&&await e.has(t))return!0;for(let e of this.blobPacks)if(e&&await e.has(t))return!0;return!!await this.resReader.getRes(e,"buffer")}async get(t){let e,r=this.cachePath+"/objects/"+t.substring(0,2)+"/"+t.substring(2);for(let r of this.treePacks)if(r&&(await r.has(t)&&(e=await r.get(t)),e))return c(`Get Object from TreePack:${t}`),e;for(let r of this.blobPacks)if(r&&(await r.has(t)&&(e=await r.get(t)),e))return c(`Get Object from TreePack:${t}`),e;return await this.resReader.getRes(r,"buffer")}}function c(t){n.log&&console.log(t)}const d=[1518500249,1859775393,-1894007588,-899497514],f={sha1:1};function u(t){if(t&&!f[t]&&!f[t.toLowerCase()])throw new Error("Digest method not supported");return new w}class w{A=1732584193;B=-271733879;C=-1732584194;D=271733878;E=-1009589776;_byte;_word;_size=0;_sp=0;constructor(){(!m||y>=8e3)&&(m=new ArrayBuffer(8e3),y=0),this._byte=new Uint8Array(m,y,80),this._word=new Int32Array(m,y,20),y+=80}update(t){if("string"==typeof t)return this._utf8(t);if(null==t)throw new TypeError("Invalid type: "+typeof t);const e=t.byteOffset,r=t.byteLength;let i=r/64|0,n=0;if(i&&!(3&e)&&!(this._size%64)){const r=new Int32Array(t.buffer,e,16*i);for(;i--;)this._int32(r,n>>2),n+=64;this._size+=n}if(1!==t.BYTES_PER_ELEMENT&&t.buffer){const i=new Uint8Array(t.buffer,e+n,r-n);return this._uint8(i)}return n===r?this:this._uint8(t,n)}_uint8(t,e){const{_byte:r,_word:i}=this,n=t.length;for(e|=0;e<n;){const o=this._size%64;let a=o;for(;e<n&&a<64;)r[a++]=t[e++];a>=64&&this._int32(i),this._size+=a-o}return this}_utf8(t){const{_byte:e,_word:r}=this,i=t.length;let n=this._sp;for(let o=0;o<i;){const a=this._size%64;let s=a;for(;o<i&&s<64;){let r=0|t.charCodeAt(o++);r<128?e[s++]=r:r<2048?(e[s++]=192|r>>>6,e[s++]=128|63&r):r<55296||r>57343?(e[s++]=224|r>>>12,e[s++]=128|r>>>6&63,e[s++]=128|63&r):n?(r=((1023&n)<<10)+(1023&r)+65536,e[s++]=240|r>>>18,e[s++]=128|r>>>12&63,e[s++]=128|r>>>6&63,e[s++]=128|63&r,n=0):n=r}s>=64&&(this._int32(r),r[0]=r[16]),this._size+=s-a}return this._sp=n,this}_int32(t,e){let{A:r,B:i,C:n,D:o,E:a}=this,s=0;for(e|=0;s<16;)g[s++]=b(t[e++]);for(s=16;s<80;s++)g[s]=_(g[s-3]^g[s-8]^g[s-14]^g[s-16]);for(s=0;s<80;s++){const t=s/20|0,e=P(r)+(h=i,c=n,f=o,0===(l=t)?h&c|~h&f:2===l?h&c|h&f|c&f:h^c^f)+a+g[s]+d[t]|0;a=o,o=n,n=N(i),i=r,r=e}var l,h,c,f;this.A=r+this.A|0,this.B=i+this.B|0,this.C=n+this.C|0,this.D=o+this.D|0,this.E=a+this.E|0}digest(t){const{_byte:e,_word:r}=this;let i=this._size%64|0;for(e[i++]=128;3&i;)e[i++]=0;if(i>>=2,i>14){for(;i<16;)r[i++]=0;i=0,this._int32(r)}for(;i<16;)r[i++]=0;const n=8*this._size,o=(4294967295&n)>>>0,a=(n-o)/4294967296;return a&&(r[14]=b(a)),o&&(r[15]=b(o)),this._int32(r),"hex"===t?this._hex():this._bin()}_hex(){const{A:t,B:e,C:r,D:i,E:n}=this;return p(t)+p(e)+p(r)+p(i)+p(n)}_bin(){const{A:t,B:e,C:r,D:i,E:n,_byte:o,_word:a}=this;return a[0]=b(t),a[1]=b(e),a[2]=b(r),a[3]=b(i),a[4]=b(n),o.slice(0,20)}}const g=new Int32Array(80);let m,y=0;const p=t=>(t+4294967296).toString(16).substr(-8),b=254===new Uint8Array(new Uint16Array([65279]).buffer)[0]?t=>t:t=>t<<24&4278190080|t<<8&16711680|t>>8&65280|t>>24&255,_=t=>t<<1|t>>>31,P=t=>t<<5|t>>>27,N=t=>t<<30|t>>>2;function D(t){return o.dcodeUtf8(t)}function j(t,e,r){let i=(new TextEncoder).encode(e);return t.set(i,r),i.length}let C=null;function k(t){let e="";for(const r of new Uint8Array(t))r<16&&(e+="0"),e+=r.toString(16);return e}function E(t){const e=t.padStart(40,"0");let r=new Uint8Array(20);for(let t=0;t<20;t++)r[t]=parseInt(e.substring(2*t,2*t+2),16);return r}async function v(t,e=!0){return null===C&&(C=await async function(){try{if("da39a3ee5e6b4b0d3255bfef95601890afd80709"===await T(new Uint8Array([])))return!0}catch(t){}return!1}()),C?T(t,e):function(t,e=!0){let r;return r=e?u().update(t).digest("hex"):u().update(t).digest(),r}(t,e)}async function T(t,e=!0){const r=new Uint8Array(await crypto.subtle.digest("SHA-1",t));return e?k(r):r}class A{tree;parent="0";author;author_timestamp;author_timezone;committer;committer_timestamp;committer_timezone;commitMessage;sha}class O{commitinfo;constructor(t,e){t instanceof ArrayBuffer?(this.commitinfo=new A,this.parse(t),this.commitinfo.sha=e):this.commitinfo=t}readString(t,e,r){let i=r>0?r:t.byteLength;return t=t.slice(e,e+i),D(new Uint8Array(t))}strToBuff(t){return(new TextEncoder).encode(t)}getStrLen(t,e,r=-1){let i=0;for(let n=0;n<r&&0!==t[e+n];n++)i++;return i}parse(t){let e=this.commitinfo,r=new Uint8Array(t),i=0;if("commit "!==this.readString(r,i,7))return!1;i+=7;let n=this.readString(r,i,this.getStrLen(r,i,100));i+=n.length+1;let o=this.readString(r,i,parseInt(n)),a=o.indexOf("tree ");if(a<0)return!1;let s=o.substr(a+5,40);e.tree=s;let l=o.indexOf("parent ",a+40);if(l<0)return!1;let h=o.substr(l+7,40);e.parent=h,e.commitMessage=o.substr(l+7+40+1)}idbuffToString(t){return t instanceof ArrayBuffer?k(new Uint8Array(t)):t instanceof Uint8Array?k(t):t}formatDate(t){return t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate()+" "+t.getHours()+":"+t.getMinutes()+":"+t.getSeconds()}async toBuffer(t){let e=this.idbuffToString(this.commitinfo.tree),r=this.commitinfo.parent?this.idbuffToString(this.commitinfo.parent):null,i="commit ",n="";n+="tree "+e+"a",r&&(n+="parent "+r+"a"),n+="author "+this.commitinfo.author+" "+this.formatDate(this.commitinfo.author_timestamp)+" \n\n "+this.commitinfo.commitMessage+"\n",i+=(new TextEncoder).encode(n).length,i+="\0",i+=n;let o=this.strToBuff(i);return t.zip&&(o=new Uint8Array(t.zip(o))),this.commitinfo.sha=await v(o,!0),o}}var x;!function(t){t.TREE="tree",t.BLOB="blob",t.COMMIT="commit"}(x||(x={}));class U{mode;path;oid;packid=null;treeNode=null;owner;type;flags=0;touchFlag=0;fileMTime;get idstring(){return k(this.oid)}get isDir(){return"0"==this.mode.charAt(0)}static dirMode="040000";static blobMode="100644";static InvalidOID=new Uint8Array(20);constructor(t,e,r){this.path=t,this.mode=e,this.type=L(e),this.oid=r?new Uint8Array(r):U.InvalidOID}get dbgGetTreeNode(){return this.get_treeNode()}async get_treeNode(){if(!this.treeNode){let t=window;if(t.gitfs&&t.gitfs.gitfs){let e=t.gitfs.gitfs;this.treeNode=await e.openNode(this)}}return this.treeNode}modeToInt(){return parseInt(this.mode,16)}}class S{_entries=[];parent=null;buff=null;sha=null;constructor(t,e,r){this.parent=e,t&&(t instanceof Uint8Array?this.parseBuffer(t,r):Array.isArray(t)&&(this._entries=t.map($)))}get entries(){return this._entries||(this._entries=[]),this._entries}getParentEntry(t){if(t.parent){let e=t.parent.entries;for(let r=0,i=e.length;r<i;r++)if(e[r].treeNode==t)return e[r]}return null}_getFullPath(t,e){let r=this.getParentEntry(t);if(r){let i=e?r.path+"/"+e:r.path;return this._getFullPath(t.parent,i)}return e||"/"}get fullPath(){return this._getFullPath(this,null)}getEntry(t){let e=this._entries;for(let r=0,i=e.length;r<i;r++)if(e[r].path===t)return e[r];return null}addEntry(t,e,r){let i=new U(t,e?U.dirMode:U.blobMode,r?r.slice(0):null);return i.owner=this,this.entries.push(i),this.needSha(),i}rmEntry(t){let e=-1;return"string"==typeof t?e=this.entries.findIndex((e=>e.path==t)):t instanceof U&&(e=this.entries.indexOf(t)),e>=0&&(this.entries.splice(e,1),this.needSha(),!0)}*[Symbol.iterator](){for(const t of this._entries)yield t}needSha(){this.sha=null,this.buff=null,this.parent&&this.parent.needSha()}isNeedSha(){return!this.sha||!this.buff}async updateAllSha(t,e){let r=this.entries;for(let i=0,n=r.length;i<n;i++){let n=r[i],o=n.treeNode;if(o){let r=await o.updateAllSha(t,e);n.oid=E(r)}}return this.isNeedSha()&&(await this.toObject(t),e.push(this)),this.sha}parse_tree(t){let e=this._entries,r=5,i=t.indexOf(0,r);if(-1===i)return void console.error("tree后面没有找到0，格式不对");let n=D(new Uint8Array(t.buffer.slice(r,i)));for(parseInt(n),r=i+1,r=r+3&-4;r<t.length;){const i=t.indexOf(32,r);if(-1===i)throw new Error(`GitTree: Error parsing buffer at byte location ${r}: Could not find the next space character.`);const n=t.indexOf(0,r);if(-1===n)throw new Error(`GitTree: Error parsing buffer at byte location ${r}: Could not find the next null character.`);let o=D(new Uint8Array(t.buffer.slice(r,i)));"40000"===o&&(o="040000");const a=L(o),s=D(new Uint8Array(t.buffer.slice(i+1,n)));if(s.includes("\\")||s.includes("/"))throw"unsafe path:"+s;const l=new Uint8Array(t.buffer.slice(n+1,n+21));r=n+21,r=r+3&-4;let h=new Uint32Array(t.buffer,r,2),c=h[0],d=h[1],f=new Date(4294967296*c+d);r+=8;let u=new U(s,o,l);u.fileMTime=f,u.owner=this,u.type=a,e.push(u)}return e}parseBuffer(t,e){let r;if(this.buff=t,r=G.zip?new Uint8Array(e.unzip(t.buffer)):new Uint8Array(t.buffer),this._entries.length=0,116==r[0]&&114==r[1]&&101==r[2]&&101==r[3]&&32==r[4])return this.parse_tree(r)}async toObject(t){const e=this._entries?[...this._entries]:[];e.sort(F);let r=0,i=0;e.map((t=>{let e=t.mode.replace(/^0/,"");i+=e.length,i+=1;let r=(new TextEncoder).encode(t.path).length;i+=r,i+=1,i+=20,i=i+3&-4,i+=8})),r=5+i.toString().length+1,r=(r+3&-4)+i;let n=new Uint8Array(r),o=j(n,"tree ",0);return o+=j(n,i.toString(),o),n[o]=0,o+=1,o=o+3&-4,e.map((t=>{let e=t.mode.replace(/^0/,"");if(o+=j(n,e,o),n[o]=32,o+=1,o+=j(n,t.path,o),n[o]=0,o+=1,t.oid&&t.oid!=U.InvalidOID){if(!(t.oid instanceof Uint8Array))throw"oid type error";n.set(t.oid,o)}else if(t.treeNode?.sha){let e=E(t.treeNode.sha);if(20!=e.byteLength)throw"oid length error";n.set(e,o)}o+=20,o=o+3&-4;let r=t.fileMTime?t.fileMTime.valueOf():0,i=Math.floor(r/4294967296),a=4294967295&r,s=new Uint32Array(n.buffer,o,2);s[0]=i,s[1]=a,o+=8})),t&&G.zip&&(n=new Uint8Array(t.zip(n.buffer))),this.sha=await v(n,!0),this.buff=n,n}}function F(t,e){return function(t,e){return-(t<e)||+(t>e)}(M(t),M(e))}function M(t){return"040000"===t.mode?t.path+"/":t.path}function L(t){switch(t){case"040000":return x.TREE;case"100644":case"100755":case"120000":return x.BLOB;case"160000":return x.COMMIT}throw new Error(`Unexpected GitTree entry mode: ${t}`)}let B=/^0?4.*/,R=/^1006.*/,I=/^1007.*/,z=/^120.*/,W=/^160.*/;function $(t){return t.mode=function(t){if("number"==typeof t&&(t=t.toString(8)),t.match(B))return"040000";if(t.match(R))return"100644";if(t.match(I))return"100755";if(t.match(z))return"120000";if(t.match(W))return"160000";throw new Error(`Could not understand file mode: ${t}`)}(t.mode),t.type||(t.type=L(t.mode)),t}var J=".projinfo";class G{static OBJSUBDIRNUM=1;static MAXFILESIZE=33554432;static zip=!1;treeRoot=new S(null,null,null);curCommit=new A;frw;allchanges=[];recentCommits;static touchID=0;user;checkDownload=!1;_objectPacks=[];constructor(t){this.frw=t}addObjectPack(t,e=!1){this._objectPacks.indexOf(t)<0&&(e&&this._objectPacks.splice(0,0,t),this._objectPacks.push(t))}removeObjectPack(t){let e=this._objectPacks.indexOf(t);e>=0&&this._objectPacks.splice(e,1)}clearObjectPack(){this._objectPacks.length=0}getObjUrl(t){let e=G.OBJSUBDIRNUM,r="objects/",i=t;for(let t=0;t<e;t++){let t=i.substring(0,2);i=i.substring(2),r+=t,r+="/"}return r+=i,r}getCurCommit(){return this.curCommit.sha}async initByLastCommit(){}async getCommitHead(t){let e=await this.frw.read(t,"utf8",!1);if(e)return this.recentCommits=e.split("\n"),this.recentCommits[0];throw"no commit"}async initByCommitID(t){if(!t)return!1;let e=await this.getCommit(t);if(!e)return!1;let r=e.commitinfo.tree;return this.treeRoot=await this.getTreeNode(r,this.treeRoot),this.curCommit.tree=r,this.curCommit.parent=e.commitinfo.parent,this.curCommit.commitMessage=e.commitinfo.commitMessage,this.curCommit.sha=t,!0}async setRoot(t){try{this.treeRoot=await this.getTreeNode(t,this.treeRoot)}catch(t){this.treeRoot=null}}async toRev(t){}async getCommit(t){let e,r=this.getObjUrl(t),i=await this.frw.read(r,"buffer",!1);return i?(e=new O(this.frw.unzip(i),t),e):null}async loadAllPack(){}async getTreeNode(t,e){if(!t)return new S(null,null,this.frw);let r,i=this.getObjUrl(t);try{r=await this.frw.read(i,"buffer",!1)}catch(t){}if(!r){for(let e of this._objectPacks)if(e&&(await e.has(t)&&(r=await e.get(t)),r))break;if(!r)throw"no treepath"}let n=new Uint8Array(r),o=e;return o?o.parseBuffer(n,this.frw):o=new S(n,null,this.frw),o.sha=t,o}async getBlobNode(t,e){let r=t;"string"!=typeof t&&(r=k(t));let i=this.getObjUrl(r),n=null;try{let t=await this.frw.read(i,"buffer",!1);t&&(n=G.zip?this.frw.unzip(t):t)}catch(t){}if(!n){for(let t of this._objectPacks)if(t&&(await t.has(r)&&(n=await t.get(r)),n))break;if(!n)throw new Error("download error:"+r)}if(this.checkDownload){let t=await v(new Uint8Array(n),!0);t!=r&&console.log("下载的文件校验错误:",r,t)}return"utf8"==e?D(n):n}async openNode(t){if(t.treeNode)return t.treeNode;t instanceof U||console.error("openNode param error!");try{if(t.isDir){let e=await this.getTreeNode(t.idstring,null);return t.treeNode=e,e.parent=t.owner,e}}catch(t){throw"open node error"}}async visitAll(t,e,r){await e(t);for await(const i of t.entries)if(i.isDir)try{i.treeNode||await this.openNode(i),await this.visitAll(i.treeNode,e,r)}catch(t){console.log("openNode error:",k(i.oid))}else await r(i)}async loadFile(t,e,r){let i;return"string"==typeof t?await this.loadFileByPath(t,e):(t instanceof S?i=t.getEntry(e):t instanceof U&&(i=t,r=e),i?await this.getBlobNode(i.idstring,r):(console.log("没有这个文件:",e),null))}async loadFileByPath(t,e){let r=[];if(await this.pathToEntries(t,r)){let t=r[r.length-1];return await this.getBlobNode(t.idstring,e)}return null}async saveBlobNode(t,e,r){return e.byteLength>G.MAXFILESIZE?(alert("文件太大，无法上传："+r+"\n限制为："+G.MAXFILESIZE/1024/1024+"M"),!1):(await this.saveObject(t,e),!0)}async saveObject(t,e){let r=this.getObjUrl(t);await this.frw.write(r,e,!1)}async sha1(t){return"string"==typeof t&&(t=(new TextEncoder).encode(t).buffer),await v(new Uint8Array(t),!0)}async pathToEntries(t,e){let r=t.split("/"),i=this.treeRoot;e.length=0;for await(let t of r){if(""==t)continue;if("."==t)continue;".."==t&&(i=i.parent);let r=i.getEntry(t);if(!r)return!1;e.push(r),r.isDir&&!(i=r.treeNode)&&(i=await this.openNode(r))}return!0}async pathToObjPath(t){let e=[];if(await this.pathToEntries(t,e)){let t=k(e[e.length-1].oid);return this.getObjUrl(t)}return null}async getNodeByPath(t,e=!1,r=null){let i=t.split("/"),n=r||this.treeRoot;for(let t=0,r=i.length;t<r;t++){let r=i[t];if(""==r)continue;if("."==r)continue;".."==r&&(n=n.parent);let o=n.getEntry(r);if(o)n=o.treeNode?o.treeNode:await this.openNode(o);else{if(!e)return null;{let t=n.addEntry(r,!0,null);n=new S(null,n,this.frw),t.treeNode=n,n.needSha()}}}return n}async setFileAtNode(t,e,r){let i;i=r instanceof ArrayBuffer?r:r instanceof File?await async function(t){return new Promise(((e,r)=>{let i=new FileReader;i.onload=async t=>{let r=t.target.result;e(r)},i.onerror=function(t){e(null)},i.readAsArrayBuffer(t)}))}(r):(new TextEncoder).encode(r).buffer;let n=await v(new Uint8Array(i),!1),o=k(n),a=t.getEntry(e);if(a){if(k(a.oid)===o)return console.log("文件没有修改。"),a;a.oid=n,t.needSha()}else a=t.addEntry(e,!1,n);return console.log("[gitfs] 提交变化文件:",t.fullPath+"/"+e),await this.saveBlobNode(o,i,t.fullPath+"/"+e)||a.oid.fill(0),a}async checkoutToLocal(t,e){e.child&&0!==Object.keys(e.child).length||await e.readChild();for(let r of t){let i=r.path;if(r.isDir){let r=await e.mkdir(i),n=t.getEntry(i);if(!n)return void console.error("gitfs 没有这个节点:",i);n.treeNode||await this.openNode(n),await this.checkoutToLocal(n.treeNode,r)}else{let t,n=e.child[i],o=k(r.oid);if(n){let e=await n.readFile("buffer");if(t=await v(e,!0),t==o)continue}if("0000000000000000000000000000000000000000"==o){console.warn("错误文件：",i);continue}let a=await this.getBlobNode(r.oid,"buffer");a?(console.log("gitfs update file:",e.getFullPath()+"/"+i),await e.createFile(i,a)):console.error("下载文件失败。")}}}async rename(t,e){let r=[];if(await this.pathToEntries(t,r)){let t=r[r.length-1];return t.path=e,t.owner.needSha(),!0}return!1}async remove(t){let e=[];if(await this.pathToEntries(t,e)){let t=e[e.length-1];return t.owner.rmEntry(t)}return!1}async removeObject(t){let e=this.getObjUrl(t);await this.frw.rm(e)}copy(t,e){t.addEntry(e.path,e.isDir,e.oid)}async makeCommit(t){if(!this.treeRoot.sha)return console.error("[gitfs] makecommit 需要先计算sha"),null;if(this.curCommit.tree==this.treeRoot.sha)return console.log("[gitfs] makecommit parent 和现在的相同"),null;let e=new A;e.commitMessage=t,e.author=this.user,e.author_timestamp=new Date,e.parent=this.curCommit.sha,e.tree=this.treeRoot.sha,console.log("[gitfs] makecommit tree:",this.treeRoot.sha);let r=new O(e,"nosha"),i=await r.toBuffer(this.frw);return this.curCommit=e,i}async push(t,e){}async saveHeadToLocal(t,e){"object"==typeof t&&(t=JSON.stringify(t));let r=await e.mkdir(J);await r.createFile("head",t)}async getHeadFromLocal(t){await t.readChild();let e=t.child[J];if(!e)return null;await e.readChild();let r=e.child.head;return r?r.readFile("utf8"):r}printCommit(t){console.log("-----------------------------"),console.log(t.commitMessage,t.sha,t.tree)}async printLog(t){let e=this.curCommit;this.printCommit(e);for(let r=0;r<t;r++){let t=e.parent;if(!t)break;if("0"==t)break;let r=await this.getCommit(t);if(!r)break;this.printCommit(r.commitinfo),e=r.commitinfo}}}function H(t){return new Promise((e=>setTimeout(e,t)))}let X={layaNative:class{repoPath;getAbsPath(t){let e=conch.getCachePath();return t.includes(":/")||t.includes(":\\")?t:(e.endsWith("/")||(e+="/"),e+t)}makeDirsInCachePath(t){let e=(t=t.replace(/\\/g,"/")).split("/");if(e.pop(),e.length<=0)return;let r=this.getAbsPath("");for(let t of e)r=r+"/"+t,fs_exists(r)||fs_mkdir(r)}async init(t,e){t&&!t.endsWith("/")&&(t+="/"),this.repoPath=t;let r=this.getAbsPath("objects");fs_exists(r)||fs_mkdir(r),n.log&&console.log("DCCClientFS: path="+conch.getCachePath())}async fetch(t){let e=await function(t,e="buffer"){return new Promise(((r,i)=>{const n=new _XMLHttpRequest;n.responseTypeCode="utf8"==e?1:5,n._open("GET",t,!0),n.setPostCB((t=>{r(t)}),(t=>{r(null)})),n.getData(t)}))}(t);return{ok:!!e,arrayBuffer:async()=>e,text:async()=>o.dcodeUtf8(e)}}async read(t,e,r){let i;try{i=fs_readFileSync(this.getAbsPath(t)),"utf8"==e&&(i=o.dcodeUtf8(i))}catch(t){}if(!i){if(r)return null;if(this.repoPath){let r=await this.fetch(this.repoPath+t);i="utf8"==e?await r.text():await r.arrayBuffer(),await this.write(t,i)}}return i}async write(t,e,r){this.makeDirsInCachePath(t),t=this.getAbsPath(t),!r&&fs_exists(t)||fs_writeFileSync(t,e)}async isFileExist(t){return Promise.resolve().then((()=>fs_exists(t)))}async mv(t,e){throw"native no mv"}unzip(t){throw new Error("Method not implemented.")}zip(t){throw new Error("Method not implemented.")}textencode(t){return(new TextEncoder).encode(t)}textdecode(t,e){return o.dcodeUtf8(t)}async rm(t){t=this.getAbsPath(t),fs_rm(t)}async enumCachedObjects(t){let e=this.getAbsPath("objects"),r=fs_readdirSync(e);for(let i of r){let r=fs_readdirSync(e+"/"+i);for(let e of r)t(i+e)}}},web:class{dbfile;repoPath;async init(t,e){t&&!t.endsWith("/")&&(t+="/"),this.repoPath=t,this.dbfile=new a,await this.dbfile.init("","")}async fetch(t){return await fetch(t)}async read(t,e,r){let i;try{i=await this.dbfile.read(t,e,!0)}catch(n){if(r)return null;if(this.repoPath){let r=await fetch(this.repoPath+t);"utf8"==e?(i=await r.text(),await this.dbfile.write(t,i)):(i=await r.arrayBuffer(),await this.dbfile.write(t,i))}}return i}async write(t,e,r){!r&&await this.dbfile.isFileExist(t)||this.dbfile.write(t,e)}async isFileExist(t){return await this.dbfile.isFileExist(t)}async mv(t,e){await this.dbfile.mv(t,e)}unzip(t){throw new Error("Method not implemented.")}zip(t){throw new Error("Method not implemented.")}textencode(t){return(new TextEncoder).encode(t)}textdecode(t,e){return(new TextDecoder).decode(t)}async rm(t){await this.dbfile.rm(t)}async enumCachedObjects(t){await this.dbfile.enumCachedObjects(t)}}}[o.runtimeName];class Z{static VERSION="1.0.0";_frw;_onlyTransUrl=!1;_gitfs;_pathMapToDCC="";_dccServer;_logger=null;dccPathInAssets="cache/dcc2.0";constructor(t,e=null,r=null){if(t&&!t.endsWith("/")&&(t+="/"),this._dccServer=t,e||(e=X),!e)throw"没有正确的文件访问接口";this._frw=new e,r&&(this._logger=r,r.clear()),this.checkEnv()}enableLog(t){n.log=t}checkEnv(){if(window.conch){if(!ZipFile)throw"native 环境不对";if(!_XMLHttpRequest)throw"native 环境不对";if(!conch.getCachePath)throw"native 环境不对";if(!fs_exists)throw"native 环境不对";if(!fs_mkdir)throw"native 环境不对";if(!fs_readFileSync)throw"native 环境不对";if(!fs_writeFileSync)throw"native 环境不对";if(!fs_rm)throw"native 环境不对";if(!fs_readdirSync)throw"native 环境不对"}}get fileIO(){return this._frw}log(t){n.log&&console.log(t),this._logger&&this._logger.checkLog(t)}set pathMapToDCC(t){this._pathMapToDCC=t}get pathMapToDCC(){return this._pathMapToDCC}async init(t,e){if(this._gitfs)throw"重复初始化";if(await this._frw.init(this._dccServer,e),window.conch){let t=new r;try{let e=await t.getRes(this.dccPathInAssets+"/head.json","buffer");e&&await this._frw.write("head.json",e,!0)}catch(t){n.log&&console.log("LayaDCCClient init error: no head.json in package")}}let i,o=null;try{let t=await this._frw.read("head.json","utf8",!0);o=JSON.parse(t).root,i=o}catch(t){}let a=null,s=null;try{if(t){let e=await this._frw.fetch(t),r=0;for(;!e.ok;){if(e=await this._frw.fetch(t),r++,r>10)return!1;H(100)}s=await e.text(),a=JSON.parse(s),i=a.root}}catch(t){}if(!a&&!o)return!1;let l=this._gitfs=new G(this._frw);if(window.conch){let t=new h(this.dccPathInAssets);await t.init(),l.addObjectPack(t)}if((!o||a&&o!=a.root)&&a.treePackages.length){this.log("需要下载treenode");for(let t of a.treePackages){this.log(`下载treenode:${t}`);let e=await this._frw.fetch(`${this._dccServer}packfile/tree-${t}.idx`);if(!e.ok)throw"download treenode idx error";let r=JSON.parse(await e.text()),i=await this._frw.fetch(`${this._dccServer}packfile/tree-${t}.pack`);if(!i.ok)throw"download treenode pack error";let n=await i.arrayBuffer();for(let t of r){let e=n.slice(t.start,t.start+t.length);await this._gitfs.saveObject(t.id,e)}}}return await this._frw.write("head.json",s,!0),await l.setRoot(i),!0}set onlyTransUrl(t){this._onlyTransUrl=t}get onlyTransUrl(){return this._onlyTransUrl}async readFile(t){let e=this._gitfs;if(!e)throw"dcc没有正确init";if(t.startsWith("http:")||t.startsWith("https:")||t.startsWith("file:"))if(this._pathMapToDCC){if(!t.startsWith(this._pathMapToDCC))return null;t=t.substring(this._pathMapToDCC.length)}else t=new URL(t).pathname;return await e.loadFileByPath(t,"buffer")}async getObjectUrl(t){return this._gitfs.getObjUrl(t)}async transUrl(t){let e=this._gitfs;if(!e)return t;if(this._pathMapToDCC){if(!t.startsWith(this._pathMapToDCC))return t;t=t.substring(this._pathMapToDCC.length)}else t=new URL(t).pathname;let r=await e.pathToObjPath(t);return r?this._frw.repoPath+r:t}async updateAll(t){let e=this._gitfs,r=new Set;await this._frw.enumCachedObjects((t=>{r.add(t)}));let i=[];await e.visitAll(e.treeRoot,(async t=>{r.has(t.sha)||await this._frw.read(e.getObjUrl(t.sha),"buffer",!1)}),(async t=>{let e=k(t.oid);r.has(e)||i.push(e)})),this.log(`updateAll need update ${i.length}`),t&&t(0);for(let r=0,n=i.length;r<n;r++){let o=i[r];await this._frw.read(e.getObjUrl(o),"buffer",!1),this.log(`updateAll: update obj:${o}`),t&&t(r/n)}t&&t(1)}async updateByZip(t,e,r){let i=new e;i.open(t),i.forEach((async t=>{"head.json"==t.entryName||await this.addObject(t.entryName,t.getData())}));let n=i.getEntry("head.json");await this._frw.write("head.json",n.getData().buffer,!0);let o=await this._frw.read("head.json","utf8",!0),a=JSON.parse(o);await this._gitfs.setRoot(a.root)}async addObject(t,e){return this._gitfs.saveObject(t,e)}async clean(){let t=this._gitfs,e=new Set;await t.visitAll(t.treeRoot,(async t=>{e.add(t.sha)}),(async t=>{e.add(k(t.oid))}));let r=[];await this._frw.enumCachedObjects((t=>{e.has(t)||r.push(t)}));for(let e of r)n.log&&console.log("清理节点:",e),t.removeObject(e)}_downloader;injectToLaya(){this._downloader||(this._downloader=new s(this,this._logger)),this._downloader.injectToLaya()}removeFromLaya(){this._downloader&&this._downloader.removeFromLaya()}injectToNativeFileReader(){this._downloader||(this._downloader=new s(this,this._logger)),this._downloader.injectToNativeFileReader()}removeFromNative(){this._downloader&&this._downloader.removeFromNative()}}return e})()));