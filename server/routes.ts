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

  const sanitizeUser = (user: any) => {
    if (!user) return user;
    const { password, ...safe } = user;
    return safe;
  };

  // Profile Routes
  app.get(api.profile.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    res.json(sanitizeUser(user));
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
      res.json(sanitizeUser(updated));
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

  // Multi-device session management
  app.get("/api/sessions/count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.countUserSessions(userId);
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sessions/logout-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentSid = req.sessionID;
      const deleted = await storage.deleteAllUserSessions(userId, currentSid);
      res.json({ message: `${deleted} autre(s) appareil(s) déconnecté(s)`, count: deleted });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(`${api.profile.scans.path}/:id`, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const scanId = parseInt(req.params.id);
      const success = await storage.deleteScanEntry(scanId, userId);
      if (success) {
        res.json({ message: "Scan deleted" });
      } else {
        res.status(404).json({ message: "Scan not found" });
      }
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
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
      
      // Detailed nutritional mapping for better accuracy
      const mappedNutriments = {
        sugars: nutriments.sugars_100g || nutriments.sugars || 0,
        fat: nutriments.fat_100g || nutriments.fat || 0,
        proteins: nutriments.proteins_100g || nutriments.proteins || 0,
        salt: nutriments.salt_100g || nutriments.salt || 0,
        saturated_fat: nutriments['saturated-fat_100g'] || nutriments['saturated-fat'] || 0,
        fiber: nutriments.fiber_100g || nutriments.fiber || 0,
        sodium: nutriments.sodium_100g || nutriments.sodium || 0,
        energy_kcal: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0,
      };

      const scoreValue = product.nutriscore_score !== undefined ? product.nutriscore_score : null;
      
      // Map Nutri-Score (-15 to 40) to 0-100 scale if available
      // Otherwise fallback to calculation in frontend
      let calculatedHealthScore = null;
      if (scoreValue !== undefined && scoreValue !== null) {
        calculatedHealthScore = Math.max(0, Math.min(100, 100 - (Number(scoreValue) + 15) * (100 / 55)));
      }

      // If product name is unknown or missing key data, try to enhance it with AI specifically for Moroccan context
      let enhancedName = product.product_name || "";
      let aiNutriments = null;
      let aiCalories = null;

      // If we don't have a name from OFF, we MUST get it from AI
      // If we have a name but it's very generic (like "Product"), we can try to improve it
      const isGenericName = !enhancedName || enhancedName.toLowerCase().includes("unknown") || enhancedName.length < 3;

      if (isGenericName || !product.brands || !product.nutriments || Object.keys(product.nutriments).length < 3) {
        try {
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a Moroccan food expert. Identify the product precisely from the barcode. If it's a known product in Morocco, provide its exact common name and brand. Do not return generic or random names. Return JSON: { name, brand, nutriments: { sugars, fat, proteins, salt }, calories }."
              },
              {
                role: "user",
                content: `Barcode: ${barcode}. Current data: ${JSON.stringify({ name: product.product_name, brand: product.brands })}`
              }
            ],
            response_format: { type: "json_object" }
          });
          const aiData = JSON.parse(aiResponse.choices[0].message.content || "{}");
          if (aiData.name && aiData.name.length > 2) enhancedName = aiData.name;
          if (aiData.nutriments) aiNutriments = aiData.nutriments;
          if (aiData.calories) aiCalories = aiData.calories;
        } catch (e) {
          console.error("AI Enhancement error:", e);
        }
      }

      // Final fallback if both OFF and AI failed
      if (!enhancedName) enhancedName = "Produit inconnu";

      const productData: any = {
        name: enhancedName,
        brand: product.brands || "Unknown Brand",
        nutriments: mappedNutriments,
        image_url: product.image_url,
        additives: product.additives_tags?.map((tag: string) => tag.replace('en:', '').replace('-', ' ')),
        calories: Math.round(Number(mappedNutriments.energy_kcal)),
        healthScore: calculatedHealthScore,
        nutriscore: product.nutriscore_grade,
        serving_quantity: product.serving_quantity || (product.product_name?.toLowerCase().includes("biscuit") ? 25 : null),
        alternatives: [],
        dietWarnings: [],
        isMoroccan: barcode.startsWith("611"),
      };

      // Find healthier alternatives using AI if the score is low
      if (calculatedHealthScore !== null && calculatedHealthScore < 70) {
        try {
          const altResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a Moroccan nutrition expert. Suggest 3 healthier alternatives for the given product that are commonly available in Moroccan supermarkets (Marjane, Carrefour, Acima, BIM). Focus on better Nutri-Score alternatives. Return JSON: { alternatives: [{ name, brand, healthScore, reason }] }."
              },
              {
                role: "user",
                content: `Product: ${productData.name}, Brand: ${productData.brand}, Score: ${productData.healthScore}, Type: ${product.categories || "Food"}`
              }
            ],
            response_format: { type: "json_object" }
          });
          const altData: any = JSON.parse(altResponse.choices[0].message.content || "{}");
          productData.alternatives = (altData.alternatives || []).map((a: any) => ({
            ...a,
            healthScore: a.healthScore || 80
          }));
        } catch (e) {
          console.error("Alternatives AI error:", e);
        }
      }

      // Check if product matches user dietary preferences
      if (userId) {
        const user = await storage.getUser(userId);
        if (user && user.dietaryPreferences && user.dietaryPreferences.length > 0) {
          const isHalalPref = user.dietaryPreferences.includes('halal');
          const isVeganPref = user.dietaryPreferences.includes('vegan');
          const isGlutenFreePref = user.dietaryPreferences.includes('sans_gluten');
          const isDiabeticPref = user.dietaryPreferences.includes('diabetique');
          const isPeanutAllergyPref = user.dietaryPreferences.includes('allergie_arachide');

          // ── 1. Open Food Facts tags (most reliable) ──────────────────────
          const analysisTags: string[] = product.ingredients_analysis_tags || [];
          const labelsTags: string[] = product.labels_tags || [];
          const categoriesTags: string[] = product.categories_tags || [];

          // Check OFF tags for non-halal / pork
          const offHasPork = analysisTags.some((t: string) =>
            ['en:pork', 'en:non-halal', 'en:pork-gelatin', 'fr:porc'].includes(t)
          );
          const isHalalCertified = labelsTags.some((t: string) =>
            t.includes('halal')
          );
          const productIsInPorkCategory = categoriesTags.some((t: string) =>
            ['en:porks', 'en:hams', 'en:bacons', 'en:lards', 'en:pork-products',
             'en:sausages', 'fr:charcuteries', 'fr:jambons', 'fr:lardons'].includes(t)
          );

          // ── 2. Keyword scan on product text ──────────────────────────────
          const productText = (
            enhancedName + " " +
            (product.product_name || "") + " " +
            (product.ingredients_text || "") + " " +
            (product.brands || "") + " " +
            (product.categories || "") + " " +
            analysisTags.join(' ')
          ).toLowerCase();

          const porkKeywords = /\b(porc|pork|lard|lardon|bacon|jambon|cochon|pig|swine|ham|prosciutto|pancetta|chorizo|saucisson|rillettes|andouille|boudin)\b|gélatine de porc|gelatin|gelatine|graisse de porc|saindoux|e441|extrait de porc/;
          const keywordHasPork = porkKeywords.test(productText);

          const glutenKeywords = /\b(blé|wheat|gluten|orge|seigle|avoine|épeautre|barley|rye|oat)\b/;
          const keywordHasGluten = glutenKeywords.test(productText);

          const peanutKeywords = /\b(arachide|arachides|cacahuète|cacahuètes|peanut|peanuts|groundnut)\b/;
          const keywordHasPeanut = peanutKeywords.test(productText);

          // ── 3. Apply warnings deterministically ──────────────────────────
          const warnings: string[] = [];

          if (isHalalPref) {
            const hasPorkSignal = offHasPork || productIsInPorkCategory || keywordHasPork;
            if (hasPorkSignal && !isHalalCertified) {
              warnings.push("🚫 Attention Halal : Ce produit contient du porc ou des ingrédients d'origine porcine (lard, gélatine, etc.) incompatibles avec votre régime Halal.");
            } else if (!hasPorkSignal && !isHalalCertified && (product.ingredients_text || "").length > 10) {
              // Use AI only when we have ingredient data but no clear signal
              try {
                const dietResponse = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [
                    {
                      role: "system",
                      content: "Tu es un expert en alimentation halal. Analyse les ingrédients d'un produit alimentaire pour détecter toute trace de porc (porc, lard, gélatine porcine, saindoux, E441, graisses animales non certifiées) ou tout ingrédient clairement non-halal. Si aucun problème n'est détecté, renvoie un tableau vide. Réponds UNIQUEMENT en JSON: { warnings: [string] }. Les avertissements doivent être en français."
                    },
                    {
                      role: "user",
                      content: `Produit: ${enhancedName}, Marque: ${productData.brand}\nIngrédients: ${product.ingredients_text || "N/A"}\nCatégories: ${product.categories || "N/A"}`
                    }
                  ],
                  response_format: { type: "json_object" }
                });
                const dietData: any = JSON.parse(dietResponse.choices[0].message.content || "{}");
                (dietData.warnings || []).forEach((w: string) => warnings.push(w));
              } catch (e) {
                console.error("Halal AI check error:", e);
              }
            }
          }

          if (isGlutenFreePref && keywordHasGluten) {
            warnings.push("⚠️ Contient du gluten : incompatible avec votre régime sans gluten.");
          }

          if (isPeanutAllergyPref && keywordHasPeanut) {
            warnings.push("⚠️ Allergie arachide : Ce produit contient des arachides ou des cacahuètes.");
          }

          if (isVeganPref) {
            const veganStatus = analysisTags.find((t: string) => t.includes('vegan') || t.includes('non-vegan'));
            if (veganStatus?.includes('non-vegan')) {
              warnings.push("⚠️ Non vegan : Ce produit contient des ingrédients d'origine animale.");
            }
          }

          if (isDiabeticPref) {
            const sugars = mappedNutriments.sugars || 0;
            if (sugars > 15) {
              warnings.push(`⚠️ Diabète : Ce produit est riche en sucres (${sugars}g/100g). À consommer avec précaution.`);
            }
          }

          productData.dietWarnings = warnings;
        }
      }

      // Save to history if user is logged in
      if (userId) {
        try {
          await storage.createScanEntry({
            userId,
            barcode,
            productName: productData.name,
            brand: productData.brand,
            imageUrl: productData.image_url,
            nutriments: productData.nutriments,
            calories: productData.calories ? Math.round(Number(productData.calories)) : null,
            dietWarnings: productData.dietWarnings,
          });
        } catch (e) {
          console.error("Error saving scan history:", e);
        }
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
