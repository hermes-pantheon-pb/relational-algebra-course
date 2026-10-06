# Chapter 7: University CS Final Examination & Solutions

**Course:** CS 4400 / CS 6400 — Advanced Database Systems  
**Topic:** Formal Relational Algebra & Query Optimization  
**Time Limit:** 120 Minutes  
**Total Points:** 100 Points  

---

## Part I: The Examination Paper

### Section A: Formal Theory & Semantics (20 Points)

#### Question A.1 (5 Points)
State the **Closure Property** of Relational Algebra. Why is this property mathematically necessary for building declarative query languages like SQL and for relational query optimizers?

#### Question A.2 (5 Points)
Explain the distinction between **Pure Set Semantics** and **Multiset (Bag) Semantics**. Specifically:
- Why does the projection operator $\pi_L(R)$ guarantee $| \pi_L(R) | \le |R|$ under set semantics?
- Why do commercial SQL engines default to bag semantics (`SELECT` without `DISTINCT`), and what is the computational trade-off?

#### Question A.3 (5 Points)
Prove that the set intersection operator ($\cap$) is mathematically redundant in Codd's foundational relational algebra by expressing $R \cap S$ using only the primitive set difference ($-$) operator. Show both set-theoretic validity and schema compatibility.

#### Question A.4 (5 Points)
Consider relation $R(A, B)$ containing tuple $t = (1, \text{null})$. Evaluate the truth value (under Three-Valued Logic) of the following predicate on tuple $t$:
$$p: (B = 5) \lor \neg(B = 5)$$
Will tuple $t$ appear in the result of $\sigma_p(R)$? Explain why or why not.

---

### Section B: Relational Evaluation on the University Database (25 Points)
*Refer to the instantiated University benchmark database from Chapter 0.*

#### Question B.1 (5 Points)
Evaluate the exact resultant relation (schema and tuples) of:
$$E_1 = \pi_{\text{name, gpa}}\left( \sigma_{(\text{year} = 1 \lor \text{major} = \text{'Physics'}) \land \text{gpa} \ge 3.0}(\text{Student}) \right)$$

#### Question B.2 (6 Points)
Evaluate the exact resultant relation (schema and tuples) of:
$$E_2 = \pi_{\text{dept}}(\text{Instructor}) - \pi_{\text{dept}}\left( \sigma_{\text{grade} = \text{'C'}}(\text{Enrollment} \bowtie \text{Course}) \right)$$

#### Question B.3 (7 Points)
Evaluate the exact resultant relation of the Anti-Semi-Join:
$$E_3 = \text{Instructor} \triangleright \text{Teaches}$$
State the exact tuple(s) in the result and explain the real-world semantic meaning of this query.

#### Question B.4 (7 Points)
Trace the step-by-step evaluation of the relational division:
$$E_4 = \pi_{\text{s\_id, c\_id}}\left( \text{Enrollment} \bowtie \sigma_{\text{dept} = \text{'Math'}}(\text{Course}) \right) \div \pi_{\text{c\_id}}\left( \sigma_{\text{dept} = \text{'Math'}}(\text{Course}) \right)$$
List the intermediate relations for:
1. Target relation $S$
2. Candidate set $\pi_X(R)$
3. Missing combinations $(\pi_X(R) \times S) - R$
4. Final result relation

---

### Section C: Query Formulation & Complex Scenarios (30 Points)
*Formulate pure relational algebra expressions for each English specification below.*

#### Question C.1 (6 Points)
*"Find the titles of all courses taught in Fall 2023 ('F23') by instructors earning strictly more than \$110,000."*

#### Question C.2 (8 Points)
*"Find the IDs and names of all students who have enrolled in EVERY course taught by instructor 'Ada Lovelace' (i2)."*  
*(You may use the division operator $\div$ or expand it using primitives).*

#### Question C.3 (8 Points)
*"Find the name and salary of the instructor with the LOWEST salary in the university using ONLY Codd's 6 primitive operators ($\sigma, \pi, \times, \rho, \cup, -$). You may NOT use $\gamma, \text{MIN}$, or sorting."*

