CREATE TABLE `arena_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`challenge` text NOT NULL,
	`player_deck` text NOT NULL,
	`opponent_deck` text NOT NULL,
	`rounds` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'playing' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `arena_matches_user_idx` ON `arena_matches` (`user_id`,`created_at`);