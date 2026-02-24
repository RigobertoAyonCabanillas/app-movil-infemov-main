@echo off
set ADB_PATH=C:\Users\INFEMOV\AppData\Local\Android\Sdk\platform-tools\adb.exe
set PACKAGE=com.infemov.appmovil
set DB_NAME=bdMovil
set LOCAL_NAME=db_proyecto.db

echo 🔄 Generando copia limpia de la base de datos...

:: 1. Crear una copia en una ruta neutral usando SQLite para 'volcar' el contenido
%ADB_PATH% shell "su 0 sqlite3 /data/data/%PACKAGE%/files/SQLite/%DB_NAME% '.backup /sdcard/copia_limpia.db'"

:: 2. Dar permisos a esa copia
%ADB_PATH% shell "su 0 chmod 777 /sdcard/copia_limpia.db"

:: 3. Borrar el archivo viejo en tu PC
if exist %LOCAL_NAME% del /f /q %LOCAL_NAME%

:: 4. Traer la copia limpia
%ADB_PATH% pull /sdcard/copia_limpia.db ./%LOCAL_NAME%

echo.
if exist %LOCAL_NAME% (
    echo ✅ EXITO: Archivo descargado con respaldo completo.
) else (
    echo ❌ ERROR: Fallo al descargar.
)
pause