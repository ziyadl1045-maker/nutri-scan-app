import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { openai } from "./replit_integrations/chat/routes"; // Reuse openai client
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
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    res.json(user);
  });

  app.get(api.profile.scans.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const history = await storage.getScanHistory(userId);
    res.json(history);
  });

  app.patch(api.profile.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.get(api.products.lookup.path, async (req: any, res) => {
    const { barcode } = req.params;
    const userId = req.isAuthenticated() ? req.user.id : null;
    
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
      const nutriments = product.nutriments || {};
      const scoreValue = product.nutriscore_score !== undefined ? product.nutriscore_score : null;
      
      // Map Nutri-Score (-15 to 40) to 0-100 scale if available
      // Otherwise fallback to calculation in frontend
      let calculatedHealthScore = null;
      if (scoreValue !== undefined && scoreValue !== null) {
        calculatedHealthScore = Math.max(0, Math.min(100, 100 - (Number(scoreValue) + 15) * (100 / 55)));
      }

      // If product name is unknown or missing key data, try to enhance it with AI specifically for Moroccan context
      let enhancedName = product.product_name || "Unknown Product";
      let aiNutriments = null;
      let aiCalories = null;

      if (!product.product_name || product.product_name === "Unknown Product" || !product.brands || !product.nutriments || Object.keys(product.nutriments).length < 3) {
        try {
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a Moroccan food expert. Identify the product from the barcode. If it's Moroccan (barcode starts with 611), be precise. Also provide accurate nutritional facts per 100g if missing. Return JSON: { name, brand, nutriments: { sugars, fat, proteins, salt }, calories }."
              },
              {
                role: "user",
                content: `Barcode: ${barcode}. Current data: ${JSON.stringify({ name: product.product_name, brand: product.brands })}`
              }
            ],
            response_format: { type: "json_object" }
          });
          const aiData = JSON.parse(aiResponse.choices[0].message.content || "{}");
          if (aiData.name) enhancedName = aiData.name;
          if (aiData.nutriments) aiNutriments = aiData.nutriments;
          if (aiData.calories) aiCalories = aiData.calories;
        } catch (e) {
          console.error("AI Enhancement error:", e);
        }
      }

      const productData = {
        name: enhancedName,
        brand: product.brands || "Unknown Brand",
        nutriments: aiNutriments || nutriments,
        image_url: product.image_url,
        additives: product.additives_tags?.map((tag: string) => tag.replace('en:', '').replace('-', ' ')),
        calories: aiCalories || nutriments['energy-kcal_100g'],
        healthScore: calculatedHealthScore,
        nutriscore: product.nutriscore_grade,
      };

      // Save to history if user is logged in
      if (userId) {
        await storage.createScanEntry({
          userId,
          barcode,
          productName: productData.name,
          brand: productData.brand,
          imageUrl: productData.image_url,
          nutriments: productData.nutriments,
          calories: productData.calories ? Math.round(Number(productData.calories)) : null,
        });
      }

      res.json(productData);
    } catch (error) {
      console.error("OpenFoodFacts error:", error);
      res.status(500).json({ message: "Failed to fetch product data" });
    }
  });

  // AI Fallback Lookup
  app.post(api.products.aiLookup.path, async (req, res) => {
    try {
      const { name } = api.products.aiLookup.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a Moroccan nutrition expert. Provide estimated nutritional facts for the given product in JSON format. Fields: name, brand, sugars (g), fat (g), proteins (g), salt (g), calories (kcal), additives (array of E-codes). All values per 100g. Focus on products available in the Moroccan market (Aicha, Dari, Centrale Danone, Bimo, Excelo, Henry's, etc) including snacks, chips, and biscuits."
          },
          {
            role: "user",
            content: `Product: ${name}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const data = JSON.parse(response.choices[0].message.content || "{}");
      
      res.json({
        name: data.name || name,
        brand: data.brand || "AI Estimate",
        nutriments: {
          sugars: data.sugars || 0,
          fat: data.fat || 0,
          proteins: data.proteins || 0,
          salt: data.salt || 0,
        },
        calories: data.calories || 0,
        additives: data.additives || [],
        isAI: true
      });
    } catch (error) {
      console.error("AI Lookup error:", error);
      res.status(500).json({ message: "Failed to estimate product data" });
    }
  });

  return httpServer;
}
