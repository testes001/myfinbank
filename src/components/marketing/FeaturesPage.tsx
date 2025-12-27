import { motion } from "framer-motion";
import { FinBankBrand } from "@/lib/brand-config";
import {
  Globe,
  Lock,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Smartphone,
  CreditCard,
  Send,
  Eye,
  AlertCircle,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { MarketingCTA } from "@/components/marketing/MarketingCTA";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export function FeaturesPage() {
  const detailedFeatures = [
    {
      category: "Transfers & Payments",
      features: [
        {
          icon: <Send className="w-6 h-6" />,
          title: "Instant SEPA Transfers",
          description: "Send money instantly within Fin-Bank to other members, or 1-2 business days to any EU bank",
          points: [
            "Zero fees for transfers within Fin-Bank",
            "Competitive rates for international transfers",
            "Real-time confirmation and tracking",
            "24/7 operation, including weekends",
          ],
        },
        {
          icon: <Globe className="w-6 h-6" />,
          title: "Multi-Currency Accounts",
          description: "Hold, exchange, and transfer in multiple currencies with real exchange rates",
          points: [
            "Primary EUR account with instant setup",
            "USD sub-accounts for international transactions",
            "Real-time exchange rates with no hidden markup",
            "Seamless currency conversion",
          ],
        },
        {
          icon: <CreditCard className="w-6 h-6" />,
          title: "Instant Virtual Cards",
          description: "Get a fully functional virtual card instantly upon account opening",
          points: [
            "Virtual card ready in seconds",
            "Physical card delivered in 5-7 business days",
            "Set spending limits per card",
            "Freeze/unfreeze cards with one tap",
          ],
        },
      ],
    },
    {
      category: "Account Management",
      features: [
        {
          icon: <Users className="w-6 h-6" />,
          title: "Joint Accounts",
          description: "Manage shared finances with partners, family, or business colleagues",
          points: [
            "Multiple signatories per account",
            "Granular permission controls",
            "Shared transaction notifications",
            "Complete transparency and audit trails",
          ],
        },
        {
          icon: <Smartphone className="w-6 h-6" />,
          title: "Mobile & Web Banking",
          description: "Access your account anytime, anywhere with our mobile and web apps",
          points: [
            "Intuitive mobile app for iOS and Android",
            "Responsive web dashboard",
            "Push notifications for all transactions",
            "Offline account access to view balance",
          ],
        },
        {
          icon: <BarChart3 className="w-6 h-6" />,
          title: "Advanced Analytics",
          description: "Understand your spending and saving patterns with detailed analytics",
          points: [
            "Categorized transaction history",
            "Spending insights and trends",
            "Budget tracking and goals",
            "Custom reports and exports",
          ],
        },
      ],
    },
    {
      category: "Security & Compliance",
      features: [
        {
          icon: <Lock className="w-6 h-6" />,
          title: "Advanced Security",
          description: "Military-grade encryption and fraud detection protect your account",
          points: [
            "AES-256 encryption for all data",
            "Real-time fraud monitoring",
            "Device fingerprinting and location tracking",
            "Automatic suspicious activity alerts",
          ],
        },
        {
          icon: <Shield className="w-6 h-6" />,
          title: "Regulatory Compliance",
          description: "Full compliance with European banking regulations and GDPR",
          points: [
            `EU Banking License: ${FinBankBrand.company.euBankingLicense}`,
            "GDPR compliant with full data privacy",
            "PSD2 Open Banking standard",
            "Regular security audits and penetration testing",
          ],
        },
        {
          icon: <AlertCircle className="w-6 h-6" />,
          title: "Deposit Insurance",
          description: "Your funds are protected up to €100,000 under EU guarantee scheme",
          points: [
            "€100,000 protection per account",
            "EU Deposit Guarantee Scheme coverage",
            "Automatic enrollment at account opening",
            "Zero-cost insurance",
          ],
        },
      ],
    },
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
              Powerful Features for Modern Banking
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Everything you need to manage your finances, all in one modern platform
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features by Category */}
      {detailedFeatures.map((category, catIndex) => (
        <section
          key={category.category}
          className={`py-20 px-4 sm:px-6 lg:px-8 ${
            catIndex % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/50"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-4xl font-bold text-slate-900 dark:text-white mb-12"
            >
              {category.category}
            </motion.h2>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {category.features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {feature.description}
                  </p>

                  <ul className="space-y-3">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ))}

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How Fin-Bank Compares
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              See what sets us apart from traditional banks
            </p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-4 px-4 font-semibold text-slate-900 dark:text-white">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900 dark:text-white">
                    Fin-Bank
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">
                    Traditional Banks
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Instant SEPA Transfers", finbank: true, traditional: false },
                  { feature: "Multi-Currency Support", finbank: true, traditional: false },
                  { feature: "Instant Virtual Cards", finbank: true, traditional: false },
                  { feature: "24/7 Online Support", finbank: true, traditional: false },
                  { feature: "Zero Account Fees", finbank: true, traditional: false },
                  { feature: "Joint Accounts", finbank: true, traditional: true },
                  { feature: "Mobile Banking", finbank: true, traditional: true },
                  { feature: "Physical Branches", finbank: true, traditional: true },
                ].map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-slate-200 dark:border-slate-700 ${
                      idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/50"
                    }`}
                  >
                    <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                      {row.feature}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.finbank && <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />}
                      {!row.finbank && (
                        <span className="text-slate-400 dark:text-slate-600">−</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.traditional && <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />}
                      {!row.traditional && (
                        <span className="text-slate-400 dark:text-slate-600">−</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
