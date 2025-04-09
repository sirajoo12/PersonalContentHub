import { 
  users, type User, type InsertUser,
  posts, type Post, type InsertPost,
  scheduled_posts, type ScheduledPost, type InsertScheduledPost 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(userId: number, instagramToken?: string, youtubeToken?: string): Promise<User | undefined>;
  
  // Posts methods
  getPosts(filters?: {platform?: string[]}): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  setCachedStatus(id: number, isCached: boolean): Promise<boolean>;
  
  // Scheduled posts methods
  getScheduledPosts(userId: number): Promise<ScheduledPost[]>;
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  updateScheduledPostStatus(id: number, status: string): Promise<ScheduledPost | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private scheduledPosts: Map<number, ScheduledPost>;
  currentUserId: number;
  currentPostId: number;
  currentScheduledPostId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.scheduledPosts = new Map();
    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentScheduledPostId = 1;
    
    // Add a demo user
    this.createUser({
      username: "demo",
      password: "password",
      display_name: "John Doe",
      email: "john@example.com",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserTokens(userId: number, instagramToken?: string, youtubeToken?: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      instagram_auth_token: instagramToken ?? user.instagram_auth_token,
      youtube_auth_token: youtubeToken ?? user.youtube_auth_token
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Posts methods
  async getPosts(filters?: {platform?: string[]}): Promise<Post[]> {
    let allPosts = Array.from(this.posts.values());
    
    if (filters?.platform && filters.platform.length > 0) {
      allPosts = allPosts.filter(post => filters.platform!.includes(post.platform));
    }
    
    // Sort posts by date, newest first
    return allPosts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const post: Post = { 
      ...insertPost, 
      id,
      created_at: insertPost.created_at || new Date()
    };
    this.posts.set(id, post);
    return post;
  }
  
  async updatePost(id: number, updateData: Partial<InsertPost>): Promise<Post | undefined> {
    const post = await this.getPostById(id);
    if (!post) return undefined;
    
    const updatedPost: Post = { ...post, ...updateData };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }
  
  async setCachedStatus(id: number, isCached: boolean): Promise<boolean> {
    const post = await this.getPostById(id);
    if (!post) return false;
    
    post.is_cached = isCached;
    this.posts.set(id, post);
    return true;
  }

  // Scheduled posts methods
  async getScheduledPosts(userId: number): Promise<ScheduledPost[]> {
    return Array.from(this.scheduledPosts.values())
      .filter(post => post.user_id === userId)
      .sort((a, b) => 
        new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      );
  }
  
  async createScheduledPost(insertPost: InsertScheduledPost): Promise<ScheduledPost> {
    const id = this.currentScheduledPostId++;
    const post: ScheduledPost = { ...insertPost, id };
    this.scheduledPosts.set(id, post);
    return post;
  }
  
  async updateScheduledPostStatus(id: number, status: string): Promise<ScheduledPost | undefined> {
    const post = this.scheduledPosts.get(id);
    if (!post) return undefined;
    
    const updatedPost: ScheduledPost = { ...post, status };
    this.scheduledPosts.set(id, updatedPost);
    return updatedPost;
  }
}

export const storage = new MemStorage();
