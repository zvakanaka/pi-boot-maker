const prompt = require('promise-prompt')
const downloadIfNotAlready = require('./lib/downloadIfNotAlready')
const { write, exists, mkdir } = require('fs-sync-utils')
const fdisk = require('./lib/fdisk')
const writeZipToDisk = require('./lib/writeZipToDisk')
const exec = require('util').promisify(require('child_process').exec)
const unzip = require('./lib/unzip')
const getFatMountPoint = require('./lib/getFatMountPoint')
const mountPointInfo = require('./lib/mountPointInfo')

const piOsFile = '2020-05-27-raspios-buster-arm64.zip'
const piOsDownloadUrlDirectory = 'raspios_arm64/images/raspios_arm64-2020-05-28'

;(async () => {
  // create cache directories
  if (!exists('./cache')) mkdir('./cache')
  if (!exists('./cache/boot')) mkdir('./cache/boot')
  if (!exists('./cache/downloads')) mkdir('./cache/downloads')
  if (!exists('./cache/downloads/firmware')) mkdir('./cache/downloads/firmware')
  if (!exists('./cache/firmware')) mkdir('./cache/firmware')

  console.log()
  await downloadIfNotAlready(
    `https://downloads.raspberrypi.org/${piOsDownloadUrlDirectory}/${piOsFile}`,
    `./cache/downloads/${piOsFile}`)
  console.log()

  let shouldAskForWifiConfig = true
  if (exists('./cache/boot/wpa_supplicant.conf')) {
    const useExistingWifiConfig = await prompt('Found previous WiFi config, use it? [Y/n] ')
    if (useExistingWifiConfig.toLocaleLowerCase() !== 'y' || useExistingWifiConfig !== '') {
      shouldAskForWifiConfig = false
    }
  }
  if (shouldAskForWifiConfig) {
    const wifiSSID = await prompt('WiFi SSID (access point name): ')
    const wifiPassword = await prompt('WiFi password: ')
    const wifiCountryCode = await prompt('WiFi 2-letter country code: ')
    console.log('\nWriting WiFi configuration')
    write(
      './cache/boot/wpa_supplicant.conf',
      `ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=${wifiCountryCode}

network={
  ssid="${wifiSSID}"
  psk="${wifiPassword}"
}`)
  }

  write('./cache/boot/ssh', '')

  // get sudo access for next commands
  await exec('sudo echo ""')

  const disks = await fdisk()
  function diskInfo (disk) {
    return `${disk.device}${disk.name ? ` (${disk.name})` : ''}, Size: ${disk.size} ${disk.unit}`
  }
  console.log('\nDevices:\n\t' + disks
    .map((d, i) => `${i + 1}) ${diskInfo(d)}`)
    .join('\n\t'))

  const diskNumber = await prompt('\nType the disk number from above that you want to overwrite: ')
  if (diskNumber > disks.length || diskNumber < 1) {
    throw new Error(`Disk number ${diskNumber} is not in the list.`)
  }
  const diskIndex = diskNumber - 1
  const disk = disks[diskIndex]
  console.log(`\nYou have chosen option ${diskNumber})\n\t${diskInfo(disk)}`)

  const sure = await prompt('\nWould you like to write Raspberry Pi OS to this device? (your disk will be overwritten) [y/N] ')
  console.log()

  if (sure === 'y') {
    console.log(`Writing ${piOsFile} to ${diskInfo(disk)}\n`)
    await writeZipToDisk({
      zipFileName: `./cache/downloads/${piOsFile}`,
      device: `${disk.device}` // '/home/adam/Desktop/test.iso'
    })
    console.log(`Wrote ${piOsFile} to ${diskInfo(disk)}`)
  }

  const bootPartitionMountPoint = await getFatMountPoint(disk.device)
  let bootMountPointInfo = await mountPointInfo(bootPartitionMountPoint)
  const bootPartitionMountedAsReadOnly = bootMountPointInfo.access === 'ro'
  if (bootPartitionMountedAsReadOnly) {
    console.log('Boot partition was mounted as read-only\nUnmounting boot partition before remounting')
    const bootPartitionIdentifier = bootMountPointInfo.partitionIdentifier
    await exec(`sudo umount ${bootPartitionIdentifier}`)
    await exec(`sudo mount -o remount,rw ${bootPartitionIdentifier} ${bootPartitionMountPoint}`)
    bootMountPointInfo = await mountPointInfo(bootPartitionMountPoint)
    if (bootMountPointInfo.access !== 'rw') {
      throw new Error(`Could not remount boot partition (${bootPartitionMountPoint}) as read-write`)
    }
    console.log('\nBoot partition remounted as read-write')
  }

  console.log(`\nCopying custom boot configuration files (WiFi, SSH access) to ${bootPartitionMountPoint}`)
  // cp boot files and configs to bootMountPoint
  await exec(`sudo cp ./cache/boot/* ${bootPartitionMountPoint}/`)
  const bootDriveIsUsb = await prompt('Will you be booting your pi from a USB device? [y/N] ')
  if (bootDriveIsUsb === 'y') {
    // download git repo of boot mods https://github.com/raspberrypi/firmware
    const firmwareZip = './cache/downloads/firmware/master.zip'
    console.log()
    await downloadIfNotAlready(
      'https://github.com/raspberrypi/firmware/archive/master.zip',
      firmwareZip)
    if (!exists('./cache/firmware/firmware-master')) {
      console.log(`Unzipping ${firmwareZip}`)
      await unzip(firmwareZip, './cache/firmware/', 'firmware-master/boot/*.elf firmware-master/boot/*.dat')
    }

    console.log('Copying USB boot firmware files to drive')
    await exec(`sudo cp ./cache/firmware/firmware-master/boot/* ${bootPartitionMountPoint}/`)
    console.log()
  }

  // TODO: sudo umount bootMountPoint

  console.log('Now safely remove and plug the drive into your pi!')
})()
