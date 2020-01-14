echo off

SET HOSTNAME=%1
SET PROJECT=%2
SET SESSION=%3
SET DIRECTORY=%4
SET INBOX=%5
SET RSAKEY=%6

rem SET BIN=%6
SET LOGDIR="C:\Windows\Temp\"

rem Remove quotes from root directory,
rem otherwise end up with quotes in the middle of concatination
rem SET BIN=%BIN:"=%

rem "aspera\win\bin\ascp.exe" -l 10G -P 33001 -i %RSAKEY% -d -k 2 %DIRECTORY% ccfxfer@%HOSTNAME%:%INBOX%/%PROJECT%
"aspera\win32\bin\ascp.exe" -v -l 10G -P 33001 -i %RSAKEY% -d -k 2 %DIRECTORY% ccfxfer@%HOSTNAME%:/%PROJECT%/%SESSION%
