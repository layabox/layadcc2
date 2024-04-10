import { VFS } from "./VFS";

var vfs:VFS
export function getVFS(){
    return vfs;
}

export function setVFS(v:VFS){
    vfs=v;
}