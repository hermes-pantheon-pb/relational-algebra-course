# Chapter 2: Codd's Fundamental Primitive Operators

Every relational query language rests upon six fundamental operators defined by Edgar F. Codd:
1. **Selection ($\sigma$)**
2. **Projection ($\pi$)**
3. **Cartesian Product ($\times$)**
4. **Rename ($\rho$)**
5. **Set Union ($\cup$)**
6. **Set Difference ($-$)**

In this chapter, each primitive is introduced with formal semantics, schema transformations, exact evaluations on our instantiated University database, and immediate real-world **compoundings** with other operators.

---

## 1. Selection ($\sigma$)

### Mathematical Definition
The selection operator filters tuples (rows) from a relation that satisfy a specified propositional predicate condition $p$:

$$\sigma_p(R) = \{ t \in R \mid p(t) = \text{true} \}$$

- **Predicate syntax:** $p$ is a boolean formula constructed from:
  - Atomic comparisons: $A \ \theta \ v$ or $A \ \theta \ B$, where $A, B$ are attributes, $v$ is a constant, and $\theta \in \{=, \neq, <, \le, >, \ge\}$.
  - Logical connectives: $\land$ (AND), $\lor$ (OR), $\neg$ (NOT).

### Schema & Cardinality Properties
- **Degree:** $\text{degree}(\sigma_p(R)) = \text{degree}(R)$ (the schema is unchanged).
- **Cardinality:** $0 \le |\sigma_p(R)| \le |R|$.

### Concrete Instantiated Example
Filter all students in the `CS` department with a `gpa` strictly greater than `3.5`:

$$\sigma_{\text{major} = \text{'CS'} \land \text{gpa} > 3.5}(\text{Student})$$

**Input: `Student`**
| s_id | name | major | gpa | year | Predicate Evaluation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| s1 | Alice | CS | 3.8 | 3 | $\text{'CS'} = \text{'CS'} \land 3.8 > 3.5 \implies \mathbf{True}$ |
| s2 | Bob | CS | 3.2 | 2 | $\text{'CS'} = \text{'CS'} \land 3.2 > 3.5 \implies \mathbf{False}$ |
| s3 | Charlie | Math | 3.9 | 4 | $\text{'Math'} = \text{'CS'} \implies \mathbf{False}$ |
| s4 | Diana | Physics | 3.5 | 1 | $\text{'Physics'} = \text{'CS'} \implies \mathbf{False}$ |
| s5 | Evan | CS | 3.9 | 2 | $\text{'CS'} = \text{'CS'} \land 3.9 > 3.5 \implies \mathbf{True}$ |
| s6 | Fiona | Math | 2.8 | 1 | $\text{'Math'} = \text{'CS'} \implies \mathbf{False}$ |

**Resulting Relation:**
| s_id | name | major | gpa | year |
| :--- | :--- | :--- | :--- | :--- |
| **s1** | Alice | CS | 3.8 | 3 |
| **s5** | Evan | CS | 3.9 | 2 |

---

## 2. Projection ($\pi$)

### Mathematical Definition
The projection operator selects a subset of attributes (columns) from a relation and **eliminates duplicate tuples** to preserve pure set semantics:

$$\pi_{A_1, A_2, \dots, A_k}(R) = \{ t[A_1, A_2, \dots, A_k] \mid t \in R \}$$

### Schema & Cardinality Properties
- **Degree:** $\text{degree}(\pi_L(R)) = |L| = k$.
- **Cardinality:** $1 \le |\pi_L(R)| \le |R|$ (assuming $|R| \ge 1$). Cardinality is strictly less than $|R|$ whenever projected values contain duplicates.

### Concrete Instantiated Example
Retrieve all distinct majors currently represented in the student body:

$$\pi_{\text{major}}(\text{Student})$$

**Step 1: Extract column `major` from all 6 tuples:**
`['CS', 'CS', 'Math', 'Physics', 'CS', 'Math']`

**Step 2: Apply Set Semantics (duplicate elimination):**
`{'CS', 'Math', 'Physics'}`

**Resulting Relation:**
| major |
| :--- |
| **CS** |
| **Math** |
| **Physics** |

---

## 💡 Compounding 1: Selection + Projection ($\pi_L(\sigma_p(R))$)

In real database systems, selection and projection are almost always chained together. This forms the universal **Filter-Then-Extract** pipeline (the core of every SQL `SELECT L FROM R WHERE p`).

### Example Query
*"Find the names and GPAs of all CS majors in their second year or above."*

$$\pi_{\text{name, gpa}}\left( \sigma_{\text{major} = \text{'CS'} \land \text{year} \ge 2}(\text{Student}) \right)$$

