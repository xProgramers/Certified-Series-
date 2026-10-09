-- Arena stats come from the TMDB audience score:
--   titles.vote_average → score 0–10, titles.vote_count → votes behind it
-- Existing titles start null and are filled from TMDB when their owner opens the Arena.
ALTER TABLE `titles` ADD `vote_average` real;--> statement-breakpoint
ALTER TABLE `titles` ADD `vote_count` integer;