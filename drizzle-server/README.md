Aqui van migracion pero solo interactuan con el back no en front

1. Comandos de Verificación (Lectura)
Localizar archivo real: C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "find /data/data/com.infemov.appmovil/ -name bdMovil"

Listar tablas: C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "sqlite3 /data/data/com.infemov.appmovil/files/SQLite/bdMovil '.tables'"

Ver datos (Formato Tabla): C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "sqlite3 -header -column /data/data/com.infemov.appmovil/files/SQLite/bdMovil 'SELECT * FROM usersdb;'"

2. Comandos de Limpieza (Reset)
Borrar Tabla (Reset de estructura): C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "sqlite3 /data/data/com.infemov.appmovil/files/SQLite/bdMovil 'DROP TABLE IF EXISTS usersdb;'"

Vaciar Tabla (Borrar solo filas): C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "sqlite3 /data/data/com.infemov.appmovil/files/SQLite/bdMovil 'DELETE FROM usersdb;'"

Reiniciar ID a 1: C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "sqlite3 /data/data/com.infemov.appmovil/files/SQLite/bdMovil 'DELETE FROM sqlite_sequence WHERE name=\"usersdb\";'"

3. Comandos de Emergencia
Borrar archivo de BD completo: C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "rm /data/data/com.infemov.appmovil/files/SQLite/bdMovil"

Insertar usuario de prueba rápido: C:\Users\PC\AppData\Local\Android\Sdk\platform-tools\adb.exe shell "sqlite3 /data/data/com.infemov.appmovil/files/SQLite/bdMovil \"INSERT INTO usersdb (nombres, apellidos, correo, telefono, contrasena) VALUES ('Test', 'Ingeniero', 'prueba@test.com', '12345', 'pass123');\""