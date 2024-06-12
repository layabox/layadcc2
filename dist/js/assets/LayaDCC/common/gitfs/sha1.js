// https://github.com/kawanet/sha1-uint8array/edit/main/lib/sha1-uint8array.ts
/**
 * sha1-uint8array.ts
 */
const K = [
    0x5a827999 | 0,
    0x6ed9eba1 | 0,
    0x8f1bbcdc | 0,
    0xca62c1d6 | 0,
];
const algorithms = {
    sha1: 1,
};
export function createHash(algorithm) {
    if (algorithm && !algorithms[algorithm] && !algorithms[algorithm.toLowerCase()]) {
        throw new Error("Digest method not supported");
    }
    return new Hash();
}
class Hash {
    constructor() {
        this.A = 0x67452301 | 0;
        this.B = 0xefcdab89 | 0;
        this.C = 0x98badcfe | 0;
        this.D = 0x10325476 | 0;
        this.E = 0xc3d2e1f0 | 0;
        this._size = 0;
        this._sp = 0; // surrogate pair
        if (!sharedBuffer || sharedOffset >= 8000 /* N.allocTotal */) {
            sharedBuffer = new ArrayBuffer(8000 /* N.allocTotal */);
            sharedOffset = 0;
        }
        this._byte = new Uint8Array(sharedBuffer, sharedOffset, 80 /* N.allocBytes */);
        this._word = new Int32Array(sharedBuffer, sharedOffset, 20 /* N.allocWords */);
        sharedOffset += 80 /* N.allocBytes */;
    }
    update(data) {
        // data: string
        if ("string" === typeof data) {
            return this._utf8(data);
        }
        // data: undefined
        if (data == null) {
            throw new TypeError("Invalid type: " + typeof data);
        }
        const byteOffset = data.byteOffset;
        const length = data.byteLength;
        let blocks = (length / 64 /* N.inputBytes */) | 0;
        let offset = 0;
        // longer than 1 block
        if (blocks && !(byteOffset & 3) && !(this._size % 64 /* N.inputBytes */)) {
            const block = new Int32Array(data.buffer, byteOffset, blocks * 16 /* N.inputWords */);
            while (blocks--) {
                this._int32(block, offset >> 2);
                offset += 64 /* N.inputBytes */;
            }
            this._size += offset;
        }
        // data: TypedArray | DataView
        const BYTES_PER_ELEMENT = data.BYTES_PER_ELEMENT;
        if (BYTES_PER_ELEMENT !== 1 && data.buffer) {
            const rest = new Uint8Array(data.buffer, byteOffset + offset, length - offset);
            return this._uint8(rest);
        }
        // no more bytes
        if (offset === length)
            return this;
        // data: Uint8Array | Int8Array
        return this._uint8(data, offset);
    }
    _uint8(data, offset) {
        const { _byte, _word } = this;
        const length = data.length;
        offset = offset | 0;
        while (offset < length) {
            const start = this._size % 64 /* N.inputBytes */;
            let index = start;
            while (offset < length && index < 64 /* N.inputBytes */) {
                _byte[index++] = data[offset++];
            }
            if (index >= 64 /* N.inputBytes */) {
                this._int32(_word);
            }
            this._size += index - start;
        }
        return this;
    }
    _utf8(text) {
        const { _byte, _word } = this;
        const length = text.length;
        let surrogate = this._sp;
        for (let offset = 0; offset < length;) {
            const start = this._size % 64 /* N.inputBytes */;
            let index = start;
            while (offset < length && index < 64 /* N.inputBytes */) {
                let code = text.charCodeAt(offset++) | 0;
                if (code < 0x80) {
                    // ASCII characters
                    _byte[index++] = code;
                }
                else if (code < 0x800) {
                    // 2 bytes
                    _byte[index++] = 0xC0 | (code >>> 6);
                    _byte[index++] = 0x80 | (code & 0x3F);
                }
                else if (code < 0xD800 || code > 0xDFFF) {
                    // 3 bytes
                    _byte[index++] = 0xE0 | (code >>> 12);
                    _byte[index++] = 0x80 | ((code >>> 6) & 0x3F);
                    _byte[index++] = 0x80 | (code & 0x3F);
                }
                else if (surrogate) {
                    // 4 bytes - surrogate pair
                    code = ((surrogate & 0x3FF) << 10) + (code & 0x3FF) + 0x10000;
                    _byte[index++] = 0xF0 | (code >>> 18);
                    _byte[index++] = 0x80 | ((code >>> 12) & 0x3F);
                    _byte[index++] = 0x80 | ((code >>> 6) & 0x3F);
                    _byte[index++] = 0x80 | (code & 0x3F);
                    surrogate = 0;
                }
                else {
                    surrogate = code;
                }
            }
            if (index >= 64 /* N.inputBytes */) {
                this._int32(_word);
                _word[0] = _word[16 /* N.inputWords */];
            }
            this._size += index - start;
        }
        this._sp = surrogate;
        return this;
    }
    _int32(data, offset) {
        let { A, B, C, D, E } = this;
        let i = 0;
        offset = offset | 0;
        while (i < 16 /* N.inputWords */) {
            W[i++] = swap32(data[offset++]);
        }
        for (i = 16 /* N.inputWords */; i < 80 /* N.workWords */; i++) {
            W[i] = rotate1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]);
        }
        for (i = 0; i < 80 /* N.workWords */; i++) {
            const S = (i / 20) | 0;
            const T = (rotate5(A) + ft(S, B, C, D) + E + W[i] + K[S]) | 0;
            E = D;
            D = C;
            C = rotate30(B);
            B = A;
            A = T;
        }
        this.A = (A + this.A) | 0;
        this.B = (B + this.B) | 0;
        this.C = (C + this.C) | 0;
        this.D = (D + this.D) | 0;
        this.E = (E + this.E) | 0;
    }
    digest(encoding) {
        const { _byte, _word } = this;
        let i = (this._size % 64 /* N.inputBytes */) | 0;
        _byte[i++] = 0x80;
        // pad 0 for current word
        while (i & 3) {
            _byte[i++] = 0;
        }
        i >>= 2;
        if (i > 14 /* N.highIndex */) {
            while (i < 16 /* N.inputWords */) {
                _word[i++] = 0;
            }
            i = 0;
            this._int32(_word);
        }
        // pad 0 for rest words
        while (i < 16 /* N.inputWords */) {
            _word[i++] = 0;
        }
        // input size
        const bits64 = this._size * 8;
        const low32 = (bits64 & 0xffffffff) >>> 0;
        const high32 = (bits64 - low32) / 0x100000000;
        if (high32)
            _word[14 /* N.highIndex */] = swap32(high32);
        if (low32)
            _word[15 /* N.lowIndex */] = swap32(low32);
        this._int32(_word);
        return (encoding === "hex") ? this._hex() : this._bin();
    }
    _hex() {
        const { A, B, C, D, E } = this;
        return hex32(A) + hex32(B) + hex32(C) + hex32(D) + hex32(E);
    }
    _bin() {
        const { A, B, C, D, E, _byte, _word } = this;
        _word[0] = swap32(A);
        _word[1] = swap32(B);
        _word[2] = swap32(C);
        _word[3] = swap32(D);
        _word[4] = swap32(E);
        return _byte.slice(0, 20);
    }
}
const W = new Int32Array(80 /* N.workWords */);
let sharedBuffer;
let sharedOffset = 0;
const hex32 = num => (num + 0x100000000).toString(16).substr(-8);
const swapLE = (c => (((c << 24) & 0xff000000) | ((c << 8) & 0xff0000) | ((c >> 8) & 0xff00) | ((c >> 24) & 0xff)));
const swapBE = (c => c);
const swap32 = isBE() ? swapBE : swapLE;
const rotate1 = num => (num << 1) | (num >>> 31);
const rotate5 = num => (num << 5) | (num >>> 27);
const rotate30 = num => (num << 30) | (num >>> 2);
function ft(s, b, c, d) {
    if (s === 0)
        return (b & c) | ((~b) & d);
    if (s === 2)
        return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
}
function isBE() {
    const buf = new Uint8Array(new Uint16Array([0xFEFF]).buffer); // BOM
    return (buf[0] === 0xFE);
}
