# Chapter 4: Extended Relational Algebra (Aggregations, Grouping & Outer Joins)

To bridge the gap between pure mathematical set theory and modern query engines (like SQL), Relational Algebra was extended with operators for arithmetic computation, statistical aggregation, grouping, and null-preserving outer joins.

---

## 1. Generalized Projection ($\pi_{\text{expr}}$)

### Mathematical Definition
Classical projection only allows passing attribute names. **Generalized Projection** extends $\pi$ by permitting arithmetic expressions, scalar functions, and string concatenations over attributes:

$$\pi_{F_1 \to B_1, F_2 \to B_2, \dots, F_k \to B_k}(R)$$

where each $F_i$ is an expression involving constants and attributes of $R$, and $B_i$ is the optional output attribute name.

### Concrete Instantiated Example
Compute a proposed 10% salary bonus for all instructors in the Computer Science department:

$$\pi_{\text{name}, \text{salary}, \ (\text{salary} \times 1.10) \to \text{bonus\_salary}}\left( \sigma_{\text{dept} = \text{'CS'}}(\text{Instructor}) \right)$$

**Resulting Relation:**
| name | salary | bonus_salary |
| :--- | :--- | :--- |
| **Alan Turing** | 120000 | 132000 |
| **Ada Lovelace** | 115000 | 126500 |
| **Claude Shannon** | 95000 | 104500 |

---

## 2. Aggregate & Grouping Operator ($\gamma$ or $\mathcal{G}$)

### Mathematical Definition
The grouping and aggregation operator partitions relation $R$ into disjoint groups based on a set of grouping attributes $G$, evaluates aggregate functions $F_i$ over each group, and returns one tuple per group:

$$_{G_1, G_2, \dots, G_k} \gamma_{F_1(A_1) \to B_1, \dots, F_m(A_m) \to B_m}(R)$$

- **Grouping Attributes ($G$):** Attributes that define partitions.
- **Aggregate Functions ($F$):** $\text{COUNT}, \text{SUM}, \text{AVG}, \text{MIN}, \text{MAX}$.
- **Empty Grouping List ($G = \emptyset$):** If no grouping attributes are specified, the entire relation is treated as a single group, returning exactly one tuple.

### Concrete Instantiated Example 1: Global Aggregation ($G = \emptyset$)
*"Calculate the total number of instructors, the average salary, and the maximum salary across the entire university."*

$$\gamma_{\text{COUNT}(\text{i\_id}) \to \text{num\_inst}, \ \text{AVG}(\text{salary}) \to \text{avg\_sal}, \ \text{MAX}(\text{salary}) \to \text{max\_sal}}(\text{Instructor})$$

**Resulting Relation:**
| num_inst | avg_sal | max_sal |
| :--- | :--- | :--- |
| 6 | 109500.0 | 120000 |

---

### Concrete Instantiated Example 2: Grouping by Department
*"For each department, determine the number of instructors, average salary, and minimum salary."*

$$_{\text{dept}} \gamma_{\text{COUNT}(\text{i\_id}) \to \text{headcount}, \ \text{AVG}(\text{salary}) \to \text{avg\_salary}, \ \text{MIN}(\text{salary}) \to \text{min\_salary}}(\text{Instructor})$$

**Step-by-step Execution:**
1. **Partition by `dept`:**
   - Group `CS`: Alan (120k), Ada (115k), Shannon (95k) $\implies$ Count: 3, Avg: 110,000, Min: 95,000.
   - Group `Math`: Gauss (110k), Noether (112k) $\implies$ Count: 2, Avg: 111,000, Min: 110,000.
   - Group `Physics`: Feynman (105k) $\implies$ Count: 1, Avg: 105,000, Min: 105,000.

**Resulting Relation:**
| dept | headcount | avg_salary | min_salary |
| :--- | :--- | :--- | :--- |
| **CS** | 3 | 110000.0 | 95000 |
| **Math** | 2 | 111000.0 | 110000 |
| **Physics** | 1 | 105000.0 | 105000 |

---

## 💡 Compounding: Grouping + Selection $\implies$ The Relational Algebra `HAVING` Clause

In SQL, the `WHERE` clause filters rows **before** grouping, while the `HAVING` clause filters groups **after** aggregation. In Relational Algebra, this distinction is elegant and seamless due to the Closure Property:

$$\sigma_{p_{\text{group}}}\left( _G \gamma_{F}(R) \right)$$

