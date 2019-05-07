const path = require("path");
const presetEnv = require("@babel/preset-env");
const presetReact = require("@babel/preset-react");
const reactHotLoader = require(path.resolve(
  __dirname,
  "..",
  "node_modules",
  "react-hot-loader",
  "babel"
));

module.exports = {
  loader: path.resolve(__dirname, "..", "node_modules", "babel-loader"),
  options: {
    presets: [
      [
        presetEnv.default,
        {
          targets: {
            ie: "11",
            chrome: "70"
          },
          modules: false,
          loose: false
        }
      ],
      presetReact.default
    ],
    plugins: [reactHotLoader]
  }
};
