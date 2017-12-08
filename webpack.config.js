"use strict";

const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin");
const autoprefixer = require("autoprefixer");
const { CheckerPlugin } = require("awesome-typescript-loader");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

const DEV_SERVER_PORT = 8426;
const DEV_SERVER_PATH = "hank-ball";
const DEV_FULL_PATH = `http://localhost:${DEV_SERVER_PORT}/${DEV_SERVER_PATH}`;
const STATIC_FILE_REGEX = /\.(woff|svg|ttf|eot|gif|jpeg|jpg|png)([\?]?.*)$/;

const isProduction = process.env.NODE_ENV === "production";

function getSassLoaders() {
    const loaders = [
        "style-loader",
        { loader: "css-loader", options: { importLoaders: 3 } },
        { loader: "postcss-loader", options: { sourceMap: !isProduction } },
        "resolve-url-loader",
        {
            loader: "sass-loader",
            // Source map is required for resolve-url-loader to work. See
            // https://github.com/bholloway/resolve-url-loader#resolve-url-loader.
            options: { sourceMap: true },
        },
    ];
    return isProduction
        ? ExtractTextPlugin.extract({
              fallback: loaders[0],
              use: loaders.slice(1),
              publicPath: "",
          })
        : loaders;
}

function getProdOnlyPlugins() {
    return [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: '"production"',
            },
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new ExtractTextPlugin("[name].css"),
    ];
}

function getDevOnlyPlugins() {
    return [
        new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require("./docs/dll/dependencies-manifest.json"),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new AddAssetHtmlPlugin({
            filepath: require.resolve("./docs/dll/dependencies.dll.js"),
        }),
    ];
}

module.exports = {
    devtool: !isProduction && "inline-source-map",
    entry: {
        hankBall: ["./src/index.ts"],
    },
    output: {
        filename: "[name].js",
        path: path.join(__dirname, "docs"),
        publicPath: isProduction ? undefined : DEV_FULL_PATH,
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
            { test: /\.scss$/, use: getSassLoaders() },
            {
                test: STATIC_FILE_REGEX,
                loader: "file-loader",
                query: {
                    name: "[path][name].[ext]",
                },
            },
        ],
    },
    plugins: [
        new CheckerPlugin(),
        new HtmlWebpackPlugin({
            favicon: path.resolve(__dirname, "src/favicon.ico"),
            minify: {
                collapseWhitespace: isProduction,
            },
            title: "Hank Ball",
        }),
        ...(isProduction ? getProdOnlyPlugins() : getDevOnlyPlugins()),
    ],
    devServer: isProduction
        ? undefined
        : {
              contentBase: path.join(__dirname, "docs"),
              hot: true,
              port: DEV_SERVER_PORT,
              publicPath: DEV_FULL_PATH,
          },
};
