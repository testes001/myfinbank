import { motion } from "framer-motion";
import { FinBankBrand } from "@/lib/brand-config";
import {
  Lock,
  Shield,
  Eye,
  AlertCircle,
  CheckCircle2,
  Zap,
  FileText,
  Users,
} from "lucide-react";
import { MarketingCTA } from "@/components/marketing/MarketingCTA";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export function SecurityPage() {
  const securityFeatures = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: "End-to-End Encryption",
      description: "All data is encrypted using AES-256 encryption standard, the same used by governments and banks",
      points: [
        "Military-grade AES-256 encryption",
        "Encryption in transit and at rest",
        "Regular encryption key rotation",
        "Zero-knowledge architecture",
      ],
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Two-Factor Authentication",
      description: "Protect your account with multiple authentication methods",
      points: [
        "SMS-based 2FA",
        "Authenticator apps (Google, Microsoft, Authy)",
        "Biometric authentication",
        "Hardware security keys",
      ],
    },
    {
      icon: <AlertCircle className="w-8 h-8" />,
      title: "Fraud Detection",
      description: "Advanced AI-powered monitoring detects suspicious activity in real-time",
      points: [
        "Real-time transaction monitoring",
        "Machine learning fraud detection",
        "Device fingerprinting",
        "Location-based verification",
      ],
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Account Monitoring",
      description: "Continuous monitoring of your account for unauthorized access",
      points: [
        "Login attempt monitoring",
        "Unusual activity alerts",
        "IP address verification",
        "Browser fingerprinting",
      ],
    },
  ];

  const complianceItems = [
    {
      title: "EU Banking Regulation",
      description: "Fully regulated under European banking directives",
      license: FinBankBrand.company.euBankingLicense,
      icon: "📜",
    },
    {
      title: "GDPR Compliance",
      description: "Your data privacy is protected under GDPR with full transparency",
      license: "GDPR Certified",
      icon: "🔐",
    },
    {
      title: "PSD2 Compliance",
      description: "Strong Customer Authentication and Open Banking standards",
      license: "PSD2 Level 2",
      icon: "✓",
    },
    {
      title: "Deposit Insurance",
      description: "Up to €100,000 protection per account",
      license: "EDIS Coverage",
      icon: "💰",
    },
  ];

  const securityBestPractices = [
    "Never share your password with anyone",
    "Logout when using shared devices",
    "Keep your device software updated",
    "Enable two-factor authentication immediately",
    "Review your account activity regularly",
    "Use strong, unique passwords",
    "Verify requests before providing information",
    "Report suspicious activity immediately",
  ];

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white">
              Security & Compliance
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Bank-grade security with military-grade encryption and full regulatory compliance
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Security Features
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Multiple layers of protection keeping your account and money safe
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {securityFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.points.map((point, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Regulatory Compliance */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Regulatory Compliance
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Full compliance with European and international regulations
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {complianceItems.map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{item.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {item.description}
                    </p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {item.license}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Security Best Practices
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Keep your account secure with these recommended practices
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {securityBestPractices.map((practice, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex items-start gap-4 bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <span className="text-slate-700 dark:text-slate-300">{practice}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              What If Something Goes Wrong?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              We have comprehensive incident response protocols to protect you
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {[
              {
                title: "Unauthorized Transaction",
                description: "Report within 60 days and we'll investigate. Your funds are protected under EU law.",
              },
              {
                title: "Account Compromise",
                description: "Immediate account lock, password reset, and fraud investigation. We'll contact you within 2 hours.",
              },
              {
                title: "Data Breach",
                description: "If our systems are compromised, we'll notify you within 72 hours with full details.",
              },
              {
                title: "Lost or Stolen Card",
                description: "Instant card deactivation with one tap. New card shipped within 5-7 business days.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Security */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Security Questions?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              Our security team is available 24/7 for any concerns
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Email: security@finbank.online | Phone: +34 (0) 800 123 456
            </p>
          </motion.div>
        </div>
      </section>

      <MarketingCTA
        title="Bank with Confidence"
        description="Your security is our top priority. Join thousands of Europeans who trust Fin-Bank."
      />
    </div>
  );
}
