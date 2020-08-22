const exec = require('util').promisify(require('child_process').exec)

module.exports = async function getFatMountPoint(deviceStr) {
  const output = await exec(`lsblk --json`)
  const lsblkObj = JSON.parse(output.stdout)
  
  const deviceStrName = deviceStr.split('/')[deviceStr.split('/').length - 1]

  const deviceCandidates = lsblkObj.blockdevices.filter(device => {
    return device.name === deviceStrName
      && Array.isArray(device.children) && device.children.length === 2
  })
  if (deviceCandidates.length < 1) {
    throw new Error(`No device candidate found for ${deviceStr}`)
  } else if (deviceCandidates.length > 1) {
    throw new Error(`More than one device candidate found for ${deviceStr}`)
  }
  const bootParitionMountPoint = deviceCandidates[0].children[0].mountpoint

  return bootParitionMountPoint
};  
