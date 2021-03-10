const { spawn } = require('child_process')

const testJavascript = () => {
  return new Promise((resolve, reject) => {
    const mocha = spawn('./node_modules/.bin/mocha', [
      '-r',
      '@babel/register',
      '--compilers',
      'js:@babel/register', 
      '-r',
      '@babel/polyfill',
      '--no-deprecation',
      '--timeout', 
      '600000'
    ])
    mocha.stdout.pipe(process.stdout)
    mocha.stderr.pipe(process.stderr)

    mocha.on('exit', code => {
      if (code !== 0) {
        return reject()
      }
      resolve()
    })
  })
}

module.exports = testJavascript
