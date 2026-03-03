'use client';

import { Bot, Compass, GraduationCap, Heart, Users, Baby } from 'lucide-react';
import type { AvatarSelection } from '@/types/database.types';

interface AvatarCompanionProps {
  type: AvatarSelection;
  message: string;
}

const avatarConfig: Record<AvatarSelection, {
  icon: any;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  tech_bot: {
    icon: Bot,
    name: 'Tech Bot',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  explorer: {
    icon: Compass,
    name: 'Explorer',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
  },
  mentor: {
    icon: GraduationCap,
    name: 'Mentor',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
  },
  mother: {
    icon: Heart,
    name: 'Mother',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
  },
  father: {
    icon: Users,
    name: 'Father',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  sibling: {
    icon: Baby,
    name: 'Sibling',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
};

export function AvatarCompanion({ type, message }: AvatarCompanionProps) {
  const config = avatarConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Avatar Icon with Floating Animation */}
      <div
        className={`
          flex-shrink-0 w-12 h-12 rounded-full 
          ${config.bgColor} ${config.borderColor} 
          border-2 flex items-center justify-center
          animate-float
        `}
      >
        <Icon className={`w-6 h-6 ${config.color}`} />
      </div>

      {/* Message Bubble */}
      <div className="flex-1 max-w-md">
        <div
          className={`
            relative rounded-2xl rounded-tl-sm
            bg-white border-2 ${config.borderColor}
            px-4 py-3 shadow-sm
          `}
        >
          {/* Avatar Name */}
          <div className={`text-xs font-semibold ${config.color} mb-1`}>
            {config.name}
          </div>

          {/* Message Text */}
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>

          {/* Speech Bubble Tail */}
          <div
            className={`
              absolute -left-2 top-3 w-0 h-0
              border-t-8 border-t-transparent
              border-r-8 ${config.borderColor}
              border-b-8 border-b-transparent
            `}
          />
          <div
            className={`
              absolute -left-[6px] top-[13px] w-0 h-0
              border-t-6 border-t-transparent
              border-r-6 border-r-white
              border-b-6 border-b-transparent
            `}
          />
        </div>
      </div>

      {/* Custom Floating Animation */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
