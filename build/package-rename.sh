#!/bin/bash

cd out

mv DicomUploader-*.dmg DicomUploader.dmg

mv DicomUploader\ Setup*.exe DicomUploaderSetup.exe

mv DicomUploader-*-x86_64.AppImage DicomUploader-x86_64.AppImage

rm *.zip
rm *.blockmap
