const path = require('path');
const { library } = require('webpack');

module.exports = {
  target:'node',
  entry: './assets/LayaDCC/common/pack_tools.ts' ,
  //mode:'none',//'development',
  mode:'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/,path.resolve(__dirname, 'cli')],
        use: {
          loader:'ts-loader',
          options: {
            configFile: 'tsconfig.dcctools.json' 
          }
        }
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'layadcctools.js', // 打包后的文件名
    path: path.resolve(__dirname, 'dist'), // 打包文件的输出目录
    library:{
        name:'layadcctools',
        type:'commonjs',
      }
  },
};