  // Helper: Enroll student in a class if not already enrolled
  const enrollInClassIfNeeded = async (classId, studentId) => {
    try {
      // Check if already enrolled
      const res = await fetch(`${API_BASE}/class/${classId}`);
      const cls = await res.json();
      if (cls.students && Array.isArray(cls.students) && cls.students.some(s => s._id === studentId)) {
        return true; // already enrolled
      }
      // Enroll student
      const updateRes = await fetch(`${API_BASE}/class/${classId}/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [...(cls.students?.map(s => s._id) || []), studentId] })
      });
      return updateRes.ok;
    } catch (err) {
      console.error('Error enrolling in class:', err);
      return false;
    }
  };
import React, { useState } from "react";
import { Mic, Loader2 } from "lucide-react";

const SERVER_URL = 'https://capstone-admin-task-hub.vercel.app';

const API_BASE = 'https://capstone-admin-task-hub.vercel.app/api';

export default function VoiceAssistant({ userId, todaysClassTime }) {
  const [listening, setListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showQA, setShowQA] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      setListening(false);
      setShowQA(true);
      askAI(transcript);
    };
    recognition.onend = () => setListening(false);
  };

  // Helper: Get all enrolled classes for the student (always fetch fresh)
  const fetchEnrolledClasses = async () => {
    try {
  const res = await fetch(`${API_BASE}/class/my-classes/${userId}?_=${Date.now()}${Math.random()}`); // force cache bust
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  };

  // Helper: Get pending/missing/upcoming activities for all enrolled classes (always fetch fresh)
  const fetchAllActivitiesStatus = async () => {
    const today = new Date();
  let enrolledClasses = await fetchEnrolledClasses();
  console.log('Fetched enrolled classes:', enrolledClasses);

    // Try to auto-enroll in classes for today if not already enrolled
    // Use the 'today' and 'dayName' variables already declared above
    try {
      const allClassesRes = await fetch(`${API_BASE}/class?_=${Date.now()}${Math.random()}`);
  const allClasses = await allClassesRes.json();
  console.log('Fetched all classes:', allClasses);
      const todayObj = new Date();
      const todayDayName = todayObj.toLocaleDateString('en-US', { weekday: 'long' });
      for (const cls of allClasses) {
        // If class is today and not enrolled, enroll
        if (cls.day && cls.day.toLowerCase() === todayDayName.toLowerCase()) {
          const enrolled = enrolledClasses.some(ec => ec._id === cls._id);
          if (!enrolled) {
            await enrollInClassIfNeeded(cls._id, userId);
          }
        }
      }
      // Re-fetch enrolled classes after possible enrollment
  enrolledClasses = await fetchEnrolledClasses();
  console.log('Enrolled classes after auto-enroll:', enrolledClasses);
    } catch (err) {
      console.error('Error auto-enrolling in today\'s classes:', err);
    }
    let pending = [];
    let missing = [];
    let hasToday = false;
    let classTime = null;
    let upcoming = [];

    for (const cls of enrolledClasses) {
      const classId = cls._id;
      // Add cache-busting param to always get latest
      const res = await fetch(`${API_BASE}/activities?classId=${classId}&_=${Date.now()}${Math.random()}`);
      const activities = await res.json();
      const subRes = await fetch(`${API_BASE}/activities/submissions?classId=${classId}&studentId=${userId}&_=${Date.now()}${Math.random()}`);
      const submissions = await subRes.json();

      // Use the class's time and day for today check
      if (cls.day && cls.day.toLowerCase() === today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()) {
        hasToday = true;
        if (cls.time && /^\d{2}:\d{2}$/.test(cls.time)) {
          const [h, m] = cls.time.split(":");
          let hour = parseInt(h, 10);
          const min = m;
          const ampm = hour >= 12 ? "PM" : "AM";
          let hour12 = hour % 12;
          if (hour12 === 0) hour12 = 12;
          classTime = `${hour12}:${min} ${ampm}`;
        } else {
          classTime = cls.time || todaysClassTime || null;
        }
      }

      activities.forEach((act) => {
        const dueDate = new Date(act.date);
        const submission = Array.isArray(submissions)
          ? submissions.find((s) => {
              const subActId =
                typeof s.activityId === "object" && s.activityId !== null
                  ? s.activityId._id
                  : s.activityId;
              return String(subActId) === String(act._id);
            })
          : null;

        // Pending: not submitted and due date is today or in future, or status is Pending
        if (!submission && dueDate >= today) {
          pending.push(`${act.title} (${cls.className}) due on ${dueDate.toLocaleDateString("en-US", { weekday: "long" })}`);
        }
        // Upcoming: not submitted and due date is in the future (not today)
        if (!submission && dueDate > today) {
          upcoming.push(`${act.title} (${cls.className}) due on ${dueDate.toLocaleDateString("en-US", { weekday: "long" })}`);
        }
        // Missing: not submitted and due date is past, or status is Missing
        if (!submission && dueDate < today) {
          missing.push(`${act.title} (${cls.className})`);
        }
        if (submission && submission.status === "Pending") {
          pending.push(`${act.title} (${cls.className}) due on ${dueDate.toLocaleDateString("en-US", { weekday: "long" })}`);
        }
        if (submission && submission.status === "Missing") {
          missing.push(`${act.title} (${cls.className})`);
        }
      });
    }
    return { pending, missing, hasToday, classTime, upcoming };
  };

  // Helper to fetch today's announcements for all classes (always fetch fresh)
  const fetchTodaysAnnouncements = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const enrolledClasses = await fetchEnrolledClasses();
      let allAnns = [];
      for (const cls of enrolledClasses) {
  const res = await fetch(`${API_BASE}/announcements?classId=${cls._id}&_=${Date.now()}${Math.random()}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const todaysAnns = data.filter(
            (ann) => ann.date && ann.date.slice(0, 10) === todayStr
          );
          if (todaysAnns.length > 0) {
            allAnns = allAnns.concat(
              todaysAnns.map(
                (a) =>
                  `${a.title}${a.content ? ` - ${a.content}` : ""} (${cls.className})`
              )
            );
          }
        }
      }
      if (allAnns.length > 0) {
        return (
          "Today's announcement" +
          (allAnns.length > 1 ? "s" : "") +
          ": " +
          allAnns.join("; ")
        );
      }
      return "";
    } catch {
      return "";
    }
  };

  const askAI = async (q) => {
    setGenerating(true);
    let aiAnswer = "";

    // Get today's date info
    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

    // Check if question is about pending activities
    if (
      q.toLowerCase().includes("pending activity") ||
      q.toLowerCase().includes("pending activities") ||
      q.toLowerCase().includes("pending")
    ) {
      const { pending, upcoming } = await fetchAllActivitiesStatus();
      if (pending.length > 0) {
        aiAnswer = `You have pending activities: ${pending.join(", ")}.`;
      } else {
        aiAnswer = "You have no pending activities.";
      }
      if (upcoming.length > 0) {
        aiAnswer += ` Upcoming activities: ${upcoming.join(", ")}.`;
      }
      setAnswer(aiAnswer);
      speak(aiAnswer);
      setGenerating(false);
      return;
    }

    // Check if question is about class time or day
    if (
      q.toLowerCase().includes("class time") ||
      q.toLowerCase().includes("what time") ||
      q.toLowerCase().includes("my class") ||
      q.toLowerCase().includes("when is my class") ||
      q.toLowerCase().includes("class today") ||
      q.toLowerCase().includes("may pasok ba") ||
      q.toLowerCase().includes("pasok ba")
    ) {
      const { pending, missing, hasToday, classTime, upcoming } = await fetchAllActivitiesStatus();
      // Only say you have a schedule if there is a real class/activity for today
      if (classTime || hasToday) {
        aiAnswer = `You have schedule for ${dayName}`;
        if (classTime) {
          aiAnswer += ` at ${classTime}`;
        }
        aiAnswer += ".";
      } else {
        aiAnswer = `You have no class today (${dayName}).`;
      }
      if (pending.length > 0) {
        aiAnswer += ` You have pending activities: ${pending.join(", ")}.`;
      }
      if (missing.length > 0) {
        aiAnswer += ` You have missing activities: ${missing.join(", ")}.`;
      }
      if (upcoming.length > 0) {
        aiAnswer += ` Upcoming activities: ${upcoming.join(", ")}.`;
      }
      const annText = await fetchTodaysAnnouncements();
      if (annText) aiAnswer += " " + annText;
    }
    // If question is about schedule or activity
    else if (
      q.toLowerCase().includes("schedule") ||
      q.toLowerCase().includes("to do") ||
      q.toLowerCase().includes("activity")
    ) {
      try {
  const res = await fetch(`${API_BASE}/schedule/today?userId=${userId}&_=${Date.now()}${Math.random()}`);
        const data = await res.json();
        if (data.schedule && data.schedule.length > 0) {
          aiAnswer = `Your schedule and activities for ${dayName}: ` + data.schedule.map(s => `${s.time} - ${s.title}`).join(", ");
        } else {
          aiAnswer = `You have no schedule or activity today (${dayName}).`;
        }
      } catch {
        aiAnswer = "I can't fetch your schedule right now.";
      }
      const { pending, missing, upcoming } = await fetchAllActivitiesStatus();
      if (pending.length > 0) {
        aiAnswer += ` You have pending activities: ${pending.join(", ")}.`;
      }
      if (missing.length > 0) {
        aiAnswer += ` You have missing activities: ${missing.join(", ")}.`;
      }
      if (upcoming.length > 0) {
        aiAnswer += ` Upcoming activities: ${upcoming.join(", ")}.`;
      }
      const annText = await fetchTodaysAnnouncements();
      if (annText) aiAnswer += " " + annText;
    } else if (
      q.toLowerCase().includes("announcement") ||
      q.toLowerCase().includes("announcements")
    ) {
      const annText = await fetchTodaysAnnouncements();
      aiAnswer = annText || "There are no announcements for today.";
    } else {
      aiAnswer = "Please ask about your schedule, activity, class time, or announcements.";
    }
    setAnswer(aiAnswer);
    speak(aiAnswer);
    setGenerating(false);
  };

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    synth.speak(utter);
  };

  return (
    <div className="w-full max-w-lg mx-auto my-4 px-2">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={startListening}
          disabled={listening || generating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold shadow-md w-full sm:w-auto justify-center`}
        >
          {listening ? (
            <>
              <Mic className="animate-pulse" size={20} />
              Listening...
            </>
          ) : generating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              <Mic size={20} />
              Ask AI (Voice)
            </>
          )}
        </button>
      </div>
      {/* Show Q&A only when generating or after a question */}
      {showQA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-indigo-900/95 rounded-xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-4 relative animate-fade-in-up pointer-events-auto">
            <button
              className="absolute top-2 right-2 text-indigo-200 hover:text-white text-xl font-bold px-2 py-1 rounded focus:outline-none"
              onClick={() => setShowQA(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-200">Question:</span>
              <span className="text-white ml-2 break-words">{question || <span className="italic text-indigo-200">None</span>}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-200">Answer:</span>
              <span className="text-white ml-2 break-words">
                {generating ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="animate-spin" size={16} /> Generating...
                  </span>
                ) : answer ? answer : <span className="italic text-indigo-200">None</span>}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}