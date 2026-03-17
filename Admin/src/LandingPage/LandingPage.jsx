import React, { useState, useEffect } from "react";
import Login from "./Login";
import {
  FaEye,
  FaBullseye,
  FaHeart,
  FaBookOpen,
  FaArrowRight,
  FaFacebookF,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaUsers,
  FaLightbulb,
  FaChevronUp,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { recordApplicationVisit, recordPageVisit } from "../utils/visitTracker";

// ─── Header Component ───────────────────────────────────────────────
const Header = ({ onContinue, onInstallApp, isInstallable }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 shadow-2xl shadow-black/20"
          : "bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900"
      }`}
    >
      {/* Top Accent Line */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-700 shadow-lg shadow-blue-500/30 overflow-hidden ring-2 ring-blue-400/30">
                <img
                  src="/taskhublogos.png"
                  alt="ALS Logo"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-lg"
                />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-gray-900 animate-pulse"></span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                <span className="text-blue-400">A</span>
                <span className="text-red-400">L</span>
                <span className="text-yellow-400">S</span>
                <span className="ml-1.5 text-gray-200 font-semibold">
                  Portal
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 tracking-wider uppercase">
                Alternative Learning System
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {["Home", "About", "Programs", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg transition-all duration-300 group"
              >
                {item}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
              </a>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Install Button */}
            <button
              onClick={onInstallApp}
              disabled={!isInstallable}
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isInstallable
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                  : "bg-gray-600/60 text-gray-300 cursor-not-allowed"
              }`}
              title={isInstallable ? "Install ALS Portal" : "Install not available on this browser yet"}
            >
              Install App
            </button>

            {/* CTA Button */}
            <button
              onClick={onContinue}
              className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative flex items-center gap-2">
                Login
                <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-300"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ${
            mobileMenuOpen ? "max-h-64 opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-2 mt-1">
            <button
              onClick={() => {
                onInstallApp();
                setMobileMenuOpen(false);
              }}
              disabled={!isInstallable}
              className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isInstallable
                  ? "text-emerald-300 hover:text-emerald-200 hover:bg-gray-700/50"
                  : "text-gray-500 cursor-not-allowed"
              }`}
            >
              Install App
            </button>
            {["Home", "About", "Programs", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Footer Component ───────────────────────────────────────────────
const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      id="contact"
      className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-gray-300"
    >
      {/* Top Accent Line */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      {/* Wave Divider */}
      <div className="absolute -top-px left-0 right-0 overflow-hidden">
        <svg viewBox="0 0 1440 60" className="w-full h-8 sm:h-12">
          <path
            fill="currentColor"
            className="text-white"
            d="M0,0 C480,60 960,60 1440,0 L1440,0 L0,0 Z"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 overflow-hidden ring-2 ring-blue-400/30">
                <img
                  src="/taskhublogos.png"
                  alt="ALS Logo"
                  className="w-9 h-9 object-cover rounded-lg"
                />
              </span>
              <div>
                <h3 className="text-white font-bold text-lg">
                  <span className="text-blue-400">A</span>
                  <span className="text-red-400">L</span>
                  <span className="text-yellow-400">S</span>
                  <span className="ml-1.5 text-white">Portal</span>
                </h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Alternative Learning System
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Empowering Filipino learners through quality alternative education.
              Building a brighter future, one learner at a time.
            </p>
            <div className="flex items-center gap-3">
              {[FaFacebookF, FaEnvelope].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-gray-700/50 hover:bg-gradient-to-br hover:from-blue-500 hover:to-indigo-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25 border border-gray-700/50 hover:border-transparent"
                >
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></span>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {["Home", "About ALS", "Programs", "Enrollment"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-blue-400 text-sm transition-all duration-200 flex items-center gap-2.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-400 group-hover:w-2.5 transition-all duration-300"></span>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
              Programs
            </h4>
            <ul className="space-y-3">
              {[
                "Basic Literacy",
                "A&E Elementary",
                "A&E Secondary",
                "Livelihood Skills",
              ].map((prog) => (
                <li key={prog}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-blue-400 text-sm transition-all duration-200 flex items-center gap-2.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-400 group-hover:w-2.5 transition-all duration-300"></span>
                    {prog}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400 group">
                <span className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors duration-300">
                  <FaMapMarkerAlt className="text-blue-400 text-xs" />
                </span>
                <span className="mt-1">DepEd Division Office, Philippines</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400 group">
                <span className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors duration-300">
                  <FaPhone className="text-blue-400 text-xs" />
                </span>
                <span>(02) 8632-1361</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400 group">
                <span className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors duration-300">
                  <FaEnvelope className="text-blue-400 text-xs" />
                </span>
                <span>als.deped@deped.gov.ph</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Alternative Learning System Portal. All
            rights reserved.
          </p>
          <p className="text-gray-500 text-xs flex items-center gap-1.5">
            Developed with{" "}
            <FaHeart className="text-red-400 text-[10px] animate-pulse" /> by
            DepEd ALS Team
          </p>
        </div>
      </div>

      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/40 z-50 ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <FaChevronUp />
      </button>
    </footer>
  );
};

// ─── Stats Section ──────────────────────────────────────────────────
const StatsSection = () => {
  const stats = [
    {
      icon: <FaGraduationCap />,
      count: "10,000+",
      label: "Graduates",
      color: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/20",
    },
    {
      icon: <FaUsers />,
      count: "500+",
      label: "Active Learners",
      color: "from-indigo-500 to-indigo-600",
      shadow: "shadow-indigo-500/20",
    },
    {
      icon: <FaBookOpen />,
      count: "50+",
      label: "Programs",
      color: "from-violet-500 to-violet-600",
      shadow: "shadow-violet-500/20",
    },
    {
      icon: <FaLightbulb />,
      count: "100+",
      label: "Learning Centers",
      color: "from-amber-500 to-amber-600",
      shadow: "shadow-amber-500/20",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-5 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">
            Our Impact
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Making a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Difference
            </span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto text-sm sm:text-base">
            Transforming lives through accessible education across the
            Philippines
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg ${stat.shadow} hover:shadow-2xl border border-gray-100/80 hover:border-transparent transition-all duration-500 hover:-translate-y-2 text-center`}
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${stat.color} text-white text-xl sm:text-2xl mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
              >
                {stat.icon}
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1">
                {stat.count}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── WelcomeScreen Component ────────────────────────────────────────
