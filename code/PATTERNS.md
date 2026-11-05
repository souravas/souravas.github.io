# 🧩 Python Interview Pattern Library

Algorithm templates and patterns. For syntax lookups, see [CHEATSHEET.md](CHEATSHEET.md).

## 📋 Table of Contents

- [Choosing a Pattern](#choosing-a-pattern)
- [Sorting](#sorting)
- [Binary Search](#binary-search)
- [Two Pointers](#two-pointers)
- [Fast & Slow Pointers](#fast--slow-pointers)
- [Sliding Window](#sliding-window)
- [Prefix Sum](#prefix-sum)
- [Hashing](#hashing)
- [Monotonic Stack](#monotonic-stack)
- [Stack Parsing & Design](#stack-parsing--design)
- [Heap / Top-K](#heap--top-k)
- [Quickselect](#quickselect)
- [Intervals](#intervals)
- [Line Sweep](#line-sweep)
- [Divide & Conquer](#divide--conquer)
- [Greedy](#greedy)
- [Backtracking](#backtracking)
- [Dynamic Programming](#dynamic-programming)
- [Bit Manipulation](#bit-manipulation)
- [Math / Number Theory](#math--number-theory)
- [Linked Lists](#linked-lists)
- [Trees](#trees)
- [Binary Search Trees](#binary-search-trees)
- [Matrix](#matrix)
- [Graphs](#graphs)
- [Trie](#trie)
- [Union-Find](#union-find)
- [Segment Tree](#segment-tree)
- [LRU Cache](#lru-cache)

---

## Choosing a Pattern

### From the Constraints

`n` bounds the complexity you can afford, which usually names the technique before you have finished reading the statement. Budget roughly 10⁷ simple operations per second in Python; 10⁸ is the C++ figure.

| n | Affordable | Usually means |
| --- | --- | --- |
| ≤ 10 | O(n!) | permutations, brute-force ordering |
| ≤ 20 | O(2ⁿ) | subset enumeration, [bitmask DP](#bitmask-dp) |
| ≤ 100 | O(n³) | [interval DP](#interval-dp), [Floyd–Warshall](#floydwarshall--all-pairs-shortest-paths) |
| ≤ 1,000 | O(n²) | [dual-sequence DP](#dual-sequence-dp), pairwise scans |
| ≤ 10⁵ | O(n log n) | [sorting](#sorting), [heap](#heap--top-k), [binary search](#binary-search) |
| ≤ 10⁶ | O(n) | [two pointers](#two-pointers), [sliding window](#sliding-window), [prefix sum](#prefix-sum) |
| ≥ 10⁹ | O(log n) | [binary search on answer](#binary-search-on-answer), math |

A bound that looks *too small* is the loudest hint in the problem — `n ≤ 20` is practically an instruction to enumerate subsets.

### From the Wording

| The problem says | Reach for |
| --- | --- |
| "sorted array", "pair that sums to" | [Two Pointers](#two-pointers) |
| "minimum/maximum X such that…" | [Binary Search on Answer](#binary-search-on-answer) |
| "longest/shortest subarray or substring" | [Sliding Window](#sliding-window) |
| "range sum", asked repeatedly | [Prefix Sum](#prefix-sum) — [Segment Tree](#segment-tree) if it mutates |
| "next greater/smaller", "histogram" | [Monotonic Stack](#monotonic-stack) |
| "top k", "k closest", "median of a stream" | [Heap / Top-K](#heap--top-k), [Quickselect](#quickselect) |
| "overlapping", "merge", "meeting rooms" | [Intervals](#intervals), [Line Sweep](#line-sweep) |
| "all permutations/subsets/combinations" | [Backtracking](#permutations-subsets-and-combinations) |
| "how many ways", "min cost", "can I reach" | [Dynamic Programming](#dynamic-programming) |
| "shortest path" — unweighted | [BFS](#bfs--shortest-path-in-an-unweighted-graph) · weighted → [Dijkstra](#dijkstra--non-negative-weights) |
| "prerequisites", "ordering", "cycle" | [topological sort](#topological-sort--kahns-algorithm) |
| "connected", "groups", "merge accounts" | [Union-Find](#union-find) |
| "prefix", "autocomplete", "dictionary" | [Trie](#trie) |
| "cycle in a list", "find the duplicate" | [Fast & Slow Pointers](#fast--slow-pointers) |

If two of them fit, write the [DP](#dynamic-programming): a correct recursion you can memoise beats a [greedy](#greedy) you cannot justify.

---

## Sorting

Python's built-in sort is Timsort — O(n log n), stable, and almost always the right answer. The algorithmic decision is the **key**, not the sort. (For `sort` / `sorted` syntax see [CHEATSHEET.md → Lists](CHEATSHEET.md#lists).)

```python
from collections import Counter

# A tuple key is a priority order — negate a term to flip that one term's direction
def sort_by_two_keys(pairs):
    pairs.sort(key=lambda x: (x[0], -x[1]))   # x[0] ascending, ties by x[1] descending
    return pairs

# Top K Frequent Elements — Counter already does the sorting
def top_k_frequent(arr, k):
    return [item for item, _ in Counter(arr).most_common(k)]
```

### Custom Comparator with `cmp_to_key`

Use when ordering depends on a relationship between two items and can't be expressed as a single key function.

```python
from functools import cmp_to_key

# Largest Number — arrange digits so the concatenation is the largest possible.
# E.g. [3, 30, 34, 5, 9] → "9534330" (because "3" + "30" > "30" + "3", etc.)
def largest_number(nums):
    arr = [str(x) for x in nums]
    def compare(a, b):
        if a + b > b + a: return -1   # a should come first
        if a + b < b + a: return 1
        return 0
    arr.sort(key=cmp_to_key(compare))
    return ''.join(arr).lstrip('0') or '0'
```

### Merge Sort

You will almost never hand-roll a sort in an interview — but the **merge step** is a reusable primitive. Counting inversions, "count of smaller numbers after self", and the skyline problem are all a merge sort with extra bookkeeping in `merge`. See also [Divide & Conquer](#divide--conquer).

```python
def merge_sort(nums):
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    return merge(merge_sort(nums[:mid]), merge_sort(nums[mid:]))

def merge(left, right):
    merged = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:     # <= keeps the sort stable
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
    merged.extend(left[i:])         # exactly one of these two is non-empty
    merged.extend(right[j:])
    return merged
```

O(n log n) time, O(n) extra space, stable.

### The Quadratic Sorts

Worth being able to write, mostly as talking points about stability and best-case behaviour.

```python
def bubble_sort(nums):              # stable; O(n) best case if you track swaps
    for i in range(len(nums)):
        for j in range(len(nums) - 1 - i):
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]
    return nums

def selection_sort(nums):           # NOT stable; always O(n²), minimal writes
    for i in range(len(nums)):
        lo = min(range(i, len(nums)), key=nums.__getitem__)
        nums[i], nums[lo] = nums[lo], nums[i]
    return nums

def insertion_sort(nums):           # stable; O(n) on nearly-sorted input
    for i in range(1, len(nums)):
        cur, j = nums[i], i - 1
        while j >= 0 and nums[j] > cur:
            nums[j + 1] = nums[j]
            j -= 1
        nums[j + 1] = cur
    return nums
```

**When to reach for it:** any problem that says "sorted" or where order unlocks a two-pointer / greedy / binary-search approach.

---

## Binary Search

### The 2 Essential Patterns

- **Pattern 1: `while left <= right`** — exact target, or the best candidate tracked in `result`
- **Pattern 2: `while left < right`** — boundary where condition flips, no `result` needed

**Default to Pattern 1.** With a tracked `result`, one loop shape covers an exact match, a first or last occurrence, a boundary, and both the minimum and the maximum answer, and an absent answer simply leaves `result` at its initial value. Pattern 2 saves the variable, but it can never report "not found", and using it to find a maximum needs an upper midpoint.

Python ints never overflow, so the midpoint is plainly `(left + right) // 2`; `left + (right - left) // 2` is a habit carried over from C++ and Java.

### Pattern 1 — Classic Binary Search

```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```

**Characteristics:**

- Both pointers move past mid: `left = mid + 1`, `right = mid - 1`
- Loop continues while valid range exists; ends with `left > right`
- Track a `result` to get the best candidate rather than an exact match: [Pattern 1 with Tracking](#pattern-1-with-tracking--find-the-boundary)

**Common problems:** standard search, rotated sorted array, find largest X where condition holds, square root, TimeMap.

### Pattern 1 with Tracking — Find the Boundary

The workhorse. Ask a yes/no question of `mid`; on a yes, record `mid` as a candidate and keep searching the half that could hold a better one.

```python
def find_boundary(nums):                 # first index where condition(nums[i]) holds
    left, right = 0, len(nums) - 1
    result = -1                          # stays -1 when nothing qualifies
    while left <= right:
        mid = (left + right) // 2
        if condition(nums[mid]):
            result = mid                 # a candidate; an earlier one may still exist
            right = mid - 1
        else:
            left = mid + 1
    return result
```

**Characteristics:**

- Both pointers still move past `mid`, so every pass shrinks the range; `result` remembers the best `mid` seen
- "Not found" is unambiguous: `result` keeps its initial value
- For the **last** index where the condition holds, flip the moves: on a yes, set `result = mid` and `left = mid + 1`
- For an insertion position, start with `result = len(nums)` so that "after everything" is a valid answer

**Common problems:** first true in a boolean array, first element not smaller than a target, insertion position, find min in rotated sorted array, peak of a mountain array, and every [Binary Search on Answer](#binary-search-on-answer) problem.

### Find First / Last Occurrence — Pattern 1 with Tracking

```python
def find_first(arr, target):
    left, right = 0, len(arr) - 1
    result = -1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            result = mid
            right = mid - 1            # keep searching left
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return result

def find_last(arr, target):
    left, right = 0, len(arr) - 1
    result = -1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            result = mid
            left = mid + 1             # keep searching right
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return result
```

Or use `bisect.bisect_left` / `bisect.bisect_right` if you don't need to write it yourself.

### Search in a Rotated Sorted Array

The array as a whole is not sorted, but **one side of every split always is**. Compare `nums[mid]` to `nums[left]` to learn which side that is; a plain range check then says whether the target lies inside the sorted side, and if it doesn't, it must be in the other. Pattern 1 with one extra decision.

```python
def search_rotated(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:                  # left side is the sorted one
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:                                        # right side is the sorted one
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1
```

**Find the minimum** is a boundary search in disguise: every value from the rotation point onward is `<= nums[-1]` and every value before it is larger, so the minimum is the first index where `nums[i] <= nums[-1]`.

```python
def find_min_rotated(nums):
    left, right = 0, len(nums) - 1
    result = len(nums) - 1               # the last element always qualifies
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] <= nums[-1]:        # at or past the rotation point: a candidate
            result = mid
            right = mid - 1
        else:
            left = mid + 1               # before the rotation point
    return nums[result]
```

Compare against the last element, never the first: `nums[mid] >= nums[0]` holds everywhere in an array that was never rotated, so a left-hand test walks away from a minimum sitting at index 0. `nums[-1]` has no such blind spot.

### Peak of a Mountain Array

There is no target here — the predicate is the **shape**. `arr[mid] > arr[mid + 1]` means the descent has already begun, so the peak is `mid` or lies to its left; otherwise you are still climbing and it is strictly right. That makes the peak the first index where `arr[i] > arr[i + 1]`, a plain boundary search.

```python
def peak_index(arr):
    left, right = 0, len(arr) - 2        # stop one short so arr[mid + 1] exists
    result = len(arr) - 1                # no descent at all: the last index is the peak
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] > arr[mid + 1]:
            result = mid                 # descending: the peak is mid or to its left
            right = mid - 1
        else:
            left = mid + 1               # still climbing
    return result
```

The same comparison finds *a* local peak in a fully unsorted array (Find Peak Element): it always points uphill, and any uphill walk on a bounded array must stop somewhere.

### Binary Search on a 2D Matrix

When each row is sorted **and** every value in a row is smaller than the first value of the next, the matrix is one sorted array that merely happens to be stored in rows. Search it as one — the only work is mapping a flat index back to a cell.

```python
def search_matrix(matrix, target):
    rows, cols = len(matrix), len(matrix[0])
    left, right = 0, rows * cols - 1
    while left <= right:
        mid = (left + right) // 2
        value = matrix[mid // cols][mid % cols]      # flat index → (row, col)
        if value == target:
            return True
        if value < target:
            left = mid + 1
        else:
            right = mid - 1
    return False
```

O(log(rows · cols)). If the rows are individually sorted but *not* globally ordered, the flattening is invalid: binary-search the rows for the candidate row and then binary-search inside it, or start at the top-right corner and drop a row / drop a column each step in O(rows + cols).

### Binary Search on Answer

When the question is "find the minimum/maximum X such that condition(X) holds", binary-search over the answer space. The test must be monotonic, and the two directions differ only in which pointer moves after a feasible `mid`:

```python
# Minimum: the slowest eating speed that still finishes within h hours
def min_eating_speed(piles, h):
    def can_finish(k):
        return sum((p + k - 1) // k for p in piles) <= h     # ceil(p / k) in ints

    left, right = 1, max(piles)
    result = right
    while left <= right:
        mid = (left + right) // 2
        if can_finish(mid):
            result = mid
            right = mid - 1              # feasible: record it, then try smaller
        else:
            left = mid + 1
    return result

# Maximum: the largest x with x * x <= n, i.e. the integer square root
def int_sqrt(n):
    left, right = 0, n
    result = 0
    while left <= right:
        mid = (left + right) // 2
        if mid * mid <= n:
            result = mid
            left = mid + 1               # feasible: record it, then try larger
        else:
            right = mid - 1
    return result
```

Bound the range by the smallest and largest answers that could possibly be right, not by the input's indices.

### Pattern 2 — Find Boundary

The alternative to [tracking a result](#pattern-1-with-tracking--find-the-boundary): keep the candidate inside the range instead of in a variable, and stop when the range is down to one index.

```python
def first_true(nums):
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if condition(nums[mid]):
            right = mid          # mid might be the answer — keep it
        else:
            left = mid + 1       # mid is not the answer — skip it
    return left                  # left == right is the answer
```

**Characteristics:**

- `right = mid` (never `mid - 1`) and `left = mid + 1` (never `mid` — would infinite-loop)
- Loop ends when `left == right` — no separate result tracking
- It always returns an index, even when nothing satisfies the condition: searching `[1, 3, 5, 7]` for the first value `>= 9` returns 3, which is indistinguishable from a real hit. Either guarantee an answer exists in the range, or test `condition(nums[left])` before trusting it.
- Seeding `right = len(nums)` instead of `len(nums) - 1` gives the `bisect_left` convention, where a failed search returns `n` and is unambiguous.

**Searching for a maximum** mirrors every move, and the midpoint must round up. With `(left + right) // 2`, a two-element range gives `mid == left`, so `left = mid` never moves and the loop spins forever.

```python
def last_true(lo, hi):                   # largest x in [lo, hi] where condition(x) holds
    left, right = lo, hi
    while left < right:
        mid = (left + right + 1) // 2    # upper midpoint, so left = mid always moves
        if condition(mid):
            left = mid
        else:
            right = mid - 1
    return left
```

**When to reach for it:** an answer is guaranteed to exist, as with a mountain's peak or a rotated array's minimum, and you want a line less. Everywhere else, tracking is the safer default.

---

## Two Pointers

```python
# Two Sum in sorted array
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target: return [left, right]
        elif s < target: left += 1
        else: right -= 1
    return []

# Remove duplicates from sorted array (in-place)
def remove_duplicates(nums):
    if not nums: return 0
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1

# Palindrome check
def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]: return False
        left += 1
        right -= 1
    return True

# Three Sum — sort, then for each pivot use two pointers
def three_sum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]: continue   # skip dup pivot
        left, right = i + 1, len(nums) - 1
        while left < right:
            s = nums[i] + nums[left] + nums[right]
            if s == 0:
                result.append([nums[i], nums[left], nums[right]])
                while left < right and nums[left] == nums[left + 1]: left += 1
                while left < right and nums[right] == nums[right - 1]: right -= 1
                left += 1
                right -= 1
            elif s < 0:
                left += 1
            else:
                right -= 1
    return result

# Container with most water
def max_area(height):
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        best = max(best, min(height[left], height[right]) * (right - left))
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best

# Trapping Rain Water — O(n) time, O(1) space
# Water above i depends on min(max_left, max_right). Advance the smaller side:
# its max is the binding constraint, so we know how much water stacks above it.
def trap(height):
    left, right = 0, len(height) - 1
    left_max = right_max = 0
    total = 0
    while left < right:
        if height[left] < height[right]:
            left_max = max(left_max, height[left])
            total += left_max - height[left]
            left += 1
        else:
            right_max = max(right_max, height[right])
            total += right_max - height[right]
            right -= 1
    return total
```

### Two Pointers across Two Arrays

The other half of the family: instead of both pointers walking one array, each walks its own. Always advance the pointer with the smaller value — that is what keeps the two walks aligned. This is the merge step of [merge sort](#merge-sort), and the same skeleton solves intersection of sorted arrays, merging sorted lists, and "sum between shared checkpoints" problems.

```python
# Teleporter arrays — two sorted arrays share some values. Between shared values
# you may take either array's run, and at a shared value you may switch sides.
# Accumulate each side's running section sum; at every meeting point commit the
# better of the two and reset both.
def maximum_score(arr1, arr2, mod=10**9 + 7):
    i = j = 0
    sum1 = sum2 = 0
    total = 0

    while i < len(arr1) and j < len(arr2):
        if arr1[i] < arr2[j]:
            sum1 += arr1[i]; i += 1
        elif arr1[i] > arr2[j]:
            sum2 += arr2[j]; j += 1
        else:                                  # shared value — commit and switch
            total += max(sum1, sum2) + arr1[i]
            sum1 = sum2 = 0
            i += 1
            j += 1

    sum1 += sum(arr1[i:])                      # drain the tails
    sum2 += sum(arr2[j:])
    return (total + max(sum1, sum2)) % mod
```

---

## Fast & Slow Pointers

Floyd's tortoise-and-hare. Used whenever you need to detect a cycle, find the middle, or find a duplicate in a "function graph".

```python
# Detect cycle in linked list
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: return True
    return False

# Find start of cycle
def detect_cycle_start(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: break
    else:
        return None
    # Reset one pointer to head; both move one step at a time
    slow = head
    while slow != fast:
        slow = slow.next
        fast = fast.next
    return slow

# Find middle of linked list (returns 2nd middle when even length)
def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

# Find duplicate in array [1..n] (values as next-pointers)
def find_duplicate(nums):
    slow = fast = nums[0]
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast: break
    slow = nums[0]
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow
```

---

## Sliding Window

One rule governs the whole family — **which side of the validity test you shrink on**:

| Goal | Shrink while the window is | Record the answer |
| --- | --- | --- |
| **Longest** valid window | **invalid** | after the shrink loop, every step |
| **Shortest** valid window | **valid** | inside the shrink loop, before each move |

Everything else is bookkeeping: what "valid" means, and what state the window has to carry to decide it in O(1).

```python
# Fixed-size window — max sum of k consecutive
def max_sum_subarray(nums, k):
    window_sum = sum(nums[:k])
    best = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        best = max(best, window_sum)
    return best

# Variable-size window — longest substring without repeats
def longest_unique_substring(s):
    seen = set()
    left = best = 0
    for right, c in enumerate(s):
        while c in seen:
            seen.remove(s[left])
            left += 1
        seen.add(c)
        best = max(best, right - left + 1)
    return best

# Minimum window substring containing all chars of t
def min_window(s, t):
    from collections import Counter
    from math import inf
    need = Counter(t)
    missing = len(t)
    left = 0
    best_start, best_len = 0, inf

    for right, c in enumerate(s):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1

        if missing == 0:
            while need[s[left]] < 0:
                need[s[left]] += 1
                left += 1
            if right - left + 1 < best_len:
                best_start, best_len = left, right - left + 1
            need[s[left]] += 1
            missing += 1
            left += 1

    return "" if best_len == inf else s[best_start:best_start + best_len]

# Longest substring with at most k distinct characters
def longest_k_distinct(s, k):
    from collections import defaultdict
    count = defaultdict(int)
    left = best = 0
    for right, c in enumerate(s):
        count[c] += 1
        while len(count) > k:
            count[s[left]] -= 1
            if count[s[left]] == 0:
                del count[s[left]]
            left += 1
        best = max(best, right - left + 1)
    return best

# Longest repeating character replacement — at most k characters may be changed.
# The window is valid when (window length - count of the most common char) <= k,
# i.e. the characters we'd have to overwrite fit inside the budget.
def character_replacement(s, k):
    from collections import defaultdict
    count = defaultdict(int)
    left = best = 0
    for right in range(len(s)):
        count[s[right]] += 1
        while (right - left + 1) - max(count.values()) > k:
            count[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best

# Shrink-on-duplicate — shortest window containing a repeat.
# Inverts the usual goal: the window is INVALID once a duplicate appears,
# and the answer is recorded at the moment it becomes invalid.
def least_consecutive_cards_to_match(cards):
    seen = set()
    left = 0
    best = len(cards) + 1
    for right in range(len(cards)):
        while cards[right] in seen:
            best = min(best, right - left + 1)
            seen.remove(cards[left])
            left += 1
        seen.add(cards[right])
    return -1 if best > len(cards) else best
```

### Fixed Window with a Match Counter

When the window size is fixed and you need "is this window an anagram / permutation of t?", maintaining `max(count.values())` or comparing whole dicts each step is O(26) per move. Track a single `matches` counter instead and update it only for the two characters that change: O(1) per step.

```python
# Permutation in String — does s2 contain a permutation of s1?
def check_inclusion(s1, s2):
    if len(s1) > len(s2):
        return False

    need = [0] * 26
    have = [0] * 26
    for i in range(len(s1)):
        need[ord(s1[i]) - ord('a')] += 1
        have[ord(s2[i]) - ord('a')] += 1

    matches = sum(need[i] == have[i] for i in range(26))

    left = 0
    for right in range(len(s1), len(s2)):
        if matches == 26:
            return True

        i = ord(s2[right]) - ord('a')            # character entering
        have[i] += 1
        if have[i] == need[i]:
            matches += 1
        elif have[i] - 1 == need[i]:             # we just broke a match
            matches -= 1

        o = ord(s2[left]) - ord('a')             # character leaving
        have[o] -= 1
        if have[o] == need[o]:
            matches += 1
        elif have[o] + 1 == need[o]:
            matches -= 1
        left += 1

    return matches == 26
```

**Find All Anagrams in a String** is the same loop, appending `left` to a result list wherever `matches == 26` instead of returning early.

---

## Prefix Sum

Convert range-sum queries from O(n) to O(1) after an O(n) preprocess.

```python
# 1D prefix sum
def build_prefix(nums):
    prefix = [0] * (len(nums) + 1)
    for i, x in enumerate(nums):
        prefix[i + 1] = prefix[i] + x
    return prefix                 # prefix[r + 1] - prefix[l] == sum of [l, r] inclusive

# Subarray sum equals K — count subarrays with sum == k
def subarray_sum(nums, k):
    from collections import defaultdict
    count = 0
    prefix_count = defaultdict(int)
    prefix_count[0] = 1                # empty prefix
    running = 0
    for x in nums:
        running += x
        count += prefix_count[running - k]
        prefix_count[running] += 1
    return count

# 2D prefix sum — sum of any submatrix in O(1)
def build_2d_prefix(matrix):
    rows, cols = len(matrix), len(matrix[0])
    prefix = [[0] * (cols + 1) for _ in range(rows + 1)]
    for r in range(rows):
        for c in range(cols):
            prefix[r + 1][c + 1] = (matrix[r][c]
                                    + prefix[r][c + 1]
                                    + prefix[r + 1][c]
                                    - prefix[r][c])
    return prefix

# Sum of submatrix from (r1, c1) to (r2, c2) inclusive
def submatrix_sum(prefix, r1, c1, r2, c2):
    return (prefix[r2 + 1][c2 + 1]
            - prefix[r1][c2 + 1]
            - prefix[r2 + 1][c1]
            + prefix[r1][c1])
```

### Prefix Products — Product of Array Except Self

The same two-pass idea with `*` in place of `+`. Dividing the total product by `nums[i]` is one line but dies on a zero in the input; instead build the product of everything to the left, then sweep back multiplying in everything to the right. Folding the second pass into the output array keeps it O(1) extra space.

```python
def product_except_self(nums):
    n = len(nums)
    result = [1] * n

    prefix = 1
    for i in range(n):                 # result[i] = product of everything LEFT of i
        result[i] = prefix
        prefix *= nums[i]

    suffix = 1
    for i in range(n - 1, -1, -1):     # then multiply in everything RIGHT of i
        result[i] *= suffix
        suffix *= nums[i]

    return result
```

Any "combine every element except this one" question takes this shape whenever the operation is associative and has an identity — sum, product, min/max, gcd, xor.

---

## Hashing

A set or dict turns "have I seen this?" into O(1). The pattern worth internalising is not the lookup itself but **choosing a key that collapses the problem**.

```python
# Two Sum — key is the complement we still need
def two_sum(nums, target):
    seen = {}                                  # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i

# Group Anagrams — key is a canonical form of the word
def group_anagrams(strs):
    from collections import defaultdict
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))               # or a 26-length count tuple: O(n) per word
        groups[key].append(s)
    return list(groups.values())

# Contains Duplicate
def contains_duplicate(nums):
    return len(set(nums)) < len(nums)

# Valid Sudoku — one pass, three dicts of sets. The box key is the insight:
# integer-dividing both coordinates by 3 maps every cell to its 3x3 box.
def is_valid_sudoku(board):
    from collections import defaultdict
    rows, cols, boxes = defaultdict(set), defaultdict(set), defaultdict(set)
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == '.':
                continue
            if v in rows[r] or v in cols[c] or v in boxes[(r // 3, c // 3)]:
                return False
            rows[r].add(v)
            cols[c].add(v)
            boxes[(r // 3, c // 3)].add(v)
    return True
```

### Longest Consecutive Sequence

O(n) without sorting. Only start counting from a number that *begins* a run — `num - 1` not being present. Every element is then visited at most twice overall.

```python
def longest_consecutive(nums):
    seen = set(nums)
    best = 0
    for num in seen:
        if num - 1 in seen:
            continue                           # not the start of a run, skip
        length = 0
        while num + length in seen:
            length += 1
        best = max(best, length)
    return best
```

### Length-prefix Encoding

Serialising a list of strings into one string, when the strings may contain any character. A plain delimiter fails because the delimiter can appear in the data; a length prefix cannot be ambiguous.

```python
def encode(strs):
    return ''.join(f"{len(s)}#{s}" for s in strs)

def decode(s):
    out = []
    i = 0
    while i < len(s):
        j = i
        while s[j] != '#':                   # digits up to the first '#' are the length
            j += 1
        length = int(s[i:j])
        out.append(s[j + 1:j + 1 + length])
        i = j + 1 + length
    return out
```

---

## Monotonic Stack

A stack maintained in monotonic (increasing or decreasing) order. Perfect for "next greater / smaller element" style problems in O(n).

```python
# Next Greater Element — for each index, the next larger VALUE to its right (-1 if
# none). Store `i - j` instead, as daily_temperatures does, if you want the distance.
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []                          # stores indices, values decreasing
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            result[stack.pop()] = x
        stack.append(i)
    return result

# Daily Temperatures — wait days until warmer
def daily_temperatures(temps):
    result = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            result[j] = i - j
        stack.append(i)
    return result

# Next Greater Element II — the array is CIRCULAR, so index 0 can be answered by
# something that sits before it. Walk twice and wrap with i % n; pushing only on
# the first lap keeps every index on the stack exactly once.
def next_greater_circular(nums):
    n = len(nums)
    result = [-1] * n
    stack = []
    for i in range(2 * n):
        j = i % n
        while stack and nums[stack[-1]] < nums[j]:
            result[stack.pop()] = nums[j]
        if i < n:
            stack.append(j)
    return result

# Largest Rectangle in Histogram
def largest_rectangle(heights):
    stack = []                          # indices, heights increasing
    best = 0
    for i, h in enumerate(heights + [0]):     # sentinel flushes the stack
        while stack and heights[stack[-1]] > h:
            top = stack.pop()
            width = i if not stack else i - stack[-1] - 1
            best = max(best, heights[top] * width)
        stack.append(i)
    return best

# Sliding Window Maximum — monotonic deque
def max_sliding_window(nums, k):
    from collections import deque
    dq = deque()                        # indices, nums[dq] decreasing
    result = []
    for i, x in enumerate(nums):
        while dq and dq[0] <= i - k:    # drop out-of-window
            dq.popleft()
        while dq and nums[dq[-1]] < x:  # maintain decreasing
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result
```

---

## Stack Parsing & Design

Not every stack problem is monotonic. The other two families: **matching/parsing** (the stack holds context you must return to) and **augmented stacks** (a parallel stack maintains an invariant).

```python
# Valid Parentheses
def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack

# Evaluate Reverse Polish Notation
def eval_rpn(tokens):
    ops = {
        '+': lambda a, b: a + b,
        '-': lambda a, b: a - b,
        '*': lambda a, b: a * b,
        '/': lambda a, b: int(a / b),   # int() truncates toward zero, a // b floors
    }
    stack = []
    for token in tokens:
        if token in ops:
            right = stack.pop()
            left = stack.pop()           # order matters for - and /
            stack.append(ops[token](left, right))
        else:
            stack.append(int(token))
    return stack.pop()
```

### Min Stack — Constant-time `getMin`

Keep a parallel stack of "minimum as of this point". Push onto it only when the new value ties or beats the current min; `<=` rather than `<` is what makes duplicates pop correctly.

```python
class MinStack:
    def __init__(self):
        self.stack = []
        self.mins = []

    def push(self, val):
        self.stack.append(val)
        if not self.mins or val <= self.mins[-1]:
            self.mins.append(val)

    def pop(self):
        if self.stack.pop() == self.mins[-1]:
            self.mins.pop()

    def top(self):
        return self.stack[-1]

    def getMin(self):
        return self.mins[-1]
```

### Basic Calculator — `+`, `-`, and Nesting

No recursion needed. Carry a running `result` and a running `sign`; on `(` push both and reset, on `)` pop them and fold the sub-expression back in. Digits are consumed greedily so multi-digit numbers work.

```python
def basic_calculator(s):
    stack = []
    result = 0
    sign = 1
    i = 0
    while i < len(s):
        c = s[i]
        if c.isdigit():
            num = 0
            while i < len(s) and s[i].isdigit():
                num = num * 10 + int(s[i])
                i += 1
            result += sign * num
            continue                      # i already advanced past the number
        if c == '+':
            sign = 1
        elif c == '-':
            sign = -1
        elif c == '(':
            stack.append(result)
            stack.append(sign)
            result, sign = 0, 1           # start the sub-expression fresh
        elif c == ')':
            prev_sign = stack.pop()
            prev_result = stack.pop()
            result = prev_result + prev_sign * result
        i += 1
    return result
```

### Car Fleet

Process cars from the one closest to the target backwards. Each stack entry is a fleet's arrival time; if the car behind arrives no later than the fleet ahead, it catches up and merges — pop it. The stack height is the number of distinct fleets.

```python
def car_fleet(target, position, speed):
    stack = []
    for p, s in sorted(zip(position, speed), reverse=True):
        stack.append((target - p) / s)          # time for this car to reach the target
        if len(stack) >= 2 and stack[-1] <= stack[-2]:
            stack.pop()                         # caught the fleet ahead
    return len(stack)
```

---

## Heap / Top-K

Min-heap of size K is the canonical "top K" trick: O(n log k) and uses O(k) memory — beats both sorting (O(n log n)) and a full heap (O(n) memory).

```python
import heapq

# Top K largest — use a MIN-heap of size K (keep the K biggest seen)
def top_k_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)         # evict the smallest in the heap
    return heap                          # K largest (unsorted)

# Top K smallest — use a MAX-heap of size K (negate values)
def top_k_smallest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, -x)
        if len(heap) > k:
            heapq.heappop(heap)
    return [-x for x in heap]

# Built-ins — the same size-k heap internally, O(n log k), result returned sorted.
# Fine to use unless the interviewer wants the heap written out:
#   heapq.nlargest(k, nums)  /  heapq.nsmallest(k, nums)

# K Closest Points to Origin — max-heap of size K by distance
def k_closest(points, k):
    heap = []
    for x, y in points:
        d = -(x*x + y*y)                 # negate for max-heap
        if len(heap) < k:
            heapq.heappush(heap, (d, x, y))
        else:
            heapq.heappushpop(heap, (d, x, y))
    return [[x, y] for _, x, y in heap]

# Merge K Sorted Lists — heap holds the current head of each list
def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))   # i breaks ties
    dummy = tail = ListNode()
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = node
        tail = tail.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next

# Find Median from Data Stream — two heaps, balanced sizes
class MedianFinder:
    def __init__(self):
        self.lo = []      # max-heap (store negated)  — lower half
        self.hi = []      # min-heap                   — upper half

    def addNum(self, num):
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))   # funnel through lo→hi
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2

# Task Scheduler — greedy with max-heap of remaining counts
def least_interval(tasks, n):
    from collections import Counter, deque
    counts = Counter(tasks)
    heap = [-c for c in counts.values()]
    heapq.heapify(heap)
    cooldown = deque()                  # (-count, ready_time)
    time = 0
    while heap or cooldown:
        time += 1
        if heap:
            c = heapq.heappop(heap) + 1
            if c < 0:
                cooldown.append((c, time + n))
        if cooldown and cooldown[0][1] == time:
            heapq.heappush(heap, cooldown.popleft()[0])
    return time
```

**When to reach for it:** top-K, k-closest, k-th order statistic in a stream, merging k streams, sliding-window median, scheduling.

### Kth Largest in a Stream — the Heap *is* the State

A design-class variant: keep a min-heap trimmed to exactly `k` elements, so its root is permanently the kth largest.

```python
import heapq

class KthLargest:
    def __init__(self, k, nums):
        self.k = k
        self.heap = nums
        heapq.heapify(self.heap)
        while len(self.heap) > k:
            heapq.heappop(self.heap)

    def add(self, val):
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        return self.heap[0]
```

### Reorganize String — Most-frequent-first Placement

Place the most frequent character into every other slot (index 0, 2, 4, …), wrapping to index 1 when you run off the end. Impossible exactly when some character's count exceeds `(n + 1) // 2`, so check that first and bail.

```python
from collections import Counter
import heapq

def reorganize_string(s):
    n = len(s)
    counts = Counter(s)
    heap = [(-c, ch) for ch, c in counts.items()]       # negate for a max-heap
    heapq.heapify(heap)

    if -heap[0][0] > (n + 1) // 2:
        return ""

    result = [''] * n
    index = 0
    while heap:
        count, ch = heapq.heappop(heap)
        for _ in range(-count):
            result[index] = ch
            index += 2
            if index >= n:
                index = 1                                # wrap to the odd slots
    return ''.join(result)
```

### Ugly Numbers — Heap as an Ordered Generator

Pop the smallest, push its multiples, dedupe with a set. The generic shape of "generate values in increasing order from a rule".

```python
import heapq

def nth_ugly_number(n):
    heap = [1]
    seen = {1}
    for _ in range(n - 1):
        value = heapq.heappop(heap)
        for prime in (2, 3, 5):
            nxt = value * prime
            if nxt not in seen:
                seen.add(nxt)
                heapq.heappush(heap, nxt)
    return heap[0]
```

### Last Stone Weight

Straight max-heap simulation — negate on the way in, negate on the way out.

```python
import heapq

def last_stone_weight(stones):
    heap = [-s for s in stones]
    heapq.heapify(heap)
    while len(heap) > 1:
        first = -heapq.heappop(heap)
        second = -heapq.heappop(heap)
        if first != second:
            heapq.heappush(heap, -(first - second))
    return -heap[0] if heap else 0
```

---

## Quickselect

Find the kth order statistic in **O(n) average** without sorting. Same partition step as quicksort, but recurse into one side only.

```python
import random

def quickselect(arr, k):                    # kth smallest, 1-indexed; mutates arr
    target = k - 1
    lo, hi = 0, len(arr) - 1
    while True:
        pivot = arr[random.randint(lo, hi)]  # random pivot: sorted input stays O(n)
        # Three-way partition: [lo, lt) < pivot, [lt, gt] == pivot, (gt, hi] > pivot.
        # The == block is what keeps duplicates linear — a two-way split leaves
        # every equal value on one side, so all-equal input goes O(n²).
        lt, i, gt = lo, lo, hi
        while i <= gt:
            if arr[i] < pivot:
                arr[lt], arr[i] = arr[i], arr[lt]
                lt += 1
                i += 1
            elif arr[i] > pivot:
                arr[i], arr[gt] = arr[gt], arr[i]
                gt -= 1                      # i stays: the value swapped in is unseen
            else:
                i += 1
        if target < lt:
            hi = lt - 1
        elif target > gt:
            lo = gt + 1
        else:
            return pivot                     # target lands inside the == block

# Kth Largest Element — call quickselect with k = len(arr) - k + 1
def find_kth_largest(nums, k):
    return quickselect(nums, len(nums) - k + 1)
```

**When to reach for it:** "kth largest/smallest" when an in-place O(n) average solution beats the O(n log k) heap. Unlucky pivots can still cost O(n²) — vanishingly rare with a random pivot, but use the heap if you need a guarantee.

---

## Intervals

Almost always: **sort by start**, then sweep.

```python
from math import inf

# Merge overlapping intervals
def merge_intervals(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

# Insert interval into sorted, non-overlapping list
def insert_interval(intervals, new):
    result = []
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < new[0]:
        result.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= new[1]:
        new = [min(new[0], intervals[i][0]), max(new[1], intervals[i][1])]
        i += 1
    result.append(new)
    while i < n:
        result.append(intervals[i]); i += 1
    return result

# Meeting Rooms II — minimum rooms needed
def min_meeting_rooms(intervals):
    import heapq
    intervals.sort(key=lambda x: x[0])
    heap = []                                # end times of ongoing meetings
    for start, end in intervals:
        if heap and heap[0] <= start:
            heapq.heappop(heap)              # reuse a room
        heapq.heappush(heap, end)
    return len(heap)

# Meeting Rooms I — can one person attend everything?
def can_attend_meetings(intervals):
    intervals.sort()
    return all(a[1] <= b[0] for a, b in zip(intervals, intervals[1:]))

# Non-overlapping intervals — minimum removals (greedy by end time)
def erase_overlap_intervals(intervals):
    intervals.sort(key=lambda x: x[1])
    count = 0
    end = -inf
    for s, e in intervals:
        if s >= end:
            end = e
        else:
            count += 1
    return count

# Minimum Arrows to Burst Balloons — same greedy, counting kept groups
# instead of removed ones. Sort by end, shoot at the end of the first
# balloon still unburst; that arrow clears everything overlapping it.
def find_min_arrows(points):
    points.sort(key=lambda x: x[1])
    arrows = 0
    limit = -inf
    for start, end in points:
        if start > limit:
            arrows += 1
            limit = end
    return arrows
```

### Partition Labels

Intervals you have to *derive* first. Each character's last occurrence defines an interval; scan left to right extending the current partition's end to the furthest last-occurrence seen. When the scan index reaches that end, nothing inside the partition appears later — cut.

```python
def partition_labels(s):
    last = {ch: i for i, ch in enumerate(s)}
    parts = []
    start = end = 0
    for i, ch in enumerate(s):
        end = max(end, last[ch])
        if i == end:
            parts.append(end - start + 1)
            start = i + 1
    return parts
```

---

## Line Sweep

Sort the *endpoints* rather than the intervals, then move a vertical line across them carrying a running state. Where the interval greedies above answer "how many / which ones", a sweep answers "what is true at each x".

```python
# Minimum rooms via a delta sweep — the counting version of Meeting Rooms II.
# +1 at every start, -1 at every end; the answer is the running maximum.
def min_meeting_rooms_sweep(intervals):
    events = []
    for start, end in intervals:
        events.append((start, 1))
        events.append((end, -1))
    events.sort()                    # ties: -1 sorts before +1, so a room freed
                                     # at time t is reusable at time t
    ongoing = best = 0
    for _, delta in events:
        ongoing += delta
        best = max(best, ongoing)
    return best
```

### Union Area of Rectangles — Sweep + Coordinate Compression

Cut the plane into vertical strips at every distinct x. Inside one strip the set of covering rectangles never changes, so the strip's area is `width × (covered y-length)`, and the covered y-length is a 1-D interval-merge over the y-spans of the rectangles crossing that strip.

```python
from math import inf

def rectangle_area_ii(rectangles):
    xs = sorted({x for r in rectangles for x in (r[0], r[2])})
    total = 0

    for xl, xr in zip(xs, xs[1:]):
        width = xr - xl                          # never 0: xs holds distinct values
        spans = sorted(
            (y1, y2)
            for x1, y1, x2, y2 in rectangles
            if x1 <= xl and x2 >= xr and y1 < y2     # rectangle spans this strip
        )
        covered = 0
        cur_end = -inf
        for y1, y2 in spans:
            y1 = max(y1, cur_end)                  # clip against what's already counted
            if y2 > y1:
                covered += y2 - y1
                cur_end = y2
        total += width * covered

    return total
```

O(n² log n) as written. Replacing the per-strip merge with a segment tree over compressed y-coordinates brings it to O(n log n).

---

## Divide & Conquer

Split, solve both halves, then do the real work in the **combine** step. If a problem asks for a count of cross-pairs (inversions, smaller-elements-to-the-right), the merge step is where those pairs become countable in O(n) instead of O(n²).

### Count of Smaller Numbers After Self

Merge sort on `(original_index, value)` pairs. When a left element is emitted, exactly `r` right-half elements have already been emitted — and every one of them was strictly smaller. Ties go left (`<=`) so that equal values are not counted as smaller.

```python
def count_smaller(nums):
    counts = [0] * len(nums)

    def sort(pairs):
        if len(pairs) <= 1:
            return pairs
        mid = len(pairs) // 2
        left, right = sort(pairs[:mid]), sort(pairs[mid:])

        merged = []
        l = r = 0
        while l < len(left) and r < len(right):
            if left[l][1] <= right[r][1]:
                counts[left[l][0]] += r          # r right-elements already emitted
                merged.append(left[l])
                l += 1
            else:
                merged.append(right[r])
                r += 1
        for i in range(l, len(left)):            # leftovers: all of right was smaller
            counts[left[i][0]] += r
        merged.extend(left[l:])
        merged.extend(right[r:])
        return merged

    sort(list(enumerate(nums)))
    return counts
```

Counting **inversions** is the same code with a single scalar accumulator instead of the per-index array.

### The Skyline Problem

Each building is trivially its own skyline; merging two skylines is a two-pointer walk that tracks the current height contributed by *each* side and emits `max(h1, h2)` whenever either changes. Suppressing repeated heights on emit is what keeps the output canonical.

```python
def get_skyline(buildings):
    if not buildings:
        return []
    return _solve(buildings, 0, len(buildings) - 1)

def _solve(bs, lo, hi):
    if lo == hi:
        left, right, height = bs[lo]
        return [[left, height], [right, 0]]
    mid = (lo + hi) // 2
    return _merge(_solve(bs, lo, mid), _solve(bs, mid + 1, hi))

def _merge(A, B):
    out = []
    i = j = 0
    h1 = h2 = 0                          # current height from each side

    def push(x, h):
        if not out or out[-1][1] != h:   # skip no-op height changes
            out.append([x, h])

    while i < len(A) and j < len(B):
        if A[i][0] < B[j][0]:
            x, h1 = A[i]; i += 1
        elif A[i][0] > B[j][0]:
            x, h2 = B[j]; j += 1
        else:                            # same x: consume both before emitting
            x, h1 = A[i]
            h2 = B[j][1]
            i += 1
            j += 1
        push(x, max(h1, h2))

    for x, h in A[i:]:                   # the exhausted side contributes 0 from here,
        push(x, h)                       # and max(0, h) == h
    for x, h in B[j:]:
        push(x, h)

    return out
```

O(n log n). The alternative formulation is a line sweep with a max-heap of active heights.

---

## Greedy

Make the locally optimal choice at each step. Only works when the problem has the greedy-choice property — usually you need a sorting key or a clear invariant.

```python
# The shape almost every greedy takes
def greedy(items):
    items.sort(key=greedy_key)       # deadline, end time, size, value/weight ratio, ...
    state = initial_state()
    result = 0
    for item in items:
        if is_feasible(item, state):    # take it only if the local choice stays valid
            result += take(item, state)
    return result
```

Picking the sort key *is* the problem. Correctness rests on an exchange argument — "swapping any optimal solution's choice for mine is never worse" — not on the fact that it passed the samples. When you cannot justify one, the fallback is [DP](#dynamic-programming).

```python
from math import inf

# Coin change, greedy version — correct ONLY for canonical coin systems
# (e.g. 1/5/10/25). For arbitrary coins it fails: coins [1, 3, 4], amount 6
# gives 4+1+1 = 3 coins, but the optimum is 3+3 = 2. That case needs DP.
def make_change(coins, amount):
    coins.sort(reverse=True)
    count = 0
    for coin in coins:
        count += amount // coin
        amount %= coin
    return count if amount == 0 else -1

# Jump Game — can you reach the end?
def can_jump(nums):
    farthest = 0
    for i, x in enumerate(nums):
        if i > farthest: return False
        farthest = max(farthest, i + x)
    return True

# Jump Game II — minimum jumps to reach end
def jump(nums):
    jumps = current_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == current_end:
            jumps += 1
            current_end = farthest
    return jumps

# Gas Station — find starting index to complete circuit, or -1
def can_complete_circuit(gas, cost):
    if sum(gas) < sum(cost): return -1
    tank = start = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:
            start = i + 1
            tank = 0
    return start

# Best Time to Buy/Sell Stock I — single transaction
# Track the minimum price seen so far; best profit is price - min_so_far.
def max_profit(prices):
    min_price = inf
    best = 0
    for p in prices:
        min_price = min(min_price, p)
        best = max(best, p - min_price)
    return best

# Best Time to Buy/Sell Stock II — unlimited transactions
# Sum every positive day-to-day delta (equivalent to capturing every uptrend).
def max_profit_ii(prices):
    return sum(max(0, prices[i] - prices[i - 1]) for i in range(1, len(prices)))

# Activity selection (classic greedy) — see "Non-overlapping intervals" above
```

---

## Backtracking

```python
# Generic template
def backtrack(state):
    if is_goal(state):
        result.append(state[:])     # copy! state is mutated
        return
    for choice in get_choices(state):
        if is_valid(choice, state):
            make_choice(choice, state)
            backtrack(state)
            undo_choice(choice, state)
```

### Permutations, Subsets and Combinations

Permutations loop over every unused index; subsets and combinations loop from `start` onward, which is what stops the same set being built twice in a different order.

```python
# Permutations
def permutations(nums):
    result = []
    def bt(current, used):
        if len(current) == len(nums):
            result.append(current[:])
            return
        for i, x in enumerate(nums):
            if used[i]: continue
            used[i] = True
            current.append(x)
            bt(current, used)
            current.pop()
            used[i] = False
    bt([], [False] * len(nums))
    return result

# Subsets (power set)
def subsets(nums):
    result = []
    def bt(start, current):
        result.append(current[:])
        for i in range(start, len(nums)):
            current.append(nums[i])
            bt(i + 1, current)
            current.pop()
    bt(0, [])
    return result

# Combinations — choose k from n
def combine(n, k):
    result = []
    def bt(start, current):
        if len(current) == k:
            result.append(current[:])
            return
        for i in range(start, n + 1):
            current.append(i)
            bt(i + 1, current)
            current.pop()
    bt(1, [])
    return result

# Combination Sum (with repetition allowed)
def combination_sum(candidates, target):
    result = []
    candidates.sort()
    def bt(start, current, remaining):
        if remaining == 0:
            result.append(current[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remaining: break
            current.append(candidates[i])
            bt(i, current, remaining - candidates[i])    # i, not i+1 — reuse allowed
            current.pop()
    bt(0, [], target)
    return result
```

### Grid and Board Search — Word Search, N-Queens

```python
# Word Search in grid
def exist(board, word):
    rows, cols = len(board), len(board[0])
    def dfs(r, c, i):
        if i == len(word): return True
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or board[r][c] != word[i]):
            return False
        board[r][c] = '#'                    # mark visited
        found = (dfs(r+1, c, i+1) or dfs(r-1, c, i+1)
                 or dfs(r, c+1, i+1) or dfs(r, c-1, i+1))
        board[r][c] = word[i]                # restore
        return found
    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))

# N-Queens — use three sets for O(1) attack checks
def solve_n_queens(n):
    result = []
    cols, diag1, diag2 = set(), set(), set()   # diag1: r-c, diag2: r+c
    queens = []

    def bt(row):
        if row == n:
            board = ['.' * c + 'Q' + '.' * (n - c - 1) for c in queens]
            result.append(board)
            return
        for c in range(n):
            if c in cols or (row - c) in diag1 or (row + c) in diag2:
                continue
            cols.add(c); diag1.add(row - c); diag2.add(row + c)
            queens.append(c)
            bt(row + 1)
            queens.pop()
            cols.discard(c); diag1.discard(row - c); diag2.discard(row + c)

    bt(0)
    return result
```

### Pruning the Search — Parentheses, Palindrome Partitions

Refuse a partial state the moment it can no longer lead to a valid answer, instead of generating everything and filtering at the leaf.

```python
# Generate Parentheses — prune by counts instead of validating at the leaf.
# Open a bracket while any remain; close one only while it would stay balanced.
def generate_parentheses(n):
    result = []
    current = []
    def bt(opened, closed):
        if len(current) == 2 * n:
            result.append(''.join(current))
            return
        if opened < n:
            current.append('(')
            bt(opened + 1, closed)
            current.pop()
        if opened > closed:
            current.append(')')
            bt(opened, closed + 1)
            current.pop()
    bt(0, 0)
    return result

# Palindrome Partitioning — the choice at each step is where to cut next
def partition(s):
    result = []

    def is_palindrome(i, j):
        while i < j:
            if s[i] != s[j]:
                return False
            i += 1
            j -= 1
        return True

    def bt(start, current):
        if start >= len(s):
            result.append(current[:])
            return
        for end in range(start, len(s)):
            if is_palindrome(start, end):        # prune: only cut on a palindrome
                current.append(s[start:end + 1])
                bt(end + 1, current)
                current.pop()

    bt(0, [])
    return result
```

### Deduplication — Skipping Equal Siblings

When the input has duplicates and the output must not, sort first, then **skip a candidate that equals its predecessor at the same recursion depth**. The first branch already explored everything that branch could produce.

```python
# Subsets II / Combination Sum II shape
def subsets_with_dup(nums):
    nums.sort()
    result = []
    def bt(start, current):
        result.append(current[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue                         # same value, same level → same subtree
            current.append(nums[i])
            bt(i + 1, current)
            current.pop()
    bt(0, [])
    return result
```

The same skip keeps [Three Sum](#two-pointers) free of duplicate triplets without any recursion: skip a pivot equal to the one before it, and after recording a hit advance both pointers past their runs of equal values.

### When Backtracking Becomes DP

If the recursion returns a **count or an optimum** rather than enumerating every solution, states repeat and memoising collapses exponential work to polynomial. Same recursion, one decorator.

```python
from functools import cache

# Decode Ways — count decodings of a digit string ('1'..'26' → 'A'..'Z')
def decode_ways(digits):
    @cache
    def dfs(i):
        if i == len(digits):
            return 1                           # consumed everything: one valid decoding
        if digits[i] == '0':
            return 0                           # no letter starts with 0
        ways = dfs(i + 1)
        if 10 <= int(digits[i:i + 2]) <= 26:      # slicing past the end is safe
            ways += dfs(i + 2)
        return ways
    return dfs(0)
```

See [Dynamic Programming](#dynamic-programming) for the full treatment, and [Word Break](#word-break) for the same conversion applied to string segmentation.

---

## Dynamic Programming

**Families:** [linear / stairs](#linear-dp--the-stairs-family) · [partition](#partition-dp--cutting-a-sequence-into-blocks) · [grid](#grid-dp) · [dual-sequence](#dual-sequence-dp) · [knapsack](#01-knapsack) · [interval](#interval-dp) · [DAG](#dp-on-a-dag) · [tree](#tree-dp) · [bitmask](#bitmask-dp)

### Two Flavors

- **Top-down (memoization):** write the recurrence as a recursive function, cache results.
- **Bottom-up (tabulation):** fill a `dp` table iteratively from base cases.

Top-down is usually the faster route under interview pressure: write the brute-force recursion, confirm the base cases, add `@cache`. Convert to a table only if you need the space optimisation, the interviewer asks, or the recursion would run deeper than Python's default limit of 1000 frames (`sys.setrecursionlimit` is the quick fix).

### Recognising a DP Problem

1. It asks for a **max / min / count / "is it possible"** over a set of choices, not for the choices themselves.
2. The choice at each step **constrains** later steps (otherwise it is greedy).
3. Subproblems **repeat** — the same arguments come back down different branches.

Then the work is picking the state: the smallest tuple of values that determines the rest of the answer. Everything else follows from writing the recurrence honestly.

### Memoization — Cleanest with `@cache`

```python
from functools import cache

@cache                      # Python 3.9+; lru_cache(maxsize=None) is the older spelling
def fib(n):
    if n <= 1: return n
    return fib(n - 1) + fib(n - 2)

# AVOID the mutable-default-argument anti-pattern:
#   def fib(n, memo={}):  ← cache leaks across calls!

# Arguments must be hashable — pass indices, not lists.
# For grid states use two ints; for a set of chosen items use a bitmask or frozenset.
```

Define the cached helper **inside** the outer function so it closes over the input and the cache dies with the call:

```python
def solve(nums):
    @cache
    def dfs(i):
        ...
    return dfs(0)
```

### Tabulation

```python
def fib_tab(n):
    if n < 2: return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
```

### Kadane's Algorithm — Maximum Subarray

```python
def max_subarray(nums):
    best = current = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best
```

### Linear DP — the Stairs Family

One dimension, and `dp[i]` depends on a **fixed window** of earlier entries. Because the window is bounded, the array collapses to a couple of rolling variables — O(1) space.

```python
# Climbing Stairs — 1 or 2 steps at a time. Fibonacci in disguise.
def climb_stairs(n):
    prev2, prev1 = 1, 1
    for _ in range(2, n + 1):
        prev2, prev1 = prev1, prev1 + prev2
    return prev1

# Tribonacci — same shape, window of 3
def tribonacci(n):
    if n < 3:
        return 0 if n == 0 else 1
    a, b, c = 0, 1, 1
    for _ in range(3, n + 1):
        a, b, c = b, c, a + b + c
    return c

# Min Cost Climbing Stairs — pay when you LEAVE a step
def min_cost_climbing_stairs(cost):
    prev2 = prev1 = 0
    for i in range(2, len(cost) + 1):
        prev2, prev1 = prev1, min(prev1 + cost[i - 1], prev2 + cost[i - 2])
    return prev1
```

### House Robber — No Two Adjacent

```python
def rob(nums):
    prev2 = prev1 = 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1

# House Robber II — houses in a circle, so the first and last are adjacent.
# Run the linear version twice: once excluding the last house, once excluding the first.
def rob_circular(nums):
    if len(nums) == 1:
        return nums[0]
    return max(rob(nums[:-1]), rob(nums[1:]))
```

### Minimum Cost For Tickets

Non-constant transition: the window reaches back 1, 7 and 30 days rather than a fixed one or two slots, so index arithmetic replaces the rolling variables.

```python
from functools import cache

def mincost_tickets(days, costs):
    travel = set(days)
    last = days[-1]

    @cache
    def dfs(day):
        if day > last:
            return 0
        if day not in travel:
            return dfs(day + 1)              # free: skip to the next day
        return min(
            costs[0] + dfs(day + 1),
            costs[1] + dfs(day + 7),
            costs[2] + dfs(day + 30),
        )

    return dfs(days[0])
```

### Partition DP — Cutting a Sequence into Blocks

State is "the best answer for the suffix starting at `i`", and the choice is **where the current block ends**. The inner loop extends the block one element at a time, maintaining whatever the block score needs (here a running max) so each extension is O(1).

```python
from functools import cache

# Partition Array for Maximum Sum — every subarray of length <= k is replaced
# by its maximum, and we maximise the total.
def partition_array_for_maximum_sum(arr, k):
    n = len(arr)

    @cache
    def dfs(i):
        if i == n:
            return 0
        best = 0
        block_max = 0
        for j in range(i, min(i + k, n)):        # block is arr[i..j]
            block_max = max(block_max, arr[j])
            length = j - i + 1
            best = max(best, block_max * length + dfs(j + 1))
        return best

    return dfs(0)
```

O(n·k). [Word Break](#word-break) and [Palindrome Partitioning — Min Cuts](#palindrome-partitioning--min-cuts) are the same shape with a different validity test and objective.

### Grid DP

Two dimensions, and `dp[r][c]` depends on the neighbours you are allowed to arrive from — usually `(r-1, c)` and `(r, c-1)`. Base cases live on the edges.

```python
from functools import cache
from math import inf

# Unique Paths — count routes from top-left to bottom-right moving right/down
def unique_paths(m, n):
    dp = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            dp[c] += dp[c - 1]               # dp[c] is the row above, dp[c-1] the left
    return dp[n - 1]

# With obstacles — a blocked cell contributes zero routes
def unique_paths_with_obstacles(grid):
    n = len(grid[0])
    dp = [0] * n
    dp[0] = 1
    for row in grid:
        for c in range(n):
            if row[c] == 1:
                dp[c] = 0
            elif c > 0:
                dp[c] += dp[c - 1]
    return dp[-1]

# Minimum Path Sum
def min_path_sum(grid):
    rows, cols = len(grid), len(grid[0])

    @cache
    def dfs(r, c):
        if r == rows - 1 and c == cols - 1:
            return grid[r][c]
        if r >= rows or c >= cols:
            return inf
        return grid[r][c] + min(dfs(r + 1, c), dfs(r, c + 1))

    return dfs(0, 0)

# Triangle — minimum top-to-bottom path; row r+1 has one more entry than row r
def minimum_total(triangle):
    @cache
    def dfs(r, c):
        if r == len(triangle):
            return 0
        return triangle[r][c] + min(dfs(r + 1, c), dfs(r + 1, c + 1))
    return dfs(0, 0)

# Maximal Square — dp[r][c] = side of the largest all-ones square ENDING at (r, c).
# It is limited by the worst of its three neighbours, hence min(...) + 1.
# Cells are ints here; LeetCode passes '0'/'1' strings, so test == '0' there.
def maximal_square(matrix):
    @cache
    def dfs(r, c):
        if r < 0 or c < 0 or matrix[r][c] == 0:
            return 0
        return 1 + min(dfs(r - 1, c), dfs(r, c - 1), dfs(r - 1, c - 1))

    best = 0
    for r in range(len(matrix)):
        for c in range(len(matrix[0])):
            best = max(best, dfs(r, c))
    return best * best
```

**Dungeon Game — when you must solve it backwards.** The question is the *minimum starting health*, and health needed at a cell depends on what lies ahead, not behind. A forward scan cannot know it, so recurse from the destination: `need(r, c) = max(1, min(need ahead) - dungeon[r][c])`. The outer `max` enforces "never drop to 0 HP".

```python
from functools import cache
from math import inf

def calculate_minimum_hp(dungeon):
    last_row, last_col = len(dungeon) - 1, len(dungeon[0]) - 1

    @cache
    def dfs(r, c):
        if r > last_row or c > last_col:
            return inf
        if r == last_row and c == last_col:
            return max(1, 1 - dungeon[r][c])
        return max(1, min(dfs(r + 1, c), dfs(r, c + 1)) - dungeon[r][c])

    return dfs(0, 0)
```

### Coin Change — Minimum Coins to Make the Amount

```python
from math import inf

def coin_change(coins, amount):
    dp = [inf] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i:
                dp[i] = min(dp[i], dp[i - c] + 1)
    return dp[amount] if dp[amount] != inf else -1
```

### Longest Increasing Subsequence — the Tails Array

```python
def length_of_LIS(nums):
    import bisect
    tails = []
    for x in nums:
        i = bisect.bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)
```

### Dual-sequence DP

Two strings, state `(i, j)` = one index into each. Characters match → consume both and move diagonally; otherwise branch on which side to advance. Every problem below is that skeleton with a different objective.

Top-down, the recursion runs up to `len(a) + len(b)` frames deep, so two 500-character strings already pass Python's default limit of 1000: call `sys.setrecursionlimit` first, or tabulate.

| Problem | On match | On mismatch |
| --- | --- | --- |
| Longest Common Subsequence | `1 + dp(i+1, j+1)` | `max(dp(i+1, j), dp(i, j+1))` |
| Edit Distance | `dp(i+1, j+1)` | `1 + min(delete, insert, replace)` |
| Distinct Subsequences | `dp(i+1, j+1) + dp(i+1, j)` | `dp(i+1, j)` |
| Shortest Common Supersequence | take the char once | take the cheaper side |
| Minimum Delete Sum | `dp(i+1, j+1)` | `min(cost of dropping either char)` |

### Longest Common Subsequence

```python
from functools import cache

def lcs(text1, text2):
    @cache
    def dfs(i, j):
        if i == len(text1) or j == len(text2):
            return 0                         # one string is used up
        if text1[i] == text2[j]:
            return 1 + dfs(i + 1, j + 1)
        return max(dfs(i + 1, j), dfs(i, j + 1))
    return dfs(0, 0)
```

### Edit Distance — Levenshtein

```python
from functools import cache

def min_distance(word1, word2):
    @cache
    def dfs(i, j):
        if i == len(word1):
            return len(word2) - j            # insert whatever word2 has left
        if j == len(word2):
            return len(word1) - i            # delete whatever word1 has left
        if word1[i] == word2[j]:
            return dfs(i + 1, j + 1)
        return 1 + min(dfs(i + 1, j),        # delete word1[i]
                       dfs(i, j + 1),        # insert word2[j]
                       dfs(i + 1, j + 1))    # replace word1[i] with word2[j]
    return dfs(0, 0)
```

### Distinct Subsequences

Count how many times `t` appears as a subsequence of `s`. On a match you may *use* the character or *skip* it — both branches count, so they add rather than max.

```python
from functools import cache

def num_distinct(s, t):
    @cache
    def dfs(i, j):
        if j == len(t):
            return 1                     # matched all of t: one full subsequence
        if i == len(s):
            return 0                     # ran out of s with t unfinished
        count = dfs(i + 1, j)            # skip s[i]
        if s[i] == t[j]:
            count += dfs(i + 1, j + 1)   # or use it
        return count
    return dfs(0, 0)
```

### Minimum Delete Sum

Delete characters from both strings until they match, minimising the summed ASCII cost. Same skeleton, but the base case charges for the whole remaining tail instead of returning 0.

```python
from functools import cache

def minimum_delete_sum(s1, s2):
    @cache
    def dfs(i, j):
        if i == len(s1):
            return sum(map(ord, s2[j:]))
        if j == len(s2):
            return sum(map(ord, s1[i:]))
        if s1[i] == s2[j]:
            return dfs(i + 1, j + 1)
        return min(ord(s1[i]) + dfs(i + 1, j), ord(s2[j]) + dfs(i, j + 1))
    return dfs(0, 0)
```

### Shortest Common Supersequence — Returning the String, Not Its Length

When the answer is a reconstructed sequence, the recursion can return strings directly. It is clear but allocates heavily; the interview-grade version computes LCS lengths and walks the table backwards.

```python
from functools import cache

def shortest_common_supersequence(str1, str2):
    @cache
    def dfs(i, j):
        if i == len(str1):
            return str2[j:]
        if j == len(str2):
            return str1[i:]
        if str1[i] == str2[j]:
            return str1[i] + dfs(i + 1, j + 1)      # one copy covers both
        take1 = str1[i] + dfs(i + 1, j)
        take2 = str2[j] + dfs(i, j + 1)
        return take1 if len(take1) <= len(take2) else take2
    return dfs(0, 0)
```

### 0/1 Knapsack

```python
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(1, capacity + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(dp[i][w],
                               dp[i - 1][w - weights[i - 1]] + values[i - 1])
    return dp[n][capacity]
```

### Unbounded Knapsack — Coin Change II, Number of Ways

```python
def change(amount, coins):
    dp = [0] * (amount + 1)
    dp[0] = 1
    # looping over coins on the OUTSIDE counts combinations, not permutations
    for c in coins:
        for i in range(c, amount + 1):
            dp[i] += dp[i - c]
    return dp[amount]
```

### The Knapsack Loop-direction Rule

Collapsed to one dimension, the *direction* of the capacity loop is what distinguishes the variants — get this backwards and you silently solve the other problem.

```python
# 0/1 — each item once. Iterate capacity DOWNWARD so dp[j - w] is still
# the previous row (this item not yet used).
def knapsack_01(items, capacity):            # items: (weight, value)
    dp = [0] * (capacity + 1)
    for w, v in items:
        for j in range(capacity, w - 1, -1):
            dp[j] = max(dp[j], dp[j - w] + v)
    return dp[capacity]

# Unbounded — unlimited copies. Iterate capacity UPWARD so dp[j - w] may
# already include this item.
def knapsack_unbounded(items, capacity):
    dp = [0] * (capacity + 1)
    for w, v in items:
        for j in range(w, capacity + 1):     # the ONLY difference is this range
            dp[j] = max(dp[j], dp[j - w] + v)
    return dp[capacity]
```

### Subset-sum Variants

Every one of these is 0/1 knapsack with a different accumulator.

```python
# Partition Equal Subset Sum — reachability instead of value
def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    reachable = {0}
    for x in nums:
        reachable |= {r + x for r in reachable if r + x <= target}
    return target in reachable

# Target Sum — assign + or - to every number so the result is `target`.
# State is (index, running total); the two branches are the two signs.
from functools import cache
from math import inf

def find_target_sum_ways(nums, target):
    @cache
    def dfs(i, total):
        if i == len(nums):
            return 1 if total == target else 0
        return dfs(i + 1, total + nums[i]) + dfs(i + 1, total - nums[i])
    return dfs(0, 0)

# Choosing signs is equivalent to choosing the subset P that gets a plus:
#   sum(P) - (total - sum(P)) = target  ->  sum(P) = (total + target) / 2
# so the same problem can be counted as a 0/1 subset-sum, which is what makes
# the bounded-capacity table below applicable.
def find_target_sum_ways_knapsack(nums, target):
    total = sum(nums)
    if (total + target) % 2 or abs(target) > total:
        return 0
    capacity = (total + target) // 2

    dp = [0] * (capacity + 1)
    dp[0] = 1
    for x in nums:
        for j in range(capacity, x - 1, -1):      # 0/1 -> downward
            dp[j] += dp[j - x]
    return dp[capacity]

# Perfect Squares — unbounded knapsack where the "coins" are 1, 4, 9, 16, ...
def num_squares(n):
    dp = [inf] * (n + 1)
    dp[0] = 0
    for i in range(1, n + 1):
        k = 1
        while k * k <= i:
            dp[i] = min(dp[i], dp[i - k * k] + 1)
            k += 1
    return dp[n]
```

### Bounded Knapsack

Each item has a quantity limit. The direct version adds a third loop over how many copies to take — O(n · capacity · quantity):

```python
def bounded_knapsack(items, capacity):      # items: (weight, value, quantity)
    n = len(items)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        weight, value, quantity = items[i - 1]
        for j in range(capacity + 1):
            best = dp[i - 1][j]                       # take 0 copies
            for count in range(1, quantity + 1):
                total_weight = count * weight
                if total_weight > j:
                    break
                best = max(best, dp[i - 1][j - total_weight] + count * value)
            dp[i][j] = best
    return dp[n][capacity]
```

**Binary decomposition** removes that third loop. Split a quantity of `q` into chunks of size 1, 2, 4, 8, … plus a remainder; any count from 0 to `q` is a subset of those chunks, so the problem becomes plain 0/1 knapsack over O(log q) synthetic items.

```python
def bounded_knapsack_binary(items, capacity):
    expanded = []
    for weight, value, quantity in items:
        chunk = 1
        while chunk <= quantity:
            expanded.append((chunk * weight, chunk * value))
            quantity -= chunk
            chunk *= 2
        if quantity > 0:
            expanded.append((quantity * weight, quantity * value))

    dp = [0] * (capacity + 1)
    for w, v in expanded:
        for j in range(capacity, w - 1, -1):          # 0/1 → downward
            dp[j] = max(dp[j], dp[j - w] + v)
    return dp[capacity]
```

### Word Break

```python
def word_break(s, word_dict):
    words = set(word_dict)
    n = len(s)
    dp = [False] * (n + 1)             # dp[i] = can s[:i] be segmented?
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[n]
```

### Longest Palindromic Subsequence

```python
def longest_palindrome_subseq(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = 1                   # single chars are palindromes of length 1
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                dp[i][j] = (dp[i + 1][j - 1] if length > 2 else 0) + 2
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1]
```

### Longest Palindromic Substring — Expand Around Center

O(n²) time, O(1) space — usually preferred over the DP version. Each position is a potential center; check both odd-length (single char) and even-length (between chars) centers.

```python
def longest_palindrome(s):
    def expand(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]        # last valid window

    best = ""
    for i in range(len(s)):
        for p in (expand(i, i), expand(i, i + 1)):   # odd and even centers
            if len(p) > len(best):
                best = p
    return best
```

### Palindrome Partitioning — Min Cuts

```python
def min_cut(s):
    n = len(s)
    # Precompute: is_pal[i][j] = True iff s[i:j+1] is a palindrome
    is_pal = [[False] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        for j in range(i, n):
            if s[i] == s[j] and (j - i < 2 or is_pal[i + 1][j - 1]):
                is_pal[i][j] = True

    cuts = [0] * n
    for i in range(n):
        if is_pal[0][i]:
            cuts[i] = 0
        else:
            cuts[i] = min(cuts[j] + 1 for j in range(i) if is_pal[j + 1][i])
    return cuts[n - 1]
```

### Interval DP

State is a **range** `(i, j)` rather than a prefix, and the recurrence either shrinks the range from both ends or splits it at some `k`. Bottom-up, iterate by increasing length so shorter ranges are solved first; with `@cache`, as below, the recursion gets that order for free.

```python
from functools import cache

# Count Palindromic Substrings — shrink from both ends
def count_palindromic_substrings(s):
    @cache
    def is_pal(i, j):
        if i >= j:
            return True
        return s[i] == s[j] and is_pal(i + 1, j - 1)
    return sum(is_pal(i, j) for i in range(len(s)) for j in range(i, len(s)))

# Burst Balloons — split at k, the LAST balloon burst inside the range. By then
# its neighbours are the untouched balloons just outside, which is exactly what
# makes the two halves independent. Pad with 1s so the edges need no special case.
def burst_balloons(nums):
    balloons = [1] + nums + [1]

    @cache
    def dfs(i, j):                       # inclusive range of `balloons` indices
        if i > j:
            return 0
        return max(balloons[i - 1] * balloons[k] * balloons[j + 1]
                   + dfs(i, k - 1) + dfs(k + 1, j)
                   for k in range(i, j + 1))

    return dfs(1, len(balloons) - 2)
```

### Game Theory DP

Two players alternate, both optimal. Model it from the current player's view and assume the opponent then leaves you the **worst** of your options — hence `min` nested inside `max`.

```python
from functools import cache

# Coin Game — take from either end; return the best total the first player can secure
def coin_game(coins):
    @cache
    def solve(i, j):
        if i == j:
            return coins[i]
        if i + 1 == j:
            return max(coins[i], coins[j])
        # after our move the opponent picks an end, leaving us the min of what remains
        take_left = coins[i] + min(solve(i + 2, j), solve(i + 1, j - 1))
        take_right = coins[j] + min(solve(i + 1, j - 1), solve(i, j - 2))
        return max(take_left, take_right)
    return solve(0, len(coins) - 1)

# Divisor Game — pure win/lose. You win if SOME move hands the opponent a loss.
def divisor_game(n):
    @cache
    def wins(n):
        return any(n % x == 0 and not wins(n - x) for x in range(1, n))
    return wins(n)
```

### DP on a DAG

Whenever the transitions are acyclic, memoised DFS *is* the DP — no explicit topological order needed, since recursion supplies one. Look for an ordering that guarantees acyclicity: strictly increasing values, strictly shorter strings, divisibility after sorting. To run the same DP iteratively, process nodes in [topological order](#dp-in-topological-order).

```python
from functools import cache

# Longest Increasing Path in a Matrix — edges only point uphill, so no cycles
def longest_increasing_path(matrix):
    rows, cols = len(matrix), len(matrix[0])

    @cache
    def dfs(r, c):
        best = 0
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > matrix[r][c]:
                best = max(best, dfs(nr, nc))
        return best + 1

    return max(dfs(r, c) for r in range(rows) for c in range(cols))

# Longest String Chain — predecessor = this word with one character removed
def longest_string_chain(words):
    index_of = {w: i for i, w in enumerate(words)}

    @cache
    def solve(i):
        word = words[i]
        best = 0
        for k in range(len(word)):
            prev = word[:k] + word[k + 1:]
            if prev in index_of:
                best = max(best, solve(index_of[prev]))
        return best + 1

    return max(solve(i) for i in range(len(words)))

# Largest Divisible Subset — sort first, then j < i can only precede i
def largest_divisible_subset_len(nums):
    nums.sort()

    @cache
    def dfs(i):
        return max((1 + dfs(j) for j in range(i) if nums[i] % nums[j] == 0), default=1)

    return max(dfs(i) for i in range(len(nums)))
```

The O(n²) [LIS](#longest-increasing-subsequence--the-tails-array) recurrence is the same pattern; only LIS has the extra `bisect` trick that drops it to O(n log n).

### Tree DP

Two directions, and picking the wrong one is the usual reason a tree recursion turns into a mess:

- **Downward (pre-order)** — the answer at a node depends on the *path from the root*. Carry that state in as an argument.
- **Upward (post-order)** — the answer at a node depends on its *subtrees*. Solve the children, return a value, combine at the parent.

```python
from math import inf

# Downward — Count Visible Nodes: a node is visible when nothing on the path from
# the root is larger. The running maximum travels down as an argument, so each
# node is decided the moment it is reached.
def count_visible(node, max_so_far=-inf):
    if not node:
        return 0
    visible = 1 if node.val >= max_so_far else 0
    max_so_far = max(max_so_far, node.val)
    return (visible
            + count_visible(node.left, max_so_far)
            + count_visible(node.right, max_so_far))
```

Upward is the more common shape. When the parent's choice depends on what the child *did*, return a **tuple of the child's cases** instead of a single number — one pass, no recomputation.

```python
# House Robber III — (best if we rob this node, best if we skip it)
def rob_tree(root):
    def dfs(node):
        if not node:
            return (0, 0)
        left = dfs(node.left)
        right = dfs(node.right)
        rob = node.val + left[1] + right[1]    # rob here → must skip both children
        skip = max(left) + max(right)          # skip here → each child does its best
        return (rob, skip)
    return max(dfs(root))

# Longest downward path in a rooted tree — pass the parent to avoid walking back up
def longest_path(graph, node, parent):
    best = 0
    for child in graph[node]:
        if child != parent:
            best = max(best, longest_path(graph, child, node) + 1)
    return best
```

[Diameter of a Binary Tree](#subtree-recursion--depth-balance-diameter) is the same trick: return the height, accumulate the best through-path in a `nonlocal`.

### Bitmask DP

When `n ≤ ~20`, a **subset of items** fits in one integer, which makes it usable as a DP state. Bit `i` set means item `i` is used.

```python
n, i, mask = 4, 2, 0b1011      # 4 items; item 2; the subset {0, 1, 3}

mask & (1 << i)        # is item i in the subset?   → 0, no
mask | (1 << i)        # add item i                 → 0b1111
mask & ~(1 << i)       # remove item i              → 0b1011, unchanged
mask.bit_count()       # subset size (Python 3.10+) → 3
(1 << n) - 1           # the full set               → 0b1111
```

```python
from functools import cache

# Assignment problem — worker k takes the kth task assigned, so the number of
# set bits tells us which worker we are placing. No second state needed.
def min_cost_assignment(cost):
    n = len(cost)

    @cache
    def dp(mask):
        worker = mask.bit_count()
        if worker == n:
            return 0
        return min(cost[worker][task] + dp(mask | (1 << task))
                   for task in range(n) if not mask & (1 << task))

    return dp(0)
```

**Minimum cost to visit every node (TSP shape).** Here the state needs both the visited set *and* where you currently stand, because the next edge's cost depends on the current node: `dp[mask][cur]`, O(2ⁿ · n) states.

```python
from functools import cache

def min_cost_to_visit_every_node(graph):
    n = len(graph)
    FULL = (1 << n) - 1
    INF = 0x3F3F3F3F

    @cache
    def dfs(mask, cur):
        if mask == FULL:
            return 0
        best = INF
        for nxt in range(n):
            if not mask & (1 << nxt) and graph[cur][nxt]:
                best = min(best, graph[cur][nxt] + dfs(mask | (1 << nxt), nxt))
        return best

    result = dfs(1, 0)                 # start at node 0, already visited
    return -1 if result >= INF else result
```

---

## Bit Manipulation

```python
n, i = 0b1010, 3        # n = 10

# Basic operations
n & 1                   # check if odd              → 0
n | (1 << i)            # set ith bit               → 0b1010, already set
n & ~(1 << i)           # clear ith bit             → 0b0010
n ^ (1 << i)            # flip ith bit              → 0b0010
(n >> i) & 1            # get ith bit               → 1

# Tricks
n & (n - 1)             # remove rightmost set bit  → 0b1000
n & -n                  # isolate rightmost set bit → 0b0010
n != 0 and n & (n - 1) == 0   # check if power of 2 → False

# XOR properties: a ^ a == 0, a ^ 0 == a, commutative, associative
```

```python
# Count set bits — n.bit_count() (3.10+) and bin(n).count('1') both do this for you
def count_bits(n):
    count = 0
    while n:
        n &= n - 1      # remove rightmost set bit
        count += 1
    return count

# Find single number (all others appear twice)
def single_number(nums):
    result = 0
    for x in nums:
        result ^= x
    return result

# Enumerate all subsets via bitmask
def all_subsets(nums):
    n = len(nums)
    return [[nums[i] for i in range(n) if mask & (1 << i)]
            for mask in range(1 << n)]
```

---

## Math / Number Theory

```python
import math

# Sieve of Eratosthenes — all primes ≤ n in O(n log log n)
def sieve(n):
    if n < 2:
        return []                            # is_prime[1] below would not exist
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, math.isqrt(n) + 1):    # isqrt: exact, unlike int(n**0.5)
        if is_prime[i]:
            for j in range(i * i, n + 1, i):   # smaller multiples already marked
                is_prime[j] = False
    return [i for i, p in enumerate(is_prime) if p]

# Check primality — trial division to √n
def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0: return False
    for i in range(3, math.isqrt(n) + 1, 2):
        if n % i == 0: return False
    return True

# Prime factorization
def prime_factors(n):
    factors = []
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors.append(d)
            n //= d
        d += 1
    if n > 1:
        factors.append(n)
    return factors

# GCD / LCM
math.gcd(12, 18)            # 6
math.lcm(4, 6)              # 12 (Python 3.9+)

# Fast modular exponentiation — a^b mod m in O(log b)
pow(2, 10, 1000)            # built-in 3-arg pow

# Modular inverse — exponent -1 (Python 3.8+) works for ANY m coprime to a,
# and raises ValueError when no inverse exists
pow(3, -1, 7)               # 5, since 3 * 5 = 15 ≡ 1 (mod 7)

# Fermat's little theorem gives the same answer when m is prime: a^(m-2) mod m
def mod_inverse(a, m):
    return pow(a, m - 2, m)

# Common mod for combinatorics problems
MOD = 10**9 + 7
```

### Nth Prime — Sieve without Knowing the Bound

The sieve needs an upper limit, but "give me the nth prime" does not supply one. Either sieve a generous fixed bound and count as you go, or use the estimate `p_n < n(ln n + ln ln n)` for `n ≥ 6`.

```python
def nth_prime(n, limit=100_001):
    is_prime = [True] * limit
    is_prime[0] = is_prime[1] = False
    count = 0
    for i in range(2, limit):
        if is_prime[i]:
            count += 1
            if count == n:
                return i
            for j in range(i * i, limit, i):
                is_prime[j] = False
    return -1                       # limit was too small
```

---

## Linked Lists

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Dummy node pattern — use when the head itself might change
def example(head):
    dummy = ListNode(0, head)
    # ... manipulate dummy.next ...
    return dummy.next

# Reverse a linked list (iterative)
def reverse_list(head):
    prev, curr = None, head
    while curr:
        curr.next, prev, curr = prev, curr, curr.next
    return prev

# Reverse (recursive)
def reverse_list_rec(head):
    if not head or not head.next: return head
    new_head = reverse_list_rec(head.next)
    head.next.next = head
    head.next = None
    return new_head

# Merge two sorted lists
def merge_two_lists(l1, l2):
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next

# Add Two Numbers — digits are stored in REVERSE order, so index 0 is the ones
# place and one left-to-right pass adds in the natural carry direction. `carry`
# belongs in the loop condition so a final carry still gets its own node.
def add_two_numbers(l1, l2):
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        total = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit)
        tail = tail.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next

# Remove Nth node from end (one-pass via two pointers)
def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1): fast = fast.next
    while fast:
        fast = fast.next
        slow = slow.next
    slow.next = slow.next.next
    return dummy.next

# Reorder list: L0 → Ln → L1 → Ln-1 → ...
def reorder_list(head):
    # 1. find middle
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    # 2. reverse second half
    prev, curr = None, slow.next
    slow.next = None
    while curr:
        curr.next, prev, curr = prev, curr, curr.next
    # 3. merge
    first, second = head, prev
    while second:
        nxt1, nxt2 = first.next, second.next    # save both before rewiring anything
        first.next, second.next = second, nxt1
        first, second = nxt1, nxt2
```

Cycle detection lives in [Fast & Slow Pointers](#fast--slow-pointers).

---

## Trees

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

### Depth-first Traversals

```python
# Recursive traversals
def inorder(root):
    result = []
    def go(node):
        if not node: return
        go(node.left); result.append(node.val); go(node.right)
    go(root)
    return result

# Preorder / postorder — swap the order of the three lines above.

# Iterative inorder
def inorder_iter(root):
    result, stack, curr = [], [], root
    while curr or stack:
        while curr:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        result.append(curr.val)
        curr = curr.right
    return result
```

### Level-order Traversal — BFS

```python
# Level order (BFS)
def level_order(root):
    if not root: return []
    from collections import deque
    queue = deque([root])
    result = []
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result

# Zigzag level order — same loop, reverse alternate levels.
# Collecting then reversing beats pushing children in a different order:
# the traversal stays untouched and only the output flips.
def zigzag_level_order(root):
    if not root: return []
    from collections import deque
    queue = deque([root])
    result = []
    reverse = False
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level[::-1] if reverse else level)
        reverse = not reverse
    return result

# Right side view — the last node of each level. `queue[-1]` reads it
# before the level is consumed, so no per-level list is needed.
def right_side_view(root):
    if not root: return []
    from collections import deque
    queue = deque([root])
    result = []
    while queue:
        result.append(queue[-1].val)
        for _ in range(len(queue)):
            node = queue.popleft()
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
    return result
```

### Subtree Recursion — Depth, Balance, Diameter

```python
# Invert / mirror a tree — swap every node's two children.
# The tuple assignment evaluates both recursions before either is stored,
# so neither call sees a half-swapped node.
def invert_tree(root):
    if not root: return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root

# Max depth
def max_depth(root):
    if not root: return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))

# Min depth — depth of the shallowest LEAF. BFS wins here: it returns at the
# first leaf found, while DFS must explore everything. Note the asymmetry with
# max_depth — a node with one child is not a leaf, so plain min() is wrong.
def min_depth(root):
    if not root: return 0
    from collections import deque
    queue = deque([root])
    depth = 1
    while queue:
        for _ in range(len(queue)):
            node = queue.popleft()
            if not node.left and not node.right:
                return depth
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        depth += 1

# Is balanced — return (height, balanced) so it's one pass
def is_balanced(root):
    def check(node):
        if not node: return 0, True
        lh, lb = check(node.left)
        rh, rb = check(node.right)
        balanced = lb and rb and abs(lh - rh) <= 1
        return 1 + max(lh, rh), balanced
    return check(root)[1]

# Diameter — uses nonlocal
def diameter_of_binary_tree(root):
    diameter = 0
    def depth(node):
        nonlocal diameter
        if not node: return 0
        l, r = depth(node.left), depth(node.right)
        diameter = max(diameter, l + r)
        return 1 + max(l, r)
    depth(root)
    return diameter
```

### Lowest Common Ancestor

```python
# Lowest Common Ancestor (binary tree)
def lca(root, p, q):
    if not root or root == p or root == q: return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right: return root
    return left or right
```

### Serialize and Rebuild a Tree

```python
# Serialize / deserialize (preorder with None markers)
def serialize(root):
    vals = []
    def go(node):
        if not node:
            vals.append('#'); return
        vals.append(str(node.val))
        go(node.left); go(node.right)
    go(root)
    return ' '.join(vals)

def deserialize(data):
    vals = iter(data.split())
    def go():
        v = next(vals)
        if v == '#': return None
        node = TreeNode(int(v))
        node.left = go()
        node.right = go()
        return node
    return go()

# Construct Binary Tree from Preorder + Inorder
# Preorder's first value is the root; inorder splits the remaining values
# into left and right subtrees around that root. O(n) with index lookup.
def build_tree(preorder, inorder):
    inorder_index = {v: i for i, v in enumerate(inorder)}
    pre_iter = iter(preorder)

    def build(lo, hi):
        if lo > hi: return None
        root = TreeNode(next(pre_iter))
        mid = inorder_index[root.val]
        root.left = build(lo, mid - 1)        # must build left before right
        root.right = build(mid + 1, hi)        # — preorder is root → left → right
        return root

    return build(0, len(inorder) - 1)
```

### Comparing Two Trees in Lockstep

Everything above recurses over one tree. This family descends **two at once**, and the only thing that varies between its members is which child gets paired with which.

The base cases are where these go wrong. Both `None` means the two structures ran out together and agree; exactly one `None` means they diverge. Collapsing them into a single `if not p or not q` check returns `True` for a mismatch and quietly accepts trees of different shapes.

```python
def is_same_tree(p, q):
    if not p and not q:
        return True                          # ran out together — structures agree
    if not p or not q:
        return False                         # only one ran out — they diverge
    return (p.val == q.val
            and is_same_tree(p.left, q.left)
            and is_same_tree(p.right, q.right))

# Symmetric Tree — identical walk, but each node is paired with its MIRROR
def is_symmetric(root):
    def mirror(a, b):
        if not a and not b:
            return True
        if not a or not b:
            return False
        return (a.val == b.val
                and mirror(a.left, b.right)      # outer pair
                and mirror(a.right, b.left))     # inner pair
    return not root or mirror(root.left, root.right)
```

**Subtree of Another Tree** reuses the test rather than rewriting it. `is_same_tree` answers "do these two match *rooted here*", so wrap it in a walk that offers every node as a candidate root.

```python
def is_subtree(root, sub):
    if not sub:
        return True
    if not root:
        return False
    return (is_same_tree(root, sub)
            or is_subtree(root.left, sub)
            or is_subtree(root.right, sub))
```

O(n · m) worst case. The O(n + m) alternative serialises both trees and runs a substring search, but it is only sound with two guards. The `#` null markers from `serialize` above stop a truncated subtree from matching — without them the preorder of `[1]` sits inside the preorder of `[1, 2]`. A delimiter fused to every value stops a numeric prefix from matching: with plain space separation `2 # #` is still a substring of `12 # #`, so emit `,12` or `^12` rather than relying on the join.

---

## Binary Search Trees

In a BST, in-order traversal yields a sorted sequence — that's the key invariant.

```python
from math import inf

# Validate BST
def is_valid_bst(root):
    def check(node, lo, hi):
        if not node: return True
        if not (lo < node.val < hi): return False
        return check(node.left, lo, node.val) and check(node.right, node.val, hi)
    return check(root, -inf, inf)

# Insert
def insert(root, val):
    if not root: return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

# Delete (handles 0/1/2 children)
def delete(root, key):
    if not root: return None
    if key < root.val:
        root.left = delete(root.left, key)
    elif key > root.val:
        root.right = delete(root.right, key)
    else:
        if not root.left: return root.right
        if not root.right: return root.left
        # find in-order successor (smallest in right subtree)
        succ = root.right
        while succ.left: succ = succ.left
        root.val = succ.val
        root.right = delete(root.right, succ.val)
    return root

# Kth smallest — iterative in-order, stop at k
def kth_smallest(root, k):
    stack, curr = [], root
    while curr or stack:
        while curr:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        k -= 1
        if k == 0: return curr.val
        curr = curr.right

# LCA in BST — O(h) using ordering
def lca_bst(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val:
            root = root.left
        elif p.val > root.val and q.val > root.val:
            root = root.right
        else:
            return root
```

### Closest BST Values II — Two In-order Iterators

Find the `k` values nearest to `x`. Flattening the tree is O(n); this is O(h + k). Keep two stacks seeded along the search path — one that walks *backwards* through the in-order sequence (predecessors), one *forwards* (successors) — then merge them by distance to `x`, exactly like merging two sorted lists from a shared midpoint.

```python
from collections import deque

def closest_values(root, x, k):
    pred, succ = [], []                  # stacks of nodes

    node = root
    while node:                          # seed both stacks along the search path
        if node.val <= x:
            pred.append(node)
            node = node.right
        else:
            succ.append(node)
            node = node.left

    def advance_pred():                  # step to the next-smaller value
        n = pred.pop().left
        while n:
            pred.append(n)
            n = n.right

    def advance_succ():                  # step to the next-larger value
        n = succ.pop().right
        while n:
            succ.append(n)
            n = n.left

    out = deque()
    for _ in range(k):
        if not pred and not succ:
            break                        # k exceeded the tree size
        take_pred = pred and (not succ or (x - pred[-1].val) <= (succ[-1].val - x))
        if take_pred:
            out.appendleft(pred[-1].val)
            advance_pred()
        else:
            out.append(succ[-1].val)
            advance_succ()

    return list(out)
```

---

## Matrix

```python
# Standard 4-directional neighbors
DIRS = [(0, 1), (1, 0), (0, -1), (-1, 0)]

# Rotate 90° clockwise (in-place)
def rotate(matrix):
    n = len(matrix)
    # Transpose
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    # Reverse each row
    for row in matrix:
        row.reverse()

# One-liner (new matrix):
#   rotated = [list(row) for row in zip(*matrix[::-1])]

# Spiral traversal: read the four borders in turn, pulling each one inward once read
def spiral_order(matrix):
    result = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):              # top row, left to right
            result.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):              # right column, downward
            result.append(matrix[r][right])
        right -= 1
        # a lone remaining row or column was fully read by the two passes above;
        # without this check the next two passes read it again backwards
        if top > bottom or left > right:
            break
        for c in range(right, left - 1, -1):          # bottom row, right to left
            result.append(matrix[bottom][c])
        bottom -= 1
        for r in range(bottom, top - 1, -1):          # left column, upward
            result.append(matrix[r][left])
        left += 1
    return result

# Flood fill / number of islands (DFS). The recursion can go rows × cols deep —
# 90,000 on a 300 × 300 grid, far past the default limit of 1000 — so raise it
# with sys.setrecursionlimit, or use the BFS shape, when the grid is large.
def num_islands(grid):
    if not grid: return 0
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or grid[r][c] != '1'):
            return
        grid[r][c] = '0'                              # mark visited
        for dr, dc in DIRS:
            dfs(r + dr, c + dc)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                count += 1
                dfs(r, c)
    return count

# Set matrix zeroes in place (use first row/col as marker)
def set_zeroes(matrix):
    rows, cols = len(matrix), len(matrix[0])
    first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
    first_col_zero = any(matrix[r][0] == 0 for r in range(rows))

    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][c] == 0:
                matrix[r][0] = matrix[0][c] = 0

    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0

    if first_row_zero:
        for c in range(cols): matrix[0][c] = 0
    if first_col_zero:
        for r in range(rows): matrix[r][0] = 0
```

### Sparse Matrix Multiplication

The textbook triple loop does `n·m·p` multiplications regardless of content. When most entries are zero, reorder the loops to `i → k → j` so that a zero in `A[i][k]` lets you skip an entire inner loop, and pre-index the non-zeros of `B` by row.

```python
def multiply(a, b):
    if not a or not a[0] or not b or not b[0]:
        return []

    n, m, p = len(a), len(a[0]), len(b[0])

    # b_nz[k] = [(col, value), ...] — only the non-zero entries of row k
    b_nz = [[(j, b[k][j]) for j in range(p) if b[k][j]] for k in range(m)]

    result = [[0] * p for _ in range(n)]
    for i in range(n):
        row_out = result[i]
        for k, a_ik in enumerate(a[i]):
            if a_ik:                      # skip zeros in A: whole inner loop avoided
                for j, b_kj in b_nz[k]:   # skip zeros in B
                    row_out[j] += a_ik * b_kj
    return result
```

---

## Graphs

```python
# Adjacency list — usually a dict
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D'],
    'C': ['A'],
    'D': ['B'],
}

# DFS recursive
def dfs(graph, start, visited=None):
    if visited is None: visited = set()
    visited.add(start)
    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    return visited

# DFS iterative
def dfs_iter(graph, start):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node in visited: continue
        visited.add(node)
        stack.extend(n for n in graph[node] if n not in visited)
    return visited
```

### BFS — Shortest Path in an Unweighted Graph

```python
from collections import deque

# The first time BFS reaches a node is along a shortest path, so record the
# distance right then. Critical: mark visited when you ENQUEUE, not when you
# dequeue — otherwise the same node gets pushed many times and complexity blows up.
def bfs(graph, start):
    dist = {start: 0}                        # doubles as the visited set
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for n in graph[node]:
            if n not in dist:
                dist[n] = dist[node] + 1     # mark on enqueue
                queue.append(n)
    return dist                              # unreachable nodes are absent

# Multi-source BFS — seed the queue with ALL sources before the main loop.
# Common problems: Rotting Oranges, Walls and Gates, 01 Matrix.
def multi_source_bfs(grid, sources):        # dist[r][c] = steps from the nearest
    rows, cols = len(grid), len(grid[0])    # source, or -1 if unreachable
    dist = [[-1] * cols for _ in range(rows)]
    queue = deque()

    for r, c in sources:                     # seed all sources at distance 0
        dist[r][c] = 0
        queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return dist
```

### Implicit Graphs — BFS over a State Space

The hardest part of these is *seeing* the graph. There is no adjacency list: a **node is a configuration**, and an **edge is a legal move**. Once you name those two things, it is ordinary BFS.

| Problem | Node | Edge |
| --- | --- | --- |
| Word Ladder | a word | change one letter, result must be in the dictionary |
| Open the Lock | a 4-digit combination | turn one wheel ±1 |
| Sliding Puzzle | the board layout | swap the blank with a neighbour |
| Knight's shortest path | a square | one L-shaped move |

Requirements: states must be **hashable** for the `visited` set (freeze grids with `tuple(tuple(row) for row in grid)`), and you must mark visited **on enqueue**, not on dequeue.

```python
from collections import deque

# Word Ladder — generate neighbours rather than scanning the whole word list.
# Comparing against every word is O(N·L) per step; mutating each position over
# 26 letters is O(26·L) and independent of the dictionary size. This counts
# TRANSFORMATIONS; LeetCode counts the words in the sequence, so add 1 there.
def word_ladder(begin, end, word_list):
    words = set(word_list)
    words.discard(begin)
    queue = deque([begin])
    steps = 0

    while queue:
        for _ in range(len(queue)):
            word = queue.popleft()
            if word == end:
                return steps
            for i in range(len(word)):
                for ch in 'abcdefghijklmnopqrstuvwxyz':
                    candidate = word[:i] + ch + word[i + 1:]
                    if candidate in words:
                        words.remove(candidate)      # removing == marking visited
                        queue.append(candidate)
        steps += 1
    return -1

# Sliding Puzzle — the board is the state; freeze it to make it hashable
def sliding_puzzle(board, target=((1, 2, 3), (4, 5, 0))):
    start = tuple(tuple(row) for row in board)
    if start == target:
        return 0

    queue = deque([start])
    visited = {start}
    distance = 0

    while queue:
        for _ in range(len(queue)):
            state = queue.popleft()
            if state == target:
                return distance

            r, c = next((i, j)
                        for i, row in enumerate(state)
                        for j, v in enumerate(row) if v == 0)

            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < len(state) and 0 <= nc < len(state[0]):
                    grid = [list(row) for row in state]
                    grid[r][c], grid[nr][nc] = grid[nr][nc], grid[r][c]
                    nxt = tuple(tuple(row) for row in grid)
                    if nxt not in visited:
                        visited.add(nxt)
                        queue.append(nxt)
        distance += 1
    return -1
```

**Open the Lock** is the same loop with `('0000',)` as the start, neighbours from turning each wheel up or down, and the deadends pre-loaded into `visited`.

### Reverse the Search Direction

"Which cells can reach the border?" is expensive from every cell but cheap from the border — flip the edges and run one traversal per target set, then intersect.

```python
# Pacific Atlantic Water Flow — walk UPHILL inward from each ocean's edges.
# Cells reached from both edge sets are the answer. Like num_islands, the
# recursion can reach rows × cols deep: raise sys.setrecursionlimit on big grids.
def pacific_atlantic(heights):
    if not heights or not heights[0]:
        return []
    rows, cols = len(heights), len(heights[0])
    pacific, atlantic = set(), set()

    def dfs(r, c, visited, prev_height):
        if (r, c) in visited or not (0 <= r < rows and 0 <= c < cols):
            return
        if heights[r][c] < prev_height:          # water only flows downhill,
            return                               # so going inward we must not descend
        visited.add((r, c))
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            dfs(nr, nc, visited, heights[r][c])

    for c in range(cols):
        dfs(0, c, pacific, heights[0][c])
        dfs(rows - 1, c, atlantic, heights[rows - 1][c])
    for r in range(rows):
        dfs(r, 0, pacific, heights[r][0])
        dfs(r, cols - 1, atlantic, heights[r][cols - 1])

    return [[r, c] for r, c in pacific & atlantic]
```

### Clone Graph

Traverse while building copies. The `old → new` dict does double duty: it is the memo *and* the visited set, which is what stops cycles from recursing forever.

```python
def clone_graph(node):
    if not node:
        return None
    clones = {}

    def dfs(cur):
        if cur in clones:
            return clones[cur]
        copy = Node(cur.val)
        clones[cur] = copy                       # register BEFORE recursing
        copy.neighbors = [dfs(n) for n in cur.neighbors]
        return copy

    return dfs(node)
```

### Topological Sort — Kahn's Algorithm

```python
from collections import deque

def topological_sort(graph):
    # Initialize in-degree for every node — including those only seen as values
    in_degree = {node: 0 for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            in_degree.setdefault(neighbor, 0)
            in_degree[neighbor] += 1

    queue = deque(n for n, d in in_degree.items() if d == 0)
    result = []
    while queue:
        node = queue.popleft()
        result.append(node)
        for n in graph.get(node, []):
            in_degree[n] -= 1
            if in_degree[n] == 0:
                queue.append(n)
    return result if len(result) == len(in_degree) else []   # [] = cycle

# Cycle in a directed graph — the DFS alternative, with 3 colors. Reaching a GRAY
# node means the walk has looped back into its own path.
def has_cycle_directed(graph):
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {node: WHITE for node in graph}

    def dfs(node):
        color[node] = GRAY
        # .get, not graph[node]: a sink may have no key, and indexing a defaultdict
        # would insert one while the any() below is still iterating the graph
        for n in graph.get(node, []):
            if color.get(n, WHITE) == GRAY: return True
            if color.get(n, WHITE) == WHITE and dfs(n): return True
        color[node] = BLACK
        return False

    return any(color[n] == WHITE and dfs(n) for n in graph)
```

### Topological Sort with a Tie-break

Kahn's algorithm with a **heap** instead of a queue yields the lexicographically smallest valid order. Everything else is unchanged.

```python
import heapq

def alien_order(words):
    graph = {c: set() for word in words for c in word}
    indegree = {c: 0 for c in graph}

    for first, second in zip(words, words[1:]):
        for a, b in zip(first, second):
            if a != b:
                if b not in graph[a]:
                    graph[a].add(b)
                    indegree[b] += 1
                break
        else:
            if len(first) > len(second):         # "abc" before "ab" is invalid
                return ""

    heap = [c for c in indegree if indegree[c] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        c = heapq.heappop(heap)
        order.append(c)
        for nxt in graph[c]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                heapq.heappush(heap, nxt)

    return ''.join(order) if len(order) == len(graph) else ""   # short = cycle
```

### Is the Topological Order Unique?

Kahn's algorithm has a free choice at exactly one moment: when the queue holds more than one node. So the order is unique **iff the queue never holds two** — one check inside the loop you already have, no extra pass.

```python
from collections import deque

def unique_topological_order(graph, indegree):
    queue = deque(n for n in indegree if indegree[n] == 0)
    order = []
    while queue:
        if len(queue) > 1:
            return None                  # a choice exists → more than one valid order
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == len(indegree) else None      # short = cycle
```

**Sequence Reconstruction** — "is `original` the only sequence consistent with these subsequences?" — is this plus one equality test: build the graph from each adjacent pair of every subsequence, then check `unique_topological_order(graph, indegree) == original`.

### DP in Topological Order

Kahn's order is also a DP order: a node leaves the queue only after every edge into it has been processed, so its value is final when it is popped. Relax each outgoing edge as you go, and longest-path questions on a DAG, such as the earliest time every task can finish, come out in O(V + E) with no recursion.

```python
from collections import deque

# Earliest finish time: each task takes duration[task] and may start only once
# every prerequisite has finished. graph[task] = the tasks that depend on it.
def earliest_finish(graph, duration):
    indegree = {task: 0 for task in graph}
    for task in graph:
        for nxt in graph[task]:
            indegree[nxt] += 1

    finish = {task: duration[task] for task in graph}     # if started at time 0
    queue = deque(task for task in graph if indegree[task] == 0)
    while queue:
        task = queue.popleft()
        for nxt in graph[task]:
            finish[nxt] = max(finish[nxt], finish[task] + duration[nxt])
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return max(finish.values(), default=0)
```

The recursive form of the same DP is memoised DFS: see [DP on a DAG](#dp-on-a-dag).

### Dijkstra — Non-negative Weights

```python
import heapq
from collections import defaultdict
from math import inf

# graph[node] = {neighbor: weight}. The BFS/DFS templates above use a list of
# neighbors instead — adjust the inner loop accordingly.
def dijkstra(graph, start):
    # Not {node: inf for node in graph}: built from an edge list, a node with no
    # outgoing edges never becomes a key, and indexing it would raise KeyError
    distances = defaultdict(lambda: inf)
    distances[start] = 0
    pq = [(0, start)]
    while pq:
        d, node = heapq.heappop(pq)
        if d > distances[node]: continue              # stale entry
        for neighbor, weight in graph.get(node, {}).items():
            nd = d + weight
            if nd < distances[neighbor]:
                distances[neighbor] = nd
                heapq.heappush(pq, (nd, neighbor))
    return distances                                  # unreachable → inf on lookup
```

### 0-1 BFS

```python
from collections import defaultdict, deque
from math import inf

# Shortest path when every edge weight is 0 or 1 — O(V + E), no heap.
# Trick: weight-0 edges go to the FRONT of the deque, weight-1 to the back.
def zero_one_bfs(graph, start):             # graph[node] = [(neighbor, weight)],
    dist = defaultdict(lambda: inf)         # every weight ∈ {0, 1}
    dist[start] = 0
    dq = deque([start])
    while dq:
        node = dq.popleft()
        for neighbor, w in graph.get(node, []):
            nd = dist[node] + w
            if nd < dist[neighbor]:
                dist[neighbor] = nd
                if w == 0:
                    dq.appendleft(neighbor)           # free move — process next
                else:
                    dq.append(neighbor)
    return dist
```

### Bellman-Ford — Negative Weights

```python
from math import inf

# A shortest path uses at most n - 1 edges, so n - 1 rounds of relaxing every
# edge are enough. Handles negative weights and detects negative cycles.
def bellman_ford(edges, n, start):
    dist = [inf] * n
    dist[start] = 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    # One more pass — if anything still relaxes, there's a negative cycle
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None
    return dist
```

### Floyd–Warshall — All-pairs Shortest Paths

Every pair at once, for small `n` — O(n³), so n ≤ ~100 in Python. Negative edge weights are fine, unlike Dijkstra.

```python
from math import inf

def floyd_warshall(n, edges):               # edges: (u, v, w) — add both directions
    dist = [[inf] * n for _ in range(n)]    # for an undirected graph
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = min(dist[u][v], w)     # keep the cheapest parallel edge
    # After round k, dist[i][j] is the shortest path whose intermediate nodes all
    # come from 0..k — which is why k has to be the OUTERMOST loop
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist                             # dist[i][i] < 0 → i lies on a negative cycle
```

### Minimum Spanning Tree

**Kruskal** — sort every edge by weight, take it if its endpoints are not already connected. The "already connected" test is [Union-Find](#union-find). Stop after `n - 1` edges.

```python
def minimum_spanning_tree(n, edges):        # edges: (weight, a, b)
    edges.sort()
    dsu = UnionFind(n)
    total = taken = 0
    for weight, a, b in edges:
        if dsu.find(a) != dsu.find(b):
            dsu.union(a, b)
            total += weight
            taken += 1
            if taken == n - 1:
                break
    return total
```

O(E log E), dominated by the sort. If the graph is disconnected the same loop returns a **minimum spanning forest** — just drop the early exit and report `taken` alongside the total.

**Prim** — grow one tree, always taking the cheapest edge leaving it. With a heap it is O(E log V), the same as Kruskal; only the heap-free O(V²) version, which scans for the cheapest frontier node, pulls ahead on dense graphs.

```python
import heapq

def prim(graph, start=0):                   # graph[node] = [(neighbor, weight), ...]
    visited = {start}
    heap = [(w, v) for v, w in graph[start]]
    heapq.heapify(heap)
    total = 0
    while heap and len(visited) < len(graph):
        weight, node = heapq.heappop(heap)
        if node in visited:
            continue                        # stale entry
        visited.add(node)
        total += weight
        for nxt, w in graph[node]:
            if nxt not in visited:
                heapq.heappush(heap, (w, nxt))
    return total
```

---

## Trie

```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.children.setdefault(c, TrieNode())
        node.is_end = True

    def search(self, word):
        node = self._traverse(word)
        return node is not None and node.is_end

    def startsWith(self, prefix):
        return self._traverse(prefix) is not None

    def _traverse(self, s):
        node = self.root
        for c in s:
            if c not in node.children: return None
            node = node.children[c]
        return node
```

Common use cases: prefix queries, autocomplete, word search in grid (combine with DFS), longest common prefix.

### Autocomplete and Prefix Counts

Two small extensions of the same node. For autocomplete, walk to the prefix node and DFS everything beneath it. For "how many words start with this prefix", maintain a counter on every node you pass through during insert — then the query is O(len(prefix)) with no traversal at all.

```python
class CountingTrieNode:
    def __init__(self):
        self.children = {}
        self.words_through = 0        # words passing through this node
        self.is_end = False

def insert_counting(root, word):
    node = root
    for c in word:
        node = node.children.setdefault(c, CountingTrieNode())
        node.words_through += 1
    node.is_end = True

def count_prefix(root, prefix):
    node = root
    for c in prefix:
        if c not in node.children:
            return 0
        node = node.children[c]
    return node.words_through

def autocomplete(root, prefix):
    node = root
    for c in prefix:
        if c not in node.children:
            return []
        node = node.children[c]

    out = []
    def collect(node, path):
        if node.is_end:
            out.append(prefix + ''.join(path))
        for c, child in node.children.items():
            path.append(c)
            collect(child, path)
            path.pop()
    collect(node, [])
    return out
```

### Wildcard Search — `.` Matches Any Character

A concrete character is a lookup; a `.` forks into every child. The recursion is over `(node, index)` rather than over the string alone.

```python
class WordDictionary:                    # reuses TrieNode from the section above
    def __init__(self):
        self.root = TrieNode()

    def addWord(self, word):
        node = self.root
        for c in word:
            node = node.children.setdefault(c, TrieNode())
        node.is_end = True

    def search(self, pattern):
        def match(node, i):
            if i == len(pattern):
                return node.is_end
            c = pattern[i]
            if c == '.':
                return any(match(child, i + 1) for child in node.children.values())
            child = node.children.get(c)
            return child is not None and match(child, i + 1)

        return match(self.root, 0)
```

### Word Search II — Trie + Grid DFS

Searching the grid once per word is O(words × cells × 4^L). Instead put *all* the words in a trie and walk the grid once, advancing the trie node in lockstep with the path. A path dies the moment it leaves the trie.

Two details do the heavy lifting: storing the whole word on its terminal node (so no path string has to be rebuilt), and **pruning exhausted branches** out of the trie so later cells stop re-exploring dead subtrees.

```python
class _Node:
    def __init__(self):
        self.children = {}
        self.word = None                     # the full word, if one ends here

def word_search_ii(board, words):
    if not board or not board[0]:
        return []

    root = _Node()
    for word in words:
        node = root
        for c in word:
            node = node.children.setdefault(c, _Node())
        node.word = word

    rows, cols = len(board), len(board[0])
    grid = [list(row) for row in board]
    found = set()

    def dfs(r, c, node):
        ch = grid[r][c]
        child = node.children.get(ch)
        if child is None:
            return

        if child.word is not None:
            found.add(child.word)
            child.word = None                # don't re-find the same word

        grid[r][c] = '#'                     # mark visited on the board itself
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != '#':
                dfs(nr, nc, child)
        grid[r][c] = ch

        if not child.children:               # dead end — prune it from the trie
            del node.children[ch]

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)

    return [w for w in words if w in found]
```

---

## Union-Find

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False                       # already connected
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        self.components -= 1
        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)

# Cycle in undirected graph
def has_cycle_undirected(edges, n):
    uf = UnionFind(n)
    for u, v in edges:
        if not uf.union(u, v):
            return True
    return False

# Number of connected components
def count_components(n, edges):
    uf = UnionFind(n)
    for u, v in edges:
        uf.union(u, v)
    return uf.components
```

### Dict-backed DSU — for Non-integer Elements

When the elements are strings, coordinates or e-mail addresses, back the parent map with a dict so nodes spring into existence on first touch. No `n` needed up front.

```python
class DictUnionFind:                   # distinct name — the one above is UnionFind(n)
    def __init__(self):
        self.id = {}

    # Iterative on purpose: with no union by rank, union(i, i + 1) in a loop grows
    # one long chain, and a recursive find would pass Python's 1000-frame limit
    def find(self, x):
        root = x
        while self.id.get(root, root) != root:   # unseen elements are their own root
            root = self.id[root]
        while x != root:                         # point the whole path at the root
            self.id[x], x = root, self.id[x]
        return root

    def union(self, x, y):
        self.id[self.find(x)] = self.find(y)
```

Tracking **component sizes** costs one more dict: keep `size[root]`, and on a successful union add the smaller root's size into the larger's. That gives "size of the component containing x" in O(α(n)) and makes union-by-size available at the same time.

### Accounts Merge Shape

The common application: union things that share an attribute, then group by root.

```python
from collections import defaultdict

def accounts_merge(accounts):
    uf = DictUnionFind()
    owner = {}
    for name, *emails in accounts:
        for email in emails:
            uf.union(emails[0], email)       # all e-mails of one account are connected
            owner[email] = name

    groups = defaultdict(list)
    for email in owner:
        groups[uf.find(email)].append(email)

    return [[owner[root]] + sorted(emails) for root, emails in groups.items()]
```

### Offline / Reverse Union-Find

DSU can merge but cannot split, so a problem that **removes** edges over time looks impossible. Process the queries backwards: deletions in reverse order are insertions. Answer the reversed sequence, then reverse the answers.

```python
# Connected components after each edge removal
def components_after_removals(n, breaks):
    uf = DictUnionFind()
    out = []
    for a, b in reversed(breaks):
        out.append(n)                        # record the state BEFORE re-adding
        if uf.find(a) != uf.find(b):
            uf.union(a, b)
            n -= 1                           # one merge = one fewer component
    out.reverse()
    return out
```

**When to reach for Union-Find:** connectivity queries, dynamic component counting, cycle detection in undirected graphs, Kruskal's MST, and any "edges only ever get added" timeline (reverse the input if they only get removed).

---

## Segment Tree

For **range queries with point updates** on a mutable array. A prefix-sum array answers range sums in O(1) but costs O(n) per update; a segment tree makes both O(log n).

Stored as a flat array with `4n` slots (a safe upper bound). Node `cur` covers `[cur_left, cur_right]`; its children are `2*cur` and `2*cur + 1`. Indexing starts at 1 so the arithmetic works.

```python
class SegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        for i, v in enumerate(arr):
            self.update(1, 0, self.n - 1, i, v)

    # walk down to the leaf for idx, then recombine on the way back up
    def update(self, cur, cur_left, cur_right, idx, val):
        if cur_left == cur_right:
            self.tree[cur] = val
            return
        mid = (cur_left + cur_right) // 2
        if idx <= mid:
            self.update(cur * 2, cur_left, mid, idx, val)
        else:
            self.update(cur * 2 + 1, mid + 1, cur_right, idx, val)
        self.tree[cur] = self.tree[cur * 2] + self.tree[cur * 2 + 1]

    def query(self, cur, cur_left, cur_right, query_left, query_right):
        if cur_left > query_right or cur_right < query_left:
            return 0                                     # disjoint — identity element
        if query_left <= cur_left and cur_right <= query_right:
            return self.tree[cur]                        # fully covered
        mid = (cur_left + cur_right) // 2                # partial — split
        return (self.query(cur * 2, cur_left, mid, query_left, query_right)
                + self.query(cur * 2 + 1, mid + 1, cur_right, query_left, query_right))
```

Call it with the full range: `tree.query(1, 0, n - 1, l, r)` and `tree.update(1, 0, n - 1, i, v)`.

**Changing the operation.** Swap the combine step and the disjoint-case identity together — they must agree, or partial overlaps silently return wrong answers:

| Query | Combine | Identity |
| --- | --- | --- |
| sum | `left + right` | `0` |
| max | `max(left, right)` | `-inf` (or `0` if all values are non-negative) |
| min | `min(left, right)` | `inf` |
| gcd | `math.gcd(left, right)` | `0` |

For a range-max tree, exactly three lines of the class above change:

```python
from math import inf

def update(self, cur, cur_left, cur_right, idx, val):
    ...
    # recombine after recursing
    self.tree[cur] = max(self.tree[cur * 2], self.tree[cur * 2 + 1])

def query(self, cur, cur_left, cur_right, query_left, query_right):
    if cur_left > query_right or cur_right < query_left:
        return -inf                                      # identity, not 0
    ...
    # partial overlap
    return max(self.query(cur * 2, cur_left, mid, query_left, query_right),
               self.query(cur * 2 + 1, mid + 1, cur_right, query_left, query_right))
```

**When to reach for it:** repeated range aggregate queries interleaved with updates. If the array never changes, use [prefix sums](#prefix-sum). If you only need prefix aggregates with updates, a Binary Indexed (Fenwick) tree is shorter to write. Range *updates* need lazy propagation, which is rarely expected in an interview.

---

## LRU Cache

Classic design question. Two implementations — pick based on whether you're allowed `OrderedDict`.

### Easy Version — OrderedDict

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)             # mark as most recently used
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)       # evict the oldest (LRU)
```

### From Scratch — Hash Map + Doubly-linked List

Interviewers often disallow `OrderedDict`. Build it yourself: dict for O(1) lookup, DLL for O(1) reorder/evict.

```python
class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.cache = {}                          # key → Node
        # Sentinel head/tail simplify edge cases (no None checks on neighbors)
        self.head, self.tail = Node(), Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_front(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_front(node)                  # most recently used → front
        return node.val

    def put(self, key, value):
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._add_to_front(node)
        if len(self.cache) > self.cap:
            lru = self.tail.prev                  # evict from tail (least recent)
            self._remove(lru)
            del self.cache[lru.key]
```

**Variants:** LFU cache (frequency + recency, harder), TTL cache (add expiration), thread-safe LRU (add a lock).
