import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { api } from "@shared/routes";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Profile Routes
  app.get(api.profile.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    res.json(user);
  });

  app.patch(api.profile.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.profile.update.input.parse(req.body);
      const updated = await storage.updateUser(userId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Product Lookup (Proxy to OpenFoodFacts)
  app.get(api.products.lookup.path, async (req, res) => {
    const { barcode } = req.params;
    try {
      // Use OpenFoodFacts API (free, no key)
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (!response.ok) {
        return res.status(404).json({ message: "Product not found" });
      }
      const data = await response.json();
      if (data.status === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const product = data.product;
      res.json({
        name: product.product_name || "Unknown Product",
        brand: product.brands,
        nutriments: product.nutriments,
        image_url: product.image_url,
        // Add more fields if needed
      });
    } catch (error) {
      console.error("OpenFoodFacts error:", error);
      res.status(500).json({ message: "Failed to fetch product data" });
    }
  });

  return httpServer;
}
