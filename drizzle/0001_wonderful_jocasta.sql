CREATE TABLE `reservacionesdb` (
	`id` integer PRIMARY KEY NOT NULL,
	`clase_id` integer NOT NULL,
	`nombre_clase` text NOT NULL,
	`hora_inicio` text NOT NULL,
	`hora_fin` text NOT NULL,
	`fecha` text NOT NULL,
	`estado` text NOT NULL,
	`lugar` integer
);
