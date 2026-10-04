CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`series_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `series_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`original_name` text,
	`overview` text,
	`poster_path` text,
	`backdrop_path` text,
	`first_air_year` integer,
	`last_air_year` integer,
	`number_of_seasons` integer,
	`number_of_episodes` integer,
	`genres` text DEFAULT '[]' NOT NULL,
	`networks` text DEFAULT '[]' NOT NULL,
	`status` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`bio` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `watch_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`series_id` integer NOT NULL,
	`collection_number` integer NOT NULL,
	`rating_halves` integer NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`viewing_number` integer DEFAULT 1 NOT NULL,
	`palette` text,
	`watched_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `watch_entries_user_idx` ON `watch_entries` (`user_id`,`watched_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `watch_entries_user_number_idx` ON `watch_entries` (`user_id`,`collection_number`);--> statement-breakpoint
CREATE INDEX `watch_entries_series_idx` ON `watch_entries` (`series_id`);