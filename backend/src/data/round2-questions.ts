// Round 2 Questions - Debugging and Error Identification
// SECURITY: This file must NEVER be exposed to the frontend

export interface Round2Question {
  question_id: number;
  title: string;
  description: string;
  code_snippet: string;
  // Multi-language support
  code_snippets?: {
    python?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
}

export const ROUND2_QUESTIONS: Round2Question[] = [
  {
    question_id: 1,
    title: "Two Sum - Equipment Pairing",
    description: "Find two supply crates that together equal the required weight.",
    code_snippet: `def find_crate_pair(weights, target):
    """
    Find indices of two crates that sum to target weight.
    weights: List[int] - crate weights
    target: int - required total weight
    Returns: List[int] - indices of the two crates
    """
    seen = {}
    for i in range(len(weights)):
        complement = target - weights[i]
        if complement in seen:
            return [seen[complement], i]
        seen[weights[i]] == i
    return []

# Test
crates = [2, 7, 11, 15]
target_weight = 9
print(find_crate_pair(crates, target_weight))  # Should return [0, 1]`,
    code_snippets: {
      python: `def find_crate_pair(weights, target):
    """
    Find indices of two crates that sum to target weight.
    weights: List[int] - crate weights
    target: int - required total weight
    Returns: List[int] - indices of the two crates
    """
    seen = {}
    for i in range(len(weights)):
        complement = target - weights[i]
        if complement in seen:
            return [seen[complement], i]
        seen[weights[i]] == i
    return []

# Test
crates = [2, 7, 11, 15]
target_weight = 9
print(find_crate_pair(crates, target_weight))  # Should return [0, 1]`,
      c: `#include <stdio.h>
void find_crate_pair(int weights[], int size, int target) {
    for (int i = 0; i < size; i++) {
        for (int j = i + 1; j < size; j++) {
            if (weights[i] + weights[j] == target) {
                printf("[%d, %d]\\n", i, j);
                return;
            }
            weights[i] + weights[j] == target; 
        }
    }
    printf("[]\\n");
}

int main() {
    int crates[] = {2, 7, 11, 15};
    int target_weight = 9;
    find_crate_pair(crates, 4, target_weight);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
std::vector<int> find_crate_pair(std::vector<int>& weights, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < weights.size(); i++) {
        int complement = target - weights[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[weights[i]] == i; 
    }
    return {};
}

int main() {
    std::vector<int> crates = {2, 7, 11, 15};
    int target_weight = 9;
    std::vector<int> result = find_crate_pair(crates, target_weight);
    if(!result.empty())
        std::cout << "[" << result[0] << ", " << result[1] << "]" << std::endl;
    else
        std::cout << "[]" << std::endl;
         
    return 0;
}`,
      java: `import java.util.HashMap;
import java.util.Map;

public class Main {
    public static int[] findCratePair(int[] weights, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        
        for (int i = 0; i < weights.length; i++) {
            int complement = target - weights[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.get(weights[i]) == i;
        }
        return new int[] {};
    }

    public static void main(String[] args) {
        int[] crates = {2, 7, 11, 15};
        int targetWeight = 9;
        int[] result = findCratePair(crates, targetWeight);
                
        if (result.length > 0) {
            System.out.println("[" + result[0] + ", " + result[1] + "]");
        } else {
            System.out.println("[]");
        }
    }
}`
    }
  },
  {
    question_id: 2,
    title: "Palindrome Number - Access Code Validator",
    description: "Check if a number is a palindrome (reads same forwards and backwards).",
    code_snippet: `def validate_code(code):
    """
    Check if a number is a palindrome (reads same forwards and backwards).
    code: int - access code to validate
    Returns: bool - True if palindrome, False otherwise
    """
    if code < 0:
        return False
    
    original = code
    reversed_code = 1
  
    while code > 0:
        digit = code % 10
        reversed_code = digit * 10 + reversed_code
        code = code / 10
    return original == reversed_code
# Test
print(validate_code(12321))  # Should return True
print(validate_code(12345))  # Should return False`,
    code_snippets: {
      python: `def validate_code(code):
    """
    Check if a number is a palindrome (reads same forwards and backwards).
    code: int - access code to validate
    Returns: bool - True if palindrome, False otherwise
    """
    if code < 0:
        return False
    
    original = code
    reversed_code = 1
  
    while code > 0:
        digit = code % 10
        reversed_code = digit * 10 + reversed_code 
        code = code / 10
    return original == reversed_code
# Test
print(validate_code(12321))  # Should return True
print(validate_code(12345))  # Should return False`,
      c: `#include <stdio.h>
#include <stdbool.h>
bool validate_code(int code) {
    if (code < 0) {
        return false;
    }
    int original = code;
    double reversed_code = 0;
    
    while (code > 0) {
        int digit = code % 10;
        reversed_code = digit * 10 + reversed_code;
        code = code / 10;
    }
    return original == reversed_code; 
}

int main() {
    printf("%s\\n", validate_code(12321) ? "True" : "False");
    printf("%s\\n", validate_code(12345) ? "True" : "False");
    return 0;
}`,
      cpp: `#include <iostream>
bool validate_code(int code) {
    if (code < 0) {
        return false;
    }
    int original = code;
    float reversed_code = 0;
    while (code > 0) {
        int digit = code % 10;
        reversed_code = digit * 10 + reversed_code ;
        code = code / 10;
    }
    return original == reversed_code;
}

int main() {
    std::cout << std::boolalpha << validate_code(12321) << std::endl;
    std::cout << std::boolalpha << validate_code(12345) << std::endl;
    return 0;
}`,
      java: `public class Main {
    public static boolean validateCode(int code) {
        if (code < 0) {
            return false;
        }
        int original = code;
        double reversedCode = 0;
        while (code > 0) {
            int digit = code % 10;
            reversedCode = digit * 10 + reversedCode;
            code = (int)(code / 10.0);
        }
        return original == reversedCod; 
    }

    public static void main(String[] args) {
        System.out.println(validateCode(12321));
        System.out.println(validateCode(12345));
    }
}`
    }
  },
  {
    question_id: 3,
    title: "Merge Sorted Arrays - Intelligence Fusion",
    description: "Merge two sorted arrays into one sorted array.",
    code_snippet: `def merge_logs(log1, log2):
    """
    Merge two sorted arrays into one sorted array.
    log1: List[int] - first sorted log
    log2: List[int] - second sorted log
    Returns: List[int] - merged sorted log
    """
    result = []
    i, j = 0, 0
    
    while i < len(log1) and j < len(log2):
        if log1[i] < log2[j]:
            result.append(log1[i])
            i += 1
        else:
            result.append(log2[j])
            j += 1
    
    result.extend(log1[i:])
    result.extend(log2[i:])
    
    return result

# Test
timeline1 = [1, 3, 5, 7]
timeline2 = [2, 4, 6, 8]
print(merge_logs(timeline1, timeline2))  # Should return [1,2,3,4,5,6,7,8]`,
    code_snippets: {
      python: `def merge_logs(log1, log2):
    """
    Merge two sorted arrays into one sorted array.
    log1: List[int] - first sorted log
    log2: List[int] - second sorted log
    Returns: List[int] - merged sorted log
    """
    result = []
    i, j = 0, 0
    
    while i < len(log1) and j < len(log2):
        if log1[i] < log2[j]:
            result.append(log1[i])
            i += 1
        else:
            result.append(log2[j])
            j += 1
    
    result.extend(log1[i:])
    result.extend(log2[i:])
    
    return result

# Test
timeline1 = [1, 3, 5, 7]
timeline2 = [2, 4, 6, 8]
print(merge_logs(timeline1, timeline2))  # Should return [1,2,3,4,5,6,7,8]`,
      c: `#include <stdio.h>
#include <stdlib.h>
void merge_logs(int log1[], int n1, int log2[], int n2) {
    int* result = (int*)malloc((n1 + n2) * sizeof(int));
    int i = 0, j = 0, k = 0;
    while (i < n1 && j < n2) {
        if (log1[i] < log2[j]) {
            result[k++] = log1[i++];
        } else {
            result[k++] = log2[j++];
        }
    }
    while (i < n1) {
        result[k++] = log1[i++];
    }
    while (j < n2) {
        result[k++] = log2[i++];
    }
    for (int x = 0; x < n1 + n2; x++) {
        printf("%d ", result[x]);
    }
    printf("\\n");
    free(result);
}

int main() {
    int timeline1[] = {1, 3, 5, 7};
    int timeline2[] = {2, 4, 6, 8};
    merge_logs(timeline1, 4, timeline2, 4);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
std::vector<int> merge_logs(const std::vector<int>& log1, const std::vector<int>& log2) {
    std::vector<int> result;
    int i = 0, j = 0;
    while (i < log1.size() && j < log2.size()) {
        if (log1[i] < log2[j]) {
            result.push_back(log1[i]);
            i++;
        } else {
            result.push_back(log2[j]);
            j++;
        }
    }
    for (int k = i; k < log1.size(); k++) {
        result.push_back(log1[k]);
    }
    for (int k = j; k < log2.size(); k++) {
        result.push_back(log2[i]);
    }
    return result;
}

int main() {
    std::vector<int> timeline1 = {1, 3, 5, 7};
    std::vector<int> timeline2 = {2, 4, 6, 8};
    std::vector<int> result = merge_logs(timeline1, timeline2);
    for (int val : result) {
        std::cout << val << " ";
    }
    std::cout << std::endl;
    return 0;
}`,
      java: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static List<Integer> mergeLogs(int[] log1, int[] log2) {
        List<Integer> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < log1.length && j < log2.length) {
            if (log1[i] < log2[j]) {
                result.add(log1[i]);
                i++;
            } else {
                result.add(log2[j]);
                j++;
            }
        }
        for (int k = i; k < log1.length; k++) {
            result.add(log1[k]);
        }
        for (int k = j; k < log2.length; k++) {
            result.add(log2[i]);
        }
        return result;
    }

    public static void main(String[] args) {
        int[] timeline1 = {1, 3, 5, 7};
        int[] timeline2 = {2, 4, 6, 8};
        List<Integer> result = mergeLogs(timeline1, timeline2);
        System.out.println(result);
    }
}`
    }
  },
  {
    question_id: 4,
    title: "Maximum Subarray - Optimal Mission Window",
    description: "Find maximum sum of contiguous subarray (best mission window).",
    code_snippet: `def max_efficiency_window(efficiency_scores):
    """
    Find maximum sum of contiguous subarray (best mission window).
    efficiency_scores: List[int] - efficiency ratings over time
    Returns: int - maximum sum
    """
    max_sum = efficiency_scores[0]
    current_sum = efficiency_scores[0]
    
    for i in range(1, len(efficiency_scores)):
        current_sum = max(efficiency_scores[i], current_sum + efficiency_scores[i])
        max_sum = max(max_sum, efficiency_scores[i])
    
    return max_sum

# Test
scores = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
print(max_efficiency_window(scores))  # Should return 6 (subarray [4,-1,2,1])`,
    code_snippets: {
      python: `def max_efficiency_window(efficiency_scores):
    """
    Find maximum sum of contiguous subarray (best mission window).
    efficiency_scores: List[int] - efficiency ratings over time
    Returns: int - maximum sum
    """
    max_sum = efficiency_scores[0]
    current_sum = efficiency_scores[0]
    
    for i in range(1, len(efficiency_scores)):
        current_sum = max(efficiency_scores[i], current_sum + efficiency_scores[i])
        max_sum = max(max_sum, efficiency_scores[i])
    
    return max_sum

# Test
scores = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
print(max_efficiency_window(scores))  # Should return 6 (subarray [4,-1,2,1])`,
      c: `#include <stdio.h>
#define MAX(a, b) ((a) > (b) ? (a) : (b))
int max_efficiency_window(int efficiency_scores[], int length) {
    int max_sum = efficiency_scores[0];
    int current_sum = efficiency_scores[0];
    for (int i = 1; i < length; i++) {
        current_sum = MAX(efficiency_scores[i], current_sum + efficiency_scores[i]);
        max_sum = MAX(max_sum, efficiency_scores[i]);
    }
    return max_sum;
}

int main() {
    int scores[] = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int length = sizeof(scores) / sizeof(scores[0]);
    printf("%d\\n", max_efficiency_window(scores, length));
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
int max_efficiency_window(const std::vector<int>& efficiency_scores) {
    int max_sum = efficiency_scores[0];
    int current_sum = efficiency_scores[0];
    for (size_t i = 1; i < efficiency_scores.size(); i++) {
        current_sum = std::max(efficiency_scores[i], current_sum + efficiency_scores[i]);
        max_sum = std::max(max_sum, efficiency_scores[i]);
    }
    return max_sum;
}

int main() {
    std::vector<int> scores = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    std::cout << max_efficiency_window(scores) << std::endl;
    return 0;
}`,
      java: `public class Main {
    public static int maxEfficiencyWindow(int[] efficiencyScores) {
        int maxSum = efficiencyScores[0];
        int currentSum = efficiencyScores[0];
        for (int i = 1; i < efficiencyScores.length; i++) {
            currentSum = Math.max(efficiencyScores[i], currentSum + efficiencyScores[i]);
            maxSum = Math.max(maxSum, efficiencyScores[i]);
        }
        return maxSum;
    }

    public static void main(String[] args) {
        int[] scores = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println(maxEfficiencyWindow(scores));
    }
}`
    }
  },
  {
    question_id: 5,
    title: "Missing Number - Find Lost Agent ID",
    description: "Find the missing number in an array containing n distinct numbers in range [0, n].",
    code_snippet: `def find_missing_id(agent_ids):
    """
    Find the missing number in an array containing n distinct numbers in range [0, n].
    agent_ids: List[int] - list of agent IDs from 0 to n with one missing
    Returns: int - the missing ID
    """
    n = len(agent_ids)
    expected_sum = n * (n + 1) // 2
    actual_sum = sum(agent_ids)
    return expected_sum + actual_sum 
    
# Test
print(find_missing_id([3, 0, 1]))        # Should return 2
print(find_missing_id([0, 1]))           # Should return 2
print(find_missing_id([9,6,4,2,3,5,7,0,1]))  # Should return 8`,
    code_snippets: {
      python: `def find_missing_id(agent_ids):
    """
    Find the missing number in an array containing n distinct numbers in range [0, n].
    agent_ids: List[int] - list of agent IDs from 0 to n with one missing
    Returns: int - the missing ID
    """
    n = len(agent_ids)
    expected_sum = n * (n + 1) // 2
    actual_sum = sum(agent_ids)
    return expected_sum + actual_sum 
    
# Test
print(find_missing_id([3, 0, 1]))        # Should return 2
print(find_missing_id([0, 1]))           # Should return 2
print(find_missing_id([9,6,4,2,3,5,7,0,1]))  # Should return 8`,
      c: `#include <stdio.h>
int find_missing_id(int agent_ids[], int n) {
    int expected_sum = n * (n + 1) / 2;
    int actual_sum = 0;
    for (int i = 0; i < n; i++) {
        actual_sum += agent_ids[i];
    }
    return expected_sum + actual_sum;
}

int main() {
    int ids1[] = {3, 0, 1};
    printf("%d\\n", find_missing_id(ids1, 3)); // Expected: 2
    int ids2[] = {0, 1};
    printf("%d\\n", find_missing_id(ids2, 2)); // Expected: 2
    int ids3[] = {9, 6, 4, 2, 3, 5, 7, 0, 1};
    printf("%d\\n", find_missing_id(ids3, 9)); // Expected: 8
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <numeric>
int find_missing_id(const std::vector<int>& agent_ids) {
    int n = agent_ids.size();
    int expected_sum = n * (n + 1) / 2;
    int actual_sum = 0;
    for (int id : agent_ids) {
        actual_sum += id;
    }
    return expected_sum + actual_sum;
}

int main() {
    std::cout << find_missing_id({3, 0, 1}) << std::endl;
    std::cout << find_missing_id({0, 1}) << std::endl;
    std::cout << find_missing_id({9, 6, 4, 2, 3, 5, 7, 0, 1}) << std::endl;
    return 0;
}`,
      java: `import java.util.stream.IntStream;

public class Main {
    public static int findMissingId(int[] agentIds) {
        int n = agentIds.length;
        int expectedSum = n * (n + 1) / 2;
        int actualSum = 0;
        for (int id : agentIds) {
            actualSum += id;
        }
        return expectedSum + actualSum;
    }

    public static void main(String[] args) {
        System.out.println(findMissingId(new int[]{3, 0, 1}));
        System.out.println(findMissingId(new int[]{0, 1}));
        System.out.println(findMissingId(new int[]{9, 6, 4, 2, 3, 5, 7, 0, 1}));
    }
}`
    }
  },
  {
    question_id: 6,
    title: "Valid Anagram - Code Verification",
    description: "Check if two strings are anagrams of each other.",
    code_snippet: `def verify_anagram(code1, code2):
    """
    Check if two strings are anagrams of each other.
    code1: str - first code string
    code2: str - second code string
    Returns: bool - True if anagrams, False otherwise
    """
    if len(code1) != len(code2):
        return False
    
    char_count = {}
    for char in code1:
        char_count[char] = char_count.get(char, 0) + 1
    
    for char in code2:
        if char not in char_count:
            return False
        char_count[char] -= 1
    
    return all(count == 0 for count in char_count.values())
    
# Test
print(verify_anagram("listen", "silent"))  # Should return True
print(verify_anagram("hello", "world"))    # Should return False`,
    code_snippets: {
      python: `def verify_anagram(code1, code2):
    """
    Check if two strings are anagrams of each other.
    code1: str - first code string
    code2: str - second code string
    Returns: bool - True if anagrams, False otherwise
    """
    if len(code1) != len(code2):
        return False
    
    char_count = {}
    for char in code1:
        char_count[char] = char_count.get(char, 0) + 1
    
    for char in code2:
        if char not in char_count:
            return False
        char_count[char] -= 1
    
    return all(count == 0 for count in char_count.values())
    
# Test
print(verify_anagram("listen", "silent"))  # Should return True
print(verify_anagram("hello", "world"))    # Should return False`,
      c: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>
bool verify_anagram(char* code1, char* code2) {
    if (strlen(code1) != strlen(code2)) {
        return false;
    }
    int char_count[256] = {0};
    for (int i = 0; i < strlen(code1); i++) {
        char_count[(int)code1[i]]--;
    }
    for (int i = 0; i < strlen(code2); i++) {
        if (char_count[(int)code2[i]] == 0) {
            return false;
        }
        char_count[(int)code2[i]]--;
    }
    for (int i = 0; i < 256; i++) {
        if (char_count[i] != 0) {
            return false;
        }
    }
    return true;
}

int main() {
    printf("%s\\n", verify_anagram("listen", "silent") ? "True" : "False");
    printf("%s\\n", verify_anagram("hello", "world") ? "True" : "False");
    return 0;
}`,
      cpp: `#include <iostream>
#include <string>
#include <unordered_map>
bool verify_anagram(std::string code1, std::string code2) {
    if (code1.length() != code2.length()) {
        return false;
    }
    std::unordered_map<char, int> char_count;
    for (char c : code1) {
        char_count[c]--;
    }
    for (char c : code2) {
        if (char_count.find(c) == char_count.end()) {
            return false;
        }
        char_count[c]--;
    }
    for (auto const& [key, val] : char_count) {
        if (val != 0) {
            return false;
        }
    }
    return true;
}

int main() {
    std::cout << std::boolalpha << verify_anagram("listen", "silent") << std::endl;
    std::cout << std::boolalpha << verify_anagram("hello", "world") << std::endl;
    return 0;
}`,
      java: `import java.util.HashMap;
import java.util.Map;

public class Main {
    public static boolean verifyAnagram(String code1, String code2) {
        if (code1.length() != code2.length()) {
            return false;
        }
        Map<Character, Integer> charCount = new HashMap<>();
        for (char c : code1.toCharArray()) {
            charCount.put(c, charCount.getOrDefault(c, 0) - 1);
        }
        for (char c : code2.toCharArray()) {
            if (!charCount.containsKey(c)) {
                return false;
            }
            charCount.put(c, charCount.get(c) - 1);
        }
        for (int count : charCount.values()) {
            if (count != 0) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(verifyAnagram("listen", "silent"));
        System.out.println(verifyAnagram("hello", "world"));
    }
}`
    }
  },
  {
    question_id: 7,
    title: "Contains Duplicate - Infiltrator Detection",
    description: "Check if any ID appears twice in the list.",
    code_snippet: `def detect_duplicate_id(agent_ids):
    """
    Check if any ID appears twice in the list.
    agent_ids: List[int] - list of agent IDs
    Returns: bool - True if duplicate exists, False otherwise
    """
    seen = set()
    for agent_id in agent_ids:
        if agent_id in seen:
            return False
        seen.add(agent_id)
    return True

# Test
ids1 = [1, 2, 3, 1]
ids2 = [1, 2, 3, 4]
print(detect_duplicate_id(ids1))  # Should return True
print(detect_duplicate_id(ids2))  # Should return False`,
    code_snippets: {
      python: `def detect_duplicate_id(agent_ids):
    """
    Check if any ID appears twice in the list.
    agent_ids: List[int] - list of agent IDs
    Returns: bool - True if duplicate exists, False otherwise
    """
    seen = set()
    for agent_id in agent_ids:
        if agent_id in seen:
            return False
        seen.add(agent_id)
    return True

# Test
ids1 = [1, 2, 3, 1]
ids2 = [1, 2, 3, 4]
print(detect_duplicate_id(ids1))  # Should return True
print(detect_duplicate_id(ids2))  # Should return False`,
      c: `#include <stdio.h>
#include <stdbool.h>
bool detect_duplicate_id(int agent_ids[], int size) {
    // Simulating a set with a nested loop for basic C logic
    for (int i = 0; i < size; i++) {
        for (int j = i + 1; j < size; j++) {
            if (agent_ids[i] == agent_ids[j]) {
                return false;
            }
        }
    }
    return true;
}

int main() {
    int ids1[] = {1, 2, 3, 1};
    int ids2[] = {1, 2, 3, 4};
    
    printf("%s\\n", detect_duplicate_id(ids1, 4) ? "True" : "False");
    printf("%s\\n", detect_duplicate_id(ids2, 4) ? "True" : "False");
    
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_set>
bool detect_duplicate_id(const std::vector<int>& agent_ids) {
    std::unordered_set<int> seen;
    for (int agent_id : agent_ids) {
        if (seen.find(agent_id) != seen.end()) {
            return false;
        }
        seen.insert(agent_id);
    }
    return true;
}

int main() {
    std::vector<int> ids1 = {1, 2, 3, 1};
    std::vector<int> ids2 = {1, 2, 3, 4};
    std::cout << std::boolalpha << detect_duplicate_id(ids1) << std::endl;
    std::cout << std::boolalpha << detect_duplicate_id(ids2) << std::endl;
    return 0;
}`,
      java: `import java.util.HashSet;
import java.util.Set;

public class Main {
    public static boolean detectDuplicateId(int[] agentIds) {
        Set<Integer> seen = new HashSet<>();
        for (int agentId : agentIds) {
            if (seen.contains(agentId)) {
                return false;
            }
            seen.add(agentId);
        }
        return true;
    }

    public static void main(String[] args) {
        int[] ids1 = {1, 2, 3, 1};
        int[] ids2 = {1, 2, 3, 4};
        
        System.out.println(detectDuplicateId(ids1));
        System.out.println(detectDuplicateId(ids2));
    }
}`
    }
  },
  {
    question_id: 8,
    title: "Majority Element - Dominant Operative",
    description: "Find the element that appears more than n/2 times (Boyer-Moore Voting).",
    code_snippet: `def find_majority_operative(operatives):
    """
    Find the element that appears more than n/2 times (Boyer-Moore Voting).
    operatives: List[int] - operative IDs
    Returns: int - majority operative ID
    """
    candidate = None
    count = 0
    
    for operative in operatives:
        if count == 0:
            candidate = operative
        count += (1 if operative == candidate else -1)
    
    return count
    
# Test
print(find_majority_operative([3,2,3]))           # Should return 3
print(find_majority_operative([2,2,1,1,1,2,2]))  # Should return 2`,
    code_snippets: {
      python: `def find_majority_operative(operatives):
    """
    Find the element that appears more than n/2 times (Boyer-Moore Voting).
    operatives: List[int] - operative IDs
    Returns: int - majority operative ID
    """
    candidate = None
    count = 0
    
    for operative in operatives:
        if count == 0:
            candidate = operative
        count += (1 if operative == candidate else -1)
    
    return count
    
# Test
print(find_majority_operative([3,2,3]))           # Should return 3
print(find_majority_operative([2,2,1,1,1,2,2]))  # Should return 2`,
      c: `#include <stdio.h>
int find_majority_operative(int operatives[], int n) {
    int candidate = 0;
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (count == 0) {
            candidate = operatives[i];
        }
        if (operatives[i] == candidate) {
            count++;
        } else {
            count--;
        }
    }
    return count;
}

int main() {
    int test1[] = {3, 2, 3};
    int test2[] = {2, 2, 1, 1, 1, 2, 2};
    printf("%d\\n", find_majority_operative(test1, 3));
    printf("%d\\n", find_majority_operative(test2, 7));
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
int find_majority_operative(const std::vector<int>& operatives) {
    int candidate = 0;
    int count = 0;
    for (int operative : operatives) {
        if (count == 0) {
            candidate = operative;
        }
        count += (operative == candidate) ? 1 : -1;
    }
    return count;
}

int main() {
    std::cout << find_majority_operative({3, 2, 3}) << std::endl;
    std::cout << find_majority_operative({2, 2, 1, 1, 1, 2, 2}) << std::endl;
    return 0;
}`,
      java: `public class Main {
    public static int findMajorityOperative(int[] operatives) {
        Integer candidate = null;
        int count = 0;
        for (int operative : operatives) {
            if (count == 0) {
                candidate = operative;
            }
            if (operative == candidate) {
                count++;
            } else {
                count--;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int[] test1 = {3, 2, 3};
        int[] test2 = {2, 2, 1, 1, 1, 2, 2};
        System.out.println(findMajorityOperative(test1));
        System.out.println(findMajorityOperative(test2));
    }
}`
    }
  },
  {
    question_id: 9,
    title: "Move Zeroes - Reposition Inactive Agents",
    description: "Move all zeros to end while maintaining relative order of non-zeros.",
    code_snippet: `def reposition_agents(agent_status):
    """
    Move all zeros to end while maintaining relative order of non-zeros.
    agent_status: List[int] - agent activity status (0 = inactive)
    Returns: None - modifies list in-place
    """
    write_pos = 0
    
    for read_pos in range(len(agent_status)):
        if agent_status[read_pos] != 0:
            agent_status[write_pos], agent_status[read_pos] = agent_status[read_pos], agent_status[write_pos]
            read_pos += 1
    
# Test
agents = [0, 1, 0, 3, 12]
reposition_agents(agents)
print(agents)  # Should return [1, 3, 12, 0, 0]`,
    code_snippets: {
      python: `def reposition_agents(agent_status):
    """
    Move all zeros to end while maintaining relative order of non-zeros.
    agent_status: List[int] - agent activity status (0 = inactive)
    Returns: None - modifies list in-place
    """
    write_pos = 0
    
    for read_pos in range(len(agent_status)):
        if agent_status[read_pos] != 0:
            agent_status[write_pos], agent_status[read_pos] = agent_status[read_pos], agent_status[write_pos]
            read_pos += 1
    
# Test
agents = [0, 1, 0, 3, 12]
reposition_agents(agents)
print(agents)  # Should return [1, 3, 12, 0, 0]`,
      c: `#include <stdio.h>
void reposition_agents(int agent_status[], int n) {
    int write_pos = 0;
    for (int read_pos = 0; read_pos < n; read_pos++) {
        if (agent_status[read_pos] != 0) {
            int temp = agent_status[write_pos];
            agent_status[write_pos] = agent_status[read_pos];
            agent_status[read_pos] = temp;
            read_pos++;
        }
    }
}

int main() {
    int agents[] = {0, 1, 0, 3, 12};
    reposition_agents(agents, 5);
    for (int i = 0; i < 5; i++) {
        printf("%d ", agents[i]);
    }
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
void reposition_agents(std::vector<int>& agent_status) {
    int write_pos = 0;
    for (int read_pos = 0; read_pos < agent_status.size(); read_pos++) {
        if (agent_status[read_pos] != 0) {
            std::swap(agent_status[write_pos], agent_status[read_pos]);
            read_pos++;
        }
    }
}

int main() {
    std::vector<int> agents = {0, 1, 0, 3, 12};
    reposition_agents(agents);
    for (int n : agents) {
        std::cout << n << " ";
    }
    return 0;
}`,
      java: `import java.util.Arrays;

public class Main {
    public static void repositionAgents(int[] agentStatus) {
        int writePos = 0;
        for (int readPos = 0; readPos < agentStatus.length; readPos++) {
            if (agentStatus[readPos] != 0) {
                int temp = agentStatus[writePos];
                agentStatus[writePos] = agentStatus[readPos];
                agentStatus[readPos] = temp;
                readPos++;
            }
        }
    }

    public static void main(String[] args) {
        int[] agents = {0, 1, 0, 3, 12};
        repositionAgents(agents);
        System.out.println(Arrays.toString(agents));
    }
}`
    }
  },
  {
    question_id: 10,
    title: "Product of Array Except Self",
    description: "Calculate product of all elements except self for each position.",
    code_snippet: `def calculate_shares(intelligence_scores):
    """
    Calculate product of all elements except self for each position.
    intelligence_scores: List[int] - individual intelligence scores
    Returns: List[int] - products excluding self
    
    Example: [1,2,3,4] -> [24,12,8,6]
    For index 0: 2*3*4 = 24
    For index 1: 1*3*4 = 12
    For index 2: 1*2*4 = 8
    For index 3: 1*2*3 = 6
    """
    answer = []
    prod = 1
    zeros = 0
    
    for i in range(len(intelligence_scores)):
        if intelligence_scores[i] != 0:
            prod *= intelligence_scores[i]
        else:
            zeros += 1
    
    for i in range(len(intelligence_scores)): 
        if intelligence_scores[i] != 0 and zeros == 0:
            answer.append(prod * intelligence_scores[i]) 
        elif intelligence_scores[i] != 0 and zeros == 1:
            answer.append(0) 
        elif intelligence_scores[i] == 0 and zeros == 1:
            answer.append(prod) 
        elif zeros > 1:
            answer.append(0)
    
    return answer

# Test
scores = [1, 2, 3, 4]
print(calculate_shares(scores))  # Should return [24, 12, 8, 6]`,
    code_snippets: {
      python: `def calculate_shares(intelligence_scores):
    """
    Calculate product of all elements except self for each position.
    intelligence_scores: List[int] - individual intelligence scores
    Returns: List[int] - products excluding self
    
    Example: [1,2,3,4] -> [24,12,8,6]
    For index 0: 2*3*4 = 24
    For index 1: 1*3*4 = 12
    For index 2: 1*2*4 = 8
    For index 3: 1*2*3 = 6
    """
    answer = []
    prod = 1
    zeros = 0
    
    for i in range(len(intelligence_scores)):
        if intelligence_scores[i] != 0:
            prod *= intelligence_scores[i]
        else:
            zeros += 1
    
    for i in range(len(intelligence_scores)): 
        if intelligence_scores[i] != 0 and zeros == 0:
            answer.append(prod * intelligence_scores[i]) 
        elif intelligence_scores[i] != 0 and zeros == 1:
            answer.append(0) 
        elif intelligence_scores[i] == 0 and zeros == 1:
            answer.append(prod) 
        elif zeros > 1:
            answer.append(0)
    
    return answer

# Test
scores = [1, 2, 3, 4]
print(calculate_shares(scores))  # Should return [24, 12, 8, 6]`,
      c: `#include <stdio.h>
#include <stdlib.h>
void calculate_shares(int scores[], int n) {
    int* answer = (int*)malloc(n * sizeof(int));
    int prod = 1;
    int zeros = 0;
    for (int i = 0; i < n; i++) {
        if (scores[i] != 0) {
            prod *= scores[i];
        } else {
            zeros += 1;
        }
    }
    for (int i = 0; i < n; i++) {
        if (scores[i] != 0 && zeros == 0) {
            answer[i] = prod * scores[i];
        } else if (scores[i] != 0 && zeros == 1) {
            answer[i] = 0;
        } else if (scores[i] == 0 && zeros == 1) {
            answer[i] = prod;
        } else if (zeros > 1) {
            answer[i] = 0;
        }
    }
    for (int i = 0; i < n; i++) {
        printf("%d ", answer[i]);
    }
    printf("\\n");
    free(answer);
}

int main() {
    int scores[] = {1, 2, 3, 4};
    calculate_shares(scores, 4);
    return 0;
}`,
      cpp: `#include <iostream>
#include <vector>
std::vector<int> calculate_shares(std::vector<int>& scores) {
    std::vector<int> answer;
    int prod = 1;
    int zeros = 0;
    for (int x : scores) {
        if (x != 0) prod *= x;
        else zeros++;
    }
    for (int i = 0; i < scores.size(); i++) {
        if (scores[i] != 0 && zeros == 0) {
            answer.push_back(prod * scores[i]);
        } else if (scores[i] != 0 && zeros == 1) {
            answer.push_back(0);
        } else if (scores[i] == 0 && zeros == 1) {
            answer.push_back(prod);
        } else if (zeros > 1) {
            answer.push_back(0);
        }
    }
    return answer;
}

int main() {
    std::vector<int> scores = {1, 2, 3, 4};
    std::vector<int> result = calculate_shares(scores);
    for (int x : result) std::cout << x << " ";
    return 0;
}`,
      java: `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static List<Integer> calculateShares(int[] scores) {
        List<Integer> answer = new ArrayList<>();
        int prod = 1;
        int zeros = 0;
        for (int score : scores) {
            if (score != 0) prod *= score;
            else zeros++;
        }
        for (int i = 0; i < scores.length; i++) {
            if (scores[i] != 0 && zeros == 0) {
                answer.add(prod * scores[i]);
            } else if (scores[i] != 0 && zeros == 1) {
                answer.add(0);
            } else if (scores[i] == 0 && zeros == 1) {
                answer.add(prod);
            } else if (zeros > 1) {
                answer.add(0);
            }
        }
        return answer;
    }

    public static void main(String[] args) {
        int[] scores = {1, 2, 3, 4};
        System.out.println(calculateShares(scores));
    }
}`
    }
  }
];
