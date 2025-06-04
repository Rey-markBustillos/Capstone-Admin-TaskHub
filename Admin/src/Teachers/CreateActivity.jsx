import React, { useState } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import Navbar from '../components/Navbar'; // Import Navbar

const CreateActivity = () => {
  const [activityData, setActivityData] = useState({
    title: '',
    description: '',
    date: '',
    score: '',
    attachment: null, // Changed to null for file handling
    createdBy: '', // You might want to fetch this from user context
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setActivityData({ ...activityData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setActivityData({ ...activityData, attachment: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      for (const key in activityData) {
        formData.append(key, activityData[key]);
      }

      // Convert date to Philippines timezone
      const philippinesTime = moment.tz(activityData.date, 'Asia/Manila').format();
      formData.set('date', philippinesTime);

      await axios.post('http://localhost:5000/api/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Activity created successfully!');
      setActivityData({
        title: '',
        description: '',
        date: '',
        score: '',
        attachment: null,
        createdBy: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <Navbar /> {/* Add Navbar here */}
      <div className="max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-4">Create Activity</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Title
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="title"
              name="title"
              type="text"
              placeholder="Title"
              value={activityData.title}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="description"
              name="description"
              placeholder="Description"
              value={activityData.description}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
              Date
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="date"
              name="date"
              type="datetime-local"
              value={activityData.date}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="score">
              Score
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="score"
              name="score"
              type="number"
              placeholder="Score"
              value={activityData.score}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attachment">
              Attachment
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="attachment"
              name="attachment"
              type="file"
              onChange={handleFileChange}
            />
          </div>
          {/* You might want to fetch createdBy from user context */}
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Create Activity
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateActivity;