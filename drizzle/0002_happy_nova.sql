PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reservacionesdb` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clase_id` integer NOT NULL,
	`nombre_clase` text NOT NULL,
	`hora_inicio` text NOT NULL,
	`hora_fin` text NOT NULL,
	`fecha` text NOT NULL,
	`estado` text NOT NULL,
	`lugar` integer DEFAULT 0,
	`coach` text,
	`vacantes` integer DEFAULT 0,
	`tipo_clase_id` integer,
	`lugares_ocupados` text,
	`espera_users` text
);
--> statement-breakpoint
INSERT INTO `__new_reservacionesdb`("id", "clase_id", "nombre_clase", "hora_inicio", "hora_fin", "fecha", "estado", "lugar", "coach", "vacantes", "tipo_clase_id", "lugares_ocupados", "espera_users") SELECT "id", "clase_id", "nombre_clase", "hora_inicio", "hora_fin", "fecha", "estado", "lugar", "coach", "vacantes", "tipo_clase_id", "lugares_ocupados", "espera_users" FROM `reservacionesdb`;--> statement-breakpoint
DROP TABLE `reservacionesdb`;--> statement-breakpoint
ALTER TABLE `__new_reservacionesdb` RENAME TO `reservacionesdb`;--> statement-breakpoint
PRAGMA foreign_keys=ON;