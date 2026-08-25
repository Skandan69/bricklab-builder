CREATE TABLE `towns` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`owner_name` text,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`brick_count` integer DEFAULT 0 NOT NULL,
	`thumb` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `towns_owner_idx` ON `towns` (`owner_id`);--> statement-breakpoint
CREATE INDEX `towns_public_idx` ON `towns` (`visibility`,`updated_at`);--> statement-breakpoint
CREATE TABLE `town_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`town_id` text NOT NULL,
	`voter_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `town_likes_town_idx` ON `town_likes` (`town_id`);
