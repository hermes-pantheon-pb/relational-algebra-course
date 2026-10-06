# Chapter 6: Academically Important Real-World Scenarios

University Computer Science exams frequently test queries that require synthesizing multiple algebraic operators to solve problems without relying on syntactic crutches. This chapter details five classic, academically celebrated patterns evaluated against our instantiated database.

---

## Pattern 1: Finding Maximum / Extreme Values WITHOUT Aggregation ($\gamma$)

> [!IMPORTANT]
> **Classic CS Exam Challenge:**
> *"Find the name and salary of the highest-paid instructor using ONLY Codd's 6 primitive operators ($\sigma, \pi, \times, \rho, \cup, -$). You are NOT permitted to use $\gamma$ or $\text{MAX}$."*

### Theoretical Intuition
How can we determine the maximum without a `MAX` function?
1. An instructor $x$ is **NOT** the highest-paid if there exists some instructor $y$ whose salary is strictly greater than $x$'s salary ($x.\text{salary} < y.\text{salary}$).
2. If we identify all instructors who earn strictly less than at least one colleague, the highest earner will be the **only one missing from that set**!
3. Therefore:
   $$\text{HighestEarner} = \text{AllInstructors} - \text{InstructorsWhoEarnLessThanSomeone}$$

### The Algebraic Formulation:
$$\text{LowerEarners} = \pi_{I1.\text{i\_id}}\left( \sigma_{I1.\text{salary} < I2.\text{salary}}\left( \rho_{I1}(\text{Instructor}) \times \rho_{I2}(\text{Instructor}) \right) \right)$$
$$\text{MaxID} = \pi_{\text{i\_id}}(\text{Instructor}) - \text{LowerEarners}$$
$$\text{Result} = \pi_{\text{name, salary}}\left( \text{Instructor} \bowtie \text{MaxID} \right)$$

### Evaluation on Instantiated Database:
1. **Instructors and Salaries:**
   - Alan (120k), Ada (115k), Gauss (110k), Noether (112k), Feynman (105k), Shannon (95k).
2. **Compute $I1.\text{salary} < I2.\text{salary}$:**
   - Ada (115k) < Alan (120k) $\implies \mathbf{i2} \in \text{LowerEarners}$.
   - Gauss (110k) < Ada (115k) $\implies \mathbf{i3} \in \text{LowerEarners}$.
   - Noether (112k) < Ada (115k) $\implies \mathbf{i4} \in \text{LowerEarners}$.
   - Feynman (105k) < Gauss (110k) $\implies \mathbf{i5} \in \text{LowerEarners}$.
   - Shannon (95k) < Feynman (105k) $\implies \mathbf{i6} \in \text{LowerEarners}$.
   - Alan (120k) < Any other salary? $\implies \mathbf{False}$ for all pairs! Alan never appears in $I1$ where condition holds.
3. **Set Difference:**
   $$\{\text{i1}, \text{i2}, \text{i3}, \text{i4}, \text{i5}, \text{i6}\} - \{\text{i2}, \text{i3}, \text{i4}, \text{i5}, \text{i6}\} = \{\mathbf{\text{i1}}\}$$
4. **Join Back with `Instructor`:**
   $$\pi_{\text{name, salary}}(\text{Instructor} \bowtie \{\text{i1}\}) \implies \{(\mathbf{\text{Alan Turing}}, \mathbf{120000})\}$$

---

## Pattern 2: Counting Without COUNT ("At Least $K$" vs. "Exactly $K$")

How do we query quantities in pure Relational Algebra without the extended grouping operator $\gamma$?

### Sub-Pattern A: "At Least Two Distinct Items"
*"Find all students who have enrolled in at least two distinct courses."*

To identify an entity associated with $\ge 2$ distinct items, we perform a **Self-Join on `Enrollment`** requiring the course IDs to differ:

$$\text{AtLeastTwo} = \pi_{E1.\text{s\_id}}\left( \sigma_{E1.\text{s\_id} = E2.\text{s\_id} \land E1.\text{c\_id} \neq E2.\text{c\_id}}\left( \rho_{E1}(\text{Enrollment}) \times \rho_{E2}(\text{Enrollment}) \right) \right)$$

Evaluating on our data:
- `s1`: enrolled in CS101, CS102, CS201, CS301 $\implies \ge 2$ courses ($\mathbf{\text{s1}}$ included).
- `s2`: enrolled in CS101, CS102, MATH101 $\implies \ge 2$ courses ($\mathbf{\text{s2}}$ included).
- `s3`: enrolled in MATH101, MATH102, CS101 $\implies \ge 2$ courses ($\mathbf{\text{s3}}$ included).
- `s4`: enrolled in PHYS101, MATH101 $\implies \ge 2$ courses ($\mathbf{\text{s4}}$ included).
- `s5`: enrolled ONLY in CS101 $\implies$ never satisfies $E1.\text{c\_id} \neq E2.\text{c\_id}$!
- **Result:** $\{\text{s1}, \text{s2}, \text{s3}, \text{s4}\}$.

---

### Sub-Pattern B: "Exactly One Item"
*"Find all students who have enrolled in EXACTLY one course."*

Using set arithmetic:
$$\text{ExactlyOne} = \text{AtLeastOne} - \text{AtLeastTwo}$$

$$\text{AtLeastOne} = \pi_{\text{s\_id}}(\text{Enrollment}) = \{\text{s1}, \text{s2}, \text{s3}, \text{s4}, \text{s5}\}$$
$$\text{ExactlyOne} = \{\text{s1}, \text{s2}, \text{s3}, \text{s4}, \text{s5}\} - \{\text{s1}, \text{s2}, \text{s3}, \text{s4}\} = \mathbf{\{\text{s5}\}}$$

Joining with `Student`:
$$\pi_{\text{name}}(\text{Student} \bowtie \{\text{s5}\}) \implies \{\mathbf{\text{Evan}}\}$$

---

## Pattern 3: Exclusive Non-Association ("Has Done A, But NEVER B")

> [!CAUTION]
> **Common Student Blunder:**
> Writing $\sigma_{\text{c\_id} = \text{'CS101'} \land \text{dept} \neq \text{'Math'}}(\text{Enrollment} \bowtie \text{Course})$.
> This fails! Bob (`s2`) took `CS101` (CS dept) and `MATH101` (Math dept). Bob's `CS101` row would pass this filter, falsely claiming Bob never took Math!
>
> In relational algebra, **negation across independent tuples requires Set Difference ($-$)**.

### Query Specification:
*"Find all students who have enrolled in CS101, but have NEVER taken any course from the Math department."*

$$\text{TookCS101} = \pi_{\text{s\_id}}\left( \sigma_{\text{c\_id} = \text{'CS101'}}(\text{Enrollment}) \right)$$
$$\text{TookAnyMath} = \pi_{\text{s\_id}}\left( \text{Enrollment} \bowtie \sigma_{\text{dept} = \text{'Math'}}(\text{Course}) \right)$$
$$\text{ResultIDs} = \text{TookCS101} - \text{TookAnyMath}$$

### Evaluation on Instantiated Database:
1. **$\text{TookCS101}$:**
   - Alice (`s1`), Bob (`s2`), Charlie (`s3`), Evan (`s5`).
   - $\text{TookCS101} = \{\text{s1}, \text{s2}, \text{s3}, \text{s5}\}$.
2. **$\text{TookAnyMath}$:**
   - Bob (`s2` took MATH101), Charlie (`s3` took MATH101, MATH102), Diana (`s4` took MATH101).
   - $\text{TookAnyMath} = \{\text{s2}, \text{s3}, \text{s4}\}$.
3. **Set Difference:**
   $$\{\text{s1}, \text{s2}, \text{s3}, \text{s5}\} - \{\text{s2}, \text{s3}, \text{s4}\} = \{\mathbf{\text{s1}}, \mathbf{\text{s5}}\}$$
4. **Join with `Student`:**
   $$\pi_{\text{name}}(\text{Student} \bowtie \{\text{s1}, \text{s5}\}) \implies \{\mathbf{\text{Alice}}, \mathbf{\text{Evan}}\}$$

Both Alice and Evan took `CS101` and never took any Math course.

---

## Pattern 4: Multi-Tier Hierarchy Traversal (Graph Traversal)

*"Find all courses along with their indirect (2nd-degree) prerequisites (the prerequisite of their prerequisite)."*

We self-join `Prereq` matching the prerequisite of the first hop to the course ID of the second hop:

$$\text{IndirectPrereq} = \pi_{P1.\text{c\_id}, P2.\text{prereq\_id}}\left( \sigma_{P1.\text{prereq\_id} = P2.\text{c\_id}}\left( \rho_{P1}(\text{Prereq}) \times \rho_{P2}(\text{Prereq}) \right) \right)$$

### Evaluation on Instantiated Database:
Base `Prereq` rows:
- `(CS102, CS101)`
- `(CS201, CS102)`
- `(CS301, CS102)`
- `(MATH102, MATH101)`

When $P1.\text{prereq\_id} = P2.\text{c\_id}$:
- For $P1 = (\text{CS201}, \text{CS102})$: matches $P2 = (\text{CS102}, \text{CS101}) \implies (\mathbf{\text{CS201}}, \mathbf{\text{CS101}})$.
- For $P1 = (\text{CS301}, \text{CS102})$: matches $P2 = (\text{CS102}, \text{CS101}) \implies (\mathbf{\text{CS301}}, \mathbf{\text{CS101}})$.

**Resulting Relation:**
| c_id | prereq_id |
| :--- | :--- |
| **CS201** | CS101 |
| **CS301** | CS101 |

---

## Pattern 5: The Theoretical Limit of Relational Algebra: Transitive Closure

> [!NOTE]
> **The Transitive Closure Inexpressibility Theorem (Aho & Ullman, 1979):**
> Classical Relational Algebra cannot express the **arbitrary transitive closure** of a binary relation $R(A, B)$.

### Why?
Any valid expression in Relational Algebra has a fixed, finite syntactic depth.
- An expression with $k$ self-joins can trace paths of length at most $k+1$.
- In a database where graph diameter is not bounded by a constant known at query compile time (e.g., genealogical trees, network reachability, organization charts of arbitrary depth), Relational Algebra **cannot** compute full reachability.

This theoretical boundary motivated the development of:
1. **Datalog:** Extending relational algebra with recursive horn clauses:
   $$\text{Reachable}(x, y) \leftarrow \text{Edge}(x, y).$$
   $$\text{Reachable}(x, y) \leftarrow \text{Edge}(x, z), \text{Reachable}(z, y).$$
2. **SQL:1999 Standard:** The introduction of recursive CTEs (`WITH RECURSIVE`).
