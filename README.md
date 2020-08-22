# Raspberry Pi Boot USB Maker
Downloads and writes the latest Pi OS to a USB device. Also sets up [WiFi, SSH](https://www.raspberrypi.org/documentation/configuration/boot_folder.md), and the needed boot files for USB boot. 

This automates the 2nd half of [Jeff Geerlings instructions](https://www.jeffgeerling.com/blog/2020/im-booting-my-raspberry-pi-4-usb-ssd). YOU STILL HAVE TO DO THE FIRST HALF (steps 1-6) SPECIFIED [HERE](https://www.jeffgeerling.com/blog/2020/im-booting-my-raspberry-pi-4-usb-ssd) ONCE.

# WARNINGS
- USB boot is still in [beta](https://www.raspberrypi.org/forums/viewtopic.php?t=274595)
- Only for Raspberry Pi 4
- USE THIS SOFTWARE AT YOUR OWN RISK
- It's gonna make your Pi really fast

## Instructions
```
git clone https://github.com/zvakanaka/pi-boot-maker.git
cd pi-boot-maker
npm install
npm start
```

## System Dependencies
- Ubuntu
- Node.js

## Road Map
- [ ] Backup and restore USB drives/SD Cards
- [ ] Support SD Cards
- [ ] Support distros other than Raspberry Pi OS
- [ ] Support Pis other than the Raspberry Pi 4

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct, and the process for submitting pull requests.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Adam Quinton** - *Initial work* - [zvakanaka](https://github.com/zvakanaka)

See also the list of [contributors](https://github.com/zvakanaka/pi-boot-maker/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details