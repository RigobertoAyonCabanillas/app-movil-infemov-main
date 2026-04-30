@echo off
set ADB_PATH="C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set PACKAGE=com.infemov.appmovil
set DB_NAME=bdMovilFinal
set LOCAL_NAME=db_proyecto_final.db
set REMOTE_PATH=/data/data/%PACKAGE%/files/SQLite/%DB_NAME%

echo 🔄 1. Consolidando TODAS las tablas (Root Checkpoint)...
:: Ejecutamos el checkpoint como root para saltar restricciones de la app
%ADB_PATH% shell "su 0 sqlite3 %REMOTE_PATH% 'PRAGMA wal_checkpoint(TRUNCATE);'"

echo 📁 2. Creando copia integra de la base de datos...
%ADB_PATH% shell "su 0 cp %REMOTE_PATH% /sdcard/full_sync.db"
%ADB_PATH% shell "su 0 chmod 777 /sdcard/full_sync.db"

echo 📥 3. Descargando a PC...
if exist %LOCAL_NAME% del /f /q %LOCAL_NAME%
%ADB_PATH% pull /sdcard/full_sync.db ./%LOCAL_NAME%

echo.
if exist %LOCAL_NAME% (
    echo ✅ EXITO: Base de datos completa sincronizada.
) else (
    echo ❌ ERROR: Fallo la descarga.
)
pause