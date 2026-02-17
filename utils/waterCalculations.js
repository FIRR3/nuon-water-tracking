/**
 * Calculate recommended daily water intake in milliliters
 * Based on scientific guidelines and research
 * 
 * @param {Object} params
 * @param {number} params.weight - Weight in kg
 * @param {number} params.height - Height in cm
 * @param {string} params.activityLevel - 'Sedentary', 'Moderate', or 'High'
 * @param {number} params.age - Age in years
 * @param {string} params.gender - 'male', 'female', or 'other'
 * @param {number} params.customGoal - Optional custom goal in ml (overrides calculation)
 * @returns {number} Recommended water intake in milliliters
 */
export function calculateRecommendedWaterIntake({
  weight,
  height,
  activityLevel,
  age,
  gender,
  customGoal = null
}) {
  // If user has set a custom goal, use that
  if (customGoal !== null && customGoal !== undefined) {
    return customGoal;
  }

  // Base calculation: 30-35ml per kg of body weight
  // Adjusted for gender (males typically need slightly more due to muscle mass)
  let baseIntake;
  
  if (gender === 'male') {
    baseIntake = weight * 35; // 35ml per kg for males
  } else if (gender === 'female') {
    baseIntake = weight * 31; // 31ml per kg for females
  } else {
    baseIntake = weight * 33; // Average for non-binary/other
  }

  // Age adjustments
  let ageMultiplier = 1.0;
  
  if (age < 12) {
    // Children have higher water needs relative to body weight
    ageMultiplier = 1.2;
  } else if (age < 18) {
    // Teenagers (active growth period)
    ageMultiplier = 1.1;
  } else if (age >= 65) {
    // Elderly need a base amount
    ageMultiplier = 1.0;
  }
  // Adults 18-64 stay at 1.0

  // Activity level adjustments
  let activityMultiplier = 1.0;
  
  switch (activityLevel) {
    case 'Sedentary':
      activityMultiplier = 1.0; // Base level
      break;
    case 'Moderate':
      activityMultiplier = 1.3; // 30% more for moderate activity
      break;
    case 'High':
      activityMultiplier = 1.6; // 60% more for high activity
      break;
    default:
      activityMultiplier = 1.0;
  }

  // Calculate final recommendation
  const recommendedIntake = baseIntake * ageMultiplier * activityMultiplier;

  // Round to nearest 50ml for cleaner numbers
  return Math.round(recommendedIntake / 50) * 50;
}

/**
 * Get a descriptive explanation of the recommendation
 */
export function getIntakeExplanation(intake) {
  const liters = (intake / 1000).toFixed(1);
  const cups = Math.round(intake / 237); // 237ml per cup
  
  return {
    ml: intake,
    liters: parseFloat(liters),
    cups: cups,
    description: `${liters}L (about ${cups} cups) per day`
  };
}

/**
 * Calculate percentage of daily goal achieved
 */
export function calculateProgress(currentIntake, goalIntake) {
  if (goalIntake === 0) return 0;
  const percentage = (currentIntake / goalIntake) * 100;
  return Math.min(Math.round(percentage), 100);
}