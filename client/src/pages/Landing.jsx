import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { login, token, loading } = useAuth();
  const cursorGlowRef = useRef(null);
  
  // ✅ STATE: Track if Google Script is ready
  const [googleReady, setGoogleReady] = useState(false);

  // Auto redirect
  useEffect(() => {
    if (!loading && token) navigate("/dashboard");
  }, [loading, token, navigate]);

  // Reveal animations
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.25 }
    );
    elements.forEach((el) => observer.observe(el));
  }, []);

  // ============================
  // GOOGLE LOGIN SETUP (FIXED DELAY)
  // ============================
  useEffect(() => {
    // Function to initialize Google Button
    const initGoogle = () => {
      if (!window.google) return;

      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        {
          theme: "filled_blue",
          size: "large",
          width: 350,
          type: "standard",
          shape: "rectangular",
        }
      );
      
      // ✅ Signal that Google is ready
      setGoogleReady(true);
    };

    // ✅ CHECK: Is Google loaded?
    if (window.google) {
      initGoogle();
    } else {
      // If not, check every 100ms until it is (Simple & Robust)
      const timer = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(timer);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/auth/google",
        { credential: response.credential }
      );

      login(data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  // Mouse glow effect
  useEffect(() => {
    const glow = cursorGlowRef.current;
    if (!glow) return;
    if (window.innerWidth < 768) return;

    let x = 0, y = 0;
    let targetX = 0, targetY = 0;

    const move = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      glow.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", move);
    animate();
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div className="relative w-full min-h-screen text-[#111827] overflow-hidden">
      
      {/* Background Elements */}
      <div
        ref={cursorGlowRef}
        className="pointer-events-none fixed top-0 left-0 w-[400px] h-[400px] rounded-full -z-20"
        style={{
          background: "radial-gradient(circle, rgba(40,0,80,0.25), rgba(0,0,0,0) 70%)",
          filter: "blur(90px)",
        }}
      ></div>

      <div className="absolute inset-0 -z-30 bg-gradient-to-br from-[#f7f8ff] via-[#eef0ff] to-[#e7e9ff]" />

      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(150,115,255,0.18),transparent_70%)] blur-[120px] -z-20"></div>

      <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-b from-transparent to-[#f7f8ff] pointer-events-none z-10"></div>

      <style>{`
        .fade-left { opacity: 0; transform: translateX(-60px); transition: 0.8s ease-out; }
        .fade-right { opacity: 0; transform: translateX(60px); transition: 0.8s ease-out; }
        .fade-center { opacity: 0; transform: translateY(40px); transition: 0.8s ease-out; }
        .active { opacity: 1 !important; transform: translate(0,0) !important; }
        
        #googleBtn iframe { margin: 0 !important; display: block !important; } 

        .premium-img-wrapper::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 1.5rem;
          background: radial-gradient(circle at 30% 30%, rgba(180,150,255,0.14), rgba(255,255,255,0));
          pointer-events: none;
        }
      `}</style>

      {/* HERO */}
      <section
        id="hero"
        className="
          min-h-screen
          flex flex-col items-center justify-center text-center
          px-4 sm:px-6 fade-center reveal pb-8
          pt-32 sm:pt-0
        "
      >
        <h1
          className="
            hidden sm:block
            text-[55px] sm:text-[70px] md:text-[85px] lg:text-[95px]
            font-extrabold leading-[1.05] tracking-tight max-w-5xl
          "
        >
          Career Made <br />
          <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text drop-shadow-md">
            Simple
          </span>
        </h1>

        <h1
          className="
            sm:hidden block
            text-[80px] font-extrabold leading-[1.1] tracking-tight
          "
        >
          Career<br />Made<br />
          <span className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-transparent bg-clip-text drop-shadow-md">
            Simple
          </span>
        </h1>

        <p className="mt-6 text-[36px] sm:text-[20px] md:text-[22px] lg:text-[24px] text-gray-600 max-w-2xl leading-relaxed">
          Smarter Career Decisions, Powered by AI.
        </p>

        {/* ========================================================= */}
        {/* BUTTON WRAPPER */}
        {/* ========================================================= */}
        <div className="relative mt-10 inline-block group">
          
          {/* VISUAL BUTTON (Changes text if loading) */}
          <button
            className={`
              pointer-events-none
              px-8 sm:px-10 py-3.5
              bg-gradient-to-r from-fuchsia-500 to-indigo-600
              text-white rounded-lg 
              text-base sm:text-lg font-semibold
              shadow-[0_4px_25px_rgba(120,50,255,0.25)]
              transition-all duration-300
              
              /* Only glow/scale if loaded */
              ${googleReady ? 'group-hover:shadow-[0_6px_30px_rgba(120,50,255,0.35)] group-hover:scale-[1.045]' : 'opacity-80'}
            `}
          >
            {/* ✅ SHOW LOADING UNTIL GOOGLE SCRIPT ARRIVES */}
            {googleReady ? "Try Zyris" : "Loading..."}
          </button>

          {/* REAL GOOGLE BUTTON (Invisible Overlay) */}
          <div 
            id="googleBtn"
            className="absolute inset-0 z-10 opacity-0 overflow-hidden flex justify-center items-center cursor-pointer"
          ></div>

        </div>

      </section>

      {/* ✅ SCROLL ANCHOR */}
      <div id="features" className="scroll-mt-32"></div>

      {/* MOBILE Why Choose */}
      <h2 className="sm:hidden text-3xl text-center font-bold text-[#2b2055] mt-24 mb-8">
        Why Choose Zyris?
      </h2>

      {/* DESKTOP Why Choose */}
      <h2
        className="
          hidden sm:block 
          text-4xl md:text-5xl font-bold text-center mt-10 mb-10 
          text-[#34245f]
          fade-center reveal
        "
      >
        Why Choose Zyris?
      </h2>

      {/* FEATURE COMPONENTS */}
      <PremiumSection
        title="Smarter Resume Insights"
        subtitle="📄 AI Resume Analyzer"
        img="/resume.png"
        desc="Instant insights on strengths, weaknesses, keywords, and recruiter-focused improvements."
      />

      <PremiumSection
        title="Accurate JD Match Analysis"
        subtitle="🎯 Job Description Analyzer"
        img="/jd.png"
        reverse
        desc="See match %, missing skills, and tailored improvement steps for any JD."
      />

      <PremiumSection
        title="Practice Like a Real Interview"
        subtitle="🎤 AI Mock Interviews"
        img="/interview.png"
        desc="Simulated interviews with AI scoring, coaching, and improvement suggestions."
      />

      <PremiumSection
        title="Personalized Job Insights"
        subtitle="🔍 Match Engine"
        img="/match.png"
        reverse
        desc="Deep resume–JD comparison to understand recruiter expectations."
      />

      <PremiumSection
        title="Instant Role-Based Resumes"
        subtitle="📝 Tailored Resume Generator"
        img="/tailor.png"
        desc="Create ATS-friendly and JD-optimized resumes instantly."
      />

      <PremiumSection
        title="Track Everything Easily"
        subtitle="📊 Dashboard History"
        img="/history.png"
        reverse
        desc="Your reports, interviews, and resumes saved automatically."
      />

      <section id="faq" className="px-4 sm:px-6 py-20 sm:py-28 fade-center reveal">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16">
          FAQ
        </h2>
        <FAQ q="Is this really free?" a="Yes — fully free for students and educational use." />
        <FAQ q="Do I need technical knowledge?" a="No. Just upload your resume or paste a JD." />
        <FAQ q="Is my data safe & private?" a="Absolutely — your data remains private and secure." />
      </section>

      <footer className="py-10 sm:py-12 text-center text-gray-700 text-base sm:text-lg">
        Built with ❤️ for Students • Powered by MERN + AI
      </footer>
    </div>
  );
}

/* FEATURE SECTION */
function PremiumSection({ title, subtitle, desc, img, reverse }) {
  return (
    <section className="px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 sm:gap-24 items-center">
        <div className={`${reverse ? "lg:order-2 fade-right" : "lg:order-1 fade-left"} reveal`}>
          <h3 className="text-fuchsia-600 text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-4">
            {subtitle}
          </h3>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
            {title}
          </h2>
          <p className="text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed">
            {desc}
          </p>
        </div>

        <div
          className={`
            relative premium-img-wrapper
            w-full h-[240px] sm:h-[300px] md:h-[380px] lg:h-[420px]
            rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-xl
            transition-all duration-500 hover:scale-[1.04] hover:shadow-2xl hover:brightness-[1.05]
            ${reverse ? "lg:order-1 fade-left" : "lg:order-2 fade-right"} reveal
          `}
        >
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover transition-all duration-500"
          />
        </div>
      </div>
    </section>
  );
}

/* FAQ */
function FAQ({ q, a }) {
  return (
    <details
      className="
        max-w-3xl mx-auto mb-6 sm:mb-8 p-6 sm:p-7 md:p-8
        rounded-2xl border
        bg-gradient-to-br from-white to-[#fafbff]
        shadow-[0_5px_20px_rgba(150,115,255,0.12)]
        hover:shadow-[0_5px_30px_rgba(150,115,255,0.22)]
        transition-all duration-300
        fade-center reveal
      "
    >
      <summary className="cursor-pointer font-semibold text-lg sm:text-xl md:text-2xl">
        {q}
      </summary>
      <p className="mt-4 text-gray-600 text-base sm:text-lg md:text-xl">
        {a}
      </p>
    </details>
  );
}