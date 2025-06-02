import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Lesson } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Clock, Video, FileText } from 'lucide-react';

interface LessonContentProps {
  lesson: Lesson;
}

const LessonContent: React.FC<LessonContentProps> = ({ lesson }) => {
  const renderContent = () => {
    if (lesson.type === 'video' && lesson.videoUrl) {
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Video: {lesson.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                Video URL: {lesson.videoUrl}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (lesson.type === 'text' && lesson.content) {
      return (
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown 
            components={{
              code: ({ inline, className, children, ...props }) => {
                return !inline ? (
                  <pre className="bg-gray-100 rounded p-4 overflow-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-700">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">
                  {children}
                </strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50">
                  {children}
                </blockquote>
              ),
            }}
          >
            {lesson.content}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No content available for this lesson</p>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
            <div className="flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">{lesson.duration}</span>
            </div>
          </div>
          <p className="text-gray-600 mt-2">{lesson.description}</p>
        </div>
        
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default LessonContent;