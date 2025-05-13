import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Home, UserPlus, Book, List, Upload, ChevronLeft, ChevronRight } from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // Sidebar open/close state

  return (
    <div style={{ ...styles.sidebar, width: isOpen ? "250px" : "60px" }}>
      <button style={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <ul style={styles.navLinks}>
        <li>
          <Link to="/dashboard" style={styles.link}>
            <Home size={20} /> {isOpen && "Dashboard"}
          </Link>
        </li>
        <li>
          <Link to="/addstudent" style={styles.link}>
            <UserPlus size={20} /> {isOpen && "Add Student"}
          </Link>
        </li>
        <li>
          <Link to="/addclass" style={styles.link}>
            <Book size={20} /> {isOpen && "Add Class"}
          </Link>
        </li>
        <li>
          <Link to="subjectnav" style={styles.link}>
            <Upload size={20} /> {isOpen && "Upload Task  "}
          </Link>
        </li>
      </ul>
    </div>
  );
};

// Inline styles for the sidebar
const styles = {
  sidebar: {
    height: "100vh",
    backgroundColor: "#333",
    color: "white",
    position: "fixed",
    top: 0,
    left: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "20px",
    transition: "width 0.3s",
    overflow: "hidden",
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  navLinks: {
    listStyle: "none",
    padding: 0,
    width: "100%",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "white",
    textDecoration: "none",
    padding: "15px",
    textAlign: "center",
    fontSize: "18px",
    transition: "background 0.3s",
  },
};

export default Sidebar;
            