import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/comments/CommentSection';
import {
  MessageSquare,
  Sparkles,
  Flame,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

const DISCUSSION_TOPICS = [
  {
    id: 'crispr-future-medicine',
    title: 'CRISPR & Gene Editing Ethics in Restorative Medicine',
    category: 'Science',
    categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Discussing the boundary between somatic gene corrections and inherited germline modifications in clinical human trials.',
    author: 'Dr. Priya Mehta',
    authorRole: 'author',
  },
  {
    id: 'ai-reasoning-frontiers',
    title: 'Autonomous AI Agents and the Future of Software Development',
    category: 'Technology',
    categoryColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'How multi-agent systems and verified workflows are shifting software engineering from manual coding to specification architecture.',
    author: 'Thomas Okeke',
    authorRole: 'author',
  },
  {
    id: 'climate-resilience-2030',
    title: 'Rethinking Global Water Infrastructure for the Next Century',
    category: 'Environment',
    categoryColor: 'bg-teal-50 text-teal-800 border-teal-200',
    description: 'How coastal megacities and arid regions are deploying biomimetic sponge architecture to survive hydrologic extremes.',
    author: 'Thomas Okeke',
    authorRole: 'author',
  },
  {
    id: 'ancient-manuscripts-decoded',
    title: 'Unlocking the Lost Scrolls of Herculaneum with Computer Vision',
    category: 'History',
    categoryColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    description: 'High-energy X-ray phase contrast tomography is revealing philosophical texts preserved by volcanic ash for two millennia.',
    author: 'Thomas Okeke',
    authorRole: 'author',
  },
  {
    id: 'longevity-cellular-repair',
    title: 'The Molecular Hallmarks of Aging and Cellular Rejuvenation',
    category: 'Medicine',
    categoryColor: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'From senolytics to partial epigenetic reprogramming, how targeting cellular decay is transforming preventative healthcare.',
    author: 'Dr. Priya Mehta',
    authorRole: 'author',
  },
  {
    id: 'editorial-moderation-standards',
    title: 'Community Governance & Editorial Integrity in Modern CMS',
    category: 'Publishing',
    categoryColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Developing transparent editorial review pipelines, reader feedback mechanisms, and automated fact-checking guardrails.',
    author: 'Eleanor Vance',
    authorRole: 'admin',
  },
];

const DiscussionPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTopic, setActiveTopic] = useState(DISCUSSION_TOPICS[0]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full text-xs font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Lumen Discussion & Editorial Forum
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Open Discussions & Topic Reflections
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Engage with authors, readers, and editors across all published essays and research topics
          </p>
        </div>
      </div>

      {/* Topic Switcher Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#D97736]" />
            Select Discussion Topic ({DISCUSSION_TOPICS.length} Active Threads)
          </span>
          <span className="text-xs text-stone-400">Click any card to switch discussion view</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISCUSSION_TOPICS.map((topic) => {
            const isSelected = activeTopic.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className={`p-5 rounded-3xl border text-left transition space-y-3 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#1A382B] shadow-sm ring-2 ring-[#1A382B]/10'
                    : 'bg-[#FAF7F2] border-[#EDE8DF] hover:bg-white hover:border-stone-300'
                }`}
              >
                <div className="space-y-2">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${topic.categoryColor}`}
                  >
                    {topic.category}
                  </span>
                  <h2 className="font-serif text-base font-bold text-stone-900 leading-snug">
                    {topic.title}
                  </h2>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between text-[11px] text-stone-400 w-full">
                  <span>Topic Author: {topic.author}</span>
                  {isSelected ? (
                    <span className="font-bold text-[#1A382B] flex items-center gap-1">
                      Active <ArrowRight className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-stone-400 flex items-center gap-1">
                      Open <MessageSquare className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Thread Banner */}
      <div className="bg-[#1A382B] text-white rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <BookOpen className="w-4 h-4 text-[#D97736]" />
          <span>Active Topic Discussion</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {activeTopic.title}
        </h2>
        <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
          {activeTopic.description}
        </p>
        <div className="pt-2 flex items-center gap-3 text-xs text-stone-300">
          <span>Category: <strong className="text-white">{activeTopic.category}</strong></span>
          <span>•</span>
          <span>Topic Lead: <strong className="text-white">{activeTopic.author}</strong></span>
        </div>
      </div>

      {/* Threaded Comment Section */}
      <CommentSection targetId={activeTopic.id} targetTitle={activeTopic.title} />
    </div>
  );
};

export default DiscussionPage;
