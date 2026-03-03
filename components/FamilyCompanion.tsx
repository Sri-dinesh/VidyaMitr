'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Award, Zap, X, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CompanionType = 'mother' | 'father' | 'sibling';
export type StudentState = 'starting' | 'struggling' | 'succeeding' | 'completing' | 'idle';

interface Companion {
  type: CompanionType;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  personality: string;
}

interface FamilyCompanionProps {
  currentSubject?: string;
  recentFeedback?: 'too_slow' | 'too_hard' | 'perfect' | null;
  studentState?: StudentState;
  className?: string;
  defaultCompanion?: CompanionType;
  onCompanionChange?: (companion: CompanionType) => void;
}

// ============================================================================
// COMPANION DEFINITIONS
// ============================================================================

const COMPANIONS: Record<CompanionType, Companion> = {
  mother: {
    type: 'mother',
    name: 'Mom',
    icon: <Heart className="w-6 h-6" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    personality: 'Nurturing & Empathetic',
  },
  father: {
    type: 'father',
    name: 'Dad',
    icon: <Award className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    personality: 'Guiding & Proud',
  },
  sibling: {
    type: 'sibling',
    name: 'Sibling',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    personality: 'Fun & Challenging',
  },
};

// ============================================================================
// DYNAMIC MESSAGE ENGINE
// ============================================================================

const MESSAGE_DICTIONARY: Record<
  CompanionType,
  Record<StudentState, string[]>
> = {
  mother: {
    starting: [
      "I'm so proud of you for starting this journey! Take your time and enjoy learning.",
      "Remember, every expert was once a beginner. You've got this, sweetheart!",
      "I'll be right here cheering you on. Let's learn together!",
      "Starting something new takes courage. I believe in you completely!",
    ],
    struggling: [
      "Take a deep breath, dear. It's okay to find things challenging. We can try an easier approach first.",
      "I'm proud of your effort, not just the results. Let's break this down into smaller steps.",
      "Every struggle is a step toward understanding. You're doing wonderfully by trying!",
      "Remember when you learned to ride a bike? This is just like that - practice makes progress!",
    ],
    succeeding: [
      "I knew you could do it! Your hard work is really paying off, sweetheart!",
      "Look at you shine! I'm so incredibly proud of your dedication.",
      "You're not just learning, you're mastering this! Keep up the amazing work!",
      "Your focus and determination inspire me. You're doing beautifully!",
    ],
    completing: [
      "You did it! I'm bursting with pride watching you complete this module!",
      "What an achievement! Your perseverance has brought you so far.",
      "I always knew you had it in you. Congratulations on finishing this!",
      "You've grown so much through this learning journey. I'm so proud!",
    ],
    idle: [
      "Whenever you're ready to continue, I'll be here supporting you.",
      "Take all the time you need. Learning is a journey, not a race.",
      "I'm here whenever you want to explore something new together.",
    ],
  },
  father: {
    starting: [
      "Excellent choice! Let's tackle this subject with focus and determination.",
      "I'm proud of you for taking initiative. Show this material what you're made of!",
      "Ready to excel? I know you have what it takes to master this.",
      "Starting strong is half the battle. Let's make this learning session count!",
    ],
    struggling: [
      "Champions face challenges head-on. Let's review the fundamentals and build from there.",
      "I see your effort, and that's what matters most. Let's approach this strategically.",
      "Every expert struggled at first. Your persistence will lead to mastery.",
      "Difficulty means you're pushing your limits. That's exactly where growth happens!",
    ],
    succeeding: [
      "Excellent focus! You are mastering this subject perfectly. Keep going!",
      "Outstanding work! Your dedication is producing remarkable results.",
      "This is exactly the kind of excellence I knew you were capable of!",
      "You're not just learning - you're dominating this material. Proud of you!",
    ],
    completing: [
      "Exceptional achievement! You've demonstrated true mastery of this module.",
      "That's my champion! You completed this with flying colors.",
      "Your commitment to excellence has paid off brilliantly. Well done!",
      "You've proven your capability once again. Ready for the next challenge?",
    ],
    idle: [
      "Ready to continue your path to mastery? I'm here to guide you.",
      "Take your time to prepare. Excellence requires both effort and rest.",
      "When you're ready to push forward, let's achieve great things together.",
    ],
  },
  sibling: {
    starting: [
      "Race you to the finish line! Let's crush this module together!",
      "Bet you can't finish this faster than I did! Just kidding - you totally can!",
      "Alright, let's make learning fun! Ready to become a genius?",
      "Time to level up your brain! This is going to be epic!",
    ],
    struggling: [
      "Hey, even superheroes need practice! Want to try a different approach?",
      "No worries! I struggled with this too. Let's figure it out together!",
      "Tough level, huh? Let's find the cheat code (aka easier resources)!",
      "Everyone hits a wall sometimes. Let's smash through it together!",
    ],
    succeeding: [
      "Whoa! You're absolutely crushing it! Can you teach me your secrets?",
      "Look at you go! You're making this look easy!",
      "That's what I'm talking about! You're on fire right now!",
      "Okay, show-off! Just kidding - you're doing amazing!",
    ],
    completing: [
      "YES! You finished it! High five! 🙌",
      "Module complete! You're officially awesome now!",
      "Boom! Another one bites the dust! You're unstoppable!",
      "That's how it's done! Ready for the next adventure?",
    ],
    idle: [
      "Whenever you're ready to jump back in, I'll be your study buddy!",
      "Taking a break? Smart move! Let me know when you want to continue.",
      "No rush! Hit me up when you're ready to learn something cool!",
    ],
  },
};