#### Question C.4 (8 Points)
*"Find all students who have taken AT LEAST TWO distinct Computer Science courses."*

---

### Section D: Equivalences, Proofs & Query Optimization (25 Points)

#### Question D.1 (7 Points)
Prove or disprove the following algebraic equivalence:
$$\sigma_c(R \cup S) \equiv \sigma_c(R) \cup \sigma_c(S)$$
Assume $R$ and $S$ are union-compatible. Provide a formal set-theoretic argument.

#### Question D.2 (8 Points - Spot the Optimization Bug)
A junior database engineer suggests the following push-down rule for outer joins:
$$\sigma_c(R \mathbin{⟕} S) \stackrel{?}{\equiv} R \mathbin{⟕} \sigma_c(S)$$
where $c$ is a predicate referencing an attribute from $S$ (e.g., $S.B = 'foo'$).
Is this equivalence valid in general? If invalid, provide a concrete counterexample demonstrating how the left-hand side and right-hand side produce different relations.

#### Question D.3 (10 Points - Heuristic Query Tree Optimization)
Given the canonical unoptimized query tree for:
$$\pi_{\text{title, name}}\left( \sigma_{\text{Student.major} = \text{'Math'} \land \text{Enrollment.grade} = \text{'A'} \land \text{Course.credits} = 3}(\text{Student} \bowtie \text{Enrollment} \bowtie \text{Course}) \right)$$
1. Draw the naive operator tree.
2. Step through each heuristic optimization rule (Selection pushdown, Projection pushdown).
3. Draw the resulting optimized operator tree.
4. Calculate the intermediate join cardinalities before and after optimization on our benchmark dataset.

---

# Part II: Exhaustive Solutions & Grading Rubric

---

### Solutions to Section A: Formal Theory & Semantics

#### Solution A.1 (5 Points)
- **Definition (2.5 pts):** The Closure Property states that all relational algebra operations take relations as operands and produce a relation as their result.
- **Architectural Necessity (2.5 pts):** 
  1. *Nesting:* It permits arbitrary composition of operators (e.g., $\pi(\sigma(R \bowtie S))$) without needing intermediate type conversions.
  2. *Expression Trees:* Queries can be modeled as algebraic operator trees where any subtree is itself a valid relation.
  3. *Optimization:* Enables equivalence-preserving algebraic transformations (e.g., pushing selection down the tree) because intermediate nodes obey identical relational properties.

#### Solution A.2 (5 Points)
- **Set vs. Multiset Distinction (2.5 pts):** Pure set semantics treats a relation as a set of distinct tuples. Under projection $\pi_L(R)$, if multiple tuples have identical values across the projected attribute list $L$, duplicate elimination collapses them into a single tuple. Hence $|\pi_L(R)| \le |R|$.
- **Commercial RDBMS Justification (2.5 pts):** Defaulting to bag semantics avoids the high computational overhead of sorting or hashing required for duplicate elimination on every projection ($\mathcal{O}(N \log N)$ or $\mathcal{O}(N)$ memory-intensive hash tables). SQL provides `DISTINCT` when set semantics is explicitly needed.

#### Solution A.3 (5 Points)
- **Algebraic Derivation (3 pts):**
  $$R \cap S = R - (R - S)$$
- **Proof (2 pts):**
  By set theory:
  $$R - (R - S) = R \setminus (R \setminus S) = R \cap (R \cap S^c)^c = R \cap (R^c \cup S) = (R \cap R^c) \cup (R \cap S) = \emptyset \cup (R \cap S) = R \cap S$$
  Since $R$ and $S$ are union-compatible, $R - S$ produces a relation with the identical schema and domain compatibility, which is valid input for the outer set difference. Thus $\cap$ requires no primitive operator beyond $-$.

