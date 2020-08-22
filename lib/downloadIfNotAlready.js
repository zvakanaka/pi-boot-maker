const download = require('./download')
const { exists } = require('fs-sync-utils')

module.exports = async function downloadIfNotAlready (downloadUrl, downloadFileName) {
  if (!exists(downloadFileName)) {
    // download file if it is not in place
    console.log(`Downloading ${downloadFileName}`)
    await download(downloadUrl, downloadFileName)
    console.log('Done with download')
    return downloadFileName
  }
  console.log(`Found ${downloadFileName} in cache`)
  return downloadFileName
}
