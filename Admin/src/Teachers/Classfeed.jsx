import React, { useState } from "react";
import { useParams } from "react-router-dom";

const ClassFeed = () => {
  const { id } = useParams(); // Get subject ID from URL

  // Subject Data
  const subjects = {
    1: "Mathematics",
    2: "Science",
    3: "English",
    4: "History",
  };

  // Initial Announcements for Each Subject
  const [feedData, setFeedData] = useState({
    1: [
      { id: 1, teacher: "Mr. John Doe", content: "Reminder: Algebra quiz on Friday!", time: "2 hours ago" },
    ],
    2: [
      { id: 1, teacher: "Ms. Jane Smith", content: "New Chemistry assignment due Monday.", time: "5 hours ago" },
    ],
    3: [
      { id: 1, teacher: "Mr. Brown", content: "Read chapters 4-6 for next class.", time: "1 day ago" },
    ],
    4: [
      { id: 1, teacher: "Mrs. Davis", content: "History project deadline is next week.", time: "3 days ago" },
    ],
  });

  // New Message State
  const [newMessage, setNewMessage] = useState("");

  // Handle Posting Message
  const handlePost = () => {
    if (newMessage.trim() !== "") {
      const newPost = {
        id: feedData[id]?.length + 1 || 1,
        teacher: "You",
        content: newMessage,
        time: "Just now",
      };

      setFeedData((prevFeeds) => ({
        ...prevFeeds,
        [id]: [newPost, ...(prevFeeds[id] || [])],
      }));

      setNewMessage(""); // Clear input
    }
  };

  return (
    <div className="w-200 ml-100 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        📢 {subjects[id] || "Class"} Feed
      </h2>

      {/* Post Message Box */}
      <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-6">
        <textarea
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Write an announcement..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full"
          onClick={handlePost}
        >
          Post
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {feedData[id]?.length > 0 ? (
          feedData[id].map((post) => (
            <div key={post.id} className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">{post.teacher}</h3>
              <p className="text-gray-600 mt-2">{post.content}</p>
              <p className="text-sm text-gray-400 mt-2">{post.time}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No announcements yet.</p>
        )}
      </div>
    </div>
  );
};

export default ClassFeed;
