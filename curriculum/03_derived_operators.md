# Chapter 3: Derived Relational Operators (Joins & Division)

Derived operators do not add theoretical expressive power to Relational Algebra beyond Codd's 6 primitives. However, they provide high-level abstractions that reflect common logical patterns in query writing.

---

## 1. The Join Family

### 1.1 Theta Join ($\bowtie_\theta$)
A **Theta Join** combines a Cartesian Product with an arbitrary propositional predicate $\theta$:

$$R \bowtie_\theta S = \sigma_\theta(R \times S)$$

- **Condition:** $\theta$ is any predicate over attributes of $R$ and $S$.
- **Equi-Join:** A special case of Theta Join where all operators in $\theta$ are equality comparisons ($=$).

---

### 1.2 Natural Join ($\bowtie$)
The **Natural Join** performs an equi-join on **all attributes shared by both schemas**, and automatically projects out redundant duplicate columns so that each shared attribute appears only once.

#### Formal Derivation:
Let $R(A_1, \dots, A_n, C_1, \dots, C_k)$ and $S(B_1, \dots, B_m, C_1, \dots, C_k)$, where $C = \{C_1, \dots, C_k\}$ is the intersection of attribute names $\text{attrs}(R) \cap \text{attrs}(S)$.

$$R \bowtie S = \pi_{\text{attrs}(R) \cup \text{attrs}(S)}\left( \sigma_{R.C_1 = S.C_1 \land \dots \land R.C_k = S.C_k}(R \times S) \right)$$

#### Concrete Instantiated Example:
Compute the natural join of `Student` and `Enrollment`:

$$\text{Student} \bowtie \text{Enrollment}$$

- Shared attribute: `s_id`.
- Tuple matching: For each tuple in `Student`, find tuples in `Enrollment` with the identical `s_id`.

**Sample Resulting Tuples:**
| s_id | name | major | gpa | year | c_id | semester | grade |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **s1** | Alice | CS | 3.8 | 3 | CS101 | F22 | A |
| **s1** | Alice | CS | 3.8 | 3 | CS102 | S23 | A |
| **s1** | Alice | CS | 3.8 | 3 | CS201 | F23 | B |
| **s1** | Alice | CS | 3.8 | 3 | CS301 | S24 | A |
| **s2** | Bob | CS | 3.2 | 2 | CS101 | F23 | B |
| **s2** | Bob | CS | 3.2 | 2 | CS102 | S24 | C |
| **s2** | Bob | CS | 3.2 | 2 | MATH101 | F23 | B |
| **s3** | Charlie | Math | 3.9 | 4 | MATH101 | F21 | A |
| **s3** | Charlie | Math | 3.9 | 4 | MATH102 | S22 | A |
| **s3** | Charlie | Math | 3.9 | 4 | CS101 | F22 | A |
| **s4** | Diana | Physics | 3.5 | 1 | PHYS101 | F23 | A |
| **s4** | Diana | Physics | 3.5 | 1 | MATH101 | F23 | B |
| **s5** | Evan | CS | 3.9 | 2 | CS101 | F23 | A |

> [!NOTE]
> **Notice what is missing:**
> `s6` (Fiona) does **not** appear anywhere in the result! Because she has no tuples in `Enrollment`, the equality condition `Student.s_id = Enrollment.s_id` evaluates to false for all pairings. Unmatched tuples are silently dropped in an inner natural join.

#### Algebraic Properties of Natural Join:
- **Commutative:** $R \bowtie S \equiv S \bowtie R$
- **Associative:** $(R \bowtie S) \bowtie T \equiv R \bowtie (S \bowtie T)$
- **Cartesian Product Equivalence:** If $\text{attrs}(R) \cap \text{attrs}(S) = \emptyset$, then $R \bowtie S \equiv R \times S$.

---

## 2. Set Intersection ($\cap$)

### Mathematical Definition
Returns tuples that exist in **both** relation $R$ and relation $S$:

