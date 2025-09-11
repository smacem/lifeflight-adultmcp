/**
 * Centralized color management for user assignments
 */

// Expanded color palette for physicians - 16 distinct colors
export const PHYSICIAN_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200', 
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-lime-100 text-lime-800 border-lime-200'
];

// Store color assignments to ensure consistency
const colorAssignments = new Map<string, number>();
let nextColorIndex = 0;

/**
 * Get a unique color for a user based on their ID and role
 */
export const getUserColor = (userId: string, userRole: 'physician' | 'learner'): string => {
  if (userRole === 'learner') {
    return 'bg-secondary text-secondary-foreground'; // Keep learners as secondary (gray)
  }
  
  // Check if we already assigned a color to this physician
  if (colorAssignments.has(userId)) {
    const colorIndex = colorAssignments.get(userId)!;
    return PHYSICIAN_COLORS[colorIndex % PHYSICIAN_COLORS.length];
  }
  
  // Assign a new color
  const colorIndex = nextColorIndex % PHYSICIAN_COLORS.length;
  colorAssignments.set(userId, colorIndex);
  nextColorIndex++;
  
  return PHYSICIAN_COLORS[colorIndex];
};

/**
 * Reset color assignments (useful for testing or when user data changes significantly)
 */
export const resetColorAssignments = (): void => {
  colorAssignments.clear();
  nextColorIndex = 0;
};

/**
 * Get all assigned colors (useful for debugging)
 */
export const getColorAssignments = (): Map<string, number> => {
  return new Map(colorAssignments);
};