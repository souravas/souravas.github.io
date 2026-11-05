# 🐍 Python Coding Interview Prep

**245 solution files** worked through by hand, plus two reference documents distilled from them.
Python 3.14, standard library only — no dependencies, no build step, no test framework.

The solutions are the practice; the references are what gets read before a round.

| | |
| --- | --- |
| **[CHEATSHEET.md](CHEATSHEET.md)** | Pure Python syntax and idioms — *"what does `bisect_left` return again?"* |
| **[PATTERNS.md](PATTERNS.md)** | Algorithm templates — *"how does the monotonic-stack template go?"* |
| **[`algomonster/`](https://github.com/souravas/code/tree/main/algomonster)** | 186 files following the AlgoMonster syllabus, in curriculum order |
| **[`neetcode/`](https://github.com/souravas/code/tree/main/neetcode)** | 59 files mirroring LeetCode submissions |

---

## The solution trees

Two trees, deliberately different conventions — each matches the source it mirrors.

### `algomonster/` — 186 files, curriculum order

Numeric prefixes are the syllabus order and are load-bearing for navigation. Module-level
`snake_case` functions with type hints; node classes declared inline per file; a second approach
lives in a sibling `_improved` / `_optimized` function so the naive version stays visible.

```
01_sorting                    4     07_graph                     22
02_binary_search              8     08_heap                       8
03_two_pointers              19     09_dynamic_programming       48
04_depth_first_search        16     10_advanced_data_structures  15
05_backtracking              16     11_miscellaneous             25
06_breadth_first_search       5
```

### `neetcode/` — 59 files, LeetCode shape

`class Solution` with `camelCase` methods matching the exact LeetCode signature. Multiple approaches
become numbered variants (`groupAnagrams1`, `groupAnagrams2`). Design problems are a bare class with
the LeetCode-specified name (`KthLargest`, `MinStack`, `LRUCache`) rather than a `Solution` wrapper.
`TreeNode` and `ListNode` live in `trees/tree_node.py` and `linked_list/list_node.py` and are
imported, not redefined — they are two of the 59 files, so this tree holds 57 problems.

```
arrays_hashes    9     math_geometry    2     trees          11
backtracking     2     sliding_window   6     two_pointers    5
binary_search    5     stack            6
heap             4     linked_list      9
```

---

## Running the code

`neetcode/` files import shared node classes by absolute package path. There are no `__init__.py`
files, so this works only via implicit namespace packages with the repo root on `sys.path` — **run
them as modules from the repo root**:

```console
$ python -m neetcode.trees.invert_tree     # works
$ python neetcode/trees/invert_tree.py     # ModuleNotFoundError
```

Only five files have a `__main__` demo:
`arrays_hashes/{contains_duplicate,group_anagrams,two_sum,valid_anagrams}.py` and
`backtracking/n_queens.py`. That is the repo's entire test harness.

`algomonster/` files have no cross-file imports — each defines whatever `Node` / `ListNode` it needs
inline. Most define functions only, so importing one does nothing visible; to exercise it, import it
from a scratch script or `python -c`. Two groups are exceptions worth knowing about:

- **Seven files execute on import** via bare top-level statements rather than a `__main__` guard:
  all of `01_sorting/`, plus `02_binary_search/{01_binary_search,07_peak_mountain_array}.py` and
  `03_two_pointers/16_product_of_array.py`.
- **Six files in `09_dynamic_programming/` are comment-only lesson notes** — they carry the syllabus
  explanation for a topic with no coded exercise of its own, so they contain no executable
  statements: `07_grid`, `25_knapsack_dp`, `33_0_1_knapsack`, `41_topological_sort_dp`, `46_bitmask`,
  `47_bitmask_dp`. They are deliberate, not stubs.

Every directory is fully solved — no empty or placeholder files remain anywhere in the tree.

---

## The reference documents

The line between them is strict: **CHEATSHEET is syntax, PATTERNS is algorithms.** Between them they
cover every technique that appears anywhere in the two solution trees.

### CHEATSHEET.md — syntax only, one-liners, no algorithms

- Types and ranges: integers (ceiling division, base conversion, bit introspection, sentinels),
  `range`, strings, booleans
- Built-in structures: lists, sets, dicts, tuples, stacks, deques
- Node skeletons for linked lists and trees
- `collections` (Counter, defaultdict, OrderedDict, deque), `heapq`, `math`, `string`, `random`,
  `itertools`, `bisect`, `functools`, `sortedcontainers`
- Comprehensions, generators, lambdas, scope (`global` / `nonlocal`), classes, type hints
- Common idioms (`enumerate`, `zip`, unpacking, transpose, argmax, coordinate compression)
- Performance tips and a Big-O reference

### PATTERNS.md — full templates you can adapt

Start at **[Choosing a Pattern](PATTERNS.md#choosing-a-pattern)**: input bound → affordable
complexity → technique, and a table mapping problem wording to the section that solves it.

- **Sorting:** built-in sort and `cmp_to_key`, merge sort (and the reusable merge step), the O(n²) sorts
- **Searching:** Binary Search (both patterns, tracking as the default), first/last occurrence,
  rotated array, mountain peak, 2D matrix, Binary Search on Answer (minimum and maximum)
- **Two-pointer family:** Two Pointers, Fast & Slow Pointers, Sliding Window (and the one rule that
  separates longest-window from shortest-window problems)
- **Array tricks:** Prefix Sum (1D & 2D) and prefix products, Hashing, Monotonic Stack (incl. the
  circular variant), Intervals, Line Sweep
- **Stacks:** monotonic, parsing (RPN, calculator), design (Min Stack), Car Fleet
- **Top-K:** Heap (top-K, k-closest, merge-K, median of stream, streaming kth-largest),
  Quickselect (three-way partition)
- **Strategies:** Divide & Conquer (count-of-smaller, skyline), Greedy, Backtracking, Dynamic Programming
- **DP families:** linear/stairs, partition, grid (incl. solving backwards), dual-sequence, knapsack
  (0/1, unbounded, bounded), interval, game theory, DAG, tree (both directions), bitmask
- **Bits & math:** Bit Manipulation, Math / Number Theory (sieve, nth prime, modpow)
- **Data structures:** Linked Lists, Trees, BSTs, Matrix, Graphs, Trie, Union-Find, Segment Tree
- **Graphs in depth:** DFS/BFS, multi-source and 0-1 BFS, implicit state-space BFS (word ladder,
  sliding puzzle), topological sort (incl. tie-breaking, uniqueness, and DP in topological order),
  Dijkstra, Bellman-Ford, Floyd–Warshall, MST (Kruskal & Prim)
- **Design:** LRU Cache (OrderedDict + from-scratch DLL versions)

---

## Interview-day tips

1. **Clarify the problem.** Input/output format, edge cases, assumptions.
2. **Brute force first, then optimize.** A correct slow solution beats a broken fast one.
3. **Think out loud.** Walk through your approach and examples before coding.
4. **Test your code.** Walk through with examples; check off-by-one errors and empty inputs.
5. **State complexity.** Always analyze and discuss time/space trade-offs.

### Patterns to drill

Two pointers · Sliding window · Binary search · DFS/BFS · Dynamic programming · Backtracking ·
Monotonic stack · Heap / top-K · Prefix sum · Intervals · Union-Find
