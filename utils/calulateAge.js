/**
 * Calculate age from a birthday date string
 * @param {string} birthday - ISO date string (e.g., "2007-08-11T22:00:00.000Z")
 * @returns {number} Age in years
 */
export function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}