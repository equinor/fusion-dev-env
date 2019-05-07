const fs = require("fs");
const https = require("https");
const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const devMiddleware = require("webpack-dev-middleware");
const hotMiddleware = require("webpack-hot-middleware");
const express = require("express");

const babel = require("../parts/babel");

const appConfig = {
  mode: "development",
  entry: [
    "./src/index.js",
    path.resolve(
      __dirname,
      "..",
      "node_modules",
      "webpack-hot-middleware",
      "client"
    )
  ],
  output: {
    publicPath: "/",
    filename: "app.bundle.js"
  },
  resolve: {
    alias: {
      "react-dom": path.resolve(
        __dirname,
        "..",
        "node_modules",
        "@hot-loader",
        "react-dom"
      )
    }
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
};

const compiler = webpack(merge(appConfig, babel));

const app = express();

app.use(
  devMiddleware(compiler, {
    noInfo: true,
    stats: false
  })
);
app.use(hotMiddleware(compiler));

app.get("/fusion.bundle.js", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "dist", "fusion.bundle.js"));
});

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "dist", "index.html"));
});

https
  .createServer(
    {
      key: fs.readFileSync(path.resolve(__dirname, "..", "keys", "server.key")),
      cert: fs.readFileSync(
        path.resolve(__dirname, "..", "keys", "server.cert")
      )
    },
    app
  )
  .listen(3000, () => {
    console.log("Fusion App listening on port 3000!");
  });
