-- Series + movies in one collection.
--   series        → titles (composite key: type + TMDB id)
--   watch_entries → content_type/content_id, status, nullable rating,
--                   certification_status, added_at, completed_at
--   favorites     → keyed by content_type/content_id
-- Every existing entry was a finished, rated series: it becomes "completed"
-- and is certified when its rating is ≥ 5.0 (rating_halves ≥ 10).
CREATE TABLE `titles` (
	`type` text NOT NULL,
	`id` integer NOT NULL,
	`name` text NOT NULL,
	`original_name` text,
	`overview` text,
	`poster_path` text,
	`backdrop_path` text,
	`start_year` integer,
	`end_year` integer,
	`number_of_seasons` integer,
	`number_of_episodes` integer,
	`runtime` integer,
	`genres` text DEFAULT '[]' NOT NULL,
	`networks` text DEFAULT '[]' NOT NULL,
	`content_rating` text,
	`status` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`type`, `id`)
);
--> statement-breakpoint
INSERT INTO `titles` (`type`, `id`, `name`, `original_name`, `overview`, `poster_path`, `backdrop_path`, `start_year`, `end_year`, `number_of_seasons`, `number_of_episodes`, `genres`, `networks`, `status`, `created_at`, `updated_at`)
SELECT 'series', `id`, `name`, `original_name`, `overview`, `poster_path`, `backdrop_path`, `first_air_year`, `last_air_year`, `number_of_seasons`, `number_of_episodes`, `genres`, `networks`, `status`, `created_at`, `updated_at` FROM `series`;
--> statement-breakpoint
CREATE TABLE `__new_watch_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`collection_number` integer NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`rating_halves` integer,
	`certification_status` text,
	`reflection` text DEFAULT '' NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`viewing_number` integer DEFAULT 1 NOT NULL,
	`palette` text,
	`added_at` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`content_type`,`content_id`) REFERENCES `titles`(`type`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_watch_entries` (`id`, `user_id`, `content_type`, `content_id`, `collection_number`, `status`, `rating_halves`, `certification_status`, `reflection`, `is_public`, `viewing_number`, `palette`, `added_at`, `completed_at`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, 'series', `series_id`, `collection_number`, 'completed', `rating_halves`,
	CASE WHEN `rating_halves` >= 10 THEN 'certified' ELSE 'not_certified' END,
	`reflection`, `is_public`, `viewing_number`, `palette`, MIN(`created_at`, `watched_at`), `watched_at`, `created_at`, `updated_at`
FROM `watch_entries`;
--> statement-breakpoint
CREATE TABLE `__new_favorites` (
	`user_id` text NOT NULL,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `content_type`, `content_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`content_type`,`content_id`) REFERENCES `titles`(`type`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_favorites` (`user_id`, `content_type`, `content_id`, `created_at`)
SELECT `user_id`, 'series', `series_id`, `created_at` FROM `favorites`;
--> statement-breakpoint
DROP TABLE `favorites`;
--> statement-breakpoint
DROP TABLE `watch_entries`;
--> statement-breakpoint
DROP TABLE `series`;
--> statement-breakpoint
ALTER TABLE `__new_watch_entries` RENAME TO `watch_entries`;
--> statement-breakpoint
ALTER TABLE `__new_favorites` RENAME TO `favorites`;
--> statement-breakpoint
CREATE INDEX `watch_entries_user_idx` ON `watch_entries` (`user_id`,`added_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `watch_entries_user_number_idx` ON `watch_entries` (`user_id`,`collection_number`);
--> statement-breakpoint
CREATE INDEX `watch_entries_content_idx` ON `watch_entries` (`content_type`,`content_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `watch_entries_one_in_progress_idx` ON `watch_entries` (`user_id`,`content_type`,`content_id`) WHERE status = 'in_progress';
