import React from "react";
import "../Css/Dashboard.css";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  // Sample data
  const totalStudents = 100;
  const totalActivities = 10;
  const totalClasses = 5;
  const studentsCompletedActivity = 85;
  const completionRate = ((studentsCompletedActivity / totalStudents) * 100).toFixed(2);

  const chartData = {
    labels: ["Students", "Activities", "Classes", "Completion %"],
    datasets: [
      {
        label: "Counts",
        data: [totalStudents, totalActivities, totalClasses, completionRate],
        backgroundColor: ["#3B82F6", "#10B981", "#EF4444", "#F59E0B"],
      },
    ],
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-start p-6 w-450">
      <h1 className="text-black font-bold mb-4 ml-200">Dashboard</h1>
      
      {/* Top Summary Boxes */}
      <div className="flex flex-wrap gap-4 ml-100">
        <div className="bg-blue-500 text-white p-6 shadow rounded-lg text-center w-60">
          <h2 className="text-lg font-semibold">Total Students</h2>
          <p className="text-3xl font-bold">{totalStudents}</p>
        </div>
        <div className="bg-green-500 text-white p-6 shadow rounded-lg text-center w-60">
          <h2 className="text-lg font-semibold">Total Activities</h2>
          <p className="text-3xl font-bold">{totalActivities}</p>
        </div>
        <div className="bg-red-500 text-white p-6 shadow rounded-lg text-center w-60">
          <h2 className="text-lg font-semibold">Total Classes</h2>
          <p className="text-3xl font-bold">{totalClasses}</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 shadow rounded-lg text-center w-60">
          <h2 className="text-lg font-semibold">Completion Rate</h2>
          <p className="text-3xl font-bold">{completionRate}%</p>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="mt-6 w-full flex justify-center">
        <div className="bg-white p-6 shadow rounded-lg w-3/4">
          <h2 className="text-lg font-semibold text-center mb-4">Performance Chart</h2>
          <Bar data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;