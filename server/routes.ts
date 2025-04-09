import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertScheduledPostSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { setupAuth, hashPassword } from "./auth";

// Mock data for demonstration
const DEMO_POSTS = [
  {
    platform: "instagram",
    content_id: "1234567890",
    caption: "Had an amazing time at the beach today! The sunset was absolutely stunning. 🌅 #beachday #sunset #summervibes",
    thumbnail_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    original_url: "https://instagram.com/p/1234567890",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    likes_count: 248,
    type: "post",
    is_cached: true
  },
  {
    platform: "instagram",
    content_id: "2345678901",
    caption: "Coffee and productivity go hand in hand. Starting the day right! ☕ #morningroutine #productivity",
    thumbnail_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    original_url: "https://instagram.com/p/2345678901",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    likes_count: 189,
    type: "story",
    is_cached: true
  },
  {
    platform: "youtube",
    content_id: "3456789012",
    title: "How to Build Your First Web App | Complete Tutorial",
    caption: "Learn everything you need to know about building a web application from scratch in this comprehensive guide.",
    thumbnail_url: "https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    original_url: "https://youtube.com/watch?v=3456789012",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    views_count: 2300,
    type: "video",
    is_cached: true
  },
  {
    platform: "youtube",
    content_id: "4567890123",
    title: "10 VS Code Extensions Every Developer Should Use",
    caption: "Boost your productivity with these essential VS Code extensions that every developer should know about.",
    thumbnail_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    original_url: "https://youtube.com/watch?v=4567890123",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    views_count: 4700,
    type: "video",
    is_cached: true
  },
  {
    platform: "instagram",
    content_id: "5678901234",
    caption: "My home office setup is finally complete! What do you think? 💻 #homeoffice #workfromhome #productivity",
    thumbnail_url: "https://images.unsplash.com/photo-1516450137525-f8886e844c76?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    original_url: "https://instagram.com/p/5678901234",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    likes_count: 543,
    type: "post",
    is_cached: true
  },
  {
    platform: "youtube",
    content_id: "6789012345",
    title: "Modern JavaScript Explained For Beginners",
    caption: "Get up to speed with modern JavaScript features and techniques in this beginner-friendly guide.",
    thumbnail_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    original_url: "https://youtube.com/watch?v=6789012345",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
    views_count: 12800,
    type: "video",
    is_cached: true
  }
];

// Initialize storage with demo posts
async function seedDemoPosts() {
  for (const post of DEMO_POSTS) {
    try {
      await storage.createPost(post);
    } catch (error) {
      console.error("Error seeding post:", error);
    }
  }
}

// Function to seed a demo user
async function seedDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await storage.getUserByUsername('demo');
    if (existingUser) return;
    
    // Create demo user with hashed password
    await storage.createUser({
      username: 'demo',
      password: await hashPassword('password'),
      display_name: 'John Doe',
      email: 'john@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    });
  } catch (error) {
    console.error('Error seeding demo user:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with Passport.js
  setupAuth(app);

  // Seed demo data
  await seedDemoUser();
  await seedDemoPosts();

  // Check if we're authenticated (for client to check session status)
  app.get('/api/auth/session', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      return res.json({
        isAuthenticated: true,
        userId: req.user?.id,
        username: req.user?.username
      });
    }
    res.json({ isAuthenticated: false });
  });

  // Helper middleware to ensure authentication
  function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
  }

  // Platform connection routes
  app.post('/api/connect/instagram', ensureAuthenticated, async (req: Request, res: Response) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    try {
      await storage.updateUserTokens(req.user!.id, token);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to connect Instagram' });
    }
  });
  
  app.post('/api/connect/youtube', ensureAuthenticated, async (req: Request, res: Response) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    try {
      await storage.updateUserTokens(req.user!.id, undefined, token);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to connect YouTube' });
    }
  });

  // Posts routes
  app.get('/api/posts', async (req: Request, res: Response) => {
    try {
      const platform = req.query.platform as string;
      const platforms = platform ? platform.split(',') : undefined;
      
      const posts = await storage.getPosts(platforms ? { platform: platforms } : undefined);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve posts' });
    }
  });
  
  app.post('/api/posts/cache', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { postId, isCached } = req.body;
      
      if (typeof postId !== 'number' || typeof isCached !== 'boolean') {
        return res.status(400).json({ message: 'Invalid input' });
      }
      
      const success = await storage.setCachedStatus(postId, isCached);
      
      if (!success) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update cache status' });
    }
  });

  // Scheduled posts routes
  app.get('/api/scheduled-posts', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const posts = await storage.getScheduledPosts(req.user!.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve scheduled posts' });
    }
  });
  
  app.post('/api/scheduled-posts', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Make sure to include user ID from authenticated user
      const post = await storage.createScheduledPost({
        ...req.body,
        user_id: req.user!.id,
        status: req.body.status || 'pending'
      });
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: 'Failed to create scheduled post' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
