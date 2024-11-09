import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ExpenseChart = ({ expenses }) => {
  // Process data to group by date
  const processData = () => {
    if (!expenses || expenses.length === 0) return [];
    
    const groupedData = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += parseFloat(expense.amount);
      return acc;
    }, {});

    return Object.entries(groupedData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = processData();

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#60A5FA" 
            strokeWidth={2}
            dot={{ fill: '#60A5FA', strokeWidth: 2 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart;