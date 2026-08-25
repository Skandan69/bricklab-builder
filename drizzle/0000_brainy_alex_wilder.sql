CREATE TABLE `city_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`city_id` text NOT NULL,
	`voter_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
