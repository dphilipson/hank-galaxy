"use strict";

const path = require("path");
const webpack = require("webpack");

const dependencies = Object.keys(require("./package.json").dependencies);

module.exports = {
    entry: { dependencies },
    output: {
        filename: "[name].dll.js",
        library: "[name]",
        path: path.join(__dirname, "docs", "dll"),
        publicPath: "assets/",
    },
    devtool: "source-map",
    plugins: [
        new webpack.DllPlugin({
            context: __dirname,
            name: "[name]",
            path: path.join(__dirname, "docs", "dll", "[name]-manifest.json"),
        }),
    ],
};
