import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { searchService } from '@/shared/api';
import {
  Search as SearchIcon, Briefcase, User, Filter,
  Loader2, Star, MapPin, DollarSign, X, Sparkles
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('jobs');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const params = { search: query };
      const res = searchType === 'jobs'
        ? await searchService.searchJobs(params)
        : await searchService.searchUsers(params);

      setResults(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="blob-bg">
        <div className="blob blob-1" style={{ width: '300px', height: '300px', opacity: 0.1 }} />
      </div>

      <motion.div initial="hidden" animate="visible" variants={staggerContainer}
        className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white"><span className="neon-text">AI Qidiruv</span></h1>
            <p className="text-slate-400 text-sm">Ishlar va foydalanuvchilarni qidiring</p>
          </div>
        </motion.div>

        {/* Search Form */}
        <motion.div variants={fadeInUp}>
          <form onSubmit={handleSearch} className="glass-card p-4">
            <div className="flex gap-2 mb-3">
              {[
                { id: 'jobs', label: 'Ishlar', icon: Briefcase },
                { id: 'users', label: 'Foydalanuvchilar', icon: User },
              ].map(type => (
                <button key={type.id} type="button" onClick={() => { setSearchType(type.id); setResults([]); setSearched(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    searchType === type.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5'
                  }`}>
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={searchType === 'jobs' ? "Ish nomi, kalit so'z..." : "Ism, ko'nikma..."}
                  className="glass-input w-full pl-12"
                />
              </div>
              <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-6 flex items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-24 animate-pulse" />)}
          </div>
        ) : searched && results.length === 0 ? (
          <motion.div variants={fadeInUp} className="glass-card p-12 text-center">
            <SearchIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Natija topilmadi</h3>
            <p className="text-slate-400">Boshqa kalit so&apos;z bilan qidirib ko&apos;ring</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="space-y-3">
            {results.map((item) => (
              searchType === 'jobs' ? (
                <div key={item.id} onClick={() => navigate(`/jobs/${item.id}`)}
                  className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors">
                  <h3 className="font-medium text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {item.budget_min || 0} - {item.budget_max || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400">{item.status}</span>
                    {item.skills_required?.length > 0 && (
                      <div className="flex gap-1">
                        {item.skills_required.slice(0, 2).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">{s.name || s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={item.id} onClick={() => navigate(`/profile/${item.id}`)}
                  className="glass-card p-4 cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {item.first_name?.charAt(0).toUpperCase() || item.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white">{item.first_name} {item.last_name}</h4>
                      <p className="text-sm text-slate-400">{item.email}</p>
                      {item.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {item.location}
                        </p>
                      )}
                    </div>
                    {item.rating > 0 && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-4 h-4" />
                        <span className="font-semibold text-sm">{item.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SearchPage;
