import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthlyChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.model),
    datasets: [{
      label: '대수',
      data: data.map(item => item.count),
      backgroundColor: '#66CC99'
    }]
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: '📅 월간 생산 지표 [Planned Mech]' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw}대`
        }
      }
    },
    scales: {
      y: { title: { display: true, text: '대수' } },
      x: { title: { display: true, text: '모델' } }
    }
  };
  return (
    <div className="chart-section">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default MonthlyChart;