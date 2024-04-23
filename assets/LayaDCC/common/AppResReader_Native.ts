
export class AppResReader_Native{
    //注意这里的file是相对于资源目录的，windows下是debug目录，android下是？？？
    async getRes(file:string, encode:'utf8'|'buffer'){
        return conch.readFileFromAsset(file,encode)
    }
}