CREATE TABLE `hospitalization_charges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hospitalization_id` integer NOT NULL,
	`product_id` integer,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`hospitalization_id`) REFERENCES `hospitalizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hospitalization_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hospitalization_id` integer NOT NULL,
	`date` text NOT NULL,
	`weight_grams` integer,
	`temperature` text,
	`heart_rate` integer,
	`resp_rate` integer,
	`treatment` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`hospitalization_id`) REFERENCES `hospitalizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hospitalizations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pet_id` integer NOT NULL,
	`tutor_id` integer,
	`vet_id` integer,
	`admitted_at` text NOT NULL,
	`reason` text,
	`diagnosis` text,
	`status` text DEFAULT 'activa' NOT NULL,
	`discharged_at` text,
	`notes` text,
	`total` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vet_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attention_id` integer,
	`hospitalization_id` integer,
	`amount` integer DEFAULT 0 NOT NULL,
	`method` text DEFAULT 'efectivo' NOT NULL,
	`date` text NOT NULL,
	`user_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`attention_id`) REFERENCES `attentions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hospitalization_id`) REFERENCES `hospitalizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "attention_id", "amount", "method", "date", "user_id", "created_at") SELECT "id", "attention_id", "amount", "method", "date", "user_id", "created_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;