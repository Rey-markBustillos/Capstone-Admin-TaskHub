import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Megaphone,
  FileText,
  Menu,
  X,
} from 'lucide-react';

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(true);

  return (
      <div
        className={`bg-gray-900 text-white fixed top-0 left-0 h-full z-50 transition-all duration-300 ${
          isOpen ? 'w-64 p-6' : 'w-16 p-4'
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          {isOpen && <h1 className="text-lg font-bold">Student Portal</h1>}
          <button onClick={() => setIsOpen(!isOpen)} className="text-white">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="space-y-4 text-sm">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 hover:bg-gray-800 px-3 py-2 rounded transition"
          >
            <Home size={18} />
            {isOpen && <span>Dashboard</span>}
          </Link>
          <Link
            to="/classes"
            className="flex items-center gap-3 hover:bg-gray-800 px-3 py-2 rounded transition"
          >
            <BookOpen size={18} />
            {isOpen && <span>Enrolled Classes</span>}
          </Link>
          <Link
            to="/viewassignments"
            className="flex items-center gap-3 hover:bg-gray-800 px-3 py-2 rounded transition"
          >
            <Megaphone size={18} />
            {isOpen && <span>View Assignment</span>}
          </Link>
          <Link
            to="/submitact"
            className="flex items-center gap-3 hover:bg-gray-800 px-3 py-2 rounded transition"
          >
            <FileText size={18} />
            {isOpen && <span>Submit Assignment</span>}
          </Link>
        </nav>
      </div>

     
     
  );
}
