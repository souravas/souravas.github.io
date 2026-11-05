# 🐍 Python Interview Cheat Sheet

Pure syntax and idioms for fast lookup. For algorithm templates (binary search, DP, graphs, etc.), see [PATTERNS.md](PATTERNS.md).

## 📋 Table of Contents

- [General Tips](#general-tips)
- [Range](#range)
- [Integers](#integers)
- [Strings](#strings)
- [Booleans & None](#booleans--none)
- [Lists](#lists)
- [Sets](#sets)
- [Dictionaries](#dictionaries)
- [Tuples](#tuples)
- [Stacks](#stacks)
- [Deques](#deques)
- [Linked List Node](#linked-list-node)
- [Tree Node](#tree-node)
- [Counter](#counter)
- [DefaultDict](#defaultdict)
- [OrderedDict](#ordereddict)
- [Heapq](#heapq)
- [Math](#math)
- [String Module](#string-module)
- [Random](#random)
- [Itertools](#itertools)
- [Bisect](#bisect)
- [SortedContainers](#sortedcontainers)
- [Functools](#functools)
- [Comprehensions](#comprehensions)
- [Generators](#generators)
- [Lambda Functions](#lambda-functions)
- [Scope: `global` & `nonlocal`](#scope-global--nonlocal)
- [Classes](#classes)
- [Type Hints](#type-hints)
- [Common Idioms](#common-idioms)
- [Performance Tips](#performance-tips)

---

## General Tips

```python
# Preferred comparisons
is None          # preferred
== None          # depends on __eq__ of object, not preferred

# Truthiness checks
while head:      # while head is not None
if not head:     # if head is None

# Swapping
left, right = right, left

# Check if empty
not stack        # True if data structure is empty
len(stack) == 0  # explicit length check

# Walrus operator (Python 3.8+) — assign within expression
while (line := input()):
    process(line)

# Loop else — runs only if the loop finished WITHOUT hitting `break`
for x in nums:
    if x == target:
        break
else:
    print("not found")       # same for while ... else

# Raise Python's recursion limit (default ~1000) — needed for deep DFS / DP
import sys
sys.setrecursionlimit(10**6)
```

---

## Range

```python
range(stop)                 # 0 .. stop-1
range(start, stop)          # start .. stop-1   — stop is ALWAYS excluded
range(start, stop, step)

# Counting down — the stop is still exclusive, so -1 reaches index 0
range(n - 1, -1, -1)        # n-1, n-2, ..., 1, 0
reversed(range(n))          # same values, clearer to read

# Empty rather than an error — a silent source of skipped loops
range(5, 5)                 # empty
range(5, 0)                 # empty (needs a negative step to count down)
range(0, 10, -1)            # empty

# Useful properties — range is lazy and O(1) to test or index
len(range(0, 10, 3))        # 4
x in range(0, 100, 2)       # O(1), not a scan
range(10)[-1]               # 9
list(range(0, 10, 3))       # [0, 3, 6, 9]

# Iterating a sequence backwards by index
for i in range(len(arr) - 1, -1, -1):
    ...

# Sliding a fixed-size window of length k
for i in range(len(arr) - k + 1):
    ...
```

---

## Integers

```python
# Conversion and basic operations
int("123")       # string to int
abs(-5)          # absolute value: 5
2**3             # power: 8 (preferred over math.pow)
divmod(10, 3)    # (3, 1) — quotient and remainder

# Division types
5 / 2            # 2.5 (float division)
5 // 2           # 2 (floor division)
5 % 2            # 1 (modulo)

# Ceiling division: stay in ints. math.ceil(a / b) detours through a float and goes
# wrong past 2**53: math.ceil((10**17 + 1) / 10) gives 10**16, not 10**16 + 1
-(-a // b)       # ceil(a / b), any signs
(a + b - 1) // b # same, for b > 0

# Negative numbers — // and % round towards NEGATIVE infinity, not towards zero
-3 // 2          # -2 (NOT -1)
int(-3 / 2)      # -1 (truncates towards zero)
-10 % 3          # 2    — Python's %: sign follows the DIVISOR
import math
math.fmod(-10, 3) # -1.0 — C-style: sign follows the DIVIDEND

# Bounds — same values, three spellings; `from math import inf` reads best in a
# recurrence (`return inf`) and is what PATTERNS.md uses throughout
from math import inf
inf, -inf
math.inf, -math.inf
float('inf'), float('-inf')

# Base conversions
int("ff", 16)           # 255 — parse from base 16
int("1010", 2)          # 10  — parse from base 2
bin(10)                 # '0b1010'
oct(10)                 # '0o12'
hex(255)                # '0xff'
bin(10)[2:]             # '1010' (drop the '0b' prefix)

# Bit introspection (operators and tricks: PATTERNS.md → Bit Manipulation)
(21).bit_length()       # 5 — bits needed to represent 21
(21).bit_count()        # 3 — set bits (Python 3.10+); before that: bin(21).count('1')
1 << 4                  # 16 — mask with only bit 4 set

# Sentinels
MOD = 10**9 + 7         # standard modulus for "answer may be large, return it mod ..."
INF_INT = 0x3F3F3F3F    # int-only "infinity" — keeps a dp table all-int, and
                        # INF_INT - INF_INT is 0 where inf - inf is nan. But unlike
                        # inf, INF_INT + w > INF_INT: test unreachable with >= INF_INT
```

---

## Strings

```python
# Strings are immutable — operations return new strings
s = "python is good"
s.split()                   # ['python', 'is', 'good'] (splits by whitespace)
s.split('#')                # splits by delimiter
''.join(my_list)            # join list elements into string

s.rsplit('#', 1)            # split from the right, at most 1 split
s.partition('#')            # ('before', '#', 'after') — always a 3-tuple
s.splitlines()

# Search and replace
s.find('is')                # index or -1 if not found
s.find('is', start, end)    # search in substring
s.index('is')               # like find, but raises ValueError if absent
s.count('o')                # non-overlapping occurrences
s.replace('good', 'great')  # replace all occurrences
s.strip()                   # remove whitespace from both ends
s.strip(' #')               # remove specific characters
s.lstrip(), s.rstrip()      # strip one side only
s.removeprefix('py')        # Python 3.9+ — strips once, not a char set
s.removesuffix('od')

# Case operations
s.upper(), s.lower()
s.title()                   # Title Case
s.capitalize()              # Capitalize first letter
s.swapcase()                # invert case

# Checks
s.isalpha()                 # letters, non-ASCII too: 'é' passes
s.isdigit()                 # digits, non-ASCII too: '²' passes, but int('²') raises
s.isascii() and s.isdigit() # strictly 0-9
"-5".isdigit()              # False — a sign is not a digit; parse signed tokens with int()
s.isalnum()                 # letters and digits
s.isspace()                 # only whitespace
s.islower(), s.isupper()
s.startswith('py')
s.endswith('od')

# Manipulation
"abc" * 3                   # 'abcabcabc'
len(s)
s[0:3]                      # substring (slicing)
sorted(s)                   # returns sorted list of chars
''.join(sorted(s))          # sort chars in string

# Replace one character at index i — strings are immutable, so rebuild
s[:i] + c + s[i + 1:]       # the workhorse of word-ladder / open-lock BFS

# Padding / alignment — the width is a MINIMUM; a longer string comes back unchanged
"12".zfill(4)               # '0012' — zero-pad on the left
"12".rjust(4, '0')          # '0012' — same result, but any fill character
"12".ljust(4)               # '12  '
"12".center(4)              # ' 12 '

# Bulk character mapping — one pass, faster than chained replace()
s.translate(str.maketrans('abc', 'xyz'))        # a→x, b→y, c→z
s.translate(str.maketrans('', '', 'aeiou'))     # third arg = delete these

# ASCII
ord('a')                    # 97
chr(97)                     # 'a'

# Character frequency array (lowercase letters)
arr = [0] * 26
for c in s.lower():
    if c.isalpha():
        arr[ord(c) - ord('a')] += 1

# f-strings (use these, not % or .format)
name, age = "Alice", 25
f"Hello {name}, you are {age}"
f"{value:>10}"              # right-align width 10
f"{value:.2f}"              # 2 decimal places
f"{value:08b}"              # 8-bit binary, zero-padded
```

---

## Booleans & None

```python
# Truthiness
bool([])        # False — empty list
bool([1])       # True
bool("")        # False — empty string
bool("a")       # True
bool(0)         # False
bool(42)        # True
bool(None)      # False

# None checks
x is None       # preferred
x is not None   # preferred
```

---

## Lists

```python
# Creation
[1] * n                    # [1, 1, 1, 1, 1]
[1, 2, 3] * 2              # [1, 2, 3, 1, 2, 3]
list("sourav")             # ['s', 'o', 'u', 'r', 'a', 'v']
list(range(5))             # [0, 1, 2, 3, 4]

# 2D arrays — ALWAYS use comprehension to avoid aliasing
matrix = [[0] * cols for _ in range(rows)]   # correct
matrix = [[0] * cols] * rows                 # WRONG — shared row references

# Adding
arr.append(x)              # add to end
arr.insert(i, x)           # insert at index i
arr.extend([1, 2, 3])      # add multiple elements
arr1 + arr2                # concatenate (new list)
[*arr1, *arr2]             # unpack and concatenate

# Removing
arr.remove(x)              # remove first occurrence (ValueError if missing)
arr.pop()                  # remove and return last
arr.pop(i)                 # remove and return element at index i
del arr[i]                 # delete element at index i
arr.clear()                # remove all

# Copying
arr.copy()                 # shallow copy
arr[:]                     # shallow copy
import copy
copy.deepcopy(arr)         # deep copy

# Sorting and reversing
arr.sort()                 # in-place ascending
arr.sort(reverse=True)     # in-place descending
sorted(arr)                # new sorted list
arr.reverse()              # in-place reverse
list(reversed(arr))        # new reversed list

# In-place methods return None — `arr = arr.sort()` silently sets arr to None.
# Same trap with .reverse(), .append(), .extend(), .clear(), random.shuffle().
# .pop() is the exception: it mutates AND returns the removed element.

# Custom sorting
arr.sort(key=len)          # by length
arr.sort(key=lambda x: (x[0], -x[1]))   # multiple criteria

# Searching
arr.index(x)               # index of first occurrence (ValueError if missing)
arr.count(x)               # count occurrences
x in arr                   # membership test (O(n))

# Aggregates
len(arr), min(arr), max(arr), sum(arr)
all(arr)                   # True if all truthy
any(arr)                   # True if any truthy

# Slicing (works on strings too)
arr[start:end]
arr[start:]
arr[:end]
arr[start:end:step]
arr[::-1]                  # reverse
arr[::2]                   # every other element

# Slice assignment — replace a slice with an iterable of any length
arr[1:3] = [9, 9, 9]       # length can differ; list resizes
arr[1:3] = []              # delete slice
arr[:] = sorted(arr)       # replace contents in-place (preserves aliases)
```

---

## Sets

```python
# Creation
s = set()                  # empty set ({} is empty dict, not set!)
s = {1, 2, 3}
s = set([1, 2, 2, 3])      # {1, 2, 3} from list

# Adding / removing
s.add(x)
s.update([1, 2, 3])        # add multiple
s.remove(x)                # KeyError if missing
s.discard(x)               # no error if missing
s.pop()                    # remove and return arbitrary element
s.clear()

# Set operations
s1 | s2                    # union
s1 & s2                    # intersection
s1 - s2                    # difference
s1 ^ s2                    # symmetric difference
s1.issubset(s2)
s1.issuperset(s2)

# Misc
len(s)
x in s                     # O(1)
list(s)
```

---

## Dictionaries

```python
# Creation
d = {}
d = {'a': 1, 'b': 2}
d = dict(a=1, b=2)
d = dict([('a', 1), ('b', 2)])

# Access
d['key']                   # KeyError if missing
d.get('key')               # None if missing
d.get('key', default)      # default if missing
d.setdefault('key', default)  # get; insert default if missing

# Adding / updating
d['key'] = value
d.update({'c': 3, 'd': 4})

# Removing
del d['key']               # KeyError if missing
d.pop('key')               # KeyError if missing
d.pop('key', default)
d.popitem()                # remove and return the NEWEST (key, value) — LIFO since 3.7
d.clear()

# Views
d.keys(), d.values(), d.items()

# Iteration
for key in d:
for value in d.values():
for key, value in d.items():

# Membership
'key' in d
'key' not in d

# Merging
{**d1, **d2}               # Python 3.5+
d1 | d2                    # Python 3.9+

# Comprehension
{k: v for k, v in pairs}
{k: v**2 for k, v in d.items() if v > 0}

# Ordered dedup of iterable (preserves order)
list(dict.fromkeys(arr))
```

---

## Tuples

```python
# Creation
t = ()                     # empty
t = (1,)                   # single element — comma required
t = (1, 2, 3)
t = 1, 2, 3                # packing

# Access
t[0], t[-1]
len(t), t.count(x), t.index(x)
x in t

# Unpacking
a, b, c = (1, 2, 3)
a, *b, c = (1, 2, 3, 4)    # a=1, b=[2,3], c=4

# Tuples as dict keys (immutable)
d = {(0, 1): 'value'}

# Freeze a grid so it can live in a `visited` set — BFS over board states
state = tuple(tuple(row) for row in grid)
grid = [list(row) for row in state]        # thaw it back to mutate
```

---

## Stacks

```python
# Use a list (LIFO)
stack = []
stack.append(x)            # push
x = stack.pop()            # pop (IndexError if empty)
x = stack[-1]              # peek
if not stack: ...          # empty check
```

---

## Deques

```python
from collections import deque

dq = deque()
dq = deque([1, 2, 3])
dq = deque(maxlen=5)       # bounded — pushes evict from other side

# Adding
dq.append(x)               # add to right
dq.appendleft(x)           # add to left
dq.extend([1, 2, 3])
dq.extendleft([1, 2, 3])   # order reversed!

# Removing
dq.pop()                   # remove from right
dq.popleft()               # remove from left

# Peeking: both ends are O(1); indexing toward the middle is O(n)
dq[0], dq[-1]

# Other
dq.rotate(n)               # rotate n steps right (negative for left)
dq.reverse()
dq.clear()

# Common gotcha: creating from a single tuple
deque((1, 2))              # deque([1, 2]) — flattens!
deque([(1, 2)])            # deque([(1, 2)]) — wrap in list
```

---

## Linked List Node

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Traversal
current = head
while current:
    print(current.val)
    current = current.next
```

For reverse/merge/cycle templates, see [PATTERNS.md → Linked Lists](PATTERNS.md#linked-lists).

---

## Tree Node

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

For traversals, BST operations, LCA, etc., see [PATTERNS.md → Trees](PATTERNS.md#trees).

---

## Counter

```python
from collections import Counter

c = Counter()
c = Counter([1, 2, 2, 3, 3, 3])   # Counter({3: 3, 2: 2, 1: 1})
c = Counter("hello")              # Counter({'l': 2, 'h': 1, ...})

# A missing key reads as 0, and unlike defaultdict the read inserts nothing
c['z']                            # 0, and 'z' in c is still False

# Equality ignores zero counts (Python 3.10+), which makes it the anagram check
Counter(s) == Counter(t)
Counter(a=1, b=0) == Counter(a=1)   # True

# Most common
c.most_common()              # all, most common first
c.most_common(2)             # top 2

# Operations
c1 + c2                      # add counts (drops zero/negative results)
c1 - c2                      # subtract — DROPS zero/negative results
c1 & c2                      # intersection (min counts)
c1 | c2                      # union (max counts)

# Gotcha: c1 - c2 is NOT signed subtraction. For signed counts use .subtract():
#   c = Counter(a=1); c.subtract(Counter(a=3)); c  → Counter({'a': -2})

# Mutation
c.update(other)              # add counts in-place
c.subtract(other)            # subtract in-place (keeps signed counts)

# Convert
list(c.elements())           # list with repeats
list(c.keys())               # unique elements
```

---

## DefaultDict

```python
from collections import defaultdict

dd = defaultdict(int)        # default 0
dd = defaultdict(list)       # default []
dd = defaultdict(set)        # default set()
dd = defaultdict(str)        # default str()
dd = defaultdict(lambda: 'x')  # custom default

# Gotcha: dd[key] CREATES the key with default if missing.
# To check membership without creating, use `key in dd` or `dd.get(key)`.

# Common pattern: grouping
groups = defaultdict(list)
for item in items:
    groups[get_group(item)].append(item)
```

---

## OrderedDict

```python
from collections import OrderedDict

# Regular dicts preserve insertion order since Python 3.7, but OrderedDict
# adds two LRU-critical operations: move_to_end and popitem(last=False).

od = OrderedDict()
od['a'] = 1
od['b'] = 2
od['c'] = 3

# Move existing key to most-recent / least-recent position
od.move_to_end('a')              # 'a' is now most recent: a → end
od.move_to_end('a', last=False)  # 'a' is now least recent: a → front

# Pop from either end
od.popitem()                     # remove and return MOST recent (last=True)
od.popitem(last=False)           # remove and return LEAST recent — LRU eviction

# Common pattern: LRU cache primitive (full template in PATTERNS.md → LRU Cache)
```

---

## Heapq

```python
import heapq

# Min heap (default)
heap = []
heapq.heappush(heap, 3)
heapq.heappush(heap, 1)
min_val = heap[0]              # peek
min_val = heapq.heappop(heap)  # pop

# Heapify in-place — O(n)
arr = [3, 1, 4, 1, 5]
heapq.heapify(arr)

# Combined ops
heapq.heappushpop(heap, x)     # push then pop min
heapq.heapreplace(heap, x)     # pop min then push

# Top-k
heapq.nlargest(k, iterable)
heapq.nsmallest(k, iterable)
heapq.nlargest(k, items, key=lambda x: x[1])

# Max heap — negate values (portable: works on every Python version)
heapq.heappush(max_heap, -x)
max_val = -heapq.heappop(max_heap)

# Python 3.14+ has a real max-heap API — check the judge's version before relying on it
heapq.heapify_max(arr)
heapq.heappush_max(max_heap, x)
max_val = heapq.heappop_max(max_heap)
max_heap[0]                    # peek the max
# also heapq.heapreplace_max and heapq.heappushpop_max

# Tuples — sorts by first element, then second, etc.
heapq.heappush(pq, (priority, item))

# Tie-breaking when items aren't comparable
counter = itertools.count()
heapq.heappush(pq, (priority, next(counter), obj))

# Merge already-sorted iterables into one sorted stream — lazy, O(1) memory
list(heapq.merge([1, 4, 7], [2, 3, 9]))   # [1, 2, 3, 4, 7, 9]
heapq.merge(*lists, key=None, reverse=False)
```

---

## Math

```python
import math

# Rounding / roots / power
math.ceil(3.2)          # 4
math.floor(3.8)         # 3
math.pow(2, 3)          # 8.0 -> 2**3 preferred over math.pow
math.sqrt(16)           # 4.0
math.isqrt(16)          # 4 (integer sqrt, no float error)
math.log(8, 2)          # 3.0
math.log(1000, 10)      # 2.9999999999999996 — float error: never int() a log to test
                        # "is n a power of k"; divide by k in a loop instead
math.log2(8)            # 3.0
math.log10(100)         # 2.0

# Number theory
math.gcd(12, 18)        # 6
math.lcm(4, 6)          # 12 (Python 3.9+)
math.factorial(5)       # 120
math.comb(5, 2)         # 10 (n choose k)
math.perm(5, 2)         # 20 (n permute k)

# Constants
math.pi
math.inf, -math.inf
math.nan

# Checks
math.isnan(x), math.isinf(x), math.isfinite(x)
```

For Sieve of Eratosthenes, modular exponentiation, etc., see [PATTERNS.md → Math / Number Theory](PATTERNS.md#math--number-theory).

---

## String Module

```python
import string

# Pre-built character sets — useful for membership checks and alphabet iteration
string.ascii_lowercase     # 'abcdefghijklmnopqrstuvwxyz'
string.ascii_uppercase     # 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
string.ascii_letters       # both lower + upper
string.digits              # '0123456789'
string.hexdigits           # '0123456789abcdefABCDEF'
string.octdigits           # '01234567'
string.punctuation         # !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
string.whitespace          # ' \t\n\r\x0b\x0c'
string.printable           # digits + letters + punctuation + whitespace

# Common uses
for c in string.ascii_lowercase:       # iterate alphabet
    ...

vowels = set("aeiou")
consonants = set(string.ascii_lowercase) - vowels

if c in string.digits:                 # ASCII-only, unlike c.isdigit(), which accepts '²' —
    ...                                # but `in` is a substring test: '' and '12' pass too
```

---

## Random

```python
import random

random.random()                  # float in [0.0, 1.0)
random.uniform(1.0, 5.0)         # float in [1.0, 5.0]
random.randint(1, 10)            # int in [1, 10] — both ends INCLUSIVE
random.randrange(10)             # int in [0, 10) — like range()
random.choice([1, 2, 3])         # one random element
random.choices(pop, k=3)         # k elements WITH replacement
random.choices(pop, weights=[1, 2, 3], k=1)   # weighted sample
random.sample(pop, k=3)          # k elements WITHOUT replacement
random.shuffle(arr)              # in-place shuffle

random.seed(42)                  # reproducibility (tests, debugging)
```

---

## Itertools

```python
import itertools

# Combinatorics
list(itertools.permutations([1, 2, 3]))                  # all permutations
list(itertools.permutations([1, 2, 3], 2))               # length-2 permutations
list(itertools.combinations([1, 2, 3, 4], 2))            # choose 2
list(itertools.combinations_with_replacement([1, 2], 2)) # with repetition
list(itertools.product([1, 2], [3, 4]))                  # cartesian product
list(itertools.product([0, 1], repeat=3))                # all 3-bit binary

# Adjacent pairs (Python 3.10+)
list(itertools.pairwise([1, 2, 3, 4]))                   # [(1,2), (2,3), (3,4)]
list(zip(xs, xs[1:]))                                    # pre-3.10 equivalent

# Chaining / grouping
list(itertools.chain([1, 2], [3, 4]))                    # flatten one level
list(itertools.chain.from_iterable([[1, 2], [3, 4]]))    # flatten iterable

data = [1, 1, 2, 2, 2, 3, 1, 1]
for key, group in itertools.groupby(data):
    print(key, list(group))    # 1 [1,1], 2 [2,2,2], 3 [3], 1 [1,1]

# Accumulate (running totals/max/min)
list(itertools.accumulate([1, 2, 3, 4]))                 # [1, 3, 6, 10]
list(itertools.accumulate([3, 1, 4, 1, 5], max))         # [3, 3, 4, 4, 5]
list(itertools.accumulate([1, 2, 3, 4], initial=0))      # [0, 1, 3, 6, 10] — prefix sums

# Infinite iterators (use with break, zip, or islice)
itertools.count(5, 2)       # 5, 7, 9, 11, ...
itertools.cycle([1, 2, 3])  # 1, 2, 3, 1, 2, 3, ...
itertools.repeat('A', 3)    # 'A', 'A', 'A'

# islice — slice any iterable, including infinite ones (no list() first).
# Same start/stop/step as a slice, but negative indices are NOT allowed.
list(itertools.islice(itertools.count(5, 2), 4))    # [5, 7, 9, 11]
list(itertools.islice(range(20), 2, 8, 2))          # [2, 4, 6]
```

---

## Bisect

```python
import bisect

arr = [1, 3, 5, 5, 7, 9]

# Insertion points (binary search), and what the index means
bisect.bisect_left(arr, 5)    # 2: first i with arr[i] >= 5, so also how many are < 5
bisect.bisect_right(arr, 5)   # 4: first i with arr[i] > 5, so also how many are <= 5
bisect.bisect(arr, 5)         # same as bisect_right

# Count the values in [lo, hi]
bisect.bisect_right(arr, 7) - bisect.bisect_left(arr, 3)   # 4: the 3, 5, 5, 7

# Insert in sorted order — O(n) due to list shift
bisect.insort_left(arr, 4)
bisect.insort(arr, 4)         # same as insort_right

# Custom key (Python 3.10+)
bisect.bisect_left(data, 4, key=lambda x: x[0])
```

---

## SortedContainers

```python
# Third-party, but pre-installed on LeetCode / HackerRank.
# Fills the gap bisect + list can't: O(log n) add/remove
# (insort is O(n) — the list shift dominates).
from sortedcontainers import SortedList, SortedDict, SortedSet

sl = SortedList([3, 1, 4, 1, 5])  # stays sorted: [1, 1, 3, 4, 5]
sl.add(2)                          # O(log n)
sl.remove(1)                       # O(log n) — first occurrence
sl.discard(99)                     # no error if missing
sl[0], sl[-1]                      # O(log n) indexed access (min / max)
sl.bisect_left(3), sl.bisect_right(3)
sl.pop(0)                          # O(log n) — remove smallest
sl.irange(2, 4)                    # iterate values in [2, 4] inclusive

# When to reach for it: sliding-window median, calendar/booking problems,
# any "maintain a sorted multiset with frequent insert/delete" pattern.
```

---

## Functools

```python
import functools

# Memoization — clean way to add a cache to recursive functions
@functools.lru_cache(maxsize=None)
def expensive(n):
    ...

@functools.cache                  # Python 3.9+ — same as lru_cache(None)
def expensive(n):
    ...

expensive.cache_clear()
expensive.cache_info()

# Reduce
from functools import reduce
reduce(lambda x, y: x + y, [1, 2, 3, 4])     # 10
reduce(lambda x, y: x * y, [1, 2, 3, 4], 1)  # 24 (with initial value)

# cmp_to_key — convert a -1/0/1 compare function into a sort key.
# Use when ordering depends on a relationship between two items
# and can't be expressed as a single key function (see PATTERNS.md → Sorting).
from functools import cmp_to_key
def compare(a, b):
    # negative → a first; positive → b first; 0 → equal
    return (a > b) - (a < b)
nums.sort(key=cmp_to_key(compare))
```

---

## Comprehensions

```python
# List
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# Dict
word_lengths = {w: len(w) for w in words}
filtered = {k: v for k, v in d.items() if v > 0}

# Set
unique_squares = {x**2 for x in nums}

# Generator (lazy — memory efficient)
total = sum(x**2 for x in range(1_000_000))

# Conditional expression — value if cond else other
result = [x if x > 0 else 0 for x in nums]

# Multiple conditions
filtered = [x for x in range(100) if x % 2 == 0 if x > 10]

# Nested loops
matrix = [[1, 2, 3], [4, 5, 6]]
flat = [n for row in matrix for n in row]
```

---

## Generators

```python
# Generator function
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# Generator expression
squares_gen = (x**2 for x in range(10))

# Use when you don't need all values at once (memory efficient, lazy)
```

---

## Lambda Functions

```python
# Basic
add = lambda x, y: x + y

# With conditional
max_func = lambda x, y: x if x > y else y

# In higher-order functions
list(filter(lambda x: x % 2 == 0, numbers))
list(map(lambda x: x**2, numbers))

# Sorting
students.sort(key=lambda s: s[1])

# Limitation: expressions only — no statements, assignments, or returns
```

---

## Scope: `global` & `nonlocal`

```python
# Python scopes (LEGB): Local → Enclosing → Global → Built-in
# READING a variable from any scope works automatically.
# REASSIGNING requires `global` or `nonlocal`.

# global — modify a module-level variable from inside a function
count = 0
def increment():
    global count
    count += 1            # without `global`, raises UnboundLocalError

# nonlocal — modify an enclosing function's variable
def outer():
    count = 0
    def inner():
        nonlocal count
        count += 1
    inner()

# Common DFS/backtracking pitfall — forgetting nonlocal on shared state
def diameter_of_binary_tree(root):
    diameter = 0
    def depth(node):
        nonlocal diameter           # required!
        if not node: return 0
        left = depth(node.left)
        right = depth(node.right)
        diameter = max(diameter, left + right)
        return 1 + max(left, right)
    depth(root)
    return diameter

# Workaround — mutating a container ≠ reassignment, no keyword needed
def outer():
    count = [0]
    def inner():
        count[0] += 1               # works without nonlocal
```

---

## Classes

```python
class Person:
    species = "Homo sapiens"           # class variable (shared)

    def __init__(self, name, age):
        self.name = name               # instance variable
        self.age = age
        self._protected = "x"          # convention only
        self.__private = "y"           # name-mangled to _Person__private

    def __str__(self):                 # used by print() and str()
        return f"Person({self.name}, {self.age})"

    def __repr__(self):                # used by repr() and the REPL
        return f"Person('{self.name}', {self.age})"

    def __lt__(self, other):           # __lt__ alone is enough for sort / heapq
        return self.age < other.age

    # __eq__ and __hash__ must compare the SAME fields. Mismatch them and two
    # equal objects hash differently, so a set/dict silently keeps both.
    def __eq__(self, other):
        return (self.name, self.age) == (other.name, other.age)

    def __hash__(self):                # defining __eq__ sets __hash__ to None
        return hash((self.name, self.age))

# Inheritance
class Student(Person):
    def __init__(self, name, age, sid):
        super().__init__(name, age)
        self.sid = sid

# Class / static methods
class MathUtils:
    @staticmethod
    def add(x, y):
        return x + y

    @classmethod
    def from_string(cls, s):
        return cls(int(s))

# Property
class Circle:
    def __init__(self, r):
        self._r = r

    @property
    def area(self):
        return 3.14159 * self._r ** 2
```

---

## Type Hints

```python
# Hints document intent — nothing checks them at runtime
def two_sum(nums: list[int], target: int) -> list[int]: ...
def rotate(nums: list[int], k: int) -> None: ...          # mutates in place, returns nothing

# Built-in generics (Python 3.9+) — no import needed
groups: dict[str, list[str]] = {}
edges: list[tuple[int, int]] = []
seen: set[int] = set()

# LeetCode's stubs use the typing aliases — List[int] means exactly list[int]
from typing import List, Optional
def subsets(nums: List[int]) -> List[List[int]]: ...
def invert_tree(root: Optional[TreeNode]) -> Optional[TreeNode]: ...

# Optional[X] is X | None, the modern spelling (Python 3.10+)
def invert_tree(root: TreeNode | None) -> TreeNode | None: ...

# A function that can return math.inf honestly returns int | float
def min_cost(i: int) -> int | float: ...

# A class naming itself in a hint: fine unquoted on 3.14, whose annotations are
# lazy; earlier versions need quotes or `from __future__ import annotations`
class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next
```

---

## Common Idioms

```python
# Iterate with index
for i, val in enumerate(items):
    ...
for i, val in enumerate(items, 1):     # start from 1
    ...

# Build value → index map
index_map = {val: i for i, val in enumerate(items)}

# Zip — iterate multiple sequences in parallel
for name, age in zip(names, ages):
    ...

# Reverse iteration
for x in reversed(items):
    ...

# Conditional assignment
value = x if condition else y

# Multiple assignment / unpacking
a, b = b, a                            # swap
x, y, *rest = sequence
a, *b = [1, 2, 3, 4]                   # a=1, b=[2,3,4]

# Count occurrences quickly
from collections import Counter
counts = Counter(items)

# Flatten one level
flat = [x for row in nested for x in row]

# Group by key
from collections import defaultdict
groups = defaultdict(list)
for item in items:
    groups[get_key(item)].append(item)

# Transpose a matrix
transposed = list(zip(*matrix))        # rows ↔ columns

# Rotate matrix 90° clockwise
rotated = [list(row) for row in zip(*matrix[::-1])]

# argmax / argmin — max/min with a key, returns the item (or its index)
best = max(candidates, key=score)
best_i = max(range(len(nums)), key=nums.__getitem__)

# Short-circuiting checks over a generator
if any(x < 0 for x in nums): ...
if all(c.isdigit() for c in s): ...

# Coordinate compression — dedup, sort, then work in index space
xs = sorted({x for lo, hi in intervals for x in (lo, hi)})
rank = {x: i for i, x in enumerate(xs)}
```

---

## Performance Tips

```python
# O(1) lookup
x in set_or_dict          # vs `x in list` which is O(n)

# Strings — never concatenate in a loop
# Bad — O(n²)
result = ""
for w in words: result += w
# Good — O(n)
result = ''.join(words)

# Membership tests on large collections — convert to set first
banned_set = set(banned_list)
[x for x in items if x not in banned_set]

# Prefer built-ins over manual loops
max(nums), min(nums), sum(nums), any(conds), all(conds)

# Comprehensions are faster than equivalent for-loops with append

# Common complexities
# O(1)       hash ops, array access
# O(log n)   binary search, balanced trees
# O(n)       single pass
# O(n log n) efficient sorts
# O(n²)      nested loops
# O(2^n)     subset generation
# O(n!)      permutation generation
```

To go the other way — from the input bound `n` to the complexity you can afford, and from there to the technique — see [PATTERNS.md → Choosing a Pattern](PATTERNS.md#choosing-a-pattern).