#### Solution A.4 (5 Points)
- **Evaluation under 3VL (2.5 pts):**
  When $B = \text{null}$, the equality comparison $(\text{null} = 5)$ evaluates to **Unknown**.
  Consequently, $\neg(\text{null} = 5)$ also evaluates to **Unknown**.
  Therefore:
  $$\text{Unknown} \lor \text{Unknown} \implies \mathbf{Unknown}$$
- **Tuple Inclusion (2.5 pts):**
  Tuple $t$ will **NOT** appear in $\sigma_p(R)$. In Relational Algebra, $\sigma_p$ retains a tuple if and only if the predicate evaluates strictly to **True**. Values evaluating to **Unknown** or **False** are rejected.

---

### Solutions to Section B: Relational Evaluation

#### Solution B.1 (5 Points)
- **Inner condition:** $(\text{year} = 1 \lor \text{major} = \text{'Physics'}) \land \text{gpa} \ge 3.0$
  - `s1`: CS, yr 3 $\implies$ False.
  - `s2`: CS, yr 2 $\implies$ False.
  - `s3`: Math, yr 4 $\implies$ False.
  - `s4`: Physics, yr 1, gpa 3.5 $\implies (1 = 1 \lor \text{True}) \land 3.5 \ge 3.0 \implies \mathbf{True}$.
  - `s5`: CS, yr 2 $\implies$ False.
  - `s6`: Math, yr 1, gpa 2.8 $\implies (1 = 1) \land 2.8 \ge 3.0 \implies \mathbf{False}$.
- **Projection $\pi_{\text{name, gpa}}$ Result:**
  | name | gpa |
  | :--- | :--- |
  | **Diana** | 3.5 |

#### Solution B.2 (6 Points)
- **Sub-expression 1:** $\pi_{\text{dept}}(\text{Instructor}) = \{\text{'CS'}, \text{'Math'}, \text{'Physics'}\}$
- **Sub-expression 2:** $\sigma_{\text{grade} = \text{'C'}}(\text{Enrollment} \bowtie \text{Course})$
  - Only one tuple in `Enrollment` has grade `'C'`: `(s2, CS102, S24, C)`.
  - Joined with `Course`, `CS102` belongs to department `'CS'`.
  - Thus, $\pi_{\text{dept}}(\dots) = \{\text{'CS'}\}$.
- **Set Difference:**
  $$\{\text{'CS'}, \text{'Math'}, \text{'Physics'}\} - \{\text{'CS'}\} = \{\mathbf{\text{'Math'}}, \mathbf{\text{'Physics'}}\}$$
- **Resulting Relation:**
  | dept |
  | :--- |
  | **Math** |
  | **Physics** |

#### Solution B.3 (7 Points)
- **Definition:** $\text{Instructor} \triangleright \text{Teaches} = \text{Instructor} - (\text{Instructor} \ltimes \text{Teaches})$.
- **Instructors in `Teaches`:** `i1` (Turing), `i2` (Lovelace), `i3` (Gauss), `i4` (Noether), `i5` (Feynman).
- **Instructors NOT in `Teaches`:** `i6` (Claude Shannon).
- **Resulting Relation:**
  | i_id | name | dept | salary |
  | :--- | :--- | :--- | :--- |
  | **i6** | Claude Shannon | CS | 95000 |
- **Real-world semantic meaning:** Identifies all active faculty members who are currently **not assigned to teach any course section**.

#### Solution B.4 (7 Points)
- **Target Relation $S$:**
  $$S = \pi_{\text{c\_id}}(\sigma_{\text{dept} = \text{'Math'}}(\text{Course})) = \{\text{'MATH101'}, \text{'MATH102'}\}$$
- **Source Relation $R$:** Math courses taken by students:
  - `s2` took `MATH101`
  - `s3` took `MATH101`, `MATH102`
  - `s4` took `MATH101`
  $$R = \{(\text{s2, MATH101}), (\text{s3, MATH101}), (\text{s3, MATH102}), (\text{s4, MATH101})\}$$