const WelcomeScreen = ({ onContinue, onInstallApp, isInstallable }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    {
      key: "vision",
      label: "Vision",
      icon: <FaEye />,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
    },
    {
      key: "mission",
      label: "Mission",
      icon: <FaBullseye />,
      gradient: "from-indigo-500 to-purple-500",
      bg: "bg-indigo-50",
      ring: "ring-indigo-200",
    },
    {
      key: "values",
      label: "Core Values",
      icon: <FaHeart />,
      gradient: "from-pink-500 to-rose-500",
      bg: "bg-pink-50",
      ring: "ring-pink-200",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "vision":
        return (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                <FaEye className="text-lg" />
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Our Vision
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base lg:text-lg">
              We will have nation-loving and competent lifelong learners who are
              able to respond to challenges and opportunities through quality,
              accessible, relevant, and liberating K to 12 Program delivered by a
              modern, professional, pro-active, nimble, trusted and nurturing
              DepEd.
            </p>
          </div>
        );
      case "mission":
        return (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25">
                <FaBullseye className="text-lg" />
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Our Mission
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base lg:text-lg">
              To develop exemplary programs and open learning opportunities for
              out-of-school youth and adults to achieve multiple competencies and
              skills for Industry 4.0.
            </p>
          </div>
        );
      case "values":
        return (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25">
                <FaHeart className="text-lg" />
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Core Values
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                {
                  title: "Inclusivity & Equity",
                  desc: "Education for all, leaving no one behind",
                },
                {
                  title: "Lifelong Learning",
                  desc: "Continuous growth and development",
                },
                {
                  title: "Community Empowerment",
                  desc: "Strengthening communities through knowledge",
                },
                {
                  title: "Flexibility & Adaptability",
                  desc: "Responsive to learners' diverse needs",
                },
              ].map((val, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:shadow-lg hover:border-transparent transition-all duration-300 group"
                >
                  <span className="mt-0.5 w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-xs shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform duration-300">
                    <FaBookOpen />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {val.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                      {val.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-5 shadow-inner">
              <FaBookOpen className="text-3xl text-gray-300" />
            </div>
            <p className="text-gray-400 font-semibold text-base">
              Select a category above to learn more
            </p>
            <p className="text-gray-300 text-sm mt-1.5">
              Discover our vision, mission, and values
            </p>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden">
      {/* Header */}
      <Header
        onContinue={onContinue}
        onInstallApp={onInstallApp}
        isInstallable={isInstallable}
      />

      {/* ─── Hero Section ──────────────────────────────────── */}
      <section
        id="home"
        className="relative flex-1 flex flex-col items-center justify-center pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-blue-200/20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-indigo-200/15 blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-50/30 to-indigo-50/30 blur-3xl"></div>
          {/* Floating dots */}
          <div className="absolute top-32 right-[20%] w-2 h-2 rounded-full bg-blue-400/40 animate-bounce"></div>
          <div className="absolute top-48 left-[25%] w-3 h-3 rounded-full bg-indigo-400/30 animate-bounce delay-300"></div>
          <div className="absolute bottom-40 left-[15%] w-2 h-2 rounded-full bg-violet-400/40 animate-bounce delay-700"></div>
          <div className="absolute top-60 right-[35%] w-2.5 h-2.5 rounded-full bg-pink-400/30 animate-bounce delay-500"></div>
        </div>

        {/* Hero Content */}
        <div
          className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* ─── Logo Area with Distinct Background ─────────── */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative p-8 sm:p-10 rounded-[2rem] bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 shadow-2xl shadow-gray-900/30 mb-8 border border-gray-700/50">
              {/* Inner glow effects */}
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
                <div className="absolute bottom-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"></div>
                <div className="absolute top-1/4 left-0 w-px h-1/2 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
                <div className="absolute top-1/4 right-0 w-px h-1/2 bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent"></div>
              </div>

              {/* Logo Image */}
              <div className="relative mb-5 flex justify-center">
                <div className="relative">
                  <span className="inline-flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-700 shadow-2xl shadow-blue-500/40 overflow-hidden ring-4 ring-blue-400/20">
                    <img
                      src="/taskhublogos.png"
                      alt="ALS Logo"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl"
                    />
                  </span>
                  <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-400 rounded-xl border-4 border-gray-900 flex items-center justify-center shadow-lg shadow-emerald-400/30">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </span>
                </div>
              </div>

              {/* ALS Letters on dark background */}
              <div className="flex items-center justify-center gap-3 sm:gap-5 mb-3">
                <span className="text-blue-400 text-6xl sm:text-7xl lg:text-8xl font-black drop-shadow-[0_0_20px_rgba(96,165,250,0.3)]">
                  A
                </span>
                <span className="text-red-400 text-6xl sm:text-7xl lg:text-8xl font-black drop-shadow-[0_0_20px_rgba(248,113,113,0.3)]">
                  L
                </span>
                <span className="text-yellow-400 text-6xl sm:text-7xl lg:text-8xl font-black drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                  S
                </span>
              </div>

              <h2 className="text-gray-300 font-bold tracking-widest text-lg sm:text-xl lg:text-2xl uppercase">
                Alternative Learning System
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
                Empowering Filipino learners through accessible, quality
                education — bridging opportunities for a brighter tomorrow.
              </p>
            </div>
          </div>

          {/* ─── Interactive Tabs Card ─────────────────────── */}
          <div
            id="about"
            className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100/80 p-6 sm:p-8 lg:p-10 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Section Label */}
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
                About Us
              </span>
            </div>

            {/* Tab Buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`group flex items-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                    activeTab === tab.key
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl scale-105 ring-4 ${tab.ring}`
                      : `${tab.bg} text-gray-600 hover:text-gray-800 hover:shadow-lg hover:scale-105 border border-transparent hover:border-gray-200`
                  }`}
                >
                  <span
                    className={`text-base transition-all duration-300 ${
                      activeTab === tab.key
                        ? "scale-110"
                        : "group-hover:scale-110"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="text-left min-h-[220px] p-5 sm:p-7 bg-gradient-to-br from-gray-50/80 via-white to-blue-50/50 rounded-2xl border border-gray-100/80 transition-all duration-500">
              {renderContent()}
            </div>

            {/* Continue Button */}
            <div className="mt-9 flex justify-center">
              <button
                onClick={onContinue}
                className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-4 px-10 sm:px-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
                aria-label="Continue to login"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-3">
                  Continue to Login
                  <FaArrowRight className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Section ─────────────────────────────────── */}
      <StatsSection />

      {/* ─── Programs Section ──────────────────────────────── */}
      <section id="programs" className="py-16 sm:py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-72 h-72 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-0 w-72 h-72 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-5 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-4">
              What We Offer
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
              Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                Programs
              </span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-lg mx-auto text-sm sm:text-base">
              Comprehensive learning programs designed for every Filipino learner
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Basic Literacy Program",
                desc: "Foundational reading, writing, and numeracy skills for out-of-school youth and adults.",
                icon: <FaBookOpen />,
                gradient: "from-blue-500 to-blue-600",
                shadow: "shadow-blue-500/15",
              },
              {
                title: "A&E Elementary Level",
                desc: "Accreditation and Equivalency program for elementary level completion.",
                icon: <FaGraduationCap />,
                gradient: "from-indigo-500 to-indigo-600",
                shadow: "shadow-indigo-500/15",
              },
              {
                title: "A&E Secondary Level",
                desc: "High school equivalency program for learners pursuing secondary education.",
                icon: <FaLightbulb />,
                gradient: "from-violet-500 to-violet-600",
                shadow: "shadow-violet-500/15",
              },
            ].map((program, i) => (
              <div
                key={i}
                className={`group relative bg-white rounded-2xl p-7 sm:p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl ${program.shadow} transition-all duration-500 hover:-translate-y-2`}
              >
                {/* Top gradient accent */}
                <div
                  className={`absolute top-0 left-6 right-6 h-1 bg-gradient-to-r ${program.gradient} rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${program.gradient} text-white text-2xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  {program.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {program.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {program.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Global Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-700 { animation-delay: 700ms; }
      `}</style>
    </div>
  );
};

// ─── Main LandingPage Component ─────────────────────────────────────
export default function LandingPage() {
  const [view, setView] = useState("welcome");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    recordApplicationVisit();
    recordPageVisit("landing-page");

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt || isInstalled) return;

    try {
      const result = await deferredPrompt.prompt();
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA install failed:', error);
    }
  };

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  if (view === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Login
          onBack={() => setView("welcome")}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <WelcomeScreen
      onContinue={() => setView("login")}
      onInstallApp={handleInstallApp}
      isInstallable={isInstallable && !isInstalled}
    />
  );
}
