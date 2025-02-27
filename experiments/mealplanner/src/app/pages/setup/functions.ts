"use server"

import { db } from '@/db';

export async function addUserSetup(userId: string, formData: any) {
    const { age, gender, weight, height, activityLevel, dietaryPreferences, healthIssues, weightGoal } = formData;
    const ageInt = parseInt(age);
    const weightInt = parseFloat(weight);
    const heightInt = parseFloat(height);
    let setup = await db.setup.findUnique({
        where: {
            userId
        }
    })
    if (setup) {
        setup.age = ageInt;
        setup.gender = gender;
        setup.weight = weightInt;
        setup.height = heightInt;
        setup.activityLevel = activityLevel;
        setup.dietaryPreferences = dietaryPreferences;
        setup.healthIssues = healthIssues;
        setup.weightGoal = weightGoal;
    } else {
        setup = await db.setup.create({
            data: {
                userId,
                age: ageInt,
                gender,
                weight: weightInt,
                height: heightInt,
                activityLevel,
                dietaryPreferences,
                healthIssues,
                weightGoal,
            }
        })
    }
    await db.setup.update({
        where: {
            userId
        },
        data: setup
    })
    return setup;
}