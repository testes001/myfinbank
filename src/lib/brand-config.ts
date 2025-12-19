/**
 * Fin-Bank Brand Identity & Guidelines
 * Modern European fintech aesthetic
 */

export const FinBankBrand = {
  // Company Information
  company: {
    name: "Fin-Bank",
    tagline: "Secure banking for modern Europe",
    description: "European digital banking with physical branches in Spain, Germany, France, Italy, and Portugal",
    euBankingLicense: "ES-2024-001-FINBANK",
    regulatoryAuthority: "Spanish Financial Authority (CNMV)",
    depositInsuranceCoverage: "€100,000 per account (EU Deposit Guarantee Scheme)",
  },

  // Visual Identity - Colors
  colors: {
    // Primary: Trust and stability
    primary: {
      dark: "#003366", // Deep blue for main actions
      light: "#004D99", // Lighter variant for hover states
      lighter: "#E6F0FF", // Very light for backgrounds
    },

    // Secondary: Growth and security
    secondary: {
      green: "#00A86B", // Growth indicator
      emerald: "#00C878", // Success/positive action
      lightGreen: "#E6F9F0", // Light background
    },

    // Neutral palette
    neutral: {
      darkGray: "#1A1A1A", // Almost black
      gray: "#4A4A4A", // Medium gray
      lightGray: "#E0E0E0", // Light gray
      silver: "#F5F5F5", // Off-white
      white: "#FFFFFF", // Pure white
    },

    // Semantic colors
    semantic: {
      success: "#00A86B",
      error: "#D32F2F",
      warning: "#F57C00",
      info: "#1976D2",
    },

    // Gradients (for landing page, hero sections)
    gradients: {
      primary: "linear-gradient(135deg, #003366 0%, #004D99 100%)",
      subtle: "linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%)",
      feature: "linear-gradient(135deg, #00A86B 0%, #00C878 100%)",
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", sans-serif',
      code: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
    },
    sizes: {
      h1: "2.5rem", // 40px
      h2: "2rem", // 32px
      h3: "1.5rem", // 24px
      h4: "1.25rem", // 20px
      h5: "1.125rem", // 18px
      h6: "1rem", // 16px
      body: "1rem", // 16px
      small: "0.875rem", // 14px
      xsmall: "0.75rem", // 12px
    },
    weights: {
      thin: 100,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Logo variants
  logo: {
    fullLogo: "Fin-Bank logo with text",
    iconOnly: "Shield-based icon for app headers",
    monochrome: "Monochrome variant for documents",
    reversed: "White logo for dark backgrounds",
  },

  // Tone of Voice Guidelines
  voice: {
    adjectives: ["Professional", "Reassuring", "Transparent", "Modern", "Trustworthy"],
    examples: {
      reassuring:
        "Your funds are protected by EU deposit insurance and advanced encryption",
      transparent:
        "We show you exactly what we're doing with your money—no hidden fees",
      modern: "Banking should be simple. That's why we built Fin-Bank",
      supportive: "Your security is our priority. If something seems unusual, we'll alert you",
    },
    taglines: [
      "Secure banking for modern Europe",
      "Banking with transparency and trust",
      "Your financial security, our mission",
      "Modern banking without compromise",
    ],
  },

  // Restricted Imagery & Content
  restrictions: {
    forbiddenImagery: [
      "US flags and American imagery",
      "Dollar signs ($) as primary currency",
      "American city skylines",
      "Social media icons in official materials",
    ],
    preferredImagery: [
      "Madrid, Barcelona, Valencia cityscapes",
      "Berlin, Munich architecture",
      "Paris, Lyon landmarks",
      "Milan, Rome art and culture",
      "Lisbon, Porto waterfront",
      "Diverse European people and faces",
      "Modern fintech interfaces",
      "Security and encryption concepts",
    ],
    currencies: {
      primary: "EUR (€)",
      secondary: "USD ($) for deposits and transfers only",
      displayFormat: "€1,234.56",
    },
  },

  // Component styling guidelines
  components: {
    buttons: {
      primary: {
        background: "#003366",
        foreground: "#FFFFFF",
        hover: "#004D99",
        active: "#002244",
      },
      secondary: {
        background: "#F5F5F5",
        foreground: "#003366",
        hover: "#E0E0E0",
        active: "#D0D0D0",
      },
      success: {
        background: "#00A86B",
        foreground: "#FFFFFF",
        hover: "#00C878",
      },
      danger: {
        background: "#D32F2F",
        foreground: "#FFFFFF",
        hover: "#B71C1C",
      },
    },
    cards: {
      background: "#FFFFFF",
      border: "#E0E0E0",
      shadow: "0 2px 8px rgba(0, 51, 102, 0.08)",
      borderRadius: "10px",
    },
    inputs: {
      background: "#F5F5F5",
      border: "#E0E0E0",
      focus: "#003366",
      focusBorder: "#004D99",
      text: "#1A1A1A",
      placeholder: "#4A4A4A",
    },
  },

  // Accessibility standards
  accessibility: {
    wcagLevel: "AA",
    minFontSize: "16px",
    minContrast: "4.5:1",
    focusIndicator: "2px solid #003366",
    keyboardNavigation: true,
  },

  // Regional specificity
  regions: {
    eligible: ["ES", "DE", "FR", "IT", "PT"],
    descriptions: {
      ES: "Spain",
      DE: "Germany",
      FR: "France",
      IT: "Italy",
      PT: "Portugal",
    },
    eligibleCountries: ["Spain", "Germany", "France", "Italy", "Portugal"],
    ibanFormats: {
      ES: "ESxx XXXX XXXX XXXX XXXX XXXX",
      DE: "DExx XXXX XXXX XXXX XXXX XX",
      FR: "FRxx XXXX XXXX XXXX XXXX XXXX XXX",
      IT: "ITxx XXXX XXXX XXXX XXXX XXXX XXX",
      PT: "PTxx XXXX XXXX XXXX XXXX XXXX X",
    },
  },

  // Security & Trust Indicators
  trustIndicators: {
    euBankingLicense: true,
    gdprCompliant: true,
    depositInsurance: "€100,000",
    ssl: true,
    twoFactorAuth: true,
    endToEndEncryption: true,
  },
};

// Theme color mapping for Tailwind (used in theme provider)
export const finbankThemeConfig = {
  light: {
    "--background": "oklch(1 0 0)",
    "--foreground": "#003366",
    "--primary": "#003366",
    "--primary-foreground": "#FFFFFF",
    "--secondary": "#F5F5F5",
    "--secondary-foreground": "#003366",
    "--accent": "#00A86B",
    "--accent-foreground": "#FFFFFF",
    "--destructive": "#D32F2F",
    "--border": "#E0E0E0",
    "--input": "#F5F5F5",
  },
  dark: {
    "--background": "#0A0E1A",
    "--foreground": "#FFFFFF",
    "--primary": "#004D99",
    "--primary-foreground": "#FFFFFF",
    "--secondary": "#1A1A1A",
    "--secondary-foreground": "#FFFFFF",
    "--accent": "#00C878",
    "--accent-foreground": "#0A0E1A",
    "--destructive": "#EF5350",
    "--border": "#2A2A2A",
    "--input": "#1A1A1A",
  },
};

// Export for external use
export default FinBankBrand;