$$R \cap S = \{ t \mid t \in R \land t \in S \}$$

### Derivation from Codd's Primitives:
Intersection can be expressed using Set Difference:

$$R \cap S \equiv R - (R - S)$$

Or alternatively:
$$R \cap S \equiv (R \cup S) - ((R - S) \cup (S - R))$$

### Concrete Instantiated Example:
*"Find all course IDs that have been taken by BOTH Alice (s1) AND Bob (s2)."*

$$\pi_{\text{c\_id}}(\sigma_{\text{s\_id} = \text{'s1'}}(\text{Enrollment})) \cap \pi_{\text{c\_id}}(\sigma_{\text{s\_id} = \text{'s2'}}(\text{Enrollment}))$$

- Alice's courses: `{'CS101', 'CS102', 'CS201', 'CS301'}`
- Bob's courses: `{'CS101', 'CS102', 'MATH101'}`
- Result: `{'CS101', 'CS102'}`

---

## 3. Semi-Join ($\ltimes$) and Anti-Semi-Join ($\triangleright$)

### 3.1 Semi-Join ($\ltimes$)
A **Semi-Join** ($R \ltimes S$) returns all tuples of $R$ for which there is at least one matching tuple in $S$ on their shared attributes.

$$R \ltimes S = \pi_{\text{attrs}(R)}(R \bowtie S)$$

> [!TIP]
> **Why Semi-Joins Matter in Distributed CS Systems:**
> In distributed databases (e.g., Google Spanner, Apache Spark), transmitting entire relations across a network is slow. Instead of shipping all columns of $S$ to node $R$, node $S$ sends only $\pi_{\text{keys}}(S)$. The join is filtered locally on $R$ via semi-join, saving massive network bandwidth.

### 3.2 Anti-Semi-Join ($\triangleright$)
An **Anti-Semi-Join** ($R \triangleright S$) returns all tuples of $R$ for which there is **no** matching tuple in $S$:

$$R \triangleright S = R - (R \ltimes S)$$

**Instantiated Example:**
$$\text{Student} \triangleright \text{Enrollment} \implies \{\text{s6 (Fiona, Math, 2.8, 1)}\}$$

---

## 4. The Division Operator ($\div$): Universal Quantification

The **Division Operator ($\div$)** is arguably the most conceptually challenging and academically celebrated operator in classical Relational Algebra. It models **universal quantification ($\forall$)**: *"find entities that are associated with ALL elements of a given target set."*

### Formal Mathematical Specification
Let relation $R$ have schema $(X, Y)$ and relation $S$ have schema $(Y)$, where $X$ and $Y$ are disjoint sets of attributes.
The division $R \div S$ produces a relation with schema $X$ consisting of all tuples $x$ such that for **every** tuple $y \in S$, the combined tuple $(x, y)$ is in $R$:

$$R \div S = \{ t \in \pi_X(R) \mid \forall s \in S, \ (t \circ s) \in R \}$$

---

### Derivation from Codd's Fundamental Primitives

Because pure Relational Algebra has no $\forall$ quantifier, division is derived using **double negation**:
$$\forall y, P(x, y) \iff \neg \exists y, \neg P(x, y)$$
*"A candidate $x$ has all properties if and only if there DOES NOT EXIST any required property that $x$ lacks."*

The complete algebraic derivation is:

$$R \div S = \pi_X(R) - \pi_X\left( (\pi_X(R) \times S) - R \right)$$

---

### 🔍 Complete Step-by-Step Derivation on the University Database

**Academic Goal:**
*"Find the IDs of all students who have enrolled in ALL Computer Science courses."*

#### Target Relation $S$: All CS Courses
$$S = \pi_{\text{c\_id}}(\sigma_{\text{dept} = \text{'CS'}}(\text{Course}))$$
$$S = \{\text{'CS101'}, \text{'CS102'}, \text{'CS201'}, \text{'CS301'}\} \quad (|S| = 4)$$

