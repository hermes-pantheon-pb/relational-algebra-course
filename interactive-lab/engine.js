/**
 * In-Browser Pure Relational Algebra Engine
 * Implements Codd's Set Semantics, Primitives, Joins, Division, and Aggregations
 */

const UNIVERSITY_DATA = {
  Student: {
    attributes: ["s_id", "name", "major", "gpa", "year"],
    pk: ["s_id"],
    rows: [
      { s_id: "s1", name: "Alice", major: "CS", gpa: 3.8, year: 3 },
      { s_id: "s2", name: "Bob", major: "CS", gpa: 3.2, year: 2 },
      { s_id: "s3", name: "Charlie", major: "Math", gpa: 3.9, year: 4 },
      { s_id: "s4", name: "Diana", major: "Physics", gpa: 3.5, year: 1 },
      { s_id: "s5", name: "Evan", major: "CS", gpa: 3.9, year: 2 },
      { s_id: "s6", name: "Fiona", major: "Math", gpa: 2.8, year: 1 }
    ]
  },
  Course: {
    attributes: ["c_id", "title", "dept", "credits"],
    pk: ["c_id"],
    rows: [
      { c_id: "CS101", title: "Intro to CS", dept: "CS", credits: 4 },
      { c_id: "CS102", title: "Data Structures", dept: "CS", credits: 4 },
      { c_id: "CS201", title: "Algorithms", dept: "CS", credits: 4 },
      { c_id: "CS301", title: "Databases", dept: "CS", credits: 4 },
      { c_id: "MATH101", title: "Calculus I", dept: "Math", credits: 3 },
      { c_id: "MATH102", title: "Linear Algebra", dept: "Math", credits: 3 },
      { PHYS101: "Physics I", c_id: "PHYS101", title: "Physics I", dept: "Physics", credits: 4 }
    ]
  },
  Enrollment: {
    attributes: ["s_id", "c_id", "semester", "grade"],
    pk: ["s_id", "c_id", "semester"],
    rows: [
      { s_id: "s1", c_id: "CS101", semester: "F22", grade: "A" },
      { s_id: "s1", c_id: "CS102", semester: "S23", grade: "A" },
      { s_id: "s1", c_id: "CS201", semester: "F23", grade: "B" },
      { s_id: "s1", c_id: "CS301", semester: "S24", grade: "A" },
      { s_id: "s2", c_id: "CS101", semester: "F23", grade: "B" },
      { s_id: "s2", c_id: "CS102", semester: "S24", grade: "C" },
      { s_id: "s2", c_id: "MATH101", semester: "F23", grade: "B" },
      { s_id: "s3", c_id: "MATH101", semester: "F21", grade: "A" },
      { s_id: "s3", c_id: "MATH102", semester: "S22", grade: "A" },
      { s_id: "s3", c_id: "CS101", semester: "F22", grade: "A" },
      { s_id: "s4", c_id: "PHYS101", semester: "F23", grade: "A" },
      { s_id: "s4", c_id: "MATH101", semester: "F23", grade: "B" },
      { s_id: "s5", c_id: "CS101", semester: "F23", grade: "A" }
    ]
  },
  Instructor: {
    attributes: ["i_id", "name", "dept", "salary"],
    pk: ["i_id"],
    rows: [
      { i_id: "i1", name: "Alan Turing", dept: "CS", salary: 120000 },
      { i_id: "i2", name: "Ada Lovelace", dept: "CS", salary: 115000 },
      { i_id: "i3", name: "Carl Gauss", dept: "Math", salary: 110000 },
      { i_id: "i4", name: "Emmy Noether", dept: "Math", salary: 112000 },
      { i_id: "i5", name: "Richard Feynman", dept: "Physics", salary: 105000 },
      { i_id: "i6", name: "Claude Shannon", dept: "CS", salary: 95000 }
    ]
  },
  Teaches: {
    attributes: ["i_id", "c_id", "semester"],
    pk: ["i_id", "c_id", "semester"],
    rows: [
      { i_id: "i1", c_id: "CS101", semester: "F22" },
      { i_id: "i1", c_id: "CS101", semester: "F23" },
      { i_id: "i1", c_id: "CS201", semester: "F23" },
      { i_id: "i2", c_id: "CS102", semester: "S23" },
      { i_id: "i2", c_id: "CS102", semester: "S24" },
      { i_id: "i2", c_id: "CS301", semester: "S24" },
      { i_id: "i3", c_id: "MATH101", semester: "F21" },
      { i_id: "i3", c_id: "MATH101", semester: "F23" },
      { i_id: "i4", c_id: "MATH102", semester: "S22" },
      { i_id: "i5", c_id: "PHYS101", semester: "F23" }
    ]
  },
  Prereq: {
    attributes: ["c_id", "prereq_id"],
    pk: ["c_id", "prereq_id"],
    rows: [
      { c_id: "CS102", prereq_id: "CS101" },
      { c_id: "CS201", prereq_id: "CS102" },
      { c_id: "CS301", prereq_id: "CS102" },
      { c_id: "MATH102", prereq_id: "MATH101" }
    ]
  }
};

