const path = require('path');
const { library } = require('webpack');

module.exports = {
  entry: './assets/LayaDCC/common/pack_index.ts' ,
  //mode:'none',//'development',
  mode:'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
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
    filename: 'layadcc.js', // 打包后的文件名
    path: path.resolve(__dirname, 'dist'), // 打包文件的输出目录
    library:{
        name:'layadcc',
        type:'umd',
      },
    globalObject:'window',//不要用self
  },
};