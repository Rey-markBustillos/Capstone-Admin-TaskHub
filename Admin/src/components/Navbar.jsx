import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleHamburgerClick = () => {
    setOpen(!open);
    if (!open) {
      navigate('/teacherannouncement');
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-center w-200 h-20 ml-75 items-center sticky top-0 z-1000">
      <div className="font-bold text-xl mr-20">MyLogo</div>

      <div className="flex items-center">
        <ul className={`hidden md:flex space-x-6 ${open ? 'flex flex-col absolute top-14 right-0 bg-gray-800 w-60 p-4 rounded-md' : ''}`}>
          <li><Link to="/teacherannouncement" className="hover:text-gray-300" onClick={() => setOpen(false)}>Announcement</Link></li>
          <li><Link to="/createactivity" className="hover:text-gray-300" onClick={() => setOpen(false)}>Create Activity</Link></li>
          <li><Link to="/studentlist" className="hover:text-gray-300" onClick={() => setOpen(false)}>StudentList</Link></li>
          <li><Link to="/contact" className="hover:text-gray-300" onClick={() => setOpen(false)}>Contact</Link></li>
        </ul>

        {/* Hamburger icon */}
        <button
          onClick={handleHamburgerClick}
          className="md:hidden flex flex-col justify-between w-6 h-4 bg-transparent border-none cursor-pointer ml-4"
          aria-label="Toggle menu"
        >
          <div className={`h-0.5 w-full bg-white rounded transition-all duration-300 ${open ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`h-0.5 w-full bg-white rounded transition-opacity duration-300 ${open ? 'opacity-0' : ''}`}></div>
          <div className={`h-0.5 w-full bg-white rounded transition-all duration-300 ${open ? '-rotate-45 translate-y-1.5' : ''}`}></div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;