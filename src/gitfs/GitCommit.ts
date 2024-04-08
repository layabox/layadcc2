import { IFileRW } from "./GitFS";
import { shasum, toHex } from "./GitFSInit";

export class CommitInfo{
    tree:string;   //20byte
    parent='0';
    author?:string;
    author_timestamp:Date;
    author_timezone?:number;
    committer:string;
    committer_timestamp:Date;
    committer_timezone:number;
    commitMessage:string;
    sha:string; //当前commit的sha
}

/**
 * 把commitinfo转成buffer
 * 从buffer中还原出commitinfo
 */
export class GitCommit{
    commitinfo:CommitInfo;
    constructor(buff:ArrayBuffer|CommitInfo, sha:string){
        if(buff instanceof ArrayBuffer){
            this.commitinfo=new CommitInfo();
            this.parse(buff);
            this.commitinfo.sha=sha;
        }else{
            this.commitinfo=buff;
        }
    }

    private readString(buff:ArrayBuffer,off:number, len:number){
        let l = (len>0?len:buff.byteLength);
        buff = buff.slice(off,off+l);
        let newbuff = new Uint8Array(buff);
        return (new TextDecoder()).decode(newbuff);
    }

    private strToBuff(str:string){
        return (new TextEncoder()).encode(str)
    }

    private getStrLen(buff:Uint8Array,off:number, maxlen=-1){
        let l=0;
        for(let i=0;i<maxlen; i++){
            if(buff[off+i]===0) break;
            l++;
        }
        return l;
    }

    parse(buff:ArrayBuffer){
        let commitinfo = this.commitinfo;
        // 是个buffer，但是buffer中保存的是字符串
        let u8buff = new Uint8Array(buff);
        let curptr = 0;
        let head = this.readString(u8buff,curptr,7);
        if(head!=='commit ') return false;
        curptr+=7;
        let length = this.readString(u8buff,curptr,this.getStrLen(u8buff,curptr,100));
        let lenlen = length.length;
        curptr+=(lenlen+1);
        let content = this.readString(u8buff,curptr,parseInt(length));
        let treepos = content.indexOf('tree ');
        if(treepos<0) return false;
        let treeid = content.substr(treepos+5,40);
        commitinfo.tree=treeid;
        let parentpos = content.indexOf('parent ',treepos+40);
        if(parentpos<0) return false;
        let parentid = content.substr(parentpos+7,40);
        commitinfo.parent=parentid;
        commitinfo.commitMessage = content.substr(parentpos+7+40+1);
    }

    private idbuffToString(id:string|ArrayBuffer|Uint8Array){
        if(id instanceof ArrayBuffer){
            return toHex(new Uint8Array(id));
        }else if(id instanceof Uint8Array){
            return toHex(id);
        }
        return id;
    }

    private formatDate(d:Date){
        return d.getFullYear()+'-'
        +(d.getMonth()+1)+'-'
        +d.getDate()+' '
        +d.getHours()+':'
        +d.getMinutes()+':'
        +d.getSeconds();
    }
    async toBuffer(frw:IFileRW){
        let treeid= this.idbuffToString(this.commitinfo.tree);
        let parentid= this.commitinfo.parent?(this.idbuffToString(this.commitinfo.parent)):null;
        let str='commit ';
        
        let strcontent='';
        strcontent+='tree '+treeid+'\a';
        if(parentid){
            strcontent+='parent '+parentid+'\a';
        }
        strcontent += 'author '+ this.commitinfo.author+' '+ this.formatDate(this.commitinfo.author_timestamp)+ ' '+'\n\n '+this.commitinfo.commitMessage+'\n';
        //                                        Date,               时区    

        let len = (new TextEncoder()).encode(strcontent).length;// strcontent.length;
        str+=len; str+='\0';
        str+=strcontent;

        // 把字符串转成buffer
        let buff = this.strToBuff(str);
        if(frw.zip){
            buff = new Uint8Array(frw.zip(buff));
        }
        /*
        // 压缩
        var deflate = new (window as any).pako.Deflate();
        deflate.push(buff, true);//true表示完了
        if (deflate.err) {
            console.error(deflate.msg);
        } else {
        }
        */
        this.commitinfo.sha = await shasum(buff,true) as string;
        return buff;
    }

}