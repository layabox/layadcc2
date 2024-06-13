var isNode = typeof window == 'undefined' && typeof global == 'object';
export class Env {
    static get runtimeName() {
        if (isNode)
            return 'node';
        if (window.conch) {
            return 'layaNative';
        }
        return 'web';
    }
    static isNative() { }
    static isWeb() { }
    static isNode() { }
    //根据不同的平台实现
    static dcodeUtf8(buf) {
        if (isNode) {
            return (new TextDecoder()).decode(buf);
        }
        else {
            if (window.conch) {
                //return conch.bufferToString(buf);
                let str = decodeBuffer(buf);
                return str;
            }
            else {
                return (new TextDecoder()).decode(buf);
            }
        }
    }
}
function decodeBuffer(buf) {
    let len = buf.byteLength;
    let pos = 0;
    var v = "", max = len, c, c2, c3, f = String.fromCharCode;
    var u = new Uint8Array(buf), i = 0;
    var strs = [];
    var n = 0;
    strs.length = 1000;
    while (pos < max) {
        c = u[pos++];
        if (c < 0x80) {
            if (c != 0)
                //v += f(c);\
                strs[n++] = f(c);
        }
        else if (c < 0xE0) {
            //v += f(((c & 0x3F) << 6) | (u[_pos_++] & 0x7F));
            strs[n++] = f(((c & 0x3F) << 6) | (u[pos++] & 0x7F));
        }
        else if (c < 0xF0) {
            c2 = u[pos++];
            //v += f(((c & 0x1F) << 12) | ((c2 & 0x7F) << 6) | (u[_pos_++] & 0x7F));
            strs[n++] = f(((c & 0x1F) << 12) | ((c2 & 0x7F) << 6) | (u[pos++] & 0x7F));
        }
        else {
            c2 = u[pos++];
            c3 = u[pos++];
            //v += f(((c & 0x0F) << 18) | ((c2 & 0x7F) << 12) | ((c3 << 6) & 0x7F) | (u[_pos_++] & 0x7F));
            const _code = ((c & 0x0F) << 18) | ((c2 & 0x7F) << 12) | ((c3 & 0x7F) << 6) | (u[pos++] & 0x7F);
            if (_code >= 0x10000) {
                const _offset = _code - 0x10000;
                const _lead = 0xd800 | (_offset >> 10);
                const _trail = 0xdc00 | (_offset & 0x3ff);
                strs[n++] = f(_lead);
                strs[n++] = f(_trail);
            }
            else {
                strs[n++] = f(_code);
            }
        }
        i++;
    }
    strs.length = n;
    return strs.join('');
}
