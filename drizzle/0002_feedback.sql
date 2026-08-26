CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`game` text NOT NULL,
	`rating` integer,
	`message` text NOT NULL,
	`context` text,
	`player_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_recent_idx` ON `feedback` (`created_at`);