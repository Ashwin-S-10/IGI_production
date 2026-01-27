// Round 1 Questions and Expected Answers
// SECURITY: This file must NEVER be exposed to the frontend

export interface Round1Question {
  question_id: number;
  title: string;
  question_text: string;
  expected_answer: string; // NEVER sent to frontend
}

export const ROUND1_QUESTIONS: Round1Question[] = [
  {
    question_id: 1,
    title: "PROBLEM 1: The Escape Route Pattern",
    question_text: `Intelligence reports show The Ghost's movements follow a specific pattern across different safehouses.

Intercepted Data:
Safehouse Alpha: 3km
Safehouse Bravo: 7km
Safehouse Charlie: 11km
Safehouse Delta: 15km
Safehouse Echo: 19km

Your Mission: Where will the next three safehouses be located?`,
    expected_answer:
      "Safehouse Foxtrot: 23km, Safehouse Golf: 27km, Safehouse Hotel: 31km",
  },

  {
    question_id: 2,
    title: "PROBLEM 2: The Minefield Navigation",
    question_text: `You must identify safe zones to cross enemy territory.
Sector Range: Grid coordinates 10 through 50
Intelligence Brief:
"Not all paths are safe. Only the indivisible ones can be trusted."

Your Mission: Mark all safe zones for passage.`,
    expected_answer:
      "11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47",
  },

  {
    question_id: 3,
    title: "PROBLEM 3: The Supply Drop Routes",
    question_text: `Command needs to calculate all possible route arrangements for 5 operatives delivering critical supplies.

Team Size: 5 operatives

Intelligence Note: Each operative must take a unique position in the convoy.

Your Mission: Calculate the total number of possible route arrangements.`,
    expected_answer:
      "120 (5! = 5 × 4 × 3 × 2 × 1)",
  },

  {
    question_id: 4,
    title: "PROBLEM 4: The Infiltrator",
    question_text: `Surveillance Log:
2, 4, 5, 6, 4, 8, 9

Your Mission: Expose the infiltrator using the duplicate ID.`,
    expected_answer: "4",
  },

  {
    question_id: 5,
    title: "PROBLEM 5: The Power Calculation",
    question_text: `The Ghost's security system requires a specific energy signature to disable.

Energy Sources:
1, 2, 3, 4, 5

Intelligence Note: Total energy equals the sum of squares of all sources.

Your Mission: Calculate the total energy signature.`,
    expected_answer:
      "55 (1² + 2² + 3² + 4² + 5² = 55)",
  },

  {
    question_id: 6,
    title: "PROBLEM 6: The Threat Assessment",
    question_text: `Sensor Readings:
12, 15, 18, 14, 16, 20, 13

Your Mission: Calculate the average threat level across all zones.`,
    expected_answer:
      "15.43 (108 ÷ 7 = 15.428571…, rounded to 15.43)",
  },

  {
    question_id: 7,
    title: "PROBLEM 7: The Signal Frequency",
    question_text: `Signals detected:
3, 5, 3, 7, 3, 9, 5, 3

Target Signal: 3

Your Mission: How many times does the target signal appear?`,
    expected_answer: "4",
  },

  {
    question_id: 8,
    title: "PROBLEM 8: The Coordinate Decoder",
    question_text: `Encrypted Location Code:
1101

Your Mission: Decode the location coordinates into readable format.`,
    expected_answer: "13 (binary 1101 = decimal 13)",
  },

  {
    question_id: 9,
    title: "PROBLEM 9: The Vault Lock Sequence",
    question_text: `Known Sequence:
0, 1, 1, 2, 3, 5, 8, ?, ?

Your Mission: Calculate the codes for the next two chambers.`,
    expected_answer: "13, 21",
  },

  {
    question_id: 10,
    title: "PROBLEM 10: The Insertion Point",
    question_text: `Sorted Coordinates:
[1, 3, 5, 6]

New Safehouse Coordinate:
5

Your Mission: Determine the index position where the new coordinate should be inserted.`,
    expected_answer:
      "Index 2 (position where 5 exists or should be inserted)",
  },
];
