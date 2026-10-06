#!/usr/bin/env python3
"""
Relational Algebra Reference Evaluator & CLI
Part of the Relational Algebra Masterclass.

Executes relational algebra operators directly on the benchmark University dataset.
"""

import json
import os
import sys
from typing import List, Dict, Any, Set, Tuple

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "university_dataset.json")

def load_dataset() -> Dict[str, Any]:
    with open(DATA_FILE, "r") as f:
        return json.load(f)["relations"]

class Relation:
    def __init__(self, name: str, attributes: List[str], rows: List[Dict[str, Any]]):
        self.name = name
        self.attributes = list(attributes)
        # Deduplicate rows under set semantics
        self.rows = self._deduplicate(rows)

    def _deduplicate(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen = set()
        unique = []
        for r in rows:
            key = tuple((k, r.get(k)) for k in sorted(self.attributes))
            if key not in seen:
                seen.add(key)
                unique.append({k: r.get(k) for k in self.attributes})
        return unique

    def display(self, title: str = ""):
        print("\n" + "=" * 65)
        heading = f" Relation: {self.name} " if not title else f" {title} "
        print(f"{heading:^65}")
        print("=" * 65)
        if not self.attributes:
            print("(Empty schema)")
            return
        
        # Determine column widths
        col_widths = {col: max(len(col), 8) for col in self.attributes}
        for row in self.rows:
            for col in self.attributes:
                val = str(row.get(col, "NULL"))
                col_widths[col] = max(col_widths[col], len(val))

        # Print header
        header_line = " | ".join(f"{col:{col_widths[col]}}" for col in self.attributes)
        print(f"| {header_line} |")
        print("|" + "|".join("-" * (col_widths[col] + 2) for col in self.attributes) + "|")

        if not self.rows:
            print("| (0 tuples / empty set)" + " " * (sum(col_widths.values()) + len(col_widths) * 3 - 22) + "|")
        else:
            for row in self.rows:
                row_line = " | ".join(f"{str(row.get(col, 'NULL')):{col_widths[col]}}" for col in self.attributes)
                print(f"| {row_line} |")
        print(f"Cardinality: {len(self.rows)} | Degree: {len(self.attributes)}")
        print("=" * 65)

# --- Relational Algebra Operators ---

def project(rel: Relation, attrs: List[str]) -> Relation:
    """π_L(R): Projection"""
    new_rows = []
    for r in rel.rows:
        new_rows.append({k: r.get(k) for k in attrs})
    return Relation(f"π_{{{','.join(attrs)}}}({rel.name})", attrs, new_rows)

def select(rel: Relation, predicate) -> Relation:
    """σ_p(R): Selection"""
    matched = [r for r in rel.rows if predicate(r)]
    return Relation(f"σ({rel.name})", rel.attributes, matched)

def cartesian_product(r1: Relation, r2: Relation, prefix1: str = "R1", prefix2: str = "R2") -> Relation:
    """R × S: Cross product with prefixing for disambiguation"""
    attrs = [f"{prefix1}.{a}" for a in r1.attributes] + [f"{prefix2}.{a}" for a in r2.attributes]
    rows = []
    for row1 in r1.rows:
        for row2 in r2.rows:
            combined = {}
            for a in r1.attributes:
                combined[f"{prefix1}.{a}"] = row1.get(a)
            for a in r2.attributes:
                combined[f"{prefix2}.{a}"] = row2.get(a)
            rows.append(combined)
    return Relation(f"{r1.name} × {r2.name}", attrs, rows)

def natural_join(r1: Relation, r2: Relation) -> Relation:
    """R ⋈ S: Natural Join"""
    shared = set(r1.attributes).intersection(set(r2.attributes))
    combined_attrs = list(r1.attributes) + [a for a in r2.attributes if a not in shared]
    matched_rows = []
    for row1 in r1.rows:
        for row2 in r2.rows:
            if all(row1.get(k) == row2.get(k) for k in shared):
                merged = {**row1, **row2}
                matched_rows.append(merged)
    return Relation(f"{r1.name} ⋈ {r2.name}", combined_attrs, matched_rows)

def set_union(r1: Relation, r2: Relation) -> Relation:
    """R ∪ S: Union"""
    if set(r1.attributes) != set(r2.attributes):
        raise ValueError("Union-compatibility violated: attributes do not match.")
    return Relation(f"{r1.name} ∪ {r2.name}", r1.attributes, r1.rows + r2.rows)

def set_difference(r1: Relation, r2: Relation) -> Relation:
    """R - S: Difference"""
    if set(r1.attributes) != set(r2.attributes):
        raise ValueError("Union-compatibility violated: attributes do not match.")
    r2_tuples = {tuple(r.get(k) for k in sorted(r1.attributes)) for r in r2.rows}
    result_rows = [r for r in r1.rows if tuple(r.get(k) for k in sorted(r1.attributes)) not in r2_tuples]
    return Relation(f"{r1.name} - {r2.name}", r1.attributes, result_rows)

def set_intersection(r1: Relation, r2: Relation) -> Relation:
    """R ∩ S: Intersection"""
    return set_difference(r1, set_difference(r1, r2))

def division(r1: Relation, r2: Relation, x_attrs: List[str], y_attrs: List[str]) -> Relation:
    """
    R(X, Y) ÷ S(Y): Relational Division
    Derivation: π_X(R) - π_X( (π_X(R) × S) - R )
    """
    pi_x_r = project(r1, x_attrs)
    
    # Cartesian product: (π_X(R) × S)
    ideal_combinations = []
    for row_x in pi_x_r.rows:
        for row_s in r2.rows:
            combined = {**row_x}
            for y in y_attrs:
                combined[y] = row_s.get(y)
            ideal_combinations.append(combined)
    ideal_rel = Relation("Ideal_Combinations", x_attrs + y_attrs, ideal_combinations)
    
    # Missing combinations: Ideal - R
    missing_rel = set_difference(ideal_rel, r1)
    
    # Candidates with missing attributes:
    disqualified = project(missing_rel, x_attrs)
    
    # Final: Candidates - Disqualified
    result = set_difference(pi_x_r, disqualified)
    result.name = f"{r1.name} ÷ {r2.name}"
    return result

def left_outer_join(r1: Relation, r2: Relation) -> Relation:
    """R ⟕ S: Left Outer Join"""
    shared = set(r1.attributes).intersection(set(r2.attributes))
    combined_attrs = list(r1.attributes) + [a for a in r2.attributes if a not in shared]
    out_rows = []
    
    for row1 in r1.rows:
        matches = [row2 for row2 in r2.rows if all(row1.get(k) == row2.get(k) for k in shared)]
        if matches:
            for row2 in matches:
                out_rows.append({**row1, **row2})
        else:
            # Pad with null
            padded = {**row1}
            for a in r2.attributes:
                if a not in shared:
                    padded[a] = None
            out_rows.append(padded)
    return Relation(f"{r1.name} ⟕ {r2.name}", combined_attrs, out_rows)

# --- CLI Demonstrations ---

def run_demos():
    data = load_dataset()
    students = Relation("Student", data["Student"]["attributes"], data["Student"]["rows"])
    courses = Relation("Course", data["Course"]["attributes"], data["Course"]["rows"])
    enrollment = Relation("Enrollment", data["Enrollment"]["attributes"], data["Enrollment"]["rows"])
    instructors = Relation("Instructor", data["Instructor"]["attributes"], data["Instructor"]["rows"])
    teaches = Relation("Teaches", data["Teaches"]["attributes"], data["Teaches"]["rows"])

    print("\n🎓 RELATIONAL ALGEBRA ENGINE CLI DEMONSTRATIONS 🎓\n")
    
    # Demo 1: Selection & Projection compounding
    print("► DEMO 1: Selection & Projection (CS students with GPA >= 3.8)")
    d1 = project(select(students, lambda r: r["major"] == "CS" and r["gpa"] >= 3.8), ["s_id", "name", "gpa"])
    d1.display()

    # Demo 2: Natural Join
    print("► DEMO 2: Natural Join (Student ⋈ Enrollment)")
    d2 = natural_join(students, enrollment)
    project(d2, ["s_id", "name", "c_id", "grade"]).display("Student Enrollments Slice")

    # Demo 3: Division (Students who took ALL CS courses)
    print("► DEMO 3: Relational Division (Students enrolled in ALL CS courses)")
    cs_courses = project(select(courses, lambda r: r["dept"] == "CS"), ["c_id"])
    cs_courses.display("Target: All CS Courses")
    
    student_course_pairs = project(enrollment, ["s_id", "c_id"])
    all_cs_students = division(student_course_pairs, cs_courses, ["s_id"], ["c_id"])
    all_cs_students.display("Division Result: Student IDs matching all CS courses")
    
    student_details = natural_join(students, all_cs_students)
    project(student_details, ["s_id", "name", "major"]).display("Student Info")

    # Demo 4: Finding Max Salary without Aggregation
    print("► DEMO 4: Highest-Paid Instructor (Using Difference & Self-Cross-Product)")
    inst1_rows = instructors.rows
    lower_earners = []
    for r1 in inst1_rows:
        for r2 in inst1_rows:
            if r1["salary"] < r2["salary"]:
                lower_earners.append({"i_id": r1["i_id"]})
    lower_rel = Relation("LowerEarners", ["i_id"], lower_earners)
    all_inst_ids = project(instructors, ["i_id"])
    max_id = set_difference(all_inst_ids, lower_rel)
    max_instructor = natural_join(instructors, max_id)
    project(max_instructor, ["i_id", "name", "salary"]).display("Maximum Salary Result")

    # Demo 5: Left Outer Join with Dangling Tuples
    print("► DEMO 5: Left Outer Join (Preserving Fiona who has 0 enrollments)")
    loj = left_outer_join(students, enrollment)
    project(loj, ["s_id", "name", "c_id", "grade"]).display("Left Outer Join Result")

if __name__ == "__main__":
    run_demos()