### Example Query
*"Find all departments where the average instructor salary is strictly greater than \$108,000."*

$$\sigma_{\text{avg\_salary} > 108000}\left( _{\text{dept}} \gamma_{\text{AVG}(\text{salary}) \to \text{avg\_salary}}(\text{Instructor}) \right)$$

1. First, evaluate $_{\text{dept}}\gamma$: produces groups `CS` (110,000), `Math` (111,000), `Physics` (105,000).
2. Second, evaluate $\sigma_{\text{avg\_salary} > 108000}$: eliminates `Physics`.

**Resulting Relation:**
| dept | avg_salary |
| :--- | :--- |
| **CS** | 110000.0 |
| **Math** | 111000.0 |

---

## 3. Outer Joins ($\mathbin{⟕}, \mathbin{⟖}, \mathbin{⟗}$)

In standard (inner) joins, any tuple in $R$ that has no corresponding match in $S$ is discarded ("dangling tuples"). Outer joins preserve these dangling tuples by padding missing attributes with $\text{null}$ ($\bot$).

### 3.1 Left Outer Join ($\mathbin{⟕}$)
Preserves **all** tuples from the left relation $R$:

$$R \mathbin{⟕} S = (R \bowtie S) \cup \left( \left( R - \pi_{\text{attrs}(R)}(R \bowtie S) \right) \times \{(\text{null}, \dots, \text{null})\} \right)$$

### 3.2 Right Outer Join ($\mathbin{⟖}$)
Preserves all tuples from the right relation $S$:

$$R \mathbin{⟖} S = S \mathbin{⟕} R$$

### 3.3 Full Outer Join ($\mathbin{⟗}$)
Preserves all tuples from both $R$ and $S$:

$$R \mathbin{⟗} S = (R \mathbin{⟕} S) \cup (R \mathbin{⟖} S)$$

---

### Concrete Instantiated Example: `Student` $\mathbin{⟕}$ `Enrollment`

Compare what happens when we perform an inner join versus a Left Outer Join:
- Recall that **Fiona (`s6`)** has 0 enrollments.

$$\pi_{\text{s\_id, name, c\_id, grade}}(\text{Student} \mathbin{⟕} \text{Enrollment})$$

**Resulting Relation:**
| s_id | name | c_id | grade |
| :--- | :--- | :--- | :--- |
| s1 | Alice | CS101 | A |
| s1 | Alice | CS102 | A |
| s1 | Alice | CS201 | B |
| s1 | Alice | CS301 | A |
| s2 | Bob | CS101 | B |
| s2 | Bob | CS102 | C |
| s2 | Bob | MATH101 | B |
| s3 | Charlie | MATH101 | A |
| s3 | Charlie | MATH102 | A |
| s3 | Charlie | CS101 | A |
| s4 | Diana | PHYS101 | A |
| s4 | Diana | MATH101 | B |
| s5 | Evan | CS101 | A |
| **s6** | **Fiona** | **null** | **null** |

Fiona is preserved in the output table.

---

## 4. Null Value Semantics and Three-Valued Logic (3VL)

When relations contain $\text{null}$ values, boolean predicate evaluation in Selection ($\sigma_p$) shifts from two-valued logic to **Three-Valued Logic (3VL)**: $\{\text{True}, \text{False}, \text{Unknown}\}$.

### Truth Tables for 3VL:

| $P$ | $Q$ | $P \land Q$ | $P \lor Q$ | $\neg P$ |
| :--- | :--- | :--- | :--- | :--- |
| True | Unknown | **Unknown** | **True** | False |
| False | Unknown | **False** | **Unknown** | True |
| Unknown | Unknown | **Unknown** | **Unknown** | **Unknown** |

> [!CAUTION]
> **The Selection Filter Rule:**
> In Relational Algebra, $\sigma_p(R)$ retains a tuple if and only if $p(t)$ evaluates strictly to **$\text{True}$**.
> If $p(t)$ evaluates to **$\text{False}$** OR **$\text{Unknown}$**, the tuple is rejected!
>
> **Crucial CS Consequence:**
> Comparisons with null (e.g., $\text{c\_id} = \text{null}$ or $\text{c\_id} \neq \text{'CS101'}$) evaluate to **$\text{Unknown}$**, NOT $\text{True}$! Therefore, Fiona's tuple would be eliminated by $\sigma_{\text{c\_id} \neq \text{'CS101'}}$. To test for nullness, explicit operators $\text{IS NULL}$ / $\text{IS NOT NULL}$ are required.
