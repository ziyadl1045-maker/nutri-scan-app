import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "./replitAuth";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`Login failed: User ${username} not found`);
          return done(null, false, { message: "Utilisateur non trouvé" });
        }
        if (user.password !== password) {
          console.log(`Login failed: Incorrect password for user ${username}`);
          return done(null, false, { message: "Mot de passe incorrect" });
        }
        console.log(`Login successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error("Login strategy error:", error);
        return done(error);
      }
    })
  );

  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        username,
        email,
        password,
        fullName,
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Error logging in after registration" });
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/login-local", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  // Get current authenticated user
  app.get("/api/auth/user", async (req: any, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Unauthorized" });
  });
}