### Execution Pipeline:
1. **Inner Operator ($\sigma$):**
   $$\sigma_{\dots}(\text{Student}) \implies \{\text{s1 (Alice, 3.8, yr 3)}, \text{s2 (Bob, 3.2, yr 2)}, \text{s5 (Evan, 3.9, yr 2)}\}$$
2. **Outer Operator ($\pi$):**
   $$\pi_{\text{name, gpa}}(\text{Intermediate}) \implies \{(\text{Alice}, 3.8), (\text{Bob}, 3.2), (\text{Evan}, 3.9)\}$$

**Resulting Relation:**
| name | gpa |
| :--- | :--- |
| **Alice** | 3.8 |
| **Bob** | 3.2 |
| **Evan** | 3.9 |

> [!TIP]
> **Commutativity Rule:**
> Can we commute projection and selection?
> $$\pi_L(\sigma_p(R)) \equiv \sigma_p(\pi_L(R)) \quad \text{ONLY IF all attributes in } p \text{ are present in } L.$$
> If $p$ references an attribute not in $L$ (e.g., $p$ checks `year \ge 2`, but $L$ only has `name, gpa`), doing projection first would discard `year`, making $\sigma_p$ impossible to evaluate!

---

## 3. Cartesian Product ($\times$)

### Mathematical Definition
The Cartesian Product (or Cross Product) pairs every tuple of relation $R$ with every tuple of relation $S$:

$$R \times S = \{ t_r \circ t_s \mid t_r \in R \land t_s \in S \}$$

where $t_r \circ t_s$ denotes tuple concatenation.

### Preconditions:
The attribute sets of $R$ and $S$ must be disjoint: $\text{attrs}(R) \cap \text{attrs}(S) = \emptyset$. If attributes share identical names, renaming ($\rho$) must be applied first.

### Schema & Cardinality Properties
- **Degree:** $\text{degree}(R \times S) = \text{degree}(R) + \text{degree}(S)$.
- **Cardinality:** $|R \times S| = |R| \times |S|$.

---

## 💡 Compounding 2: Cartesian Product + Selection $\implies$ The Birth of Joins!

Raw Cartesian products are computationally expensive and produce combinations that are mostly semantically meaningless. However, **compounding Cartesian Product with a Selection condition** transforms meaningless pairing into meaningful relational association:

$$\sigma_{R.A = S.B}(R \times S)$$

### Example Query
*"Match each Math instructor with the Math courses they can potentially teach based on department."*

Let $I = \sigma_{\text{dept} = \text{'Math'}}(\text{Instructor})$ (2 tuples: Gauss, Noether).
Let $C = \sigma_{\text{dept} = \text{'Math'}}(\text{Course})$ (2 tuples: MATH101, MATH102).

$$\sigma_{I.\text{dept} = C.\text{dept}}(I \times C)$$

**Step 1: Compute $I \times C$ ($2 \times 2 = 4$ tuples):**
| I.i_id | I.name | I.dept | I.salary | C.c_id | C.title | C.dept | C.credits |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| i3 | Gauss | Math | 110000 | MATH101 | Calculus I | Math | 3 |
| i3 | Gauss | Math | 110000 | MATH102 | Linear Algebra | Math | 3 |
| i4 | Noether | Math | 112000 | MATH101 | Calculus I | Math | 3 |
| i4 | Noether | Math | 112000 | MATH102 | Linear Algebra | Math | 3 |

**Step 2: Selection:** Since both relations were filtered for `dept = 'Math'`, all 4 tuples satisfy $I.\text{dept} = C.\text{dept}$.

This combination, $\sigma_\theta(R \times S)$, is precisely how **Theta Join ($\bowtie_\theta$)** is derived!

---

## 4. Rename Operator ($\rho$)

### Mathematical Definition
The rename operator alters the relation name and/or attribute names of a relation without modifying its tuple contents:

1. **Relation renaming:** $\rho_S(R)$ renames relation $R$ to $S$.
2. **Attribute renaming:** $\rho_{A \to B}(R)$ renames attribute $A$ to $B$.
3. **Full schema renaming:** $\rho_{S(B_1, B_2, \dots, B_n)}(R)$ renames relation to $S$ and attributes to $B_1, \dots, B_n$.

---

## 💡 Compounding 3: Rename + Cartesian Product + Selection $\implies$ Self-Joins

When a relation needs to be compared against itself, the schemas collide. The Rename operator solves this collision, enabling **Self-Joins**.

### Example Query
*"Find all pairs of distinct students who share the exact same major. Avoid duplicate inverse pairs (e.g., if (Alice, Bob) is listed, do not list (Bob, Alice)), and do not pair a student with themselves."*

$$\pi_{S1.\text{name}, S2.\text{name}, S1.\text{major}}\left( \sigma_{S1.\text{major} = S2.\text{major} \land S1.\text{s\_id} < S2.\text{s\_id}}\left( \rho_{S1}(\text{Student}) \times \rho_{S2}(\text{Student}) \right) \right)$$

