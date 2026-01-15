export * from "./models/auth";
export * from "./models/chat";

import { createInsertSchema } from "drizzle-zod";
import { users } from "./models/auth";
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
