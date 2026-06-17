CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attention_id` integer NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`method` text DEFAULT 'efectivo' NOT NULL,
	`date` text NOT NULL,
	`user_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`attention_id`) REFERENCES `attentions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prescription_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prescription_id` integer NOT NULL,
	`medication` text NOT NULL,
	`dose` text,
	`frequency` text,
	`duration` text,
	`instructions` text,
	FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pet_id` integer NOT NULL,
	`tutor_id` integer,
	`vet_id` integer,
	`attention_id` integer,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vet_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attention_id`) REFERENCES `attentions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'veterinario' NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`color` text DEFAULT '#0ea5e9' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `vet_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `vet_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `appointments` ADD `duration_min` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `attentions` ADD `vet_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `attentions` ADD `heart_rate` integer;--> statement-breakpoint
ALTER TABLE `attentions` ADD `resp_rate` integer;--> statement-breakpoint
ALTER TABLE `attentions` ADD `mucous` text;--> statement-breakpoint
ALTER TABLE `attentions` ADD `anamnesis` text;--> statement-breakpoint
ALTER TABLE `attentions` ADD `exam_findings` text;--> statement-breakpoint
ALTER TABLE `attentions` ADD `diagnosis` text;--> statement-breakpoint
ALTER TABLE `attentions` ADD `treatment` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `slot_minutes` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `logo` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `clinic_rut` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `clinic_address` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `clinic_phone` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `clinic_email` text;