module.exports = {
  plugins: [
    ['./dist/index.js', {
      libraryName: 'demo',
      splitChunkByComp: true,
    }],
  ],
}
