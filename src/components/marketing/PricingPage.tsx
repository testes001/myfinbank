import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, TrendingUp } from "lucide-react";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export function PricingPage() {
  const pricingTiers = [
    {
      name: "Starter",
      description: "Perfect for personal banking",
      price: "Free",
      period: "Forever",
      features: [
        "Unlimited transactions",
        "SEPA transfers",
        "Virtual card",
        "Multi-currency accounts",
        "Basic analytics",
        "Mobile app",
        "Email support",
        "€100k deposit insurance",
      ],
      highlight: false,
    },
    {
      name: "Plus",
      description: "For frequent traders and businesses",
      price: "€9.99",
      period: "per month",
      features: [
        "Everything in Starter, plus:",
        "Priority support (24/7 chat)",
        "Up to 10 joint accounts",
        "Advanced analytics & reports",
        "Cashback rewards (0.5%)",
        "Professional invoicing",
        "API access for SMBs",
        "Dedicated account manager",
      ],
      highlight: true,
      cta: "Get Started",
    },
    {
      name: "Business",
      description: "For companies and organizations",
      price: "Custom",
      period: "per month",
      features: [
        "Everything in Plus, plus:",
        "Unlimited business accounts",
        "Team management",
        "Advanced compliance tools",
        "Bulk transaction API",
        "Custom integrations",
        "Dedicated support line",
        "SLA guarantee",
      ],
      highlight: false,
      cta: "Contact Sales",
    },
  ];

  const faqItems = [
    {
      q: "Is there a setup fee?",
      a: "No, account creation and setup are completely free. You only pay for Premium features if you choose to upgrade.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes, you can cancel your Premium subscription anytime with no penalties. Your account will remain active with Starter features.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept credit cards (Visa, Mastercard), bank transfers, and PayPal for subscription payments.",
    },
    {
      q: "Is there a minimum balance requirement?",
      a: "No minimum balance is required. However, some features like interest-bearing accounts require €100 minimum.",
    },
    {
      q: "Do you charge for international transfers?",
      a: "International SEPA transfers within the EU are free. Non-EU transfers have a small fee, which is clearly displayed before confirmation.",
    },
    {
      q: "What about ATM withdrawals?",
      a: "You get 4 free ATM withdrawals per month in EUR. Additional withdrawals cost €2 each. No fees for withdrawals at Fin-Bank ATMs.",
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              No hidden fees. No surprises. Choose the plan that fits your needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6"
          >
            {pricingTiers.map((tier) => (
              <motion.div
                key={tier.name}
                variants={itemVariants}
                className={`relative rounded-2xl border transition-all ${
                  tier.highlight
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/10 shadow-xl scale-105 md:scale-100"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                } p-8`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">
                    {tier.price}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    {tier.period}
                  </span>
                </div>

                <Button
                  className={`w-full mb-8 flex items-center justify-center gap-2 ${
                    tier.highlight
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {tier.cta || "Get Started"} <ArrowRight className="w-4 h-4" />
                </Button>

                <ul className="space-y-4">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Fee Breakdown */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Detailed Fee Schedule
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Complete transparency. No hidden fees.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {[
              {
                category: "Transfers",
                fees: [
                  { item: "Fin-Bank to Fin-Bank", cost: "Free" },
                  { item: "SEPA transfers (EU)", cost: "Free" },
                  { item: "International transfer", cost: "€5-15" },
                ],
              },
              {
                category: "Cards",
                fees: [
                  { item: "Virtual card", cost: "Free" },
                  { item: "Physical card", cost: "Free (included)" },
                  { item: "Card replacement", cost: "€5" },
                ],
              },
              {
                category: "Withdrawals",
                fees: [
                  { item: "First 4 ATM withdrawals/month", cost: "Free" },
                  { item: "Additional withdrawals", cost: "€2 each" },
                  { item: "Out-of-network ATM", cost: "€0" },
                ],
              },
              {
                category: "Account",
                fees: [
                  { item: "Account maintenance", cost: "Free" },
                  { item: "Account closure", cost: "Free" },
                  { item: "Account statement", cost: "Free" },
                ],
              },
            ].map((section) => (
              <motion.div
                key={section.category}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
              >
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
                  {section.category}
                </h3>
                <ul className="space-y-3">
                  {section.fees.map((fee, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{fee.item}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {fee.cost}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqItems.map((item, idx) => (
              <motion.details
                key={idx}
                variants={itemVariants}
                className="group border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.q}</span>
                  <span className="text-slate-500 group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="px-6 pb-6 text-slate-600 dark:text-slate-400">
                  {item.a}
                </div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
