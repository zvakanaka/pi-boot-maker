const { spawn } = require('child_process')
const barChart = require('bar-charts')
const BLANK = '⠀' // braille blank emoji (because jstrace-bars removes leading spaces)

module.exports = function download (url, outputFileName) {
  return new Promise((resolve, reject) => {
    let lastPercentComplete

    const wget = spawn('wget', ['-O', outputFileName, url])
    wget.stderr.on('data', data => {
      const text = data.toString('utf8')
      const regexArr = text.match(/(\d+)%/)
      if (regexArr) {
        const [, percent] = regexArr
        const percentComplete = Number(percent)
        if (percentComplete !== lastPercentComplete) { // prevents jitter
          process.stdout.clearLine()
          process.stdout.cursorTo(0)
          const output = barChart([{ label: `${percent.padStart(4, BLANK)}/100%`, count: Math.max(percentComplete, 1) }], { percentages: true })
          process.stdout.write(output) // end the line
          lastPercentComplete = percentComplete
        }
      }
    })

    wget.stdout.on('end', data => {
      data && console.log('end', data)
    })
    wget.on('exit', function (code) {
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      if (code !== 0) {
        const errorMessage = `wget process exited with code ${code}`
        console.error(errorMessage)
        reject(errorMessage)
      }
      console.log(`created '${outputFileName}'`)
      resolve(code)
    })
  })
}
