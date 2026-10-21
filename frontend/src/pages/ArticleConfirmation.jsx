import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const ArticleConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-lg">

        {/* Success Icon */}
        <div className="mx-auto w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check
              className="w-14 h-14 text-emerald-700"
              strokeWidth={3}
            />
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Article Submitted
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm sm:text-base text-stone-500 leading-relaxed">
          Your article has been sent for admin review.
          You'll receive a notification once it's been evaluated.
        </p>

        {/* Back Home */}
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-6 py-3 bg-[#1A382B] hover:bg-[#11261D] text-white rounded-xl text-sm font-bold transition"
        >
          Back to Home
        </button>

      </div>
    </div>
  );
};

export default ArticleConfirmation;