# Relational Algebra Quick Reference & Cheatsheet

A concise, high-yield reference for symbols, syntax, operator properties, algebraic laws, and SQL mappings.

---

## 1. Symbol & Operator Notation

| Operator | Mathematical Symbol | ASCII / Text Alternative | Arity | Description |
| :--- | :---: | :---: | :---: | :--- |
| **Selection** | $\sigma_p(R)$ | `SIGMA[p](R)` | Unary | Filters tuples satisfying predicate $p$. |
| **Projection** | $\pi_L(R)$ | `PI[L](R)` | Unary | Extracts attribute list $L$, eliminates duplicates. |
| **Rename** | $\rho_{S}(R)$ or $\rho_{A \to B}(R)$ | `RHO[S](R)` | Unary | Renames relation or attributes. |
| **Cartesian Product** | $R \times S$ | `R TIMES S` | Binary | Pairs every tuple of $R$ with every tuple of $S$. |
| **Set Union** | $R \cup S$ | `R UNION S` | Binary | Combines tuples from union-compatible relations. |
| **Set Difference** | $R - S$ | `R MINUS S` | Binary | Tuples in $R$ but not in $S$ (union-compatible). |
| **Set Intersection** | $R \cap S$ | `R INTERSECT S` | Binary | Tuples in both $R$ and $S$ ($R - (R - S)$). |
| **Theta Join** | $R \bowtie_\theta S$ | `R JOIN[theta] S` | Binary | $\sigma_\theta(R \times S)$. |
| **Natural Join** | $R \bowtie S$ | `R JOIN S` | Binary | Equi-join on shared attributes, removes redundant cols. |
| **Division** | $R \div S$ | `R DIV S` | Binary | Universal quantification: tuples in $\pi_X(R)$ matching all $S$. |
| **Semi-Join** | $R \ltimes S$ | `R SEMIJOIN S` | Binary | $\pi_{\text{attrs}(R)}(R \bowtie S)$. |
| **Anti-Semi-Join** | $R \triangleright S$ | `R ANTIJOIN S` | Binary | $R - (R \ltimes S)$ (tuples in $R$ with no match in $S$). |
| **Left Outer Join** | $R \mathbin{⟕} S$ | `R LEFT JOIN S` | Binary | Preserves all $R$ tuples; pads missing $S$ with null. |
| **Right Outer Join** | $R \mathbin{⟖} S$ | `R RIGHT JOIN S` | Binary | Preserves all $S$ tuples; pads missing $R$ with null. |
| **Full Outer Join** | $R \mathbin{⟗} S$ | `R FULL JOIN S` | Binary | Preserves all tuples from both $R$ and $S$. |
| **Aggregate / Group** | $_G \gamma_F(R)$ | `GAMMA[G, F](R)` | Unary | Groups by $G$, applies aggregate functions $F$. |

---

## 2. Operator Precedence (Standard Order of Evaluation)

From highest to lowest precedence:
1. **Unary Operators:** $\sigma_p$, $\pi_L$, $\rho$, $_G \gamma_F$
2. **Multiplicative Operators:** $\times$, $\bowtie$, $\bowtie_\theta$, $\div$, $\ltimes$, $\triangleright$
3. **Additive Operators:** $\cap$, $\cup$, $-$

*Parentheses should be used freely to eliminate ambiguity.*

---

## 3. Relational Algebra to SQL Translation

| Relational Algebra | SQL Equivalent |
| :--- | :--- |
| $\sigma_{\text{age} > 21}(R)$ | `SELECT * FROM R WHERE age > 21` |
| $\pi_{\text{name, gpa}}(R)$ | `SELECT DISTINCT name, gpa FROM R` |
| $R \times S$ | `SELECT * FROM R CROSS JOIN S` |
| $R \bowtie S$ | `SELECT * FROM R NATURAL JOIN S` |
| $R \bowtie_{R.id = S.id} S$ | `SELECT * FROM R JOIN S ON R.id = S.id` |
| $R \cup S$ | `SELECT * FROM R UNION SELECT * FROM S` |
| $R - S$ | `SELECT * FROM R EXCEPT SELECT * FROM S` |
| $R \cap S$ | `SELECT * FROM R INTERSECT SELECT * FROM S` |
| $R \mathbin{⟕} S$ | `SELECT * FROM R LEFT OUTER JOIN S USING (...)` |
| $_G \gamma_{\text{COUNT}(A), \text{AVG}(B)}(R)$ | `SELECT G, COUNT(A), AVG(B) FROM R GROUP BY G` |
| $\sigma_{\text{avg} > 3.0}(_G \gamma_{\dots}(R))$ | `SELECT G, AVG(B) FROM R GROUP BY G HAVING AVG(B) > 3.0` |
| $R(X, Y) \div S(Y)$ | `SELECT DISTINCT R1.X FROM R R1 WHERE NOT EXISTS (SELECT S.Y FROM S EXCEPT SELECT R2.Y FROM R R2 WHERE R2.X = R1.X)` |

---

## 4. Key Algebraic Transformation Rules (Optimizer Cheat Sheet)

- **Selection Cascading:** $\sigma_{c_1 \land c_2}(R) \equiv \sigma_{c_1}(\sigma_{c_2}(R))$
- **Selection Commutativity:** $\sigma_{c_1}(\sigma_{c_2}(R)) \equiv \sigma_{c_2}(\sigma_{c_1}(R))$
- **Projection Cascading:** $\pi_{L_1}(\pi_{L_2}(R)) \equiv \pi_{L_1}(R)$ where $L_1 \subseteq L_2$
- **Join Commutativity:** $R \bowtie S \equiv S \bowtie R$
- **Join Associativity:** $(R \bowtie S) \bowtie T \equiv R \bowtie (S \bowtie T)$
- **Pushing Selection into Join:**
  $$\sigma_{c}(R \bowtie S) \equiv \sigma_c(R) \bowtie S \quad (\text{if } c \text{ only uses attrs of } R)$$
- **Pushing Selection into Union:**
  $$\sigma_{c}(R \cup S) \equiv \sigma_c(R) \cup \sigma_c(S)$$
- **Pushing Selection into Difference:**
  $$\sigma_{c}(R - S) \equiv \sigma_c(R) - \sigma_c(S) \equiv \sigma_c(R) - S$$
