/**
 * Password Strength Validation
 * Enhanced password validation with strength metrics
 */

export interface PasswordStrength {
  score: number; // 0-100
  level: "weak" | "fair" | "good" | "strong" | "very_strong";
  feedback: string[];
  isValid: boolean;
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters long");
  } else if (password.length >= 8) {
    score += 20;
  }
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 10;
  } else {
    feedback.push("Add lowercase letters");
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add uppercase letters");
  }

  if (/\d/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add numbers");
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 20;
  } else {
    feedback.push("Add special characters (!@#$%^&*)");
  }

  // Complexity checks
  const uniqueChars = new Set(password.split("")).size;
  if (uniqueChars >= password.length * 0.6) {
    score += 10;
  }

  // Common pattern penalties
  if (/^(.)\1+$/.test(password)) {
    score -= 30;
    feedback.push("Avoid repeating characters");
  }

  if (/^(abc|123|qwerty|password|admin)/i.test(password)) {
    score -= 50;
    feedback.push("Avoid common patterns like '123', 'abc', 'password'");
  }

  // Determine level
  let level: PasswordStrength["level"];
  if (score < 30) level = "weak";
  else if (score < 50) level = "fair";
  else if (score < 70) level = "good";
  else if (score < 90) level = "strong";
  else level = "very_strong";

  // Check if password meets minimum requirements
  const isValid =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    score: Math.max(0, Math.min(100, score)),
    level,
    feedback,
    isValid,
  };
}

export function getPasswordStrengthColor(
  level: PasswordStrength["level"]
): string {
  switch (level) {
    case "weak":
      return "text-red-600";
    case "fair":
      return "text-orange-600";
    case "good":
      return "text-yellow-600";
    case "strong":
      return "text-blue-600";
    case "very_strong":
      return "text-green-600";
  }
}

export function getPasswordStrengthBgColor(
  level: PasswordStrength["level"]
): string {
  switch (level) {
    case "weak":
      return "bg-red-600";
    case "fair":
      return "bg-orange-600";
    case "good":
      return "bg-yellow-600";
    case "strong":
      return "bg-blue-600";
    case "very_strong":
      return "bg-green-600";
  }
}
