"use client";
import { Context } from '@/worker'
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { addUserSetup } from "./functions";

const steps = ["Personal Info", "Physical Stats", "Preferences", "Health Issues"];

export function SetupPage({ ctx }: { ctx: Context }) {
  const userId = ctx.user?.id;
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    age: "39",
    gender: "Male",
    weight: "80",
    height: "180",
    activityLevel: "Moderate",
    dietaryPreferences: "Mediterranean",
    healthIssues: "high cholesterol",
    weightGoal: "Lose weight",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    console.log("Form Submitted:", formData);
    if (!userId) {
      setError("User ID not found. Please try logging in again.");
      return;
    }
    const setup = await addUserSetup(userId, formData);
    
    if (setup) {
      // redirect to /plan
      window.location.href = "/plan";
    } else {
      // show error message
      setError("Failed to save setup"); 
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-xl font-semibold text-center mb-4">{steps[step]}</h2>
        <CardContent>
          {step === 0 && (
            <div>
              <label className="block mb-2">Age</label>
              <Input type="number" name="age" value={formData.age} onChange={handleChange} />
              <label className="block mt-4 mb-2">Gender</label>
              <Select onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {step === 1 && (
            <div>
              <label className="block mb-2">Weight (kg)</label>
              <Input type="number" name="weight" value={formData.weight} onChange={handleChange} />
              <label className="block mt-4 mb-2">Height (cm)</label>
              <Input type="number" name="height" value={formData.height} onChange={handleChange} />
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="block mb-2">Activity Level</label>
              <Select onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Activity Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedentary">Sedentary (Little to no exercise)</SelectItem>
                  <SelectItem value="Light">Light (Light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="Moderate">Moderate (Moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="Active">Active (Hard exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="Very Active">Very Active (Very hard exercise & physical job)</SelectItem>
                </SelectContent>
              </Select>
              <label className="block mt-4 mb-2">Dietary Preferences</label>
              <Input type="text" name="dietaryPreferences" value={formData.dietaryPreferences} onChange={handleChange} placeholder="E.g., Vegan, Keto" />
            </div>
          )}
          {step === 3 && (
            <div>
              <label className="block mb-2">Health Issues</label>
              <Input type="text" name="healthIssues" value={formData.healthIssues} onChange={handleChange} placeholder="E.g., Diabetes, High Blood Pressure" />
              <label className="block mb-2">Weight Goal</label>
              <Select onValueChange={(value) => setFormData({ ...formData, weightGoal: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Weight Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lose weight">Lose weight</SelectItem>
                  <SelectItem value="Maintain weight">Maintain weight</SelectItem>
                  <SelectItem value="Gain weight">Gain weight</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        <div className="flex justify-between mt-4">
          <Button onClick={prevStep} disabled={step === 0} className="bg-gray-300 text-black">Back</Button>
          {step === steps.length - 1 ? (
            <Button onClick={handleSubmit} className="bg-green-500 text-white">Submit</Button>
          ) : (
            <Button onClick={nextStep} className="bg-blue-500 text-white">Next</Button>
          )}
        </div>
        {error && <div className="text-red-500 text-center mt-4">{error}</div>}
      </Card>
    </div>
  );
}