#### Source Relation $R$: Student-Course Enrollments
$$R = \pi_{\text{s\_id, c\_id}}(\text{Enrollment})$$

| s_id | c_id |
| :--- | :--- |
| s1 | CS101 |
| s1 | CS102 |
| s1 | CS201 |
| s1 | CS301 |
| s2 | CS101 |
| s2 | CS102 |
| s2 | MATH101 |
| s3 | MATH101 |
| s3 | MATH102 |
| s3 | CS101 |
| s4 | PHYS101 |
| s4 | MATH101 |
| s5 | CS101 |

---

#### Step 1: Find all candidate students $\pi_X(R)$
Extract all student IDs who have enrolled in at least one course:
$$\pi_{\text{s\_id}}(R) = \{\text{s1}, \text{s2}, \text{s3}, \text{s4}, \text{s5}\}$$

---

#### Step 2: Compute the ideal Cartesian Product: $\pi_X(R) \times S$
Generate all pairs that would exist if **every** candidate had taken **every** CS course ($5 \text{ candidates} \times 4 \text{ courses} = 20 \text{ pairs}$):

$$\begin{aligned}
\pi_X(R) \times S = \{
&(\text{s1, CS101}), (\text{s1, CS102}), (\text{s1, CS201}), (\text{s1, CS301}), \\
&(\text{s2, CS101}), (\text{s2, CS102}), (\text{s2, CS201}), (\text{s2, CS301}), \\
&(\text{s3, CS101}), (\text{s3, CS102}), (\text{s3, CS201}), (\text{s3, CS301}), \\
&(\text{s4, CS101}), (\text{s4, CS102}), (\text{s4, CS201}), (\text{s4, CS301}), \\
&(\text{s5, CS101}), (\text{s5, CS102}), (\text{s5, CS201}), (\text{s5, CS301})
\}
\end{aligned}$$

---

#### Step 3: Find what candidates are MISSING: $(\pi_X(R) \times S) - R$
Subtract the actual enrollments $R$ from the ideal combinations.
The remaining tuples are the courses that a candidate was **supposed** to take to qualify, but did **not**:

- For `s1`: All 4 pairs exist in $R \implies$ **0 missing tuples**.
- For `s2`: Missing $(\text{s2, CS201})$ and $(\text{s2, CS301})$.
- For `s3`: Missing $(\text{s3, CS102})$, $(\text{s3, CS201})$, $(\text{s3, CS301})$.
- For `s4`: Missing all 4 CS courses.
- For `s5`: Missing $(\text{s5, CS102})$, $(\text{s5, CS201})$, $(\text{s5, CS301})$.

$$\text{MissingPairs} = \{(\text{s2, CS201}), (\text{s2, CS301}), (\text{s3, CS102}), \dots, (\text{s5, CS301})\}$$

---

#### Step 4: Identify disqualified candidates: $\pi_X(\text{MissingPairs})$
Project the student IDs who missed at least one required CS course:

$$\pi_{\text{s\_id}}(\text{MissingPairs}) = \{\text{s2}, \text{s3}, \text{s4}, \text{s5}\}$$

---

#### Step 5: Subtract disqualified candidates from all candidates:
$$R \div S = \pi_{\text{s\_id}}(R) - \pi_{\text{s\_id}}(\text{MissingPairs})$$
$$\{\text{s1}, \text{s2}, \text{s3}, \text{s4}, \text{s5}\} - \{\text{s2}, \text{s3}, \text{s4}, \text{s5}\} = \mathbf{\{\text{s1}\}}$$

**Resulting Relation:**
| s_id |
| :--- |
| **s1** |

To retrieve her name, we compound with Natural Join:
$$\pi_{\text{name}}\left( \text{Student} \bowtie (R \div S) \right) \implies \{\mathbf{\text{Alice}}\}$$
