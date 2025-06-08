const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/', // Needed for proper routing in PWA
    clean: true,     // Automatically clean the output folder before build
  },
  mode: isProduction ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devtool: isProduction ? false : 'eval-source-map',  // Source map for dev only
  devServer: {
    static: path.join(__dirname, 'public'),
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all',
    open: false,
    hot: true,
    historyApiFallback: true, // For client-side routing support
  },
  performance: {
    hints: isProduction ? 'warning' : false,
    maxAssetSize: 300000,
    maxEntrypointSize: 300000,
  }
};