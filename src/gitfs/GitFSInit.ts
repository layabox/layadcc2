/**
 * GitFS依赖的东西。
 * 
 */

import { createHash } from "./sha1";


export function readUTF8(buf:Uint8Array, len?:number){
	return new TextDecoder().decode( new Uint8Array(buf.buffer, len));
}

// 返回写了多少
export function writeUTF8(buf:Uint8Array, str:string, off:number){
	let strbuf = new TextEncoder().encode(str);
	buf.set(strbuf,off);
	return strbuf.length;
}


let supportsSubtleSHA1:boolean|null = null

/**
 * 把一个Uint8Array转成16进制字符串。没有0x
 * @param buffer 
 * @returns 
 */
export function toHex(buffer:Uint8Array) {
	let hex = ''
	for (const byte of new Uint8Array(buffer)) {
		if (byte < 16) hex += '0'
		hex += byte.toString(16)
	}
	return hex
}

export function hashToArray(hash:string){
    let len = hash.length/2;
    let ret = new Uint8Array(len);
    for(let i=0; i<len; i++){
        ret[i]= parseInt( hash.substr(i*2,2),16);
    }
    return ret;
}

/**
 * 计算一个buffer的sha1值，返回的是40个字符串表示的20个字节数据
 * @param buffer 
 * @returns 
 */
export async function shasum(buffer:Uint8Array, tostring=true) {
	if (supportsSubtleSHA1 === null) {
		supportsSubtleSHA1 = await testSubtleSHA1()
	}
	return supportsSubtleSHA1 ? subtleSHA1(buffer,tostring) : shasumSync(buffer, tostring);
}


function shasumSync(data:Uint8Array,tostring=true) {
	let ret:string|Uint8Array;
	if(tostring){
		ret = createHash().update(data).digest('hex');
	}else{
		ret = createHash().update(data).digest();
	}
    return ret;
}

async function subtleSHA1(buffer:Uint8Array,tostring=true) {
	const hash = new Uint8Array( await crypto.subtle.digest('SHA-1', buffer) );
	if(tostring)
		return toHex(hash)
	return hash;
}

async function testSubtleSHA1() {
	try {
		const hash = await subtleSHA1(new Uint8Array([]))
		if (hash === 'da39a3ee5e6b4b0d3255bfef95601890afd80709') return true
	} catch (_) {
		// no bother
	}
	return false
}

/*
function encodeUTF8(s) {
    var i, r = [], c, x;
    for (i = 0; i < s.length; i++)
        if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
        else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
        else {
            if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
                c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                    r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
            else r.push(0xE0 + (c >> 12 & 0xF));
            r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
        };
    return r;
};
*/

