"use client";
import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Context } from "@/worker";
import { getUserData } from "./functions";
import { Layout } from "@/app/Layout";
import { Loader2, RefreshCw, ShoppingBag, Download, Share2, Lock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { toast } from "sonner";

// Define types for our data structures
type MealPlanType = {
  week: {
    day: string;
    total_calories: number;
    meals: {
      breakfast: {
        meal: string;
        ingredients: string[];
        calories: number;
        portion_size?: string;
      };
      lunch: {
        meal: string;
        ingredients: string[];
        calories: number;
        portion_size?: string;
      };
      dinner: {
        meal: string;
        ingredients: string[];
        calories: number;
        portion_size?: string;
      };
      snacks: Array<{
        meal: string;
        ingredients: string[];
        calories: number;
        portion_size?: string;
      }>;
    };
  }[];
  summary?: {
    description: string;
  }; // Optional summary with description
};

type ShoppingListItem = {
  ingredient: string;
  name?: string;
  quantity: string;
};

type ShoppingListType = {
  shopping_list?: Record<string, ShoppingListItem[]>;
} | ShoppingListItem[];

export function MealPlanPage({ ctx }: { ctx: Context }) {
  const [mealPlan, setMealPlan] = useState<MealPlanType | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListType | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingList, setGeneratingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [activeDay, setActiveDay] = useState("0");
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [canGeneratePlan, setCanGeneratePlan] = useState(false);
  // Debug flag to override restrictions
  const [debugMode, setDebugMode] = useState(ctx.debugMode);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPolledPlanId, setLastPolledPlanId] = useState<string | null>(null);
  const [pollingStartTime, setPollingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Helper function to set the active day to the current day of the week
  const setActiveDayToCurrent = () => {
    const today = new Date();
    // Get current day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDayIndex = today.getDay();
    // Convert to our index (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
    // If currentDayIndex is 0 (Sunday), we want 6, otherwise subtract 1
    const adjustedDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
    // Set the active day to the current day's index
    setActiveDay(adjustedDayIndex.toString());
  };

  useEffect(() => {
    if (ctx?.user && !fetchAttempted) {
      fetchUserData();
      setFetchAttempted(true);
      
      // Check if there's an in-progress meal plan generation
      checkForInProgressGeneration();
    }
    
    // Check if today is Monday or if user is premium
    const today = new Date();
    const isMonday = today.getDay() === 1; // 0 is Sunday, 1 is Monday
    const isPremiumUser = ctx?.user ? (ctx.user as any).isPremium || false : false; // Safe access with type assertion
    
    // Allow first-time users (with no meal plan) to generate a plan regardless of the day
    const isFirstTimeUser = !mealPlan;
    
    setCanGeneratePlan(isMonday || isPremiumUser || isFirstTimeUser);
  }, [ctx, fetchAttempted, mealPlan]);
  
  const fetchUserData = async () => {
    setLoading(true);
    setLoadingMessage("Loading your meal plan data...");
    try {
      const res = await getUserData(ctx?.user?.id || "");
      console.log(res);
      if (res && res.mealplan) {
        setMealPlan(res.mealplan.plan as unknown as MealPlanType);
        setLastPolledPlanId(res.mealplan.id);
        if (res.mealplan.shoppingList) {
          setShoppingList(res.mealplan.shoppingList.items as unknown as ShoppingListType);
        }
        // Set active day to current day when meal plan is loaded
        setActiveDayToCurrent();
      }
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      setError("Failed to load your meal plan. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  // Function to check if there's an in-progress meal plan generation
  const checkForInProgressGeneration = async () => {
    try {
      const response = await fetch("/api/mealPlanStatus");
      const status = await response.json();
      
      if (status && (status.status === "queued" || status.status === "processing")) {
        // Resume polling
        setLoading(true);
        setIsPolling(true);
        setPollingStartTime(new Date(status.startedAt));
        
        // Calculate elapsed time
        const startTimeDate = new Date(status.startedAt);
        const currentTime = new Date();
        const elapsedMs = currentTime.getTime() - startTimeDate.getTime();
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        setElapsedTime(elapsedSeconds);
        setLoadingMessage(status.message || `Resuming meal plan generation (${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s elapsed)...`);
        
        // Start polling again
        startPollingForMealPlan(elapsedSeconds);
        
        // Show toast notification
        toast.info("Resuming Generation", {
          description: "We're continuing to generate your meal plan.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error checking for in-progress generation:", error);
    }
  };

  const generateMealPlan = async () => {
    // Check if user can generate a plan (unless in debug mode)
    if (!canGeneratePlan && !debugMode) {
      setError("Free accounts can only regenerate meal plans on Mondays. Upgrade to premium for unlimited access!");
      return;
    }
    
    setLoading(true);
    setLoadingMessage("Queuing your meal plan request...");
    try {
      await fetch("/api/createMealPlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      // Show toast notification with Sonner
      toast.success("Meal Plan Queued", {
        description: "Your meal plan is being generated and will be ready in about a minute.",
        duration: 5000,
      });
      
      // Start polling for the meal plan
      setIsPolling(true);
      const startTime = new Date();
      setPollingStartTime(startTime);
      
      startPollingForMealPlan();
      
    } catch (error) {
      console.error("Error queuing meal plan:", error);
      setError("Failed to queue meal plan generation. Please try again.");
      setLoading(false);
      setLoadingMessage(null);
    }
  };

  const startPollingForMealPlan = (initialElapsedTime = 0) => {
    // Set a more user-friendly loading message
    setLoadingMessage("Your AI-powered meal plan is being generated. This typically takes about a minute while we create personalized recipes for you...");
    setElapsedTime(initialElapsedTime);
    
    // Poll every 10 seconds
    const pollInterval = setInterval(async () => {
      try {
        // Increment elapsed time (in seconds)
        setElapsedTime(prev => {
          const newElapsedTime = prev + 10;
          
          // Format elapsed time for display
          const elapsedMinutes = Math.floor(newElapsedTime / 60);
          const elapsedSeconds = newElapsedTime % 60;
          const timeDisplay = elapsedMinutes > 0 
            ? `${elapsedMinutes}m ${elapsedSeconds}s` 
            : `${elapsedSeconds}s`;
          
          // Update loading message with dots to show activity and elapsed time
          setLoadingMessage(prevMsg => {
            const baseMessage = `Checking for your meal plan (${timeDisplay})`;
            
            // Rotate through different numbers of dots to show activity
            if (prevMsg?.endsWith("...")) return `${baseMessage}.`;
            if (prevMsg?.endsWith("..")) return `${baseMessage}...`;
            if (prevMsg?.endsWith(".")) return `${baseMessage}..`;
            return `${baseMessage}.`;
          });
          
          return newElapsedTime;
        });
        
        // First check the status
        const statusResponse = await fetch("/api/mealPlanStatus");
        const status = await statusResponse.json();
        
        // If status is "completed", fetch the meal plan
        if (status && status.status === "completed") {
          const res = await getUserData(ctx?.user?.id || "");
          
          if (res && res.mealplan) {
            // We have a fresh meal plan
            clearInterval(pollInterval);
            setIsPolling(false);
            setMealPlan(res.mealplan.plan as unknown as MealPlanType);
            setLastPolledPlanId(res.mealplan.id);
            setShoppingList(null);
            setActiveDayToCurrent();
            setLoading(false);
            setLoadingMessage(null);
            setPollingStartTime(null);
            
            // Show success toast with Sonner
            toast.success("Meal Plan Ready", {
              description: "Your personalized meal plan has been generated successfully!",
              duration: 3000,
            });
          }
        } 
        // If status is "failed", show error
        else if (status && status.status === "failed") {
          clearInterval(pollInterval);
          setIsPolling(false);
          setLoading(false);
          setLoadingMessage(null);
          setPollingStartTime(null);
          
          setError(status.message || "Failed to generate meal plan. Please try again.");
          
          // Show error toast with Sonner
          toast.error("Generation Failed", {
            description: status.message || "There was an error generating your meal plan. Please try again.",
            duration: 5000,
          });
        }
        // Otherwise, continue polling
      } catch (error) {
        console.error("Error polling for meal plan:", error);
      }
    }, 10000); // Poll every 10 seconds
    
    // Stop polling after 2 minutes if no result
    setTimeout(() => {
      if (isPolling) {
        clearInterval(pollInterval);
        setIsPolling(false);
        setLoading(false);
        setLoadingMessage(null);
        setPollingStartTime(null);
        
        setError("Meal plan generation is taking longer than expected. Please check back later or try again.");
        
        // Show timeout toast with Sonner
        toast.error("Taking Longer Than Expected", {
          description: "Your meal plan is still being generated. Please check back in a few minutes.",
          duration: 5000,
        });
      }
    }, 120000); // 2 minutes timeout
  };

  const generateShoppingList = async () => {
    if (!mealPlan) return;
    
    setGeneratingList(true);
    setLoadingMessage("Queuing your shopping list request...");
    try {
      await fetch("/api/createShoppingList", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      // Show toast notification with Sonner
      toast.success("Shopping List Queued", {
        description: "Your shopping list is being generated and will be ready in a moment.",
        duration: 3000,
      });
      
      // Start polling for the shopping list
      pollForShoppingList();
      
    } catch (error) {
      console.error("Error generating shopping list:", error);
      setError("Failed to generate shopping list. Please try again.");
      setGeneratingList(false);
      setLoadingMessage(null);
    }
  };

  const pollForShoppingList = async () => {
    // Set a more user-friendly loading message
    setLoadingMessage("Generating your shopping list based on your meal plan...");
    
    // Poll every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        // Check the status
        const statusResponse = await fetch("/api/shoppingListStatus");
        const status = await statusResponse.json();
        
        // If status is "completed", fetch the shopping list
        if (status && status.status === "completed") {
          const res = await getUserData(ctx?.user?.id || "");
          
          if (res && res.mealplan && res.mealplan.shoppingList) {
            // We have a fresh shopping list
            clearInterval(pollInterval);
            setShoppingList(res.mealplan.shoppingList.items as unknown as ShoppingListType);
            setGeneratingList(false);
            setLoadingMessage(null);
            
            // Show success toast with Sonner
            toast.success("Shopping List Ready", {
              description: "Your shopping list has been generated successfully!",
              duration: 3000,
            });
          }
        } 
        // If status is "failed", show error
        else if (status && status.status === "failed") {
          clearInterval(pollInterval);
          setGeneratingList(false);
          setLoadingMessage(null);
          
          setError(status.message || "Failed to generate shopping list. Please try again.");
          
          // Show error toast with Sonner
          toast.error("Generation Failed", {
            description: status.message || "There was an error generating your shopping list. Please try again.",
            duration: 5000,
          });
        }
        // Otherwise, continue polling
      } catch (error) {
        console.error("Error polling for shopping list:", error);
      }
    }, 3000); // Poll every 3 seconds
    
    // Stop polling after 1 minute if no result
    setTimeout(() => {
      clearInterval(pollInterval);
      if (generatingList) {
        setGeneratingList(false);
        setLoadingMessage(null);
        
        setError("Shopping list generation is taking longer than expected. Please try again.");
        
        // Show timeout toast with Sonner
        toast.error("Taking Longer Than Expected", {
          description: "Your shopping list is still being generated. Please try again.",
          duration: 5000,
        });
      }
    }, 60000); // 1 minute timeout
  };

  const downloadShoppingList = () => {
    if (!shoppingList) return;
    
    // Format the shopping list as text
    let listText = "SHOPPING LIST\n\n";
    
    if (shoppingList && 'shopping_list' in shoppingList && shoppingList.shopping_list) {
      // Handle the structured shopping list with categories
      const categorizedList = shoppingList.shopping_list;
      
      Object.entries(categorizedList).forEach(([category, items]) => {
        listText += `${category.toUpperCase()}\n`;
        listText += "----------------------------------------\n";
        
        if (Array.isArray(items)) {
          items.forEach(item => {
            listText += `• ${item.ingredient}: ${item.quantity}\n`;
          });
        }
        
        listText += "\n";
      });
    } else if (Array.isArray(shoppingList)) {
      // Handle case where shoppingList is a simple array
      shoppingList.forEach(item => {
        const itemName = item.ingredient || item.name || '';
        listText += `• ${itemName}: ${item.quantity}\n`;
      });
    } else if (typeof shoppingList === 'object') {
      // Handle other object structures
      Object.entries(shoppingList).forEach(([category, items]) => {
        if (category !== 'shopping_list') {
          listText += `\n${category.toUpperCase()}:\n`;
          if (Array.isArray(items)) {
            (items as any[]).forEach(item => {
              const itemName = item.ingredient || item.name || '';
              listText += `• ${itemName}: ${item.quantity}\n`;
            });
          }
        }
      });
    }
    
    // Create a blob and download link
    const blob = new Blob([listText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareToWhatsApp = () => {
    if (!shoppingList) return;
    
    // Format the shopping list as text
    let listText = "🛒 *SHOPPING LIST*\n\n";
    
    if (shoppingList && 'shopping_list' in shoppingList && shoppingList.shopping_list) {
      // Handle the structured shopping list with categories
      const categorizedList = shoppingList.shopping_list;
      
      Object.entries(categorizedList).forEach(([category, items]) => {
        listText += `*${category.toUpperCase()}*\n`;
        
        if (Array.isArray(items)) {
          items.forEach(item => {
            listText += `• ${item.ingredient}: ${item.quantity}\n`;
          });
        }
        
        listText += "\n";
      });
    } else if (Array.isArray(shoppingList)) {
      // Handle case where shoppingList is a simple array
      shoppingList.forEach(item => {
        const itemName = item.ingredient || item.name || '';
        listText += `• ${itemName}: ${item.quantity}\n`;
      });
    } else if (typeof shoppingList === 'object') {
      // Handle other object structures
      Object.entries(shoppingList).forEach(([category, items]) => {
        if (category !== 'shopping_list') {
          listText += `\n*${category.toUpperCase()}*:\n`;
          if (Array.isArray(items)) {
            (items as any[]).forEach(item => {
              const itemName = item.ingredient || item.name || '';
              listText += `• ${itemName}: ${item.quantity}\n`;
            });
          }
        }
      });
    }
    
    // Encode the text for URL
    const encodedText = encodeURIComponent(listText);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    // Open in a new tab
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Layout ctx={ctx}>
      <div className="container mx-auto px-4 py-8">
        {/* Responsive header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Your 7-Day Meal Plan</h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Debug toggle button */}
            {debugMode && (
              <Button
                onClick={() => setDebugMode(!debugMode)}
                variant="outline"
              className={`border-gray-300 text-xs sm:text-sm flex-none ${
                debugMode ? "bg-red-100 border-red-500 text-red-500" : "text-gray-500"
              }`}
            >
              <span className="flex items-center gap-1">
                {debugMode ? "Debug: ON" : "Debug: OFF"}
              </span>
            </Button>
            )}
            
            {mealPlan && (
              <>
                {!shoppingList ? (
                  <Button 
                    onClick={generateShoppingList} 
                    variant="outline"
                    className="border-black text-black hover:bg-gray-100 flex-1 sm:flex-none"
                    disabled={generatingList}
                  >
                    {generatingList ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="sm:inline hidden">Generating...</span>
                        <span className="sm:hidden inline">Loading...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span className="sm:inline hidden">Generate Shopping List</span>
                        <span className="sm:hidden inline">Shopping List</span>
                      </span>
                    )}
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button 
                      onClick={downloadShoppingList} 
                      variant="outline"
                      className="border-black text-black hover:bg-gray-100 flex-1 sm:flex-none"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="sm:inline hidden">Download shopping list</span>
                        <span className="sm:hidden inline">Download</span>
                      </span>
                    </Button>
                    <Button 
                      onClick={shareToWhatsApp} 
                      variant="outline"
                      className="border-black text-black hover:bg-gray-100 flex-1 sm:flex-none"
                    >
                      <span className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        <span className="sm:inline hidden">Share via WhatsApp</span>
                        <span className="sm:hidden inline">Share</span>
                      </span>
                    </Button>
                  </div>
                )}
              </>
            )}
            <Button 
              onClick={generateMealPlan} 
              variant="outline"
              className="border-black text-black hover:bg-gray-100 flex-1 sm:flex-none"
              disabled={loading || (!canGeneratePlan && !debugMode)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </span>
              ) : !canGeneratePlan && !debugMode ? (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="sm:inline hidden">Available on Mondays</span>
                  <span className="sm:hidden inline">Mondays Only</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>{mealPlan ? "Regenerate Plan" : "Generate Plan"}</span>
                </span>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!canGeneratePlan && !debugMode && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Free accounts can only regenerate meal plans on Mondays. Upgrade to premium for unlimited access!
            </AlertDescription>
          </Alert>
        )}

        {debugMode && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Debug mode enabled. You can generate meal plans regardless of restrictions.
            </AlertDescription>
          </Alert>
        )}

        {!mealPlan && canGeneratePlan && !loading && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              As a new user, you can generate your first meal plan now! After that, free accounts can only regenerate plans on Mondays.
            </AlertDescription>
          </Alert>
        )}

        {loadingMessage && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-5 rounded-md mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <div>
                <p className="font-medium">{loadingMessage}</p>
                {isPolling && (
                  <p className="text-sm text-blue-100 mt-1">
                    This process may take up to 2 minutes. Please wait...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && !mealPlan && !loadingMessage && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && !mealPlan && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No meal plan available yet.</p>
            <p className="text-gray-500 text-sm">Generate a personalized 7-day meal plan based on your preferences and dietary requirements.</p>
          </div>
        )}

        {mealPlan && mealPlan.week && mealPlan.week.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Tabs defaultValue="0" value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="w-full border-b border-gray-200 bg-gray-50 p-0 h-auto">
                <div className="flex overflow-x-auto">
                  {mealPlan.week.map((day, index) => (
                    <TabsTrigger 
                      key={index}
                      value={index.toString()}
                      className="flex-1 py-3 px-2 sm:px-4 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none text-xs sm:text-sm"
                    >
                      {day.day}
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>

              {mealPlan.week.map((day, index) => (
                <TabsContent key={index} value={index.toString()} className="p-0 m-0">
                  <div className="p-3 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg sm:text-xl font-semibold">{day.day}'s Meals</h2>
                      <p className="text-xs sm:text-sm font-medium bg-black text-white px-2 sm:px-3 py-1 rounded">
                        {day.total_calories} calories
                      </p>
                    </div>

                    {/* Desktop view - standard table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Meal</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Ingredients</TableHead>
                            <TableHead>Portion Size</TableHead>
                            <TableHead className="text-right">Calories</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">🥞</span> Breakfast
                              </span>
                            </TableCell>
                            <TableCell>{day.meals.breakfast.meal}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {day.meals.breakfast.ingredients.join(", ")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {day.meals.breakfast.portion_size || "Standard serving"}
                            </TableCell>
                            <TableCell className="text-right">{day.meals.breakfast.calories}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">🍛</span> Lunch
                              </span>
                            </TableCell>
                            <TableCell>{day.meals.lunch.meal}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {day.meals.lunch.ingredients.join(", ")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {day.meals.lunch.portion_size || "Standard serving"}
                            </TableCell>
                            <TableCell className="text-right">{day.meals.lunch.calories}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">🍽️</span> Dinner
                              </span>
                            </TableCell>
                            <TableCell>{day.meals.dinner.meal}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {day.meals.dinner.ingredients.join(", ")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {day.meals.dinner.portion_size || "Standard serving"}
                            </TableCell>
                            <TableCell className="text-right">{day.meals.dinner.calories}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">🍎</span> Snacks
                              </span>
                            </TableCell>
                            <TableCell>{day.meals.snacks.map(snack => snack.meal).join(", ")}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {day.meals.snacks.flatMap(snack => snack.ingredients).join(", ")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {day.meals.snacks.map(snack => snack.portion_size || "Standard serving").join("; ")}
                            </TableCell>
                            <TableCell className="text-right">
                              {day.meals.snacks.reduce((total, snack) => total + snack.calories, 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile view - card-based layout */}
                    <div className="sm:hidden space-y-4">
                      {/* Breakfast Card */}
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-lg">🥞</span> Breakfast
                          </span>
                          <span className="text-xs font-medium bg-black text-white px-2 py-1 rounded">
                            {day.meals.breakfast.calories} cal
                          </span>
                        </div>
                        <h3 className="text-sm font-medium mb-1">{day.meals.breakfast.meal}</h3>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Ingredients:</span> {day.meals.breakfast.ingredients.join(", ")}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Portion:</span> {day.meals.breakfast.portion_size || "Standard serving"}
                        </p>
                      </div>

                      {/* Lunch Card */}
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-lg">🍛</span> Lunch
                          </span>
                          <span className="text-xs font-medium bg-black text-white px-2 py-1 rounded">
                            {day.meals.lunch.calories} cal
                          </span>
                        </div>
                        <h3 className="text-sm font-medium mb-1">{day.meals.lunch.meal}</h3>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Ingredients:</span> {day.meals.lunch.ingredients.join(", ")}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Portion:</span> {day.meals.lunch.portion_size || "Standard serving"}
                        </p>
                      </div>

                      {/* Dinner Card */}
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-lg">🍽️</span> Dinner
                          </span>
                          <span className="text-xs font-medium bg-black text-white px-2 py-1 rounded">
                            {day.meals.dinner.calories} cal
                          </span>
                        </div>
                        <h3 className="text-sm font-medium mb-1">{day.meals.dinner.meal}</h3>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Ingredients:</span> {day.meals.dinner.ingredients.join(", ")}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Portion:</span> {day.meals.dinner.portion_size || "Standard serving"}
                        </p>
                      </div>

                      {/* Snacks Card */}
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="flex items-center gap-2 font-medium">
                            <span className="text-lg">🍎</span> Snacks
                          </span>
                          <span className="text-xs font-medium bg-black text-white px-2 py-1 rounded">
                            {day.meals.snacks.reduce((total, snack) => total + snack.calories, 0)} cal
                          </span>
                        </div>
                        <h3 className="text-sm font-medium mb-1">{day.meals.snacks.map(snack => snack.meal).join(", ")}</h3>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Ingredients:</span> {day.meals.snacks.flatMap(snack => snack.ingredients).join(", ")}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Portion:</span> {day.meals.snacks.map(snack => snack.portion_size || "Standard serving").join("; ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            {mealPlan.summary && (  
              <div className="p-3 sm:p-6">
                <p className="text-sm text-gray-600">{mealPlan.summary.description}</p>
              </div>
            )}
            {/* last updated on mealplan */}
            {mealPlan && mealPlan.last_updated && (
              <div className="p-3 sm:p-6">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Last updated:</span> {mealPlan.last_updated}
                </p>
              </div>
            )}
            <div className="p-3 sm:p-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Note:</span> This meal plan is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for personalized nutrition and health advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
