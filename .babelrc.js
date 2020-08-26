// this is for netlify-lambda functions
module.exports = {
  presets: [[require.resolve('@babel/preset-env'), {targets: {node: '12'}}]],
}
