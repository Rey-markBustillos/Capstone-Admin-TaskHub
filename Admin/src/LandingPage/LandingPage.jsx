import React, { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
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
const Header = ({ onContinue, onCreateAccount, onInstallApp, isInstallable }) => {
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
          <div id="landing-auth-actions" className="flex items-center gap-3">
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

            <button
              onClick={onCreateAccount}
              className="inline-flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-xs font-semibold text-indigo-100 bg-indigo-500/25 border border-indigo-400/40 hover:bg-indigo-500/35 hover:text-white transition-all duration-300 sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Create Account</span>
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
            <button
              onClick={() => {
                onCreateAccount();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-indigo-300 hover:text-indigo-200 hover:bg-gray-700/50"
            >
              Create Account
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
    const scrollPanel = document.querySelector(".als-landing-left");
    const scrollTarget = scrollPanel || window;
    const handleScroll = () => setShowScrollTop(scrollPanel ? scrollPanel.scrollTop > 300 : window.scrollY > 300);
    scrollTarget.addEventListener("scroll", handleScroll);
    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollPanel = document.querySelector(".als-landing-left");
    if (scrollPanel) scrollPanel.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            <h4 id="landing-contact-target" className="text-white font-semibold mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
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
const WelcomeScreen = ({ onContinue, onCreateAccount, onInstallApp, isInstallable }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tourStep, setTourStep] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      if (savedUser && savedToken) {
        localStorage.setItem("als-landing-tour-v2-complete", "true");
        return null;
      }
      return localStorage.getItem("als-landing-tour-v2-complete") === "true" ? null : 0;
    } catch {
      return 0;
    }
  });
  const [spotlight, setSpotlight] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const values = [
    ["Inclusivity & Equity", "Education for all, leaving no learner behind."],
    ["Lifelong Learning", "Building skills and confidence at every stage of life."],
    ["Community Empowerment", "Strengthening communities through accessible learning."],
    ["Flexibility & Adaptability", "Learning that responds to different needs and situations."],
  ];
  const programs = [
    { title: "Basic Literacy Program", desc: "Build foundational reading, writing, and numeracy skills.", icon: <FaBookOpen />, tone: "blue" },
    { title: "A&E Elementary", desc: "Work toward elementary-level accreditation and equivalency.", icon: <FaGraduationCap />, tone: "indigo" },
    { title: "A&E Secondary", desc: "Continue learning toward secondary-level equivalency.", icon: <FaLightbulb />, tone: "violet" },
  ];
  const tour = [
    { selector: "#landing-home-target", title: "Magsimula rito", body: "Ito ang home page ng ALS Portal. Ituturo namin ang pangunahing bahagi nito bago ka magpatuloy." },
    { selector: "#landing-programs-target", title: "Tingnan ang Programs", body: "Dito makikita ang mga learning program. I-scroll ang kaliwang column para makita ang bawat opsyon." },
    { selector: "#landing-contact-target", title: "Hanapin ang Contact", body: "Nasa ibaba ng page ang contact information kung kailangan mo ng tulong." },
    { selector: "#landing-about-target", title: "Kilalanin ang ALS", body: "Dito matatagpuan ang Mission, Vision, at Core Values. I-scroll ang column kung gusto mong makita ang buong detalye." },
    { selector: "#landing-auth-actions", title: "Gumawa ng account o mag-login", body: "Bagong user? Pindutin ang Create Account. May account ka na? Pindutin ang Login. Pagkatapos, dadalhin ka sa portal ayon sa role mo." },
  ];

  const finishTour = (nextAction) => {
    try { localStorage.setItem("als-landing-tour-v2-complete", "true"); } catch { /* Continue if storage is unavailable. */ }
    setTourStep(null);
    nextAction();
  };
  const runAction = (action) => tourStep !== null ? finishTour(action) : action();
  const handleContinue = () => runAction(onContinue);
  const handleCreateAccount = () => runAction(onCreateAccount);

  useEffect(() => {
    if (tourStep === null) return undefined;
    const targetSelector = tour[tourStep]?.selector;
    let targetElement;
    let frame;
    const updateSpotlight = () => {
      if (!targetElement) return;
      const rect = targetElement.getBoundingClientRect();
      setSpotlight({ x: rect.left, y: rect.top, width: rect.width, height: rect.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
    };
    const timer = setTimeout(() => {
      targetElement = document.querySelector(targetSelector);
      if (!targetElement) return;
      targetElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      frame = requestAnimationFrame(updateSpotlight);
      window.addEventListener("scroll", updateSpotlight, true);
      window.addEventListener("resize", updateSpotlight);
    }, 120);
    return () => {
      clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateSpotlight, true);
      window.removeEventListener("resize", updateSpotlight);
    };
  }, [tourStep]);

  return (
    <div className="als-landing min-h-screen bg-slate-50 text-slate-900">
      <Header onContinue={handleContinue} onCreateAccount={handleCreateAccount} onInstallApp={onInstallApp} isInstallable={isInstallable} />

      <main className="als-landing-columns">
        <div className="als-landing-left">
          <section id="home" className={`als-home relative flex min-h-[620px] items-center overflow-hidden px-6 py-16 transition-all duration-700 sm:px-10 lg:px-14 ${isVisible ? "opacity-100" : "translate-y-4 opacity-0"}`}>
            <div className="pointer-events-none absolute -right-20 top-8 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
            <div className="relative mx-auto w-full max-w-3xl">
              <div id="landing-home-target" className="mb-8 flex items-center gap-5 rounded-2xl">
                <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 shadow-xl shadow-blue-900/20">
                  <img src="/taskhublogos.png" alt="ALS Portal logo" className="h-20 w-20 rounded-2xl object-cover sm:h-24 sm:w-24" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[.22em] text-blue-700">Welcome to</p>
                  <h1 className="text-4xl font-black tracking-tight sm:text-6xl">ALS <span className="text-indigo-700">Portal</span></h1>
                  <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">Alternative Learning System</p>
                </div>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">A welcoming place to learn, grow, and work toward new opportunities through the Alternative Learning System.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={handleContinue} className="inline-flex items-center gap-3 rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800">Continue to Login <FaArrowRight /></button>
                <a href="#programs" className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700">Explore Programs</a>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {[[<FaBookOpen />, "Flexible learning"], [<FaUsers />, "Learner focused"], [<FaGraduationCap />, "New opportunities"]].map(([icon, label]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm"><span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</span><span className="text-xs font-semibold text-slate-600 sm:text-sm">{label}</span></div>)}
              </div>
            </div>
          </section>

          <section id="programs" className="bg-white px-6 py-16 sm:px-10 lg:px-14">
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-700">Learning pathways</p>
              <h2 id="landing-programs-target" className="mt-2 text-3xl font-extrabold sm:text-4xl">Programs for every learner</h2>
              <p className="mt-3 max-w-2xl text-slate-600">Explore learning options designed to help out-of-school youth and adults build skills and continue their education.</p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {programs.map((program) => <article key={program.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700">{program.icon}</span><h3 className="mt-4 font-bold">{program.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{program.desc}</p></article>)}
              </div>
            </div>
          </section>
          <Footer />
        </div>

        <aside id="about" className="als-landing-right">
          <div className="mx-auto w-full max-w-2xl">
            <div id="landing-about-target" className="rounded-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">Who we are</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Our purpose, our promise</h2>
            <p className="mt-3 leading-7 text-slate-600">The Alternative Learning System opens learning opportunities for people whose needs are not met by the formal education system.</p>
            </div>
            <article className="mt-7 rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-900/15 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl"><FaEye /></span>
              <h3 className="mt-5 text-2xl font-bold">Our Vision</h3>
              <p className="mt-3 text-sm leading-7 text-blue-50 sm:text-base">We will have nation-loving and competent lifelong learners who are able to respond to challenges and opportunities through quality, accessible, relevant, and liberating K to 12 Program delivered by a modern, professional, pro-active, nimble, trusted and nurturing DepEd.</p>
            </article>
            <article className="mt-4 rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-700"><FaBullseye /></span>
              <h3 className="mt-5 text-2xl font-bold">Our Mission</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">To develop exemplary programs and open learning opportunities for out-of-school youth and adults to achieve multiple competencies and skills for Industry 4.0.</p>
            </article>
            <section className="mt-7 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><FaHeart /></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-rose-700">What guides us</p><h3 className="text-2xl font-extrabold">Core Values</h3></div></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">{values.map(([title, description], index) => <article key={title} className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-bold text-blue-700">0{index + 1}</span><h4 className="mt-1 font-bold">{title}</h4><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></article>)}</div>
            </section>
            <button onClick={handleContinue} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-4 font-bold text-white transition hover:bg-blue-800">Enter the Portal <FaArrowRight /></button>
            <p className="pb-8 pt-4 text-center text-xs text-slate-500">Accessible learning. Stronger communities. Brighter futures.</p>
          </div>
        </aside>
      </main>

      <style>{`
        .als-landing-columns { display:grid; grid-template-columns:minmax(0, 1.08fr) minmax(390px, .92fr); height:calc(100vh - 84px); margin-top:84px; overflow:hidden; }
        .als-landing-left, .als-landing-right { min-width:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:#cbd5e1 transparent; }
        .als-landing-left { background:#f8fafc; }
        .als-landing-right { padding:6rem clamp(1.25rem, 3vw, 3rem) 2rem; background:linear-gradient(155deg,#eff6ff 0%,#f8fafc 48%,#eef2ff 100%); border-left:1px solid #e2e8f0; scroll-padding-top:2rem; }
        .als-landing-left::-webkit-scrollbar,.als-landing-right::-webkit-scrollbar { width:8px; }
        .als-landing-left::-webkit-scrollbar-thumb,.als-landing-right::-webkit-scrollbar-thumb { background:#cbd5e1; border:2px solid transparent; background-clip:padding-box; border-radius:999px; }
        @media(min-width:901px) { .als-landing .fixed.bottom-6.right-6 { right:calc(46vw + 1.5rem); } }
        @media(max-width:900px) { .als-landing-columns { display:block; height:auto; margin-top:80px; overflow:visible; } .als-landing-left,.als-landing-right { overflow:visible; } .als-landing-right { border-left:0; border-top:1px solid #e2e8f0; padding:5rem 1.25rem 2.5rem; scroll-margin-top:5.5rem; } .als-home { min-height:560px; } }
        @media(max-width:520px) { .als-home { min-height:0; padding-top:4rem; padding-bottom:4rem; } }
      `}</style>

      {tourStep !== null && spotlight && (() => {
        const pad = 9;
        const x = Math.max(0, spotlight.x - pad);
        const y = Math.max(0, spotlight.y - pad);
        const right = Math.min(spotlight.viewportWidth, spotlight.x + spotlight.width + pad);
        const bottom = Math.min(spotlight.viewportHeight, spotlight.y + spotlight.height + pad);
        const cutWidth = right - x;
        const cutHeight = bottom - y;
        const tooltipWidth = Math.min(360, spotlight.viewportWidth - 32);
        const tooltipLeft = Math.max(16, Math.min(x, spotlight.viewportWidth - tooltipWidth - 16));
        const tooltipTop = bottom + 16 + 190 < spotlight.viewportHeight ? bottom + 16 : Math.max(16, y - 206);
        const finalStep = tourStep === tour.length - 1;
        return <div className="pointer-events-none fixed inset-0 z-[100]" aria-live="polite">
          <div className="pointer-events-auto absolute inset-x-0 top-0 bg-slate-950/65" style={{ height: y }} />
          <div className="pointer-events-auto absolute inset-x-0 bg-slate-950/65" style={{ top: bottom, bottom: 0 }} />
          <div className="pointer-events-auto absolute bg-slate-950/65" style={{ top: y, left: 0, width: x, height: cutHeight }} />
          <div className="pointer-events-auto absolute bg-slate-950/65" style={{ top: y, left: right, right: 0, height: cutHeight }} />
          {!finalStep && <div className="pointer-events-auto absolute bg-transparent" style={{ left: x, top: y, width: cutWidth, height: cutHeight }} />}
          <div className="pointer-events-none fixed rounded-2xl ring-4 ring-blue-400 ring-offset-4 ring-offset-blue-500/30" style={{ left: x, top: y, width: cutWidth, height: cutHeight, animation: "tourPulse 1.6s ease-in-out infinite" }} />
          <div id="landing-tour-tip" className="pointer-events-auto fixed w-[calc(100vw-2rem)] max-w-[360px] rounded-2xl border border-white/70 bg-white p-5 shadow-2xl sm:p-6" style={{ left: tooltipLeft, top: tooltipTop }}>
            <div className="mb-3 flex items-center justify-between gap-3"><span className="text-[11px] font-bold uppercase tracking-[.16em] text-blue-700">Sundan ang gabay</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{tourStep + 1}/{tour.length}</span></div>
            <h2 className="text-xl font-extrabold text-slate-900">{tour[tourStep].title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{tour[tourStep].body}</p>
            {!finalStep && <button onClick={() => setTourStep((step) => step + 1)} className="mt-4 flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">Susunod <FaArrowRight /></button>}
          </div>
          <style>{`@keyframes tourPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,.45); } 50% { box-shadow: 0 0 0 9px rgba(59,130,246,.08); } }`}</style>
        </div>;
      })()}
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
          onRegister={() => setView("register")}
        />
      </div>
    );
  }

  if (view === "register") {
    return (
      <Register
        onBackToLogin={() => setView("login")}
      />
    );
  }

  return (
    <WelcomeScreen
      onContinue={() => setView("login")}
      onCreateAccount={() => setView("register")}
      onInstallApp={handleInstallApp}
      isInstallable={isInstallable && !isInstalled}
    />
  );
}
