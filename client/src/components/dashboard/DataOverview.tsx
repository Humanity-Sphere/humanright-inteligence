import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const regionData = [
  { name: 'South Asia', value: 142 },
  { name: 'Africa', value: 98 },
  { name: 'South America', value: 83 },
  { name: 'Europe', value: 56 },
  { name: 'North America', value: 34 },
];

const topicData = [
  { name: 'Jan', 'Water Rights': 35, 'Education': 25, 'Free Speech': 15 },
  { name: 'Feb', 'Water Rights': 42, 'Education': 30, 'Free Speech': 22 },
  { name: 'Mar', 'Water Rights': 38, 'Education': 28, 'Free Speech': 20 },
  { name: 'Apr', 'Water Rights': 45, 'Education': 32, 'Free Speech': 25 },
  { name: 'May', 'Water Rights': 50, 'Education': 35, 'Free Speech': 30 },
  { name: 'Jun', 'Water Rights': 55, 'Education': 40, 'Free Speech': 35 },
];

const COLORS = ['#2D6CDF', '#34A853', '#FBBC05', '#EA4335', '#5E8EE8'];

export default function DataOverview() {
  const [chartType, setChartType] = useState<'topics' | 'regions'>('topics');
  
  return (
    <div className="p-6">
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md overflow-hidden">
          <button 
            onClick={() => setChartType('topics')} 
            className={`px-3 py-1 text-sm ${chartType === 'topics' ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
          >
            Topics
          </button>
          <button 
            onClick={() => setChartType('regions')} 
            className={`px-3 py-1 text-sm ${chartType === 'regions' ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
          >
            Regions
          </button>
        </div>
      </div>
      
      <div className="h-80 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
        {chartType === 'topics' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Water Rights" fill="#2D6CDF" />
              <Bar dataKey="Education" fill="#34A853" />
              <Bar dataKey="Free Speech" fill="#FBBC05" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {regionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
          <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">Top Topic</h4>
          <p className="font-medium mt-1">Water Rights</p>
          <p className="text-xs text-green-500">+24% increase</p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
          <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">Key Region</h4>
          <p className="font-medium mt-1">South Asia</p>
          <p className="text-xs text-neutral-500">142 documents</p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
          <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">Sentiment</h4>
          <p className="font-medium mt-1">Mostly Negative</p>
          <p className="text-xs text-danger">Urgent action needed</p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
          <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">Legal Citations</h4>
          <p className="font-medium mt-1">UN Resolution 64/292</p>
          <p className="text-xs text-neutral-500">Referenced 87 times</p>
        </div>
      </div>
    </div>
  );
}
