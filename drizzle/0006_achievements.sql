-- Achievements (conquistas).
--   franchises        → TMDB collections, to know when a saga is complete
--   user_achievements → what each user earned and the card that earned it
--   titles.collection_id / titles.makers → franchise and directors/creators
--     of each work; null makers = not fetched yet, filled on the next sync
CREATE TABLE `franchises` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parts` text DEFAULT '[]' NOT NULL,
	`checked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`scope` text DEFAULT '' NOT NULL,
	`label` text,
	`entry_id` text NOT NULL,
	`earned_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `key`, `scope`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entry_id`) REFERENCES `watch_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_achievements_entry_idx` ON `user_achievements` (`entry_id`);--> statement-breakpoint
CREATE INDEX `user_achievements_key_idx` ON `user_achievements` (`key`);--> statement-breakpoint
ALTER TABLE `titles` ADD `collection_id` integer;--> statement-breakpoint
ALTER TABLE `titles` ADD `makers` text;