/**
 * Calculate age from a birthday date string
 * @param {string} birthday - ISO date string (e.g., "2007-08-11T22:00:00.000Z")
 * @returns {number} Age in years
 */
export function calculateAge(birthday) {
  // Parse the date part only (YYYY-MM-DD) to avoid timezone shifting
  // This handles both "YYYY-MM-DD" and "YYYY-MM-DDT12:00:00.000Z" formats
  const datePart = birthday.split("T")[0]; // "YYYY-MM-DD"
  const [birthYear, birthMonth, birthDay] = datePart.split("-").map(Number);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1; // getMonth() is 0-indexed
  const todayDay = today.getDate();

  let age = todayYear - birthYear;

  // Adjust if birthday hasn't occurred yet this year
  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age--;
  }

  return age;
}