- **Candidate Set:** $\pi_{\text{s\_id}}(R) = \{\text{s2}, \text{s3}, \text{s4}\}$
- **Cartesian Product $\pi_X(R) \times S$:**
  $$\{(\text{s2, M101}), (\text{s2, M102}), (\text{s3, M101}), (\text{s3, M102}), (\text{s4, M101}), (\text{s4, M102})\}$$
- **Missing combinations:**
  $$\{(\text{s2, M102}), (\text{s4, M102})\}$$
- **Disqualified candidates:** $\{\text{s2}, \text{s4}\}$
- **Final Result:**
  $$\{\text{s2}, \text{s3}, \text{s4}\} - \{\text{s2}, \text{s4}\} = \mathbf{\{\text{s3}\}}$$
  *(Only Charlie has taken all Math courses).*

---

### Solutions to Section C: Query Formulation

#### Solution C.1 (6 Points)
$$\pi_{\text{title}}\left( \text{Course} \bowtie \left( \sigma_{\text{semester} = \text{'F23'}}(\text{Teaches}) \bowtie \sigma_{\text{salary} > 110000}(\text{Instructor}) \right) \right)$$

#### Solution C.2 (8 Points)
$$\text{AdaCourses} = \pi_{\text{c\_id}}\left( \text{Teaches} \bowtie \sigma_{\text{name} = \text{'Ada Lovelace'}}(\text{Instructor}) \right)$$
$$\text{StudentPairs} = \pi_{\text{s\_id, c\_id}}(\text{Enrollment})$$
$$\text{Result} = \pi_{\text{s\_id, name}}\left( \text{Student} \bowtie (\text{StudentPairs} \div \text{AdaCourses}) \right)$$

#### Solution C.3 (8 Points)
$$\text{HigherEarners} = \pi_{I1.\text{i\_id}}\left( \sigma_{I1.\text{salary} > I2.\text{salary}}\left( \rho_{I1}(\text{Instructor}) \times \rho_{I2}(\text{Instructor}) \right) \right)$$
$$\text{MinID} = \pi_{\text{i\_id}}(\text{Instructor}) - \text{HigherEarners}$$
$$\text{Result} = \pi_{\text{name, salary}}\left( \text{Instructor} \bowtie \text{MinID} \right)$$
*(This evaluates to Claude Shannon, 95000).*

#### Solution C.4 (8 Points)
$$\text{CS\_Courses} = \pi_{\text{c\_id}}\left( \sigma_{\text{dept} = \text{'CS'}}(\text{Course}) \right)$$
$$\text{CS\_Enrollment} = \text{Enrollment} \bowtie \text{CS\_Courses}$$
$$\text{ResultIDs} = \pi_{E1.\text{s\_id}}\left( \sigma_{E1.\text{s\_id} = E2.\text{s\_id} \land E1.\text{c\_id} \neq E2.\text{c\_id}}\left( \rho_{E1}(\text{CS\_Enrollment}) \times \rho_{E2}(\text{CS\_Enrollment}) \right) \right)$$
$$\text{Result} = \pi_{\text{s\_id, name}}(\text{Student} \bowtie \text{ResultIDs})$$
*(Yields Alice `s1` and Bob `s2`).*

---

### Solutions to Section D: Equivalences & Optimization

#### Solution D.1 (7 Points)
- **Verdict:** **TRUE (Equivalence holds).**
- **Proof:**
  $$\begin{aligned}
  \sigma_c(R \cup S) &= \{ t \in (R \cup S) \mid c(t) = \text{true} \} \\
  &= \{ t \mid (t \in R \lor t \in S) \land c(t) = \text{true} \} \\
  &= \{ t \mid (t \in R \land c(t) = \text{true}) \lor (t \in S \land c(t) = \text{true}) \} \quad (\text{by distributivity of } \land \text{ over } \lor) \\
  &= \{ t \mid t \in \sigma_c(R) \lor t \in \sigma_c(S) \} \\
  &= \sigma_c(R) \cup \sigma_c(S) \quad \blacksquare
  \end{aligned}$$

