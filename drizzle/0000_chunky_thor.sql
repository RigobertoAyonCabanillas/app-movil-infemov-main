CREATE TABLE `creditosdb` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`folioCredito` text,
	`paquete` text,
	`fechaPago` text,
	`fechaExpiracion` text,
	`estatus` integer,
	`userId` integer,
	`gymId` integer
);
--> statement-breakpoint
CREATE TABLE `membresiasdb` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`folioMembresia` text,
	`tipo` text,
	`fechaInicio` text,
	`fechaFin` text,
	`estatus` integer,
	`userId` integer,
	`gymId` integer
);
--> statement-breakpoint
CREATE TABLE `usersdb` (
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
	`gymId` integer
);
