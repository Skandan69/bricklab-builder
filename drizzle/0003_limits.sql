ALTER TABLE `feedback` ADD `ip_hash` text;--> statement-breakpoint
CREATE INDEX `feedback_ip_idx` ON `feedback` (`ip_hash`,`created_at`);--> statement-breakpoint
ALTER TABLE `towns` ADD `ip_hash` text;--> statement-breakpoint
CREATE INDEX `towns_ip_idx` ON `towns` (`ip_hash`,`created_at`);