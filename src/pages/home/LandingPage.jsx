import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/atoms/Button';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Users,
  Briefcase,
  GraduationCap,
  MessageCircle,
  Star,
  CheckCircle2,
  Globe,
  Play,
  TrendingUp,
  Award,
  Video,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Briefcase,
      title: 'Freelance Ishlar',
      description: 'Professional loyihalar toping va pul ishlang',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: GraduationCap,
      title: "Barter Ta'lim",
      description: "Ko'nikmalaringizni almashing va yangi bilimlar oling",
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: MessageCircle,
      title: 'Jonli Chat',
      description: 'Mijozlar va mentrlar bilan real vaqtda muloqot',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Video,
      title: "Video Qo'ng'iroqlar",
      description: 'HD sifatda video konsultatsiyalar',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      icon: Shield,
      title: "Xavfsiz To'lov",
      description: 'Escrow tizimi bilan himoyalangan to\'lovlar',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: Star,
      title: 'AI Matching',
      description: "Sun'iy intellekt yordamida ideal hamkor topish",
      gradient: 'from-pink-500 to-rose-600',
    },
  ];

  // TODO: Fetch from commonService.getSettings() or adminService.getPlatformStats()
  const stats = [
    { value: '500+', label: 'Freelancerlar' },
    { value: '200+', label: 'Mijozlar' },
    { value: '1K+', label: 'Bajarilgan loyihalar' },
    { value: '$50K+', label: "To'langan mablag'" },
  ];

  const testimonials = [
    {
      name: 'Azizbek Rahimov',
      role: 'Frontend Developer',
      content: "SkillSwap AI orqali 3 oyda $15,000 ishdim. Platforma juda qulay va ishonchli!",
      avatar: 'AR',
      rating: 5,
    },
    {
      name: 'Malika Karimova',
      role: 'UI/UX Designer',
      content: "Barter orqali Python o'rgandim va endi full-stack developer bo'ldim. Ajoyib!",
      avatar: 'MK',
      rating: 5,
    },
    {
      name: 'Jasur Toshmatov',
      role: 'Mijoz',
      content: "Loyihalarimni tez va sifatli bajardim. Freelancerlar professional darajada.",
      avatar: 'JT',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
      {/* Animated Background Blobs */}
      <div className="blob-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Grid Pattern */}
      <div className="grid-pattern" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">AI yordamida professional platforma</span>
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              variants={fadeInUp}
              className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight mb-6"
            >
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SkillSwap
              </span>
              <br />
              <span className="neon-text">AI</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="max-w-2xl mx-auto text-xl sm:text-2xl text-slate-400 mb-10"
            >
              Freelance ishlar va barter ta'lim birlashgan. Sun'iy intellekt yordamida ideal hamkor toping.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => navigate('/register')}
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
              >
                Boshlash
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
              >
                <Play className="w-5 h-5" />
                Kirish
              </button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-8 mt-12"
            >
              {['Bepul ro\'yxatdan o\'tish', 'Xavfsiz to\'lov', '24/7 Qo\'llab-quvvatlash'].map((item) => (
                <span key={item} className="flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="text-center"
              >
                <div className="text-5xl sm:text-6xl font-bold neon-text mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Nima uchun <span className="neon-text">SkillSwap AI</span>?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 text-xl max-w-2xl mx-auto">
              Bitta platformada freelance ishlar va barter ta'lim - bularning barchasi sun'iy intellekt yordamida
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="glass-card p-8 h-full group cursor-pointer">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-lg">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Foydalanuvchilar fikri
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 text-xl max-w-2xl mx-auto">
              Minglab freelancerlar va mijozlar ishonchi
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="glass-card p-8 h-full">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-lg mb-8 italic leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-lg">{testimonial.name}</div>
                      <div className="text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass-card p-12 sm:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-blue-500/10" />
              <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Bugun boshlang!
                </h2>
                <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10">
                  SkillSwap AI bilan yangi imkoniyatlarni kashf eting. Freelance ishlar toping yoki ko&apos;nikmalaringizni almashing.
                </p>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary flex items-center gap-2 text-lg px-10 py-5 mx-auto"
                >
                  Bepul Ro&apos;yxatdan O&apos;tish
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold neon-text">SkillSwap AI</span>
            </div>
            <p className="text-slate-500">
              © 2026 SkillSwap AI. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex items-center gap-2 text-slate-500">
              <Globe className="w-5 h-5" />
              <span>O&apos;zbekiston</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
