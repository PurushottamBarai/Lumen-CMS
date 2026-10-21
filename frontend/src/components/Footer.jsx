import React from 'react';
import { BookOpen } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-[#EDE8DF] bg-[#FAF7F2] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#1A382B] flex items-center justify-center text-white">
              <BookOpen className="w-3 h-3" />
            </div>
            <span className="font-serif font-bold text-stone-800 text-sm">Lumen</span>
            <span>— Editorial Content Management System</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-500">
            <span>&copy; {new Date().getFullYear()} Lumen Publishing Platform. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
