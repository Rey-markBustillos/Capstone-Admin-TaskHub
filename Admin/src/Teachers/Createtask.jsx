import React, { useState } from "react";

const CreateTask = () => {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subject, setSubject] = useState("");

  const handleCreateTask = () => {
    if (taskTitle.trim() && taskDescription.trim() && dueDate.trim() && subject.trim()) {
      const newTask = {
        id: tasks.length + 1,
        title: taskTitle,
        description: taskDescription,
        dueDate,
        subject,
      };

      setTasks([newTask, ...tasks]);
      setTaskTitle("");
      setTaskDescription("");
      setDueDate("");
      setSubject("");
    }
  };

  return (
    
    <div className="w-400">
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">📌 Create Task/Activity</h2>

      <input
        type="text"
        placeholder="Task Title"
        className="w-full p-2 text-black border rounded-lg mb-3"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
      />
      <textarea
        placeholder="Task Description"
        className="w-full p-2 border rounded-lg mb-3"
        rows="3"
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
      />
      <input
        type="date"
        className="w-full p-2 border rounded-lg mb-3"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <input
        type="text"
        placeholder="Subject"
        className="w-full p-2 border rounded-lg mb-3"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <button
        className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
        onClick={handleCreateTask}
      >
        Create Task
      </button>

      {/* Display Created Tasks */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700">📋 Task List</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks added yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {tasks.map((task) => (
              <li key={task.id} className="bg-gray-100 p-3 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-800">{task.title}</h4>
                <p className="text-gray-600">{task.description}</p>
                <p className="text-gray-500 text-sm">Due: {task.dueDate} | Subject: {task.subject}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </div>
  );
};

export default CreateTask;
