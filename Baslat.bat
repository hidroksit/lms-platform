@echo off
title LMS Platform Baslatici
color 0A

echo ===================================================
echo           LMS PLATFORM BASLATILIYOR
echo ===================================================
echo.
echo [BILGI] Docker Desktop uygulamasinin acik oldugundan emin olun.
echo.

echo [1/3] Servisler durduruluyor ve temizleniyor...
docker compose down

echo.
echo [2/3] Servisler baslatiliyor...
docker compose up -d

echo.
echo [3/3] Web sitesi aciliyor...
timeout /t 5 >nul
start http://localhost:3000

echo.
echo ===================================================
echo           BASARIYLA TAMAMLANDI!
echo ===================================================
echo.
echo Web Sitesi: http://localhost:3000
echo Backend:   http://localhost:3001
echo.
echo Masaustu uygulamasini baslatmak icin:
echo cd desktop ^&^& npm start
echo.
pause
