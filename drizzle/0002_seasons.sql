-- Season tracking for series.
--   titles.season_list         → seasons from TMDB (released / airing / upcoming)
--   titles.seasons_checked_at  → last refresh, so new seasons are noticed
--   watch_entries.watched_seasons → seasons the user marked as finished
-- Existing entries keep watched_seasons NULL: the first season refresh marks
-- every released season on completed series and none on series in progress.
ALTER TABLE `titles` ADD `season_list` text;--> statement-breakpoint
ALTER TABLE `titles` ADD `seasons_checked_at` integer;--> statement-breakpoint
ALTER TABLE `watch_entries` ADD `watched_seasons` text;