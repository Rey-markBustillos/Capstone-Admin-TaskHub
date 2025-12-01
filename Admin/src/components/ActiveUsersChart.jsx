import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ActiveUsersChart = ({ data, type = 'line' }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Active Users',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#1f2937'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#3b82f6',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#374151'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Active Users',
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#374151'
        },
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#6b7280',
          stepSize: 1
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      line: {
        tension: 0.3
      }
    }
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Active Students',
        data: data.students,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: type === 'line',
        tension: 0.3,
      },
      {
        label: 'Active Teachers',
        data: data.teachers,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: type === 'line',
        tension: 0.3,
      },
      {
        label: 'Active Admins',
        data: data.admins,
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        fill: type === 'line',
        tension: 0.3,
      }
    ],
  };

  const ChartComponent = type === 'bar' ? Bar : Line;

  return (
    <div className="w-full h-full">
      <ChartComponent options={options} data={chartData} />
    </div>
  );
};

export default ActiveUsersChart;