import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscriptionsService } from '@/shared/api';
import {
  Crown, Check, Star, Zap, Shield,
  Loader2, AlertCircle, Sparkles, X
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export const SubscriptionsPage = () => {
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.allSettled([
        subscriptionsService.getPlans(),
        subscriptionsService.getMySubscription(),
      ]);
      if (plansRes.status === 'fulfilled') {
        setPlans(plansRes.value.data?.results || plansRes.value.data || []);
      }
      if (subRes.status === 'fulfilled') {
        setMySubscription(subRes.value.data);
      }
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (planId) => {
    setBuying(true);
    setBuyError('');
    try {
      await subscriptionsService.buySubscription({ plan: planId });
      fetchData();
    } catch (err) {
      setBuyError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setBuying(false);
    }
  };

  const planIcons = [Zap, Star, Crown];
  const planColors = [
    'from-blue-500 to-cyan-500',
    'from-violet-500 to-purple-500',
    'from-amber-500 to-orange-500',
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="glass-card h-32 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-64 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="blob-bg">
        <div className="blob blob-2" style={{ width: '300px', height: '300px', opacity: 0.1 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer}
        className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white"><span className="neon-text">Obunalar</span></h1>
            <p className="text-slate-400 text-sm">Premium imkoniyatlar</p>
          </div>
        </motion.div>

        {/* Current Subscription */}
        {mySubscription && (
          <motion.div variants={fadeInUp} className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-amber-500/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Joriy obuna</h3>
              </div>
              <p className="text-lg text-emerald-400 font-bold">{mySubscription.plan_name || mySubscription.plan?.name || 'Premium'}</p>
              {mySubscription.expires_at && (
                <p className="text-sm text-slate-400 mt-1">
                  Amal qilish muddati: {new Date(mySubscription.expires_at).toLocaleDateString('uz-UZ')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {buyError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{buyError}</p>
          </div>
        )}

        {/* Plans */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.length > 0 ? plans.map((plan, index) => {
            const IconComp = planIcons[index % planIcons.length];
            const color = planColors[index % planColors.length];
            const isActive = mySubscription?.plan === plan.id || mySubscription?.plan?.id === plan.id;

            return (
              <div key={plan.id} className={`glass-card p-6 relative ${isActive ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : ''}`}>
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">
                    Joriy
                  </span>
                )}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 mx-auto shadow-lg`}>
                  <IconComp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-white text-center mb-1">
                  ${plan.price || 0}
                  <span className="text-sm text-slate-400 font-normal">/oy</span>
                </p>
                <p className="text-sm text-slate-400 text-center mb-6">{plan.description}</p>

                <div className="space-y-3 mb-6">
                  {(plan.features || []).map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !isActive && handleBuy(plan.id)}
                  disabled={isActive || buying}
                  className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                    : 'btn-primary'
                  }`}
                >
                  {isActive ? (
                    <><Check className="w-4 h-4" /> Faol</>
                  ) : buying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Sotib olish'
                  )}
                </button>
              </div>
            );
          }) : (
            <div className="glass-card p-12 text-center col-span-full">
              <Crown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Tariflar hozircha yo&apos;q</h3>
              <p className="text-slate-400">Tez orada premium tariflar qo&apos;shiladi</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SubscriptionsPage;
