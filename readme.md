## 编译方法
npx webpack --config webpack.config.cjs
npx webpack --config webpack.config.tools.cjs
    cjs是为了避免使用es模块，继续使用commonjs语法
    否则就要import，并且不能module.exports

## js说明
layadcctools.js是给ide用的，导出到window下了
layadcc.jg是给native用的，目前用的是umd

## 发布
登录：npm login
npm publish
npm --force unpublish xxx 
    24h之后不允许

npm deprecate --force xx@ver "不维护了"

修改package.json的版本号，然后publish
或者
npm version major
npm version minor
npm version patch


layadcc2命令行的编译：
tsc
node add-js-extention.js        #这个是给js的import加.js扩展名。