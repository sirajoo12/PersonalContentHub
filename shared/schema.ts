import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  instagram_auth_token: text("instagram_auth_token"),
  youtube_auth_token: text("youtube_auth_token"),
  avatar_url: text("avatar_url"),
  display_name: text("display_name"),
  email: text("email"),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // "instagram" | "youtube"
  content_id: text("content_id").notNull(), // Platform-specific ID
  title: text("title"),
  caption: text("caption"),
  thumbnail_url: text("thumbnail_url"),
  original_url: text("original_url"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  likes_count: integer("likes_count").default(0),
  views_count: integer("views_count").default(0),
  type: text("type").notNull(), // "post", "video", "story", etc.
  metadata: json("metadata"), // Additional platform-specific data
  is_cached: boolean("is_cached").default(false),
});

export const scheduled_posts = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // "instagram" | "youtube"
  content: text("content").notNull(),
  media_url: text("media_url"),
  scheduled_for: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "posted", "failed"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  instagram_auth_token: true,
  youtube_auth_token: true,
  avatar_url: true,
  display_name: true,
  email: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduled_posts).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduled_posts.$inferSelect;

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  scheduledPosts: many(scheduled_posts),
}));

export const scheduledPostsRelations = relations(scheduled_posts, ({ one }) => ({
  user: one(users, {
    fields: [scheduled_posts.user_id],
    references: [users.id],
  }),
}));
