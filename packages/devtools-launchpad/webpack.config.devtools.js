
const path = require("path");
const webpack = require("webpack");

const { DefinePlugin } = webpack;

const nativeMapping = {
  "../utils/source-editor": "devtools/client/sourceeditor/editor",
  "./test-flag": "devtools/shared/flags",
  "./client/shared/shim/Services": "Services",
  "react": "devtools/client/shared/vendor/react",
  "react-dom": "devtools/client/shared/vendor/react-dom",
};

let packagesPath = path.join(__dirname, "../");
const outputPath = process.env.OUTPUT_PATH;

module.exports = (webpackConfig, envConfig) => {
  if (outputPath) {
    webpackConfig.output.path = outputPath;
  }

  webpackConfig.resolve.alias["devtools-network-request"] = path.resolve(
     packagesPath,
     "devtools-network-request/privilegedNetworkRequest"
  );

  function externalsTest(context, request, callback) {
    let mod = request;

    // Any matching paths here won't be included in the bundle.
    if (nativeMapping[mod]) {
      const mapping = nativeMapping[mod];

      if (webpackConfig.externalsRequire) {
        // If the tool defines "externalsRequire" in the webpack config, wrap
        // all require to external dependencies with a call to the tool's
        // externalRequire method.
        let reqMethod = webpackConfig.externalsRequire;
        callback(null, `var ${reqMethod}("${mapping}")`);
      } else {
        callback(null, mapping);
      }
      return;
    }
    callback();
  }

  webpackConfig.externals = webpackConfig.externals || [];
  webpackConfig.externals.push(externalsTest);

  // Remove the existing DefinePlugin so we can override it.
  const plugins = webpackConfig.plugins.filter(
    p => !(p instanceof DefinePlugin)
  );
  webpackConfig.plugins = plugins.concat([
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || "production"),
        TARGET: JSON.stringify("firefox-panel")
      },
      "DebuggerConfig": JSON.stringify(envConfig)
    })
  ]);

  return webpackConfig;
};
