export function createShoppingListPrompt(mealPlan: any) {
    return `You are a meal planning assistant. Given the following **7-day meal plan**, generate a **shopping list** grouped by food category.

    ### **Instructions**
    - Combine duplicate ingredients and sum up their total quantities.
    - Convert quantities into standard units (grams, cups, liters, etc.).
    - Group items into **categories**:
      - **Proteins** (chicken, beef, tofu, eggs, etc.)
      - **Vegetables** (spinach, tomatoes, carrots, etc.)
      - **Fruits** (apples, bananas, oranges, etc.)
      - **Dairy** (milk, cheese, yogurt, etc.)
      - **Grains** (rice, oats, quinoa, bread, etc.)
      - **Condiments & Oils** (olive oil, spices, sauces, etc.)
      - **Other** (miscellaneous items)
    
    ### **Meal Plan**
    ${JSON.stringify(mealPlan.plan.week, null, 2)}
    
    ### **Expected JSON Response**
    {
      "shopping_list": {
        "Proteins": [
          { "ingredient": "Chicken breast", "quantity": "600g" },
          { "ingredient": "Eggs", "quantity": "12" }
        ],
        "Vegetables": [
          { "ingredient": "Spinach", "quantity": "4 cups" },
          { "ingredient": "Tomatoes", "quantity": "5" }
        ],
        "Fruits": [
          { "ingredient": "Bananas", "quantity": "6" },
          { "ingredient": "Apples", "quantity": "4" }
        ],
        "Dairy": [
          { "ingredient": "Greek Yogurt", "quantity": "2 cups" }
        ],
        "Grains": [
          { "ingredient": "Quinoa", "quantity": "3 cups" },
          { "ingredient": "Oats", "quantity": "2 cups" }
        ],
        "Condiments & Oils": [
          { "ingredient": "Olive oil", "quantity": "200ml" }
        ]
      }
    }
    
    **Return only valid JSON, no explanations.**`;
    
}

export function createMealPlanPrompt(debugMode: boolean, setup: any) {
    return `You are a professional meal planning assistant. Generate a **${debugMode ? "1" : "7"}-day structured meal plan** for the following user:

    ### **User Profile**
    - **Age:** ${setup.age}
    - **Gender:** ${setup.gender}
    - **Weight:** ${setup.weight} kg
    - **Height:** ${setup.height} cm
    - **Activity Level:** ${setup.activityLevel}
    - **Dietary Preferences:** ${setup.dietaryPreferences || "None"}
    - **Health Issues:** ${setup.healthIssues || "None"}
    - **Weight Goal:** ${setup.weightGoal} (Lose weight, Gain weight, Maintain weight)
    
    ### **Meal Plan Requirements**
    - The plan should be **balanced and tailored to the user’s weight goal**.
    - Ensure **calories align with the goal**:
      - **Lose Weight** → Slight calorie deficit (~500 kcal below maintenance)
      - **Gain Weight** → Slight calorie surplus (~500 kcal above maintenance)
      - **Maintain Weight** → Calories match maintenance level
    - Each meal should include:
      - **Meal Name** (e.g., "Grilled Chicken with Quinoa")
      - **Ingredients** (list all ingredients used)
      - **Portion Size** (clearly indicate portion amounts, e.g., "150g chicken, 1 cup quinoa")
      - **Calories** (calculated total per meal)
    
    ### **Expected JSON Response Format**
    {
      "summary": {
        "description": "This meal plan is designed to help you ${setup.weightGoal.toLowerCase()}, providing approximately 2000 calories per day based on your activity level and weight.",
        "total_calories": 14000 // Total weekly calories
      },
      "week": [
        {
          "day": "Monday",
          "meals": {
            "breakfast": { 
              "meal": "Oatmeal with Bananas",
              "ingredients": ["Oats", "Banana", "Almond Milk"],
              "portion_size": "1/2 cup oats, 1 banana, 1 cup almond milk",
              "calories": 350
            },
            "lunch": { 
              "meal": "Grilled Chicken Salad",
              "ingredients": ["Chicken", "Lettuce", "Tomato", "Avocado", "Olive Oil"],
              "portion_size": "150g chicken, 2 cups lettuce, 1/2 avocado",
              "calories": 500
            },
            "dinner": { 
              "meal": "Salmon with Quinoa",
              "ingredients": ["Salmon", "Quinoa", "Spinach", "Lemon Juice"],
              "portion_size": "120g salmon, 1/2 cup quinoa, 1 cup spinach",
              "calories": 600
            },
            "snacks": [
              {
                "meal": "Greek Yogurt with Nuts",
                "ingredients": ["Greek Yogurt", "Almonds", "Honey"],
                "portion_size": "1 cup yogurt, 10 almonds, 1 tsp honey",
                "calories": 250
              }
            ]
          },
          "total_calories": 1700
        }
      ]
    }
    
    **Return only valid JSON with no additional text.**`;
    
}