class RelTable {
  constructor(name, attributes, rows) {
    this.name = name;
    this.attributes = [...attributes];
    this.rows = this._deduplicate(rows || []);
  }

  _tupleKey(row) {
    return this.attributes.map(a => String(row[a] !== undefined ? row[a] : "__NULL__")).join("::");
  }

  _deduplicate(rawRows) {
    const seen = new Set();
    const result = [];
    for (const r of rawRows) {
      const cleaned = {};
      for (const a of this.attributes) {
        cleaned[a] = r[a] !== undefined ? r[a] : null;
      }
      const key = this.attributes.map(a => String(cleaned[a])).join("::");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(cleaned);
      }
    }
    return result;
  }

  get cardinality() {
    return this.rows.length;
  }

  get degree() {
    return this.attributes.length;
  }

  clone(newName) {
    return new RelTable(newName || this.name, this.attributes, this.rows);
  }
}

// --- RELATIONAL ALGEBRA ENGINE CORE ---
const RAEngine = {
  // Load base table
  getBaseTable(name) {
    if (!UNIVERSITY_DATA[name]) throw new Error(`Table ${name} not found`);
    return new RelTable(name, UNIVERSITY_DATA[name].attributes, UNIVERSITY_DATA[name].rows);
  },

  // Selection: σ_p(R)
  select(rel, predicateFn, desc) {
    const filtered = rel.rows.filter(predicateFn);
    return new RelTable(`σ[${desc || "predicate"}](${rel.name})`, rel.attributes, filtered);
  },

  // Projection: π_L(R)
  project(rel, attrList) {
    const validAttrs = attrList.filter(a => rel.attributes.includes(a));
    const newRows = rel.rows.map(r => {
      const item = {};
      validAttrs.forEach(a => item[a] = r[a]);
      return item;
    });
    return new RelTable(`π[${validAttrs.join(", ")}](${rel.name})`, validAttrs, newRows);
  },

  // Cartesian Product: R × S
  crossProduct(r1, r2, prefix1 = "R1", prefix2 = "R2") {
    const attrs = [
      ...r1.attributes.map(a => `${prefix1}.${a}`),
      ...r2.attributes.map(a => `${prefix2}.${a}`)
    ];
    const newRows = [];
    for (const row1 of r1.rows) {
      for (const row2 of r2.rows) {
        const item = {};
        r1.attributes.forEach(a => item[`${prefix1}.${a}`] = row1[a]);
        r2.attributes.forEach(a => item[`${prefix2}.${a}`] = row2[a]);
        newRows.push(item);
      }
    }
    return new RelTable(`(${r1.name} × ${r2.name})`, attrs, newRows);
  },

  // Natural Join: R ⋈ S
  naturalJoin(r1, r2) {
    const shared = r1.attributes.filter(a => r2.attributes.includes(a));
    const r2Only = r2.attributes.filter(a => !shared.includes(a));
    const finalAttrs = [...r1.attributes, ...r2Only];

    const matched = [];
    for (const row1 of r1.rows) {
      for (const row2 of r2.rows) {
        const isMatch = shared.every(a => row1[a] === row2[a]);
        if (isMatch) {
          const merged = { ...row1 };
          r2Only.forEach(a => merged[a] = row2[a]);
          matched.push(merged);
        }
      }
    }
    return new RelTable(`(${r1.name} ⋈ ${r2.name})`, finalAttrs, matched);
  },

  // Theta Join: R ⋈_θ S
  thetaJoin(r1, r2, thetaFn, desc, prefix1 = "R1", prefix2 = "R2") {
    const cp = this.crossProduct(r1, r2, prefix1, prefix2);
    const filtered = cp.rows.filter(thetaFn);
    return new RelTable(`(${r1.name} ⋈[${desc}] ${r2.name})`, cp.attributes, filtered);
  },

  // Set Union: R ∪ S
  union(r1, r2) {
    if (r1.attributes.length !== r2.attributes.length) {
      throw new Error("Union compatibility violation: degree mismatch.");
    }
    return new RelTable(`(${r1.name} ∪ ${r2.name})`, r1.attributes, [...r1.rows, ...r2.rows]);
  },

  // Set Difference: R - S
  difference(r1, r2) {
    const r2Keys = new Set(r2.rows.map(r => r2._tupleKey(r)));
    const remaining = r1.rows.filter(r => !r2Keys.has(r1._tupleKey(r)));
    return new RelTable(`(${r1.name} - ${r2.name})`, r1.attributes, remaining);
  },

  // Set Intersection: R ∩ S = R - (R - S)
  intersect(r1, r2) {
    return this.difference(r1, this.difference(r1, r2));
  },

  // Semi-Join: R ⋉ S = π_{attrs(R)}(R ⋈ S)
  semiJoin(r1, r2) {
    const joined = this.naturalJoin(r1, r2);
    const projected = this.project(joined, r1.attributes);
    projected.name = `(${r1.name} ⋉ ${r2.name})`;
    return projected;
  },

  // Anti-Semi-Join: R ▷ S = R - (R ⋉ S)
  antiJoin(r1, r2) {
    const semi = this.semiJoin(r1, r2);
    const diff = this.difference(r1, semi);
    diff.name = `(${r1.name} ▷ ${r2.name})`;
    return diff;
  },

  // Left Outer Join: R ⟕ S
  leftOuterJoin(r1, r2) {
    const shared = r1.attributes.filter(a => r2.attributes.includes(a));
    const r2Only = r2.attributes.filter(a => !shared.includes(a));
    const finalAttrs = [...r1.attributes, ...r2Only];

    const resultRows = [];
    for (const row1 of r1.rows) {
      const matches = r2.rows.filter(row2 => shared.every(a => row1[a] === row2[a]));
      if (matches.length > 0) {
        for (const row2 of matches) {
          const merged = { ...row1 };
          r2Only.forEach(a => merged[a] = row2[a]);
          resultRows.push(merged);
        }
      } else {
        // Pad with null
        const padded = { ...row1 };
        r2Only.forEach(a => padded[a] = null);
        resultRows.push(padded);
      }
    }
    return new RelTable(`(${r1.name} ⟕ ${r2.name})`, finalAttrs, resultRows);
  },

  // Relational Division: R(X, Y) ÷ S(Y) with detailed trace!
  divisionWithTrace(r1, r2, xAttrs, yAttrs) {
    const trace = [];

    // Step 1: Candidate Entities π_X(R)
    const piXR = this.project(r1, xAttrs);
    piXR.name = "Candidates π_X(R)";
    trace.push({
      step: "1. Project Candidates π_X(R)",
      desc: "All entities present in R that could potentially meet the condition.",
      table: piXR
    });

    // Step 2: Ideal combinations π_X(R) × S
    const idealRows = [];
    for (const rX of piXR.rows) {
      for (const rS of r2.rows) {
        const item = { ...rX };
        yAttrs.forEach(y => item[y] = rS[y]);
        idealRows.push(item);
      }
    }
    const idealRel = new RelTable("Ideal Requirements (π_X(R) × S)", [...xAttrs, ...yAttrs], idealRows);
    trace.push({
      step: "2. Cartesian Product (π_X(R) × S)",
      desc: "The hypothetical table if EVERY candidate had satisfied EVERY required target item.",
      table: idealRel
    });

    // Step 3: Missing pairs: Ideal - R
    // Keep only X and Y columns from R for fair comparison
    const rProjected = this.project(r1, [...xAttrs, ...yAttrs]);
    const missingRel = this.difference(idealRel, rProjected);
    missingRel.name = "Missing Pairs ((π_X(R) × S) - R)";
    trace.push({
      step: "3. Identify Missing Requirements",
      desc: "Pairs that candidate entities were expected to have, but do not actually possess.",
      table: missingRel
    });

    // Step 4: Disqualified Candidates π_X(Missing)
    const disqualified = this.project(missingRel, xAttrs);
    disqualified.name = "Disqualified Candidates";
    trace.push({
      step: "4. Disqualified Candidates π_X(Missing)",
      desc: "Any candidate missing at least one requirement is flagged for elimination.",
      table: disqualified
    });

    // Step 5: Final Set Difference: Candidates - Disqualified
    const finalRel = this.difference(piXR, disqualified);
    finalRel.name = `${r1.name} ÷ ${r2.name}`;
    trace.push({
      step: "5. Final Candidates - Disqualified",
      desc: "Only entities that missed zero requirements remain in the final relation.",
      table: finalRel
    });

    return { result: finalRel, trace };
  },

  // Aggregation & Grouping: _G γ_F(R)
  aggregate(rel, groupAttrs, aggs) {
    // Partition
    const groups = new Map();
    for (const row of rel.rows) {
      const gKey = groupAttrs.map(a => String(row[a])).join("::");
      if (!groups.has(gKey)) {
        groups.set(gKey, {
          sampleRow: row,
          rows: []
        });
      }
      groups.get(gKey).rows.push(row);
    }

    const outputAttrs = [...groupAttrs, ...aggs.map(a => a.as)];
    const outRows = [];

    for (const [_, gData] of groups) {
      const outRow = {};
      groupAttrs.forEach(a => outRow[a] = gData.sampleRow[a]);

      for (const agg of aggs) {
        const vals = gData.rows.map(r => r[agg.attr]).filter(v => v !== null && v !== undefined);
        let computed = 0;
        if (agg.type === "COUNT") {
          computed = gData.rows.length;
        } else if (agg.type === "SUM") {
          computed = vals.reduce((a, b) => a + Number(b), 0);
        } else if (agg.type === "AVG") {
          computed = vals.length > 0 ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length) : 0;
          computed = Math.round(computed * 100) / 100;
        } else if (agg.type === "MIN") {
          computed = Math.min(...vals.map(Number));
        } else if (agg.type === "MAX") {
          computed = Math.max(...vals.map(Number));
        }
        outRow[agg.as] = computed;
      }
      outRows.push(outRow);
    }

    return new RelTable(`_${groupAttrs.join(",")} γ (${rel.name})`, outputAttrs, outRows);
  }
};