#### Solution D.2 (8 Points)
- **Verdict:** **INVALID (Equivalence does NOT hold in general).**
- **Counterexample Explanation:**
  Consider relation $R(A) = \{(1)\}$ and $S(A, B) = \{(2, \text{'foo'})\}$.
  Join condition is natural join on $A$. Condition $c$ is $S.B = \text{'foo'}$.
  1. **Left-hand side:** $\sigma_c(R \mathbin{⟕} S)$
     - Compute $R \mathbin{⟕} S$: Since $A=1$ does not match $S$, it is preserved as $(1, \text{null})$.
     - Apply $\sigma_{B = \text{'foo'}}$: The predicate evaluates to $(\text{null} = \text{'foo'}) \implies \mathbf{Unknown} \implies$ **dropped**!
     - Left-hand side produces: $\mathbf{\emptyset}$ (empty relation).
  2. **Right-hand side:** $R \mathbin{⟕} \sigma_c(S)$
     - Filter $\sigma_{B = \text{'foo'}}(S) \implies \{(2, \text{'foo'})\}$.
     - Left outer join $R \mathbin{⟕} \dots$: Tuple $(1)$ from $R$ is preserved and padded with null $\implies \mathbf{\{(1, \text{null})\}}$.
  3. **Conclusion:** $\emptyset \neq \{(1, \text{null})\}$. Pushing selection conditions across an outer join is **unsound** because it alters null preservation semantics.

#### Solution D.3 (10 Points)
1. **Naive Tree:**
   ```
   π(title, name)
       └── σ(Student.major='Math' ∧ Enrollment.grade='A' ∧ Course.credits=3)
           └── ⋈ (c_id)
               ├── Course (7 rows)
               └── ⋈ (s_id)
                   ├── Student (6 rows)
                   └── Enrollment (13 rows)
   ```
2. **Optimization Rules Applied:**
   - **Cascade Selections:** Decompose into $c_1: (\text{major} = \text{'Math'})$, $c_2: (\text{grade} = \text{'A'})$, $c_3: (\text{credits} = 3)$.
   - **Pushdown $c_1$ to `Student`:** Filter before join $\implies$ reduces from 6 rows to 2 rows (`Charlie`, `Fiona`).
   - **Pushdown $c_2$ to `Enrollment`:** Filter before join $\implies$ reduces from 13 rows to 6 rows.
   - **Pushdown $c_3$ to `Course`:** Filter before join $\implies$ reduces from 7 rows to 2 rows (`MATH101`, `MATH102`).
   - **Pushdown Projections:** Drop unneeded columns early (`gpa`, `year`, `semester`).

3. **Optimized Tree:**
   ```
   π(title, name)
       └── ⋈ (c_id)
           ├── π(c_id, title) ← σ(credits = 3) ← Course (2 rows)
           └── ⋈ (s_id)
               ├── π(s_id, name) ← σ(major = 'Math') ← Student (2 rows)
               └── π(s_id, c_id) ← σ(grade = 'A') ← Enrollment (6 rows)
   ```
4. **Intermediate Cardinalities Comparison:**
   - **Naive Plan:** First join $\text{Student} \bowtie \text{Enrollment}$ generates 13 joined tuples $\times 8$ columns. Second join against `Course` generates 13 tuples $\times 11$ columns. Total operations: comparisons across all 13 rows.
   - **Optimized Plan:** First join: $\sigma(\text{Student}) \bowtie \sigma(\text{Enrollment}) = 2 \text{ students} \bowtie 6 \text{ enrollments} \implies$ yields only **3 matching rows** (`s3` with `MATH101`, `MATH102`, `CS101`). Second join: 3 rows joined with 2 rows of `Course` $\implies$ yields **2 rows** (`Charlie` in `MATH101`, `Charlie` in `MATH102`).
   - Computational cost is reduced by **over 75%**.
