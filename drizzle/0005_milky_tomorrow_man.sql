PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_usersdb` (
	`id` integer PRIMARY KEY NOT NULL,
	`nombres` text,
	`apellidoPaterno` text,
	`apellidoMaterno` text,
	`correo` text,
	`telefono` text,
	`contrasena` text NOT NULL,
	`estudiante` text,
	`fechaNacimiento` text,
	`token` text,
	`deviceId` text,
	`gymId` integer,
	`rol` text DEFAULT 'cliente'
);
--> statement-breakpoint
INSERT INTO `__new_usersdb`("id", "nombres", "apellidoPaterno", "apellidoMaterno", "correo", "telefono", "contrasena", "estudiante", "fechaNacimiento", "token", "deviceId", "gymId", "rol") SELECT "id", "nombres", "apellidoPaterno", "apellidoMaterno", "correo", "telefono", "contrasena", "estudiante", "fechaNacimiento", "token", "deviceId", "gymId", "rol" FROM `usersdb`;--> statement-breakpoint
DROP TABLE `usersdb`;--> statement-breakpoint
ALTER TABLE `__new_usersdb` RENAME TO `usersdb`;--> statement-breakpoint
PRAGMA foreign_keys=ON;