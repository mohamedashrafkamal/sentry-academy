import React from 'react';
import { Users, BookOpen, Award, Clock } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label }) => {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-4">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
};

const StatisticsSection: React.FC = () => {
  return (
    <div className="py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem 
          icon={<Users size={24} />} 
          value="5,000+" 
          label="Active Students" 
        />
        <StatItem 
          icon={<BookOpen size={24} />} 
          value="50+" 
          label="Expert Courses" 
        />
        <StatItem 
          icon={<Award size={24} />} 
          value="15+" 
          label="Industry Experts" 
        />
        <StatItem 
          icon={<Clock size={24} />} 
          value="300+" 
          label="Hours of Content" 
        />
      </div>
    </div>
  );
};

export default StatisticsSection;