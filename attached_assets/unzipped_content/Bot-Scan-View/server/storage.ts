import { users, type User, scanHistory, type InsertScanHistory, type ScanHistory } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getScanHistory(userId: string): Promise<ScanHistory[]>;
  createScanEntry(entry: InsertScanHistory): Promise<ScanHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
}

export const storage = new DatabaseStorage();
