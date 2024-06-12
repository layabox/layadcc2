npx webpack --config webpack.config.js
npx webpack --config webpack.config.tools.js

发布
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
