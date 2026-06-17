CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tutor_id` integer,
	`pet_id` integer,
	`tutor_name` text DEFAULT '' NOT NULL,
	`tutor_phone` text,
	`tutor_email` text,
	`pet_name` text DEFAULT '' NOT NULL,
	`species` text,
	`date` text NOT NULL,
	`time` text,
	`reason` text,
	`status` text DEFAULT 'solicitada' NOT NULL,
	`source` text DEFAULT 'interna' NOT NULL,
	`confirmed_at` text,
	`attention_id` integer,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attention_id`) REFERENCES `attentions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `pet_health_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pet_id` integer NOT NULL,
	`type` text DEFAULT 'vacuna' NOT NULL,
	`name` text NOT NULL,
	`applied_date` text NOT NULL,
	`next_due_date` text,
	`attention_id` integer,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attention_id`) REFERENCES `attentions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tutor_id` integer NOT NULL,
	`name` text NOT NULL,
	`species` text DEFAULT 'perro' NOT NULL,
	`breed` text,
	`sex` text DEFAULT 'desconocido' NOT NULL,
	`birth_date` text,
	`weight_grams` integer,
	`microchip` text,
	`sterilized` integer DEFAULT false NOT NULL,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clinic_mode` text DEFAULT 'basico' NOT NULL,
	`clinic_name` text DEFAULT '' NOT NULL,
	`public_booking_enabled` integer DEFAULT false NOT NULL,
	`booking_hours_note` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tutors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`rut` text,
	`address` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `attentions` ADD `tutor_id` integer REFERENCES tutors(id);--> statement-breakpoint
ALTER TABLE `attentions` ADD `pet_id` integer REFERENCES pets(id);--> statement-breakpoint
ALTER TABLE `attentions` ADD `weight_grams` integer;--> statement-breakpoint
ALTER TABLE `attentions` ADD `temperature` text;