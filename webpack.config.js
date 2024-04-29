const path = require('path');
const { library } = require('webpack');

module.exports = {
  entry: './assets/LayaDCC/common/pack_index.ts' ,
  //mode:'development',
  mode:'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
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

    }
  },
};