### Step-by-Step Breakdown:
1. **Rename:** Create two instances of `Student`: $S1$ and $S2$.
2. **Product:** $S1 \times S2$ generates $6 \times 6 = 36$ candidate pairs.
3. **Selection Predicates:**
   - $S1.\text{major} = S2.\text{major}$: Filters down to pairs in the same major.
   - $S1.\text{s\_id} < S2.\text{s\_id}$:
     - Eliminates self-pairings where $s_i = s_i$ (e.g., `s1 < s1` is False).
     - Enforces canonical ordering, eliminating symmetric duplicates (keeps `(s1, s2)` but rejects `(s2, s1)`).
4. **Projection:** Keeps only the student names and their shared major.

**Resulting Relation:**
| S1.name | S2.name | S1.major |
| :--- | :--- | :--- |
| **Alice** | **Bob** | CS |
| **Alice** | **Evan** | CS |
| **Bob** | **Evan** | CS |
| **Charlie** | **Fiona** | Math |

---

## 5. Set Union ($\cup$)

### Mathematical Definition
Combines all tuples from two union-compatible relations:

$$R \cup S = \{ t \mid t \in R \lor t \in S \}$$

### Union-Compatibility Requirements:
Two relations $R$ and $S$ are **union-compatible** if and only if:
1. $\text{degree}(R) = \text{degree}(S) = n$.
2. For all $i \in \{1, \dots, n\}$, the domain of the $i$-th attribute of $R$ equals the domain of the $i$-th attribute of $S$:
   $$\text{dom}(A_i) = \text{dom}(B_i)$$

### Concrete Instantiated Example
Retrieve all department names that have **either** a student enrolled **or** an instructor employed:

$$\pi_{\text{major}}(\text{Student}) \cup \pi_{\text{dept}}(\text{Instructor})$$

- $\pi_{\text{major}}(\text{Student}) = \{\text{'CS'}, \text{'Math'}, \text{'Physics'}\}$
- $\pi_{\text{dept}}(\text{Instructor}) = \{\text{'CS'}, \text{'Math'}, \text{'Physics'}\}$
- Union: $\{\text{'CS'}, \text{'Math'}, \text{'Physics'}\}$

---

## 6. Set Difference ($-$)

### Mathematical Definition
Produces all tuples that belong to relation $R$ but do **not** belong to relation $S$:

$$R - S = \{ t \in R \mid t \notin S \}$$

### Precondition:
$R$ and $S$ must be **union-compatible**.

> [!IMPORTANT]
> **Set Difference is NOT commutative:**
> $$R - S \neq S - R \quad (\text{unless } R = S)$$

---

## 💡 Compounding 4: Projection + Set Difference $\implies$ Relational Non-Existence

Set Difference is the primary mechanism in pure relational algebra for expressing **negation** ("entities that have NOT done X").

### Example Query
*"Find the IDs and names of all students who have NEVER enrolled in any course."*

In our database, `Student` has 6 students, but does `Enrollment` contain all of them?

$$\text{ActiveStudentIDs} = \pi_{\text{s\_id}}(\text{Enrollment})$$
$$\text{InactiveStudentIDs} = \pi_{\text{s\_id}}(\text{Student}) - \text{ActiveStudentIDs}$$
$$\text{Result} = \pi_{\text{s\_id, name}}(\text{Student} \bowtie \text{InactiveStudentIDs})$$

### Concrete Step-by-Step Evaluation:
1. **Project enrolled student IDs:**
   $$\pi_{\text{s\_id}}(\text{Enrollment}) = \{\text{'s1'}, \text{'s2'}, \text{'s3'}, \text{'s4'}, \text{'s5'}\}$$
2. **Project all student IDs:**
   $$\pi_{\text{s\_id}}(\text{Student}) = \{\text{'s1'}, \text{'s2'}, \text{'s3'}, \text{'s4'}, \text{'s5'}, \text{'s6'}\}$$
3. **Compute Set Difference:**
   $$\{\text{'s1'}, \text{'s2'}, \text{'s3'}, \text{'s4'}, \text{'s5'}, \text{'s6'}\} - \{\text{'s1'}, \text{'s2'}, \text{'s3'}, \text{'s4'}, \text{'s5'}\} = \{\mathbf{\text{'s6'}}\}$$
4. **Join back with `Student` to retrieve student details:**

**Resulting Relation:**
| s_id | name |
| :--- | :--- |
| **s6** | Fiona |

This powerful pattern is the relational algebra foundation for SQL's `NOT IN`, `NOT EXISTS`, and `LEFT JOIN ... WHERE ... IS NULL`.
