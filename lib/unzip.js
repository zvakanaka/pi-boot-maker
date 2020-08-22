const exec = require('util').promisify(require('child_process').exec)

module.exports = async function unzip (zipFileName, outputDirectory, filesToExtract) {
  await exec(`unzip -d ${outputDirectory} ${zipFileName} ${filesToExtract}`)

  return outputDirectory
}
