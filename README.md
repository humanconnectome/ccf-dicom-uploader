# CCF DICOM Uploader

Custom uploader for the Connectome Coordination Facility at Washington U St. Louis. Built with Electon and uses IBM's high speed Aspera transfer client.

## Installation
Precompiled binaries are available for Linux (.AppImage), Windows(.exe), and MacOS (.dmg) in the project [releases](https://github.com/humanconnectome/ccf-dicom-uploader/releases)

Note: Ubuntu might require libgconf-2-4 in order to run.
```sh
$ sudo apt-get install libgconf-2-4
# Then to run the AppImage
$ ./DicomUploader-x86_64.AppImage
```

## Server Setup (Client)
> Specific to WUSTL Connectome Coordination Facility

- You will need to have an account on the XNAT server you plan to upload to. You will also need Member or Owner access on the project.
- In order to access the WUSTL Aspera server, you need to click "Request" under "Upload Access" to generate an ssh keypair. Copy and paste the public key and email it to the addresses shown. You'll need to wait for the CCF team to install the key before you can upload data.


## Upload directions
1. Select a project. Note, the projects in the list are readable by your XNAT account but not necessarily writable.
2. Upload a Single or Multiple DICOM image sessions. The uploader accepts a single directory which itself contains arbitrarily nested DICOM for a single session or a set of subdirectories containing one image session per directory.
3. You can define the subject and session labels or extract them from the DICOM headers. Note, a multi-sesson upload can only extract from headers.


## Server Setup (Backend)

The XNAT and Aspera servers must have a cross-mounted directory in common.
For Rsync transfers, you can set the transfer user up directly on the XNAT server (assuming Linux).



# Development
## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn run electron:serve
```

### Compiles and minifies for production
```
yarn run electron:build
```

### Lints and fixes files
```
yarn lint
```
