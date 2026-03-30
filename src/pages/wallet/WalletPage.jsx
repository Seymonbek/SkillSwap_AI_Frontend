import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentsService, authService } from '@/shared/api';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import {
  Wallet, CreditCard, ArrowUpRight, ArrowDownLeft,
  Plus, X, AlertCircle,
  Check, Loader2, Shield, Coins
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const WalletPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const availableUsdBalance = Number(user?.wallet_summary?.usd_balance ?? user?.wallet?.usd_balance ?? 0);

  const fetchUserData = async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data);
    } catch (err) {
      console.error('Fetch user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTokens = async (e) => {
    e.preventDefault();
    if (!buyAmount || parseInt(buyAmount) <= 0) {
      setBuyError("To'g'ri miqdor kiriting");
      return;
    }

    if (availableUsdBalance <= 0) {
      setBuyError("USD balansingiz yo'q. Hozirgi backend flow tokenni mavjud USD balans evaziga sotib oladi.");
      return;
    }

    setBuying(true);
    setBuyError('');
    try {
      const res = await paymentsService.buyTokens({ token_amount: parseInt(buyAmount, 10) });
      setUser((prev) => ({
        ...prev,
        wallet_summary: {
          ...(prev?.wallet_summary || {}),
          ...res.data?.data,
        },
      }));
      setBuySuccess(true);
      setTimeout(() => {
        setShowBuyModal(false);
        setBuySuccess(false);
        setBuyAmount('');
      }, 2000);
    } catch (err) {
      setBuyError(getApiErrorMessage(err, "Token sotib olib bo'lmadi"));
    } finally {
      setBuying(false);
    }
  };

  const tokenPackages = [
    { amount: 10, popular: false },
    { amount: 50, popular: false },
    { amount: 100, popular: true },
    { amount: 500, popular: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="glass-card h-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="glass-card h-32 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.15 }} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-4xl mx-auto space-y-6 relative z-10"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Wallet className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              <span className="neon-text">Hamyon</span>
            </h1>
            <p className="text-slate-400 text-sm">Balans va to&apos;lovlar</p>
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={fadeInUp}>
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10" />
            <div className="relative z-10">
              <p className="text-slate-400 text-sm mb-2">Joriy balans</p>
              <div className="flex items-end gap-3 mb-6">
                <h2 className="text-5xl font-bold text-white">
                  {user?.wallet_summary?.time_tokens ?? user?.tokens ?? '0'}
                </h2>
                <span className="text-slate-400 text-lg mb-1">token</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-6"
                >
                  <Plus className="w-4 h-4" />
                  Token sotib olish
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Kirim</p>
                <p className="text-xl font-bold text-white">{user?.wallet_summary?.usd_balance || 0}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Chiqim</p>
                <p className="text-xl font-bold text-white">{user?.wallet_summary?.frozen_usd || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {availableUsdBalance <= 0 && (
          <motion.div variants={fadeInUp}>
            <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Token olish hozircha USD balans orqali ishlaydi</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Sizda USD balans 0. Shu sabab `buy-tokens` so&apos;rovi 400 qaytargan. Karta bilan to&apos;ldirish flow hali frontendga ulanmagan.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Token Packages */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Tez tanlash
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tokenPackages.map((pkg) => (
              <div
                key={pkg.amount}
                onClick={() => { setBuyAmount(String(pkg.amount)); setShowBuyModal(true); }}
                className={`glass-card p-4 cursor-pointer hover:scale-[1.02] transition-all relative ${
                  pkg.popular ? 'border-emerald-500/30' : ''
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">
                    Ommabop
                  </span>
                )}
                <div className="text-center">
                  <p className="text-3xl font-bold text-white mb-1">{pkg.amount}</p>
                  <p className="text-sm text-slate-400 mb-3">token</p>
                  <p className="text-xs text-slate-500">USD balansdan yechiladi</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Escrow Info */}
        <motion.div variants={fadeInUp}>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Escrow himoya</h3>
                <p className="text-sm text-slate-400">Xavfsiz to&apos;lov tizimi</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Barcha to&apos;lovlar Escrow tizimi orqali himoyalangan. Mijoz mablag&apos;ni escrow ga qo&apos;yadi, 
              freelancer ishni tugatgandan keyin mablag&apos; chiqariladi.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Buy Tokens Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">USD balansdan token olish</h2>
                <button onClick={() => { setShowBuyModal(false); setBuyError(''); setBuySuccess(false); }} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleBuyTokens} className="p-6 space-y-4">
                {buySuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Muvaffaqiyatli!</h3>
                    <p className="text-slate-400 mt-1">Tokenlar hisobingizga qo&apos;shildi</p>
                  </div>
                ) : (
                  <>
                    {buyError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-red-400 text-sm">{buyError}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Miqdor (token)</label>
                      <input
                        type="number"
                        min="1"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        placeholder="100"
                        className="glass-input w-full"
                        required
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Hozirgi backend flow tokenlarni mavjud USD balansdan yechib beradi. Joriy USD balans: {availableUsdBalance || 0}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="button" onClick={() => setShowBuyModal(false)} className="btn-secondary flex-1 py-3">
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        disabled={buying || availableUsdBalance <= 0}
                        className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {buying ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <><Coins className="w-4 h-4" /> Token olish</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletPage;
