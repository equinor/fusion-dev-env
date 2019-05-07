module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: __dirname + "/dist",
    publicPath: "/",
    filename: "fusion.bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      }
    ]
  }
};
