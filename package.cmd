@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul || (
  echo Failed to open the extension directory. 1>&2
  exit /b 1
)

if not exist "package-files.txt" (
  echo Missing package file list: package-files.txt 1>&2
  popd
  exit /b 1
)

set "VERSION="
for /f "usebackq delims=" %%V in (`powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference = 'Stop'; (Get-Content -Raw -LiteralPath 'manifest.json' | ConvertFrom-Json).version"`) do set "VERSION=%%V"
if not defined VERSION (
  echo Could not read the extension version from manifest.json. 1>&2
  popd
  exit /b 1
)

set "HAS_PACKAGE_FILES="
for /f "usebackq eol=# delims=" %%F in ("package-files.txt") do (
  set "HAS_PACKAGE_FILES=1"
  if not exist "%%F" (
    echo Missing required package file: %%F 1>&2
    popd
    exit /b 1
  )
)
if not defined HAS_PACKAGE_FILES (
  echo The package file list is empty. 1>&2
  popd
  exit /b 1
)

where tar.exe >nul 2>&1
if errorlevel 1 (
  echo Windows tar.exe is required to create the ZIP archive. 1>&2
  popd
  exit /b 1
)

set "OUTPUT_DIR=%SCRIPT_DIR%dist"
set "ARCHIVE=%OUTPUT_DIR%\web-tldr-%VERSION%.zip"

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
if errorlevel 1 (
  echo Could not create output directory: %OUTPUT_DIR% 1>&2
  popd
  exit /b 1
)
if exist "%ARCHIVE%" del /f /q "%ARCHIVE%"

tar.exe --exclude=*/.DS_Store --exclude=*/._* --exclude=*/.AppleDouble --exclude=*/.AppleDouble/* --exclude=*/.LSOverride --exclude=*/__MACOSX --exclude=*/__MACOSX/* -a -c -f "%ARCHIVE%" -T package-files.txt
if errorlevel 1 (
  if exist "%ARCHIVE%" del /f /q "%ARCHIVE%"
  echo Failed to create the Web Store archive. 1>&2
  popd
  exit /b 1
)

echo Created %ARCHIVE%
popd
endlocal
