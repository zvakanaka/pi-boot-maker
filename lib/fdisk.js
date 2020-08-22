const exec = require('util').promisify(require('child_process').exec)

module.exports = async function fdisk (gigabyteOnly = true) {
  const fdiskDashL = await exec('sudo fdisk -l')
  const disks = fdiskDashL.stdout.split('\n\n').map(diskStr => {
    const regex = /^Disk\s(\/.*):\s(\d+(?:\.\d+)?)\s([GM]iB),\s\d+\sbytes,\s\d+\ssectors\n(?:Disk model:\s(\w+))?/m
    const match = diskStr.match(regex)
    if (Array.isArray(match)) {
      const [, device, size, unit, name] = match
      return { device, size, unit, name }
    }
  }).filter(disk => disk && (gigabyteOnly ? disk.unit === 'GiB' : true))

  return disks
}
