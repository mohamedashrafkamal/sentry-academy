import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
}

const Testimonial: React.FC<TestimonialProps> = ({ 
  quote, 
  name, 
  title, 
  avatar,
  rating 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
          />
        ))}
      </div>
      <p className="text-gray-700 mb-6 italic">"{quote}"</p>
      <div className="flex items-center">
        <img 
          src={avatar} 
          alt={name} 
          className="w-12 h-12 rounded-full object-cover mr-4" 
        />
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-gray-600 text-sm">{title}</p>
        </div>
      </div>
    </div>
  );
};

const TestimonialSection: React.FC = () => {
  const testimonials = [
    {
      quote: "Sentry Academy's courses on distributed tracing completely changed how I approach debugging in our microservices architecture.",
      name: "Jamie Smith",
      title: "Senior Developer at TechCorp",
      avatar: "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg",
      rating: 5
    },
    {
      quote: "The error tracking course helped our team reduce customer-reported bugs by 70%. Incredibly practical knowledge.",
      name: "Rachel Lee",
      title: "Lead Engineer at StartupX",
      avatar: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg",
      rating: 5
    },
    {
      quote: "The observability fundamentals course took me from confused to confident. Now I'm leading our monitoring strategy.",
      name: "David Wilson",
      title: "DevOps Engineer at CloudSys",
      avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
      rating: 4
    }
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Students Say</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          See how Sentry Academy has helped professionals just like you master 
          modern software development and observability.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Testimonial key={index} {...testimonial} />
        ))}
      </div>
    </div>
  );
};

export default TestimonialSection;