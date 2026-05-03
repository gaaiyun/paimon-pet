@echo off
chcp 65001 >nul
title PaimonPet — One-Click Launcher

echo ================================================
echo   PaimonPet — 一键启动
echo ================================================
echo.

REM Start the Tauri app (it will auto-manage backends)
cd /d "%~dp0.."
npx tauri dev
