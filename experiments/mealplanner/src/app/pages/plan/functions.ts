"use server";

import { db } from "@/db";
import { createMealPlanPrompt, createShoppingListPrompt } from "./prompts";

// Define types for OpenAI API response
type OpenAIResponse = {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function getUserData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      mealplan: {
        include: {
          shoppingList: true
        }
      },
      setup: true,
    }
  });
  return user;
}

export async function getMealPlanStatus(userId: string) {
  const status = await db.mealPlanStatus.findUnique({
    where: { userId }
  });
  return status;
}

export async function getShoppingListStatus(userId: string) {
  const status = await db.shoppingListStatus.findUnique({
    where: { userId }
  });
  return status;
}

export async function updateMealPlanStatus(userId: string, status: string, message?: string) {
  const existingStatus = await db.mealPlanStatus.findUnique({
    where: { userId }
  });

  if (existingStatus) {
    return await db.mealPlanStatus.update({
      where: { userId },
      data: { 
        status,
        message,
        updatedAt: new Date()
      }
    });
  } else {
    return await db.mealPlanStatus.create({
      data: {
        userId,
        status,
        message
      }
    });
  }
}

export async function updateShoppingListStatus(userId: string, status: string, message?: string) {
  const existingStatus = await db.shoppingListStatus.findUnique({
    where: { userId }
  });

  if (existingStatus) {
    return await db.shoppingListStatus.update({
      where: { userId },
      data: { 
        status,
        message,
        updatedAt: new Date()
      }
    });
  } else {
    return await db.shoppingListStatus.create({
      data: { 
        userId,
        status,
        message
      } as {
        userId: string;
        status: string;
        message?: string;
      }
    });
  }
}

export async function getMealPlan(userId: string) {
  const mealPlan = await db.mealPlan.findUnique({
    where: { userId }
  });
  return mealPlan;
}

export async function getShoppingList(userId: string) {
  const mealPlan = await db.mealPlan.findUnique({
    where: { userId }
  });
  return mealPlan;
}

export async function createShoppingList(apiKey: string, mealPlan: any, userId: string, dev: boolean) {
  // Update status to "processing"
  await updateShoppingListStatus(userId, "processing", "Generating your shopping list...");

  try {
    const prompt = createShoppingListPrompt(mealPlan);
    let shoppingList;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // Use type assertion to handle the response
    const data = await response.json() as OpenAIResponse;
    const responseText = data?.choices?.[0]?.message?.content?.trim();

    if (!responseText) {
      await updateShoppingListStatus(userId, "failed", "Invalid response from ChatGPT");
      throw new Error("Invalid response from ChatGPT");
    }

    try {
      shoppingList = JSON.parse(responseText);
    } catch (error) {
      console.error("🔻 JSON Parse Error:", error, "Response Text:", responseText);
      await updateShoppingListStatus(userId, "failed", "ChatGPT returned invalid JSON");
      throw new Error("ChatGPT returned invalid JSON");
    }

    if (!shoppingList.shopping_list) {
      await updateShoppingListStatus(userId, "failed", "Invalid shopping list format returned");
      throw new Error("Invalid shopping list format returned.");
    }

    const existingShoppingList = await db.shoppingList.findUnique({
      where: { userId }
    });
    
    let savedShoppingList;
    if (existingShoppingList) {
      savedShoppingList = await db.shoppingList.update({
        where: { id: existingShoppingList.id },
        data: { items: shoppingList.shopping_list },
      });
    } else {
      savedShoppingList = await db.shoppingList.create({
        data: {
          userId,
          mealPlanId: mealPlan.id,
          items: shoppingList.shopping_list,
        },
      });
    }
    
    // Update status to "completed"
    await updateShoppingListStatus(userId, "completed", "Your shopping list is ready!");
    
    return savedShoppingList;
  } catch (error) {
    // Update status to "failed" if any error occurs
    await updateShoppingListStatus(userId, "failed", `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
}

export async function createMealPlan(apiKey: string, userId: string, debugMode: boolean) {
  // Update status to "processing"
  await updateMealPlanStatus(userId, "processing", "Generating your meal plan...");

  try {
    const setup = await db.setup.findUnique({
      where: { userId }
    });
    const prompt = createMealPlanPrompt(debugMode, setup);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // Use type assertion to handle the response
    const data = await response.json() as OpenAIResponse;
    const responseText = data?.choices?.[0]?.message?.content?.trim();
    if (!responseText) {
      await updateMealPlanStatus(userId, "failed", "ChatGPT returned no response");
      throw new Error("ChatGPT returned no response");
    }

    // Validate JSON format
    let mealPlan;
    try {
      mealPlan = JSON.parse(responseText);
    } catch (error) {
      console.error("🔻 JSON Parse Error:", error, "Response Text:", responseText);
      await updateMealPlanStatus(userId, "failed", "ChatGPT returned invalid JSON");
      throw new Error("ChatGPT returned invalid JSON");
    }

    // Save meal plan to the database
    // if there is already a meal plan, update it 
    const existingMealPlan = await db.mealPlan.findUnique({
      where: { userId },
    });
    
    let savedMealPlan;
    if (existingMealPlan) {
      savedMealPlan = await db.mealPlan.update({
        where: { id: existingMealPlan.id },
        data: { 
          plan: mealPlan,
          updatedAt: new Date() // Explicitly set the updatedAt timestamp
        },
      });
    } else {
      savedMealPlan = await db.mealPlan.create({
        data: { 
          userId, 
          plan: mealPlan,
          updatedAt: new Date() // Explicitly set the updatedAt timestamp
        }, // Storing as JSON
      });
    }

    // once a new meal plan is generated, we need to delete any existing shopping list
    await db.shoppingList.deleteMany({
      where: { userId }
    });
    
    // Update status to "completed"
    await updateMealPlanStatus(userId, "completed", "Your meal plan is ready!");
    
    return savedMealPlan;
  } catch (error) {
    // Update status to "failed" if any error occurs
    await updateMealPlanStatus(userId, "failed", `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
}