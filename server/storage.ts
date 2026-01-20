import { and } from "drizzle-orm";
import { users, type User, type UpsertUser, scanHistory, type InsertScanHistory, type ScanHistory } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getScanHistory(userId: string): Promise<ScanHistory[]>;
  createScanEntry(entry: InsertScanHistory): Promise<ScanHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: UpsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getScanHistory(userId: string): Promise<ScanHistory[]> {
    return await db
      .select()
      .from(scanHistory)
      .where(eq(scanHistory.userId, userId))
      .orderBy(desc(scanHistory.createdAt));
  }

  async createScanEntry(entry: InsertScanHistory): Promise<ScanHistory> {
    const [newEntry] = await db
      .insert(scanHistory)
      .values(entry)
      .returning();
    return newEntry;
  }

  async deleteScanEntry(id: number, userId: string): Promise<boolean> {
    const [deleted] = await db
      .delete(scanHistory)
      .where(and(eq(scanHistory.id, id), eq(scanHistory.userId, userId)))
      .returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
