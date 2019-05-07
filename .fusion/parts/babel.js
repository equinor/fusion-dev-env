const path = require("path");
const babelLoader = require("./babel-loader");

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [babelLoader]
      }
    ]
  }
};
