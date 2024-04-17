import { IObjectPack } from "./gitfs/GitFS";

/**
 * 保存在apk资源中的对象包
 */

export class ObjPack_APK implements IObjectPack{
    init(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    has(oid: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    get(oid: string): Promise<ArrayBuffer> {
        throw new Error("Method not implemented.");
    }
}