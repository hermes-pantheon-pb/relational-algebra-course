# Chapter 0: The Instantiated Relational Model & Benchmark Dataset

Before introducing algebraic operators, any rigorous study of Relational Algebra requires an unambiguous, formal database instance. This benchmark dataset serves as the single source of truth across all chapters, derivations, query trees, and exam problems in this course.

---

## 1. Formal Mathematical Definitions

In the relational model proposed by E.F. Codd (1970):

1. **Domain ($D$):** A domain is a set of atomic (indivisible) values. E.g., $\text{dom}(\text{gpa}) = \{x \in \mathbb{R} \mid 0.0 \le x \le 4.0\}$.
2. **Attribute ($A$):** A named label representing the role played by some domain in a relation schema.
3. **Relation Schema ($R(A_1: D_1, A_2: D_2, \dots, A_n: D_n)$):** A finite list of attribute names paired with domains. The degree (or arity) of $R$ is $n$.
4. **Tuple ($t$):** An element of the Cartesian product $D_1 \times D_2 \times \dots \times D_n$. A tuple is a function that maps each attribute name $A_i$ to a value $v_i \in D_i$.
5. **Relation Instance ($r(R)$ or simply $R$):** A finite set of tuples:
   $$r(R) \subseteq D_1 \times D_2 \times \dots \times D_n$$
   The cardinality of $r(R)$, denoted $|R|$, is the number of tuples in $R$.

> [!IMPORTANT]
> **Pure Relational Algebra operates on mathematical SETS, not BAGS (multisets).**
> - Duplicate tuples cannot exist within a valid relation instance.
> - Tuples have no intrinsic ordering (order is commutative: $\{t_1, t_2\} \equiv \{t_2, t_1\}$).
> - Attributes have distinct names within a schema.

---

## 2. Integrity Constraints

- **Superkey:** A subset of attributes $K \subseteq R$ such that no two distinct tuples in any valid relation instance can have identical values for $K$:
  $$\forall t_1, t_2 \in R, \ (t_1 \neq t_2 \implies t_1[K] \neq t_2[K])$$
- **Candidate Key:** A minimal superkey (no proper subset of $K$ is a superkey).
- **Primary Key ($\underline{\text{PK}}$):** The designated candidate key chosen by the database designer. Underlined in schema notation.
- **Foreign Key ($\text{FK}$):** A set of attributes in referencing relation $R_1$ that must match the primary key of referenced relation $R_2$ or be null (Referential Integrity Constraint).

---

## 3. The University Relational Schema

Our reference database models an academic institution:

$$\begin{aligned}
&\text{Student}(\underline{\text{s\_id}}, \text{name}, \text{major}, \text{gpa}, \text{year}) \\
&\text{Course}(\underline{\text{c\_id}}, \text{title}, \text{dept}, \text{credits}) \\
&\text{Enrollment}(\underline{\text{s\_id}, \text{c\_id}, \text{semester}}, \text{grade}) \\
&\text{Instructor}(\underline{\text{i\_id}}, \text{name}, \text{dept}, \text{salary}) \\
&\text{Teaches}(\underline{\text{i\_id}, \text{c\_id}, \text{semester}}) \\
&\text{Prereq}(\underline{\text{c\_id}, \text{prereq\_id}})
\end{aligned}$$

### Referential Constraints:
- $\text{Enrollment}[\text{s\_id}] \subseteq \text{Student}[\text{s\_id}]$
- $\text{Enrollment}[\text{c\_id}] \subseteq \text{Course}[\text{c\_id}]$
- $\text{Teaches}[\text{i\_id}] \subseteq \text{Instructor}[\text{i\_id}]$
- $\text{Teaches}[\text{c\_id}] \subseteq \text{Course}[\text{c\_id}]$
- $\text{Prereq}[\text{c\_id}] \subseteq \text{Course}[\text{c\_id}]$
- $\text{Prereq}[\text{prereq\_id}] \subseteq \text{Course}[\text{c\_id}]$

---

## 4. Instantiated Relations (Tabular Instances)

### Table 1: `Student` (Degree = 5, Cardinality = 6)
| s_id | name | major | gpa | year |
| :--- | :--- | :--- | :--- | :--- |
| **s1** | Alice | CS | 3.8 | 3 |
| **s2** | Bob | CS | 3.2 | 2 |
| **s3** | Charlie | Math | 3.9 | 4 |
| **s4** | Diana | Physics | 3.5 | 1 |
| **s5** | Evan | CS | 3.9 | 2 |
| **s6** | Fiona | Math | 2.8 | 1 |

*Observations for pedagogical queries:*
- `Alice`, `Bob`, `Evan` are `CS` majors; `Charlie`, `Fiona` are `Math`; `Diana` is `Physics`.
- High GPA ($\ge 3.8$): `Alice` (3.8), `Charlie` (3.9), `Evan` (3.9).
- `Fiona` has enrolled in **0 courses** (essential for testing set differences and outer joins).

---

### Table 2: `Course` (Degree = 4, Cardinality = 7)
| c_id | title | dept | credits |
| :--- | :--- | :--- | :--- |
| **CS101** | Intro to CS | CS | 4 |
| **CS102** | Data Structures | CS | 4 |
| **CS201** | Algorithms | CS | 4 |
| **CS301** | Databases | CS | 4 |
| **MATH101** | Calculus I | Math | 3 |
| **MATH102** | Linear Algebra | Math | 3 |
| **PHYS101** | Physics I | Physics | 4 |

---

### Table 3: `Enrollment` (Degree = 4, Cardinality = 13)
| s_id | c_id | semester | grade |
| :--- | :--- | :--- | :--- |
| **s1** | CS101 | F22 | A |
| **s1** | CS102 | S23 | A |
| **s1** | CS201 | F23 | B |
| **s1** | CS301 | S24 | A |
| **s2** | CS101 | F23 | B |
| **s2** | CS102 | S24 | C |
| **s2** | MATH101 | F23 | B |
| **s3** | MATH101 | F21 | A |
| **s3** | MATH102 | S22 | A |
| **s3** | CS101 | F22 | A |
| **s4** | PHYS101 | F23 | A |
| **s4** | MATH101 | F23 | B |
| **s5** | CS101 | F23 | A |

*Key Structural Highlights:*
- `s1` (Alice) has completed **all four CS courses** (`CS101`, `CS102`, `CS201`, `CS301`). Crucial benchmark for the **Division operator ($\div$)**.
- `s5` (Evan) has completed **exactly 1 course** (`CS101`).
- `s6` (Fiona) does not appear in `Enrollment`.

---

### Table 4: `Instructor` (Degree = 4, Cardinality = 6)
| i_id | name | dept | salary |
| :--- | :--- | :--- | :--- |
| **i1** | Alan Turing | CS | 120000 |
| **i2** | Ada Lovelace | CS | 115000 |
| **i3** | Carl Gauss | Math | 110000 |
| **i4** | Emmy Noether | Math | 112000 |
| **i5** | Richard Feynman | Physics | 105000 |
| **i6** | Claude Shannon | CS | 95000 |

*Key Structural Highlights:*
- Maximum salary: `Alan Turing` ($120,000$).
- Minimum salary: `Claude Shannon` ($95,000$).
- `Claude Shannon` teaches **0 courses** (dangling tuple in joins with `Teaches`).

---

### Table 5: `Teaches` (Degree = 3, Cardinality = 10)
| i_id | c_id | semester |
| :--- | :--- | :--- |
| **i1** | CS101 | F22 |
| **i1** | CS101 | F23 |
| **i1** | CS201 | F23 |
| **i2** | CS102 | S23 |
| **i2** | CS102 | S24 |
| **i2** | CS301 | S24 |
| **i3** | MATH101 | F21 |
| **i3** | MATH101 | F23 |
| **i4** | MATH102 | S22 |
| **i5** | PHYS101 | F23 |

---

### Table 6: `Prereq` (Degree = 2, Cardinality = 4)
| c_id | prereq_id |
| :--- | :--- |
| **CS102** | CS101 |
| **CS201** | CS102 |
| **CS301** | CS102 |
| **MATH102** | MATH101 |

*Note:* `CS201` and `CS301` have direct prerequisite `CS102`, which in turn requires `CS101`. This multi-hop dependency will illustrate the limits of pure relational algebra regarding recursive/transitive queries.
