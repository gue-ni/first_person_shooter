const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	mode: "development",
	entry: "./game.js",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "game.js",
	},
	module: {
		// Use `ts-loader` on any file that ends in '.ts'
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	// Bundle '.ts' files as well as '.js' files.
	resolve: {
		extensions: [".ts", ".js"],
	},
	devServer: {
		static: {
			directory: path.join(__dirname, "dist"),
		},
		port: 5000,
	},
	devtool: "inline-source-map",
	plugins: [new CopyWebpackPlugin({ patterns: [{ from: "public" }, { from: "assets", to: "assets" }] })],
};