/**
 * Get a context-aware motivational message
 */
function getMotivationalMessage(
  companionType: CompanionType,
  studentState: StudentState,
  currentSubject?: string
): string {
  const messages = MESSAGE_DICTIONARY[companionType][studentState];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  // Add subject context if provided
  if (currentSubject && studentState !== 'idle') {
    const subjectMentions: Record<CompanionType, string[]> = {
      mother: [
        ` ${currentSubject} is such an important subject!`,
        ` I know ${currentSubject} can be tricky, but you're doing great!`,
        ` Your ${currentSubject} skills are improving every day!`,
      ],
      father: [
        ` ${currentSubject} mastery will serve you well!`,
        ` Your ${currentSubject} performance is impressive!`,
        ` Keep this ${currentSubject} momentum going!`,
      ],
      sibling: [
        ` ${currentSubject} is actually pretty cool once you get into it!`,
        ` You're becoming a ${currentSubject} pro!`,
        ` ${currentSubject} won't know what hit it!`,
      ],
    };

    const mentions = subjectMentions[companionType];
    const shouldAddSubject = Math.random() > 0.5;

    if (shouldAddSubject) {
      const mention = mentions[Math.floor(Math.random() * mentions.length)];
      return randomMessage + mention;
    }
  }

  return randomMessage;
}

/**
 * Determine student state from feedback
 */
function determineStudentState(
  recentFeedback: FamilyCompanionProps['recentFeedback'],
  explicitState?: StudentState
): StudentState {
  if (explicitState) return explicitState;

  switch (recentFeedback) {
    case 'too_hard':
      return 'struggling';
    case 'perfect':
      return 'succeeding';
    case 'too_slow':
      return 'succeeding'; // They want more challenge
    default:
      return 'idle';
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FamilyCompanion({
  currentSubject,
  recentFeedback,
  studentState: explicitState,
  className = '',
  defaultCompanion = 'mother',
  onCompanionChange,
}: FamilyCompanionProps) {
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionType>(defaultCompanion);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSelector, setShowSelector] = useState(false);

  const companion = COMPANIONS[selectedCompanion];
  const studentState = determineStudentState(recentFeedback, explicitState);
  const message = getMotivationalMessage(selectedCompanion, studentState, currentSubject);

  const handleCompanionChange = (type: CompanionType) => {
    setSelectedCompanion(type);
    setShowSelector(false);
    onCompanionChange?.(type);
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Card className={`border-2 ${companion.borderColor} ${companion.bgColor} shadow-lg`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <motion.div
                    className={`flex-shrink-0 w-12 h-12 rounded-full ${companion.bgColor} border-2 ${companion.borderColor} flex items-center justify-center ${companion.color}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {companion.icon}
                  </motion.div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${companion.color}`}>
                          {companion.name}
                        </h4>
                        <button
                          onClick={() => setShowSelector(!showSelector)}
                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          aria-label="Change companion"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <button
                        onClick={() => setIsExpanded(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Minimize companion"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Companion Selector */}
                    <AnimatePresence>
                      {showSelector && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 flex gap-2"
                        >
                          {Object.values(COMPANIONS).map((comp) => (
                            <button
                              key={comp.type}
                              onClick={() => handleCompanionChange(comp.type)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                comp.type === selectedCompanion
                                  ? `${comp.bgColor} ${comp.color} border ${comp.borderColor}`
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <span className="w-4 h-4">{comp.icon}</span>
                              {comp.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Message Bubble */}
                    <motion.div
                      key={message}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                    >
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {message}
                      </p>
                    </motion.div>

                    {/* Personality Tag */}
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {companion.personality}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized State */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className={`w-14 h-14 rounded-full ${companion.bgColor} border-2 ${companion.borderColor} ${companion.color} flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Show companion"
          >
            {companion.icon}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// FLOATING VARIANT (for fixed positioning)
// ============================================================================

export function FloatingFamilyCompanion(props: FamilyCompanionProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      <FamilyCompanion {...props} />
    </div>
  );
}
