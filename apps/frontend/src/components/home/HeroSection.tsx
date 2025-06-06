import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="relative bg-gradient-to-r from-blue-900 to-indigo-800 text-white rounded-2xl overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://images.pexels.com/photos/7103/writing-notes-idea-conference.jpg')] bg-cover bg-center" />

      <div className="relative z-10 px-8 py-16 md:px-12 md:py-24 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Become an Expert in Observability and Software Development
        </h1>

        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl">
          Join thousands of developers mastering modern software practices with our curated courses
        </p>

        <form onSubmit={handleSearch} className="max-w-lg relative mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-4 pr-20 py-4 bg-white text-black bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder:text-black/30 placeholder:text-opacity-60"
              placeholder="Search for courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700"
            >
              Search
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap gap-4 items-center mt-8">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <img
                  src={`https://randomuser.me/api/portraits/men/${20 + i}.jpg`}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-sm md:text-base text-blue-100">
            Join <span className="font-bold">5,000+</span> developers already learning on Sentry Academy
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;