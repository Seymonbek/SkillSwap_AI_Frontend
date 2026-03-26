import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFreelanceStore } from '../store/freelanceStore';
import { Brain, Loader2, FileText, Layers, Zap, ChevronLeft } from 'lucide-react';

const tabs = [
  { id: 'resume', label: 'CV Analizator', icon: FileText },
  { id: 'scope', label: 'TZ Generatsiyasi', icon: Layers },
  { id: 'save', label: 'Generatsiya + Saqlash', icon: Zap },
];

export default function AIServices() {
  const { aiResult, aiLoading, error, analyzeResume, generateScope, generateAndSave, clearAiResult } = useFreelanceStore();
  const [activeTab, setActiveTab] = useState('resume');
  const [resumeText, setResumeText] = useState('');
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'resume') {
      analyzeResume(resumeText);
    } else if (activeTab === 'scope') {
      generateScope({ prompt });
    } else {
      generateAndSave({ prompt });
    }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    clearAiResult();
  };

  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn--secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }} title="Orqaga">
            <ChevronLeft size={20} />
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={24} style={{ color: '#ec4899' }} /> Frilanserlar uchun AI Xizmatlari
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => switchTab(tab.id)}
            style={{ fontSize: 13 }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div className="card" style={{ maxWidth: 640 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'resume' ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: 16 }}>📄 AI CV Analizator</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>CV matnini kiriting — AI kuchli va zaif tomonlarini baholaydi</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">CV matni (min. 50 belgi)</label>
                <textarea
                  className="form-textarea"
                  required
                  minLength={50}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="CV ning to'liq matnini kiriting..."
                  style={{ minHeight: 150 }}
                />
              </div>
              <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={aiLoading}>
                {aiLoading ? <><Loader2 className="animate-spin" size={18} /> Tahlil qilinmoqda...</> : '🧠 CV ni tahlil qilish'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: 16 }}>
                {activeTab === 'scope' ? '📋 TZ Generatsiyasi' : '⚡ Generatsiya + Saqlash'}
              </h3>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                {activeTab === 'scope' ? "AI sizning tavsifingiz bo'yicha texnik topshiriq (TZ) yaratadi" : "AI TZ yaratadi va uni loyiha sifatida saqlaydi"}
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Loyiha tavsifi</label>
                <textarea
                  className="form-textarea"
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Nima qilish kerakligini tasvirlang..."
                  style={{ minHeight: 120 }}
                />
              </div>
              <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={aiLoading}>
                {aiLoading ? <><Loader2 className="animate-spin" size={18} /> Generatsiya qilinmoqda...</> : (activeTab === 'scope' ? '📋 TZ yaratish' : '⚡ Yaratish va Saqlash')}
              </button>
            </form>
          </>
        )}

        {error && <div className="error-msg" style={{ marginTop: 16 }}>{error}</div>}

        {aiResult && (
          <motion.div className="match-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h4>🎯 AI Natijasi</h4>
            <pre>{typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2)}</pre>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
