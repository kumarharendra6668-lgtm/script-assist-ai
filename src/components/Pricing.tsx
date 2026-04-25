import React from 'react';
import { motion } from 'motion/react';
import { Check, X, Sparkles, Flame, Shield, Zap, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface PricingProps {
  onClose: () => void;
  currentPlan?: string;
}

export default function Pricing({ onClose, currentPlan = 'Basic' }: PricingProps) {
  const plans = [
    {
      name: 'Basic',
      price: 'Free',
      tag: 'Get Started',
      description: 'Perfect for casual creators',
      features: [
        { text: '2 scripts per day', included: true },
        { text: 'Standard script quality', included: true },
        { text: 'Limited tones', included: true },
        { text: 'Save up to 20 drafts', included: true },
        { text: 'All tones unlocked', included: false },
        { text: 'Priority generation', included: false },
      ],
      buttonText: 'Start Free',
      highlight: false,
      badge: null,
    },
    {
      name: 'Standard',
      price: '₹49',
      period: '/month',
      tag: 'Upgrade Now',
      description: 'Ideal for growing content creators',
      features: [
        { text: '5 scripts per day', included: true },
        { text: 'Better human-like scripts', included: true },
        { text: 'All tones unlocked (Shayari)', included: true },
        { text: 'Faster generation speed', included: true },
        { text: 'Save up to 50 drafts', included: true },
        { text: 'Unlimited drafts', included: false },
      ],
      buttonText: 'Upgrade Now',
      highlight: true,
      badge: 'Most Popular',
    },
    {
      name: 'Pro',
      price: '₹99',
      period: '/month',
      tag: 'Go Pro',
      description: 'For high-volume power users',
      features: [
        { text: '30–50 scripts per day', included: true },
        { text: 'Best human-like script quality', included: true },
        { text: 'Priority generation speed', included: true },
        { text: 'All features unlocked', included: true },
        { text: 'Unlimited drafts', included: true },
        { text: 'Early access to new features', included: true },
      ],
      buttonText: 'Upgrade Now',
      highlight: false,
      badge: 'Best Value',
      note: 'Fair usage policy applies to maintain smooth performance'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl overflow-y-auto"
    >
      <div className="w-full max-w-6xl my-auto py-12 sm:py-0">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10 space-y-4 px-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-bold border border-orange-100 dark:border-orange-800"
          >
            <Flame size={16} />
            Limited-time offer 🔥
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Simple Pricing.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium text-sm sm:text-base">
            Choose the plan that fits your growth.
          </p>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-[110]"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 overflow-x-auto sm:overflow-x-visible pb-12 sm:pb-0 px-6 sm:px-0 snap-x snap-mandatory">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className={cn(
                "relative group flex flex-col p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-500 border h-full min-w-[280px] sm:min-w-0 snap-center",
                plan.highlight 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-2xl sm:scale-[1.02] z-10" 
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-200 dark:hover:border-slate-700"
              )}
            >
              {plan.badge && (
                <div className={cn(
                  "absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg",
                  plan.highlight 
                    ? "bg-indigo-600 text-white" 
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                )}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{plan.name}</h3>
                <p className={cn(
                  "text-xs sm:text-sm font-medium",
                  plan.highlight ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"
                )}>
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1 mb-6 sm:mb-8">
                <span className="text-4xl sm:text-5xl font-black tracking-tighter">{plan.price}</span>
                {plan.period && (
                  <span className={cn(
                    "text-xs sm:text-sm font-bold",
                    plan.highlight ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"
                  )}>
                    {plan.period}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3 sm:space-y-4 mb-8 sm:mb-10 text-left">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center",
                      feature.included 
                        ? (plan.highlight ? "bg-indigo-500 text-white" : "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400")
                        : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                    )}>
                      {feature.included ? <Check size={10} strokeWidth={4} /> : <X size={8} strokeWidth={4} />}
                    </div>
                    <span className={cn(
                      "text-xs sm:text-sm font-medium",
                      !feature.included && "text-slate-400 dark:text-slate-600"
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <button className={cn(
                  "w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-[0.98] shadow-sm",
                  plan.highlight 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800" 
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                )}>
                  {plan.buttonText}
                </button>
                {plan.note && (
                  <p className="text-[10px] text-center font-medium text-slate-400 dark:text-slate-500 px-4 leading-relaxed">
                    {plan.note}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
