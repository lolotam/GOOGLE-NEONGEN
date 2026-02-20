import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for exploring AI capabilities',
    features: [
      '100 Chat messages/mo',
      '20 Image generations/mo',
      'Standard speed',
      'Community support',
      'Watermarked images'
    ],
    notIncluded: [
      'Video generation',
      'API access',
      'Private gallery'
    ]
  },
  {
    name: 'Pro',
    price: { monthly: 29, annual: 24 },
    description: 'For creators and professionals',
    popular: true,
    features: [
      'Unlimited Chat messages',
      '1000 Image generations/mo',
      '50 Video generations/mo',
      'Fast generation speed',
      'Priority support',
      'No watermarks',
      'Private gallery',
      'Commercial usage rights'
    ],
    notIncluded: [
      'API access'
    ]
  },
  {
    name: 'Enterprise',
    price: { monthly: 99, annual: 89 },
    description: 'For teams and developers',
    features: [
      'Everything in Pro',
      'Unlimited generations',
      'Full API access',
      'Dedicated support',
      'Custom model fine-tuning',
      'SSO & Team management',
      'SLA guarantees'
    ],
    notIncluded: []
  }
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Choose the perfect plan for your creative needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-white/5 rounded-full border border-white/10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === 'monthly' 
                  ? "bg-primary-neon text-background-primary shadow-lg" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                billingCycle === 'annual' 
                  ? "bg-primary-neon text-background-primary shadow-lg" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Annual
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full border",
                billingCycle === 'annual' 
                  ? "bg-background-primary/20 border-background-primary/20" 
                  : "bg-primary-neon/10 text-primary-neon border-primary-neon/20"
              )}>
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -10 }}
              className={cn(
                "relative p-8 rounded-3xl border backdrop-blur-sm flex flex-col",
                plan.popular 
                  ? "bg-background-secondary/80 border-primary-neon/50 shadow-[0_0_30px_rgba(57,255,20,0.1)]" 
                  : "bg-background-secondary/30 border-white/5"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-neon text-background-primary text-sm font-bold rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-display">
                    ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                {billingCycle === 'annual' && plan.price.annual > 0 && (
                  <p className="text-xs text-primary-neon mt-2">
                    Billed ${plan.price.annual * 12} yearly
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-primary-neon shrink-0" />
                    {feature}
                  </div>
                ))}
                {plan.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                    <X className="w-5 h-5 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-colors",
                  plan.popular
                    ? "bg-primary-neon text-background-primary hover:bg-primary-lime"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {plan.price.monthly === 0 ? 'Get Started' : 'Subscribe'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
