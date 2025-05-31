import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WeeklyChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.model),
    datasets: [{
      label: '대수',
      data: data.map(item => item.count),
      backgroundColor: '#6EC1E4',
      borderRadius: 8,
      barThickness: 30
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '🗓️ 주간 생산 지표 [Planned Finish]',
        font: { size: 18 }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw}대`
        }
      }
    },
    layout: {
      padding: { top: 10, bottom: 10, left: 10, right: 10 }
    },
    scales: {
      y: {
        title: { display: false, text: '대수', font: { size: 14 } },
        ticks: { stepSize: 1, precision: 0 }
      },
      x: {
        title: { display: false, text: '모델', font: { size: 14 } },
        ticks: { maxRotation: 45, minRotation: 30 }
      }
    }
  };

  return (
    <div className="chart-section" style={{ height: '89%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '90%', height: '290px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default WeeklyChart;
