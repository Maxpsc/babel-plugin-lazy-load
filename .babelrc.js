module.exports = {
  presets: ['@babel/preset-react'],
  plugins: [
    ['./lib/index.js', {
      splitChunkByComp: true,
    }],
  ],
}
