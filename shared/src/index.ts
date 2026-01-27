export type RoundQuestion = {
  id: string;
  roundId: "round1" | "round2" | "round3";
  title: string;
  prompt: string;
  difficulty: "intro" | "standard" | "advanced";
  points: number;
  timeLimit: string;
  tags: string[];
  starterCode?: string;
  referenceNotes?: string;
};

const QUESTION_BANK: Record<string, RoundQuestion[]> = {
  round1: [
    {
      id: "r1-q1",
      roundId: "round1",
      title: "PROBLEM 1: The Escape Route Pattern",
      prompt:
        "Intelligence reports show The Ghost's movements follow a specific pattern across different safehouses.\n\n" +
        "Intercepted Data:\n" +
        "Safehouse Alpha: 3km\n" +
        "Safehouse Bravo: 7km\n" +
        "Safehouse Charlie: 11km\n" +
        "Safehouse Delta: 15km\n" +
        "Safehouse Echo: 19km\n\n" +
        "Your Mission: Where will the next three safehouses be located?",
      difficulty: "intro",
      points: 10,
      timeLimit: "5 min",
      tags: ["patterns", "arithmetic-sequence"],
    },

    {
      id: "r1-q2",
      roundId: "round1",
      title: "PROBLEM 2: The Minefield Navigation",
      prompt:
        "You must identify safe zones to cross enemy territory.\n\n" +
        "Sector Range: Grid coordinates 10 through 50\n\n" +
        "Intelligence Brief: Not all paths are safe. Only the indivisible ones can be trusted.\n\n" +
        "Your Mission: Mark all safe zones for passage.",
      difficulty: "standard",
      points: 10,
      timeLimit: "8 min",
      tags: ["primes", "number-theory"],
    },

    {
      id: "r1-q3",
      roundId: "round1",
      title: "PROBLEM 3: The Supply Drop Routes",
      prompt:
        "Command needs to calculate all possible route arrangements for 5 operatives delivering critical supplies.\n\n" +
        "Team Size: 5 operatives\n\n" +
        "Intelligence Note: Each operative must take a unique position in the convoy.\n\n" +
        "Your Mission: Calculate the total number of possible route arrangements.",
      difficulty: "intro",
      points: 10,
      timeLimit: "3 min",
      tags: ["math", "factorial", "permutations"],
    },

    {
      id: "r1-q4",
      roundId: "round1",
      title: "PROBLEM 4: The Infiltrator",
      prompt:
        "Your surveillance team has been tracking suspects. One ID appears twice in the system.\n\n" +
        "Surveillance Log:\n" +
        "2, 4, 5, 6, 4, 8, 9\n\n" +
        "Your Mission: Expose the infiltrator using the duplicate ID.",
      difficulty: "intro",
      points: 10,
      timeLimit: "3 min",
      tags: ["arrays", "duplicates"],
    },

    {
      id: "r1-q5",
      roundId: "round1",
      title: "PROBLEM 5: The Power Calculation",
      prompt:
        "The Ghost's security system requires a specific energy signature to disable.\n\n" +
        "Energy Sources:\n" +
        "1, 2, 3, 4, 5\n\n" +
        "Intelligence Note: Total energy equals the sum of squares of all sources.\n\n" +
        "Your Mission: Calculate the total energy signature.",
      difficulty: "standard",
      points: 10,
      timeLimit: "5 min",
      tags: ["math", "loops"],
    },

    {
      id: "r1-q6",
      roundId: "round1",
      title: "PROBLEM 6: The Threat Assessment",
      prompt:
        "Multiple sensor readings from different zones need to be analyzed.\n\n" +
        "Sensor Readings:\n" +
        "12, 15, 18, 14, 16, 20, 13\n\n" +
        "Your Mission: Calculate the average threat level across all zones.",
      difficulty: "intro",
      points: 10,
      timeLimit: "3 min",
      tags: ["math", "average"],
    },

    {
      id: "r1-q7",
      roundId: "round1",
      title: "PROBLEM 7: The Signal Frequency",
      prompt:
        "A suspicious signal keeps appearing in your communications log.\n\n" +
        "Signals detected:\n" +
        "3, 5, 3, 7, 3, 9, 5, 3\n\n" +
        "Target Signal: 3\n\n" +
        "Your Mission: Determine how many times the target signal appears.",
      difficulty: "intro",
      points: 10,
      timeLimit: "3 min",
      tags: ["arrays", "counting"],
    },

    {
      id: "r1-q8",
      roundId: "round1",
      title: "PROBLEM 8: The Coordinate Decoder",
      prompt:
        "Enemy coordinates have been intercepted in an unknown format.\n\n" +
        "Encrypted Location Code:\n" +
        "1101\n\n" +
        "Your Mission: Decode the location coordinates into a readable format.",
      difficulty: "standard",
      points: 10,
      timeLimit: "5 min",
      tags: ["binary", "number-systems"],
    },

    {
      id: "r1-q9",
      roundId: "round1",
      title: "PROBLEM 9: The Vault Lock Sequence",
      prompt:
        "The Ghost's vault uses a mathematical lock based on a known sequence.\n\n" +
        "Known Sequence:\n" +
        "0, 1, 1, 2, 3, 5, 8, ?, ?\n\n" +
        "Your Mission: Calculate the codes for the next two chambers.",
      difficulty: "standard",
      points: 10,
      timeLimit: "5 min",
      tags: ["sequences", "fibonacci"],
    },

    {
      id: "r1-q10",
      roundId: "round1",
      title: "PROBLEM 10: The Insertion Point",
      prompt:
        "The Ghost's database stores coordinates in sorted order.\n\n" +
        "Sorted Coordinates:\n" +
        "[1, 3, 5, 6]\n\n" +
        "New Safehouse Coordinate:\n" +
        "5\n\n" +
        "Your Mission: Determine the index position where the new coordinate should be inserted.",
      difficulty: "standard",
      points: 10,
      timeLimit: "5 min",
      tags: ["arrays", "binary-search"],
    },
  ],
  round2: [
    {
      id: "r2-q1",
      roundId: "round2",
      title: "Two Sum - Equipment Pairing",
      prompt:
        "Find two supply crates that together equal the required weight. Identify the bugs in the code.",
      difficulty: "standard",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "hash-map", "arrays"],
    },
    {
      id: "r2-q2",
      roundId: "round2",
      title: "Palindrome Number - Access Code Validator",
      prompt:
        "Check if a number is a palindrome (reads same forwards and backwards). Find the bugs.",
      difficulty: "standard",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "math", "palindrome"],
    },
    {
      id: "r2-q3",
      roundId: "round2",
      title: "Roman to Integer - Cipher Decoder",
      prompt:
        "Convert Roman numeral codes to integers. Identify and fix the bugs.",
      difficulty: "standard",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "strings", "conversion"],
    },
    {
      id: "r2-q4",
      roundId: "round2",
      title: "Valid Parentheses - Signal Validation",
      prompt:
        "Validate encrypted signal brackets. Find the bugs in the validation logic.",
      difficulty: "standard",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "stack", "strings"],
    },
    {
      id: "r2-q5",
      roundId: "round2",
      title: "Merge Two Sorted Lists - Intel Consolidation",
      prompt:
        "Merge two sorted intelligence lists. Identify the bugs in the merge logic.",
      difficulty: "standard",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "linked-list", "merge"],
    },
    {
      id: "r2-q6",
      roundId: "round2",
      title: "Maximum Subarray - Signal Strength",
      prompt:
        "Find the contiguous subarray with maximum sum. Debug the implementation.",
      difficulty: "advanced",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "dynamic-programming", "arrays"],
    },
    {
      id: "r2-q7",
      roundId: "round2",
      title: "Climbing Stairs - Infiltration Routes",
      prompt:
        "Count distinct ways to climb n steps. Find and fix the bugs.",
      difficulty: "standard",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "dynamic-programming", "fibonacci"],
    },
    {
      id: "r2-q8",
      roundId: "round2",
      title: "Binary Tree Inorder - Asset Inventory",
      prompt:
        "Perform inorder traversal of an asset tree. Debug the traversal code.",
      difficulty: "advanced",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "trees", "recursion"],
    },
    {
      id: "r2-q9",
      roundId: "round2",
      title: "Symmetric Tree - Security Check",
      prompt:
        "Check if a binary tree is symmetric. Find the bugs in the comparison logic.",
      difficulty: "advanced",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "trees", "recursion"],
    },
    {
      id: "r2-q10",
      roundId: "round2",
      title: "Single Number - Mole Detection",
      prompt:
        "Find the element that appears only once. Debug the detection algorithm.",
      difficulty: "standard",
      points: 10,
      timeLimit: "10 min",
      tags: ["debugging", "bit-manipulation", "arrays"],
    },
  ],
  round3: [
    {
  id: "r3-q1",
  roundId: "round3",
  title: "The Target Coordinates Range",
  prompt: `**Mission Context:**
Intelligence has pinpointed The Ghost's hideout within a specific coordinate range on the grid. Find exactly where his activity starts and ends in the sorted surveillance data.

**Problem:**
Given a sorted array and a target value, return the starting and ending index of the target. If not found, return [-1, -1].

**Examples:**

Input: nums = [5, 7, 7, 8, 8, 10], target = 8  
Output: [3, 4]

Input: nums = [5, 7, 7, 8, 8, 10], target = 6  
Output: [-1, -1]

Input: nums = [1, 1, 1, 1, 1], target = 1  
Output: [0, 4]

**Constraints:**
• 0 ≤ array length ≤ 10000  
• -10⁹ ≤ nums[i] ≤ 10⁹  
• Array is sorted in non-decreasing order`,
  difficulty: "standard",
  points: 50,
  timeLimit: "20 min",
  tags: ["hash-map", "string", "sorting", "algorithms"],
},

    {
      id: "r3-q2",
      roundId: "round3",
      title: "Container With Most Water",
      prompt:
        "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\n**Constraints:**\n• n == height.length\n• 2 <= n <= 105\n• 0 <= height[i] <= 104",
      difficulty: "advanced",
      points: 50,
      timeLimit: "30 min",
      tags: ["two-pointers", "array", "greedy", "algorithms"],
      referenceNotes: "/images/question_11.jpg",
    },
    {
      id: "r3-q3",
      roundId: "round3",
      title: "Longest Substring Without Repeating Characters",
      prompt:
        "Given a string `s`, find the length of the longest substring without repeating characters.\n\n**Example 1:**\nInput: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.\n\n**Example 2:**\nInput: s = \"bbbbb\"\nOutput: 1\nExplanation: The answer is \"b\", with the length of 1.\n\n**Example 3:**\nInput: s = \"pwwkew\"\nOutput: 3\nExplanation: The answer is \"wke\", with the length of 3.\n\n**Constraints:**\n• 0 <= s.length <= 5 * 104\n• s consists of English letters, digits, symbols and spaces.",
      difficulty: "advanced",
      points: 50,
      timeLimit: "30 min",
      tags: ["sliding-window", "hash-map", "string", "algorithms"],
    },

  ],
};

export function getRoundQuestions(roundId: string): RoundQuestion[] {
  return QUESTION_BANK[roundId] ? [...QUESTION_BANK[roundId]] : [];
}

export function getQuestionDetails(roundId: string, questionId: string): RoundQuestion | null {
  const questions = QUESTION_BANK[roundId];
  if (!questions) return null;
  return questions.find((question) => question.id === questionId) ?? null;
}

export const ALL_ROUND_IDS = Object.keys(QUESTION_BANK);
