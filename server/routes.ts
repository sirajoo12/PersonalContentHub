import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertScheduledPostSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware with MemoryStore
  const MemoryStoreInstance = MemoryStore(session);
  app.use(session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new MemoryStoreInstance({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'socialsync-secret'
  }));

  // Seed demo posts
  await seedDemoPosts();

  // Authentication route
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (req.session) {
      req.session.userId = user.id;
      req.session.username = user.username;
    }
    
    res.json({ 
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      has_instagram: !!user.instagram_auth_token,
      has_youtube: !!user.youtube_auth_token
    });
  });
  
  app.get('/api/auth/session', (req: Request, res: Response) => {
    if (req.session && req.session.userId) {
      return res.json({ 
        isAuthenticated: true, 
        userId: req.session.userId,
        username: req.session.username
      });
    }
    
    res.json({ isAuthenticated: false });
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // User profile route
  app.get('/api/user', async (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      has_instagram: !!user.instagram_auth_token,
      has_youtube: !!user.youtube_auth_token
    });
  });

  // Platform connection routes
  app.post('/api/connect/instagram', async (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    try {
      await storage.updateUserTokens(req.session.userId, token);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to connect Instagram' });
    }
  });
  
  app.post('/api/connect/youtube', async (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    try {
      await storage.updateUserTokens(req.session.userId, undefined, token);
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
  
  app.post('/api/posts/cache', async (req: Request, res: Response) => {
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
  app.get('/api/scheduled-posts', async (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const posts = await storage.getScheduledPosts(req.session.userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve scheduled posts' });
    }
  });
  
  app.post('/api/scheduled-posts', async (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const schedulePostSchema = insertScheduledPostSchema.extend({
        user_id: z.number().optional()
      });
      
      const validated = schedulePostSchema.parse({
        ...req.body,
        user_id: req.session.userId
      });
      
      const post = await storage.createScheduledPost(validated);
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
