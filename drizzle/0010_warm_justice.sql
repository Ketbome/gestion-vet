PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clinic_mode` text DEFAULT 'basico' NOT NULL,
	`clinic_name` text DEFAULT '' NOT NULL,
	`public_booking_enabled` integer DEFAULT false NOT NULL,
	`booking_hours_note` text,
	`slot_minutes` integer DEFAULT 30 NOT NULL,
	`iva_enabled` integer DEFAULT true NOT NULL,
	`iva_rate` real DEFAULT 19 NOT NULL,
	`logo` text,
	`clinic_rut` text,
	`clinic_address` text,
	`clinic_phone` text,
	`clinic_email` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "clinic_mode", "clinic_name", "public_booking_enabled", "booking_hours_note", "slot_minutes", "iva_enabled", "iva_rate", "logo", "clinic_rut", "clinic_address", "clinic_phone", "clinic_email", "created_at", "updated_at") SELECT "id", "clinic_mode", "clinic_name", "public_booking_enabled", "booking_hours_note", "slot_minutes", "iva_enabled", "iva_rate", "logo", "clinic_rut", "clinic_address", "clinic_phone", "clinic_email", "created_at", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;