-- "Mais recentes" orders the collection by when each card was certified.
--   watch_entries.certified_at → exact moment the card got its certificate
-- completed_at only keeps the day the user picked, so cards certified on the
-- same day tied and fell back to the order they were added. Backfill: a card
-- last saved on its completion day was most likely certified at that moment,
-- so updated_at is the best guess; otherwise the completion day itself.
ALTER TABLE `watch_entries` ADD `certified_at` integer;--> statement-breakpoint
UPDATE `watch_entries` SET `certified_at` = CASE
  WHEN `updated_at` BETWEEN `completed_at` - 43200000 AND `completed_at` + 43200000 THEN `updated_at`
  ELSE `completed_at`
END
WHERE `status` = 'completed' AND `completed_at` IS NOT NULL;
