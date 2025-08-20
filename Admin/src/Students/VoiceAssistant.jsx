import React, { useState } from "react";
import { Mic, Loader2 } from "lucide-react";

const SERVER_URL = 'https://capstone-admin-task-hub-9c3u.vercel.app';

const API_BASE = 'https://capstone-admin-task-hub-9c3u-p6r5s7bf2.vercel.app/api';

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

  // Helper: Get all enrolled classes for the student
  const fetchEnrolledClasses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/class/my-classes/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  };

  // Helper: Get pending/missing/upcoming activities for all enrolled classes (today and future)
  const fetchAllActivitiesStatus = async () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const enrolledClasses = await fetchEnrolledClasses();
    let pending = [];
    let missing = [];
    let hasToday = false;
    let classTime = null;
    let upcoming = [];

    for (const cls of enrolledClasses) {
      const classId = cls._id;
      const res = await fetch(`${API_BASE}/api/activities?classId=${classId}`);
      const activities = await res.json();
      const subRes = await fetch(`${API_BASE}/api/activities/submissions?classId=${classId}&studentId=${userId}`);
      const submissions = await subRes.json();

      activities.forEach((act) => {
        const dueDate = new Date(act.date);
        const dueStr = act.date?.slice(0, 10);
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
        if (dueStr === todayStr) {
          hasToday = true;
          classTime = act.time || todaysClassTime || null;
        }
      });
    }
    return { pending, missing, hasToday, classTime, upcoming };
  };

  // Helper to fetch today's announcements for all classes
  const fetchTodaysAnnouncements = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const enrolledClasses = await fetchEnrolledClasses();
      let allAnns = [];
      for (const cls of enrolledClasses) {
        const res = await fetch(`${API_BASE}/api/announcements?classId=${cls._id}`);
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
      if (todaysClassTime || classTime || hasToday) {
        aiAnswer = `You have schedule for ${dayName}`;
        if (todaysClassTime || classTime) {
          aiAnswer += ` at ${todaysClassTime || classTime}`;
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
        const res = await fetch(`${API_BASE}/api/schedule/today?userId=${userId}`);
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
        <div className="mt-4 bg-indigo-900/80 rounded-lg p-4 shadow flex flex-col gap-2">
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
      )}
    </div>
  );
}