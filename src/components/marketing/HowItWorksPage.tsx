import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Shield,
  CreditCard,
  Send,
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export function HowItWorksPage() {
  const navigate = useNavigate();
  const steps = [
    {
      number: "1",
      title: "Create Your Account",
      description: "Sign up with your email and basic information. Takes just 2 minutes.",
      icon: <UserPlus className="w-8 h-8" />,
      details: [
        "Visit finbank.online and click 'Get Started'",
        "Enter your email address and create a secure password",
        "Accept terms and conditions",
        "Account created instantly",
      ],
    },
    {
      number: "2",
      title: "Verify Your Identity",
      description: "Quick identity verification to comply with EU regulations.",
      icon: <Shield className="w-8 h-8" />,
      details: [
        "Take a selfie with your ID document",
        "Our AI verifies your identity in seconds",
        "For some cases, manual review within 24 hours",
        "Instant approval for eligible applicants",
      ],
    },
    {
      number: "3",
      title: "Link Your Bank Account",
      description: "Connect your existing bank account for funding and withdrawals.",
      icon: <CreditCard className="w-8 h-8" />,
      details: [
        "Choose your preferred funding method",
        "Link your EU bank account (via Open Banking)",
        "Or set up a wire transfer",
        "Funds available within 1-2 business days",
      ],
    },
    {
      number: "4",
      title: "Get Your Virtual Card",
      description: "Instant virtual card for online shopping and payments.",
      icon: <CreditCard className="w-8 h-8" />,
      details: [
        "Virtual card generated automatically",
        "Use immediately for online purchases",
        "Order physical card (arrives in 5-7 days)",
        "Both linked to your EUR account",
      ],
    },
    {
      number: "5",
      title: "Start Sending Money",
      description: "Send money instantly to other Fin-Bank users or any EU account.",
      icon: <Send className="w-8 h-8" />,
      details: [
        "Add a recipient within the app",
        "Enter amount and currency",
        "Confirm and send instantly",
        "Get real-time notifications",
      ],
    },
    {
      number: "6",
      title: "Manage Your Finances",
      description: "Access advanced tools to track spending and plan ahead.",
      icon: <BarChart3 className="w-8 h-8" />,
      details: [
        "View transaction history with details",
        "Get spending insights and analytics",
        "Create budgets and savings goals",
        "Export statements anytime",
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
              Get Started in Minutes
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Simple, straightforward process from account creation to your first transaction
            </p>
          </motion.div>
        </div>
      </section>

      {/* Step-by-step Process */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-12"
          >
            {steps.map((step, idx) => (
              <motion.div key={step.number} variants={itemVariants}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Content */}
                  <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <span className="text-xl font-bold">{step.number}</span>
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </h2>
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        {step.description}
                      </p>
                      <ul className="space-y-3">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-600 dark:text-slate-400">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Visual */}
                  <div className={`relative h-80 rounded-xl overflow-hidden ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl"></div>
                    <div className="relative h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 flex items-center justify-center border border-slate-700 shadow-xl">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 mb-4">
                          {step.icon}
                        </div>
                        <p className="text-white font-semibold">{step.title}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress connector */}
                {idx < steps.length - 1 && (
                  <div className="flex justify-center mt-12">
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      whileInView={{ opacity: 1, scaleY: 1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-2 text-slate-400"
                    >
                      <ArrowRight className="w-5 h-5 rotate-90" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Summary */}
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
              Complete Timeline
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              From signup to your first transaction
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { time: "2 min", event: "Account Creation" },
              { time: "5 min", event: "Identity Verified" },
              { time: "24 hrs", event: "Funds Available" },
              { time: "5 sec", event: "First Transaction" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center border border-slate-200 dark:border-slate-700"
              >
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {item.time}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.event}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of Europeans who are banking better with Fin-Bank
            </p>
            <Button size="lg" className="bg-white hover:bg-slate-100 text-blue-600 font-bold flex items-center gap-2 mx-auto">
              Create Your Account <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
