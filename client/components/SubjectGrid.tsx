'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { IntentModal } from '@/components/IntentModal';
import { SUBJECTS } from '@/lib/constants/subjects';

// Color themes for subject cards
const colorThemes = [
  { bgColor: 'bg-blue-50', borderColor: 'border-blue-200', hoverBg: 'hover:bg-blue-100' },
  { bgColor: 'bg-purple-50', borderColor: 'border-purple-200', hoverBg: 'hover:bg-purple-100' },
  { bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', hoverBg: 'hover:bg-indigo-100' },
  { bgColor: 'bg-green-50', borderColor: 'border-green-200', hoverBg: 'hover:bg-green-100' },
  { bgColor: 'bg-pink-50', borderColor: 'border-pink-200', hoverBg: 'hover:bg-pink-100' },
  { bgColor: 'bg-orange-50', borderColor: 'border-orange-200', hoverBg: 'hover:bg-orange-100' },
  { bgColor: 'bg-teal-50', borderColor: 'border-teal-200', hoverBg: 'hover:bg-teal-100' },
  { bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', hoverBg: 'hover:bg-cyan-100' },
];

export function SubjectGrid() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubjectClick = (subjectName: string) => {
    setSelectedSubject(subjectName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {SUBJECTS.map((subject, index) => {
          const theme = colorThemes[index % colorThemes.length];

          return (
            <Card
              key={subject.value}
              className={`
                cursor-pointer transition-all duration-200
                hover:shadow-lg hover:scale-105
                border-2 ${theme.borderColor}
                ${theme.bgColor} ${theme.hoverBg}
              `}
              onClick={() => handleSubjectClick(subject.value)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div
                  className={`
                    w-14 h-14 rounded-full ${theme.bgColor} 
                    flex items-center justify-center text-3xl
                    ring-2 ${theme.borderColor}
                  `}
                >
                  {subject.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">
                  {subject.label}
                </h3>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedSubject && (
        <IntentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          subject={selectedSubject}
        />
      )}
    </>
  );
}
