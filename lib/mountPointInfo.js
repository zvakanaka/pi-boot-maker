const exec = require('util').promisify(require('child_process').exec)

module.exports = async function mountPointInfo (partitionMountPoint) {
  const output = await exec('mount')
  const relevantLines = output.stdout
    .split('\n')
    .filter(line => line.includes(` on ${partitionMountPoint} `))

  if (relevantLines.length !== 1) {
    throw new Error(`Expected to find one candidate for mountPoint ${partitionMountPoint} but found ${relevantLines.length}`)
  }
  const regex = /(\/.*)\son\s(\/.*)\stype\s(.*)\s\(([a-z]+)/
  const match = relevantLines[0].match(regex)
  if (Array.isArray(match)) {
    const [, partitionIdentifier, mountPoint, type, access] = match
    return { partitionIdentifier, mountPoint, type, access }
  }
  throw new Error(`Regular expression failure while searching for mountPoint info for ${partitionMountPoint}`)
}
