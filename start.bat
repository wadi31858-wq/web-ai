@echo off
echo ====================================================
echo Menjalankan Web AI di Local Server...
echo Ini diperlukan agar kamera diizinkan oleh Browser.
echo ====================================================
start http://localhost:8080
python -m http.server 8080
