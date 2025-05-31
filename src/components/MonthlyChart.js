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
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '📅 월간 생산 지표 [Planned Mech]',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw}대`
        }
      }
    },
    scales: {
      y: {
        title: { display: false, text: '대수', font: { size: 14 } },
        ticks: { font: { size: 12 }, stepSize: 1 }
      },
      x: {
        title: { display: false, text: '모델', font: { size: 14 } },
        ticks: { font: { size: 12 } }
      }
    },
    elements: {
      bar: {
        borderRadius: 5
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

export default MonthlyChart;
