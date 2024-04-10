
/**
 * 处理路径
 * 分隔符只允许 "/"，不允许使用"\"
 */
class _WebPath {
    constructor() {
    }

    /**
     * 返回 path 的扩展名
     * 即 path 的最后一部分中从最后一次出现 .（句点）字符直到字符串结束
     * 如果在 path 的最后一部分中没有 .，或者如果 path 的基本名称（参见 path.basename()）除了第一个字符以外没有 .，则返回空字符串
     * @param path 
     */
    extname(path: string) {
        let tlaya = (window as any).Laya;
         let ext =(tlaya.LoaderManager.createMap[tlaya.Utils.getFilecompatibleExtension(path)])?tlaya.Utils.getFilecompatibleExtension(path):tlaya.Utils.getFileExtension(path);
         ext = "."+ext;
         return ext;
    }

    /**
     * 返回 path 的目录名
     * 类似于 Unix 的 dirname 命令
     * 尾部的目录分隔符会被忽略
     * @param path 
     */
    dirname(path: string) {
		if(path=='/') return path;
        if (path.endsWith("/") || path.endsWith("\\")) {
            path = path.substr(0, path.length - 1);
        }
        let lastSp = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        if (lastSp < 0) return ".";
        if ((path.startsWith("/") || path.startsWith("\\")) && lastSp === 0) {
            return "/";
        }
        let dirname = path.substr(0, lastSp);
        return dirname;
    }

    /**
     * 返回 path 的最后一部分
     * 类似于 Unix 的 basename 命令
     * 尾部的目录分隔符会被忽略
     * @param path 
     * @param ext 
     */
    basename(path: string, ext?: string) {
        if (path.endsWith("/") || path.endsWith("\\")) {
            path = path.substr(0, path.length - 1);
        }
        let lastSp = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        if (lastSp < 0) return path;
        let basename = path.substr(lastSp + 1);
        if (!!ext && path.endsWith(ext)) {
            basename = basename.substr(0, basename.length - ext.length);
        }
        return basename;
    }

    /**
     * 检测 path 是否为绝对路径
     * @param path 
     */
    isAbsolute(path: string) {
        return path.startsWith("/") || path.startsWith("\\");
    }

    /**
     * 会将所有给定的 path 片段连接到一起，然后规范化生成的路径
     * @param path 
     */
    join(...paths:string[]) {
        return this.normalize(paths.join("/"));
    }

    /**
     * 规范化给定的 path
     * 解析 '..' 和 '.' 片段
     * 和nodejs不一致的，尾部的分隔符会统一不会保留
     * @param path 
     */
    normalize(path: string) {
        let normalizeFragment: Array<string> = [];
		let scheme='';
		if(path.startsWith('http:/')) scheme='http:/';
		if(path.startsWith('https:/')) scheme='https:/';
		path=path.substring(scheme.length);

        let normalizePath: string = "";
        let sequence = path.split("/");
        let fragment;
        for (let i = 0, len = sequence.length; i < len; i++) {
            fragment = sequence[i];
            if (fragment === "." || fragment === "") {
                continue;
            } else if (fragment === "..") {
                normalizeFragment.pop();
            } else {
                normalizeFragment.push(fragment);
            }
        }

        if (path.startsWith("/")) {
            normalizePath = `/`;
        }
        normalizePath += normalizeFragment.join("/");
        if (!normalizePath) {
            normalizePath = ".";
        }
        return scheme + normalizePath;
    }

    /**
     * 根据当前工作目录返回 from 到 to 的相对路径
     * 如果 from 和 to 各自解析到相同的路径（分别调用 path.resolve() 之后），则返回零长度的字符串
     * @param from 
     * @param to 
     */
    relative(from: string, to: string) {
        from = this.normalize(from);
        to = this.normalize(to);
        let fromFragment = from.split("/");
        let toFragment = to.split("/");
        let relativePath = "";
        for (let i = 0, fromLen = fromFragment.length; i < fromLen; i++) {
            if (!relativePath && fromFragment[0] === toFragment[0]) {
                fromFragment.shift();
                toFragment.shift();
            } else {
                relativePath += "../";
            }
        }
        relativePath += toFragment.join("/");
        return relativePath;
    }
}

export var WebPath = new _WebPath;