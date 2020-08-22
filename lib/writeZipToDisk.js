// https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
const { spawn } = require('child_process')
const barChart = require('bar-charts')
const BLANK = '⠀' // braille blank emoji (because jstrace-bars removes leading spaces)

module.exports = async function writeZipToDisk ({ zipFileName = null, device = null }) {
  if (typeof arguments[0] !== 'object') {
    throw new Error('Expected argument to be of type `object`')
  } else if (arguments.length !== 1) {
    throw new Error('Expected exactly 1 (one) argument')
  } else if (typeof zipFileName !== 'string') {
    throw new Error(`Expected zipFileName to be of type 'string' but got '${typeof zipFileName}'`)
  } else if (typeof device !== 'string') {
    throw new Error(`Expected device to be of type 'string' but got '${typeof device}'`)
  } else if (zipFileName.length <= 0) {
    throw new Error('Expected zipFileName string length to be greater than 0')
  } else if (device.length <= 0) {
    throw new Error('Expected device string length to be greater than 0')
  }

  const unzip = spawn('unzip', ['-p', zipFileName])
  const dd = spawn('sudo', ['dd', 'bs=4M', `of=${device}`, 'status=progress', 'conv=fsync'])
  return new Promise((resolve, reject) => {
    unzip.stdout.on('data', (data) => {
      // pipe data from unzip to dd
      dd.stdin.write(data)
    })

    unzip.stderr.on('data', (data) => {
      console.error(`unzip stderr: ${data}`)
      // throw new Error(`unzip stderr: ${data}`);
    })

    unzip.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = `unzip process exited with code ${code}`
        console.error(errorMessage)
        reject(new Error(`unzip process exited with code ${code}`))
      }
      dd.stdin.end()
    })

    dd.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    dd.stderr.on('data', (data) => {
      const text = data.toString('utf8')
      const regexArr = text.match(/^(\d+)\sbytes/)
      if (regexArr) {
        const [, bytes] = regexArr
        const percentComplete = parseInt(parseInt(bytes) / 3711959040 * 100)
        process.stdout.clearLine()
        process.stdout.cursorTo(0)
        const output = barChart([{ label: `${`${percentComplete}`.padStart(4, BLANK)}/100%`, count: Math.max(percentComplete, 1) }], { percentages: true })
        process.stdout.write(output) // end the line
      }
    })

    dd.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = `dd process exited with code ${code}`
        console.error(errorMessage)
        reject(new Error(errorMessage))
      }
      resolve(code)
    })
  })
}
