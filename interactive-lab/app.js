/**
 * Relational Algebra Masterclass - Interactive Lab UI Controller
 */

// Utility: render a RelTable instance into an HTML table element
function renderTableHTML(relTable, options = {}) {
  const container = document.createElement("div");
  container.className = "table-container";

  const headerBar = document.createElement("div");
  headerBar.className = "table-header-bar";
  headerBar.innerHTML = `
    <h3>${options.title || relTable.name}</h3>
    <span class="meta-stats">${relTable.cardinality} tuples · degree ${relTable.degree}</span>
  `;
  container.appendChild(headerBar);

  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "table-scroll";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  relTable.attributes.forEach(attr => {
    const th = document.createElement("th");
    th.textContent = attr;
    if (options.pk && options.pk.includes(attr)) {
      th.className = "pk-col";
      th.title = "Primary Key Component";
    }
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  if (relTable.rows.length === 0) {
    const emptyRow = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Math.max(relTable.attributes.length, 1);
    td.className = "null-val";
    td.style.textAlign = "center";
    td.style.padding = "1.5rem";
    td.textContent = "∅ (Empty Relation - 0 tuples satisfy condition)";
    emptyRow.appendChild(td);
    tbody.appendChild(emptyRow);
  } else {
    relTable.rows.forEach(row => {
      const tr = document.createElement("tr");
      relTable.attributes.forEach(attr => {
        const td = document.createElement("td");
        const val = row[attr];
        if (val === null || val === undefined) {
          td.innerHTML = '<span class="null-val">null</span>';
        } else {
          td.textContent = String(val);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  scrollWrapper.appendChild(table);
  container.appendChild(scrollWrapper);

  return container;
}

// Preset Workbench Queries
const PRESETS = [
  {
    id: "filter_extract",
    name: "Filter & Extract (Selection + Projection)",
    category: "compounding",
    badge: "Compounding",
    math: "π[name, gpa]( σ[major='CS' ∧ year≥2](Student) )",
    desc: "The universal 'Filter-Then-Extract' pattern. We first filter for CS students in sophomore year or higher, then discard unrelated columns to extract only name and GPA.",
    run() {
      const student = RAEngine.getBaseTable("Student");
      const filtered = RAEngine.select(student, r => r.major === "CS" && r.year >= 2, "major='CS' ∧ year≥2");
      const projected = RAEngine.project(filtered, ["name", "gpa"]);
      return {
        result: projected,
        trace: [
          { step: "Step 1: Selection σ[major='CS' ∧ year≥2](Student)", desc: "Filters down from 6 students to 3 matching tuples (Alice, Bob, Evan).", table: filtered },
          { step: "Step 2: Projection π[name, gpa](Step 1)", desc: "Eliminates s_id, major, and year columns.", table: projected }
        ]
      };
    }
  },
  {
    id: "natural_join",
    name: "Natural Join (Student ⋈ Enrollment)",
    category: "joins",
    badge: "Join",
    math: "Student ⋈ Enrollment",
    desc: "Associates students with their course registrations based on shared attribute 's_id'. Notice how Fiona (s6) is silently excluded because she has 0 enrollments.",
    run() {
      const student = RAEngine.getBaseTable("Student");
      const enroll = RAEngine.getBaseTable("Enrollment");
      const joined = RAEngine.naturalJoin(student, enroll);
      const slice = RAEngine.project(joined, ["s_id", "name", "c_id", "grade"]);
      return {
        result: slice,
        trace: [
          { step: "Step 1: Input Tables", desc: "Student (6 rows) and Enrollment (13 rows).", table: student },
          { step: "Step 2: Natural Join on s_id", desc: "13 joined rows materialized. Unmatched s6 is dropped.", table: joined }
        ]
      };
    }
  },
  {
    id: "left_outer_join",
    name: "Left Outer Join (Preserving Fiona)",
    category: "extended",
    badge: "Outer Join",
    math: "Student ⟕ Enrollment",
    desc: "Preserves dangling tuples from the left relation. Fiona (s6) has never registered for a course; here she is preserved with null values for course columns.",
    run() {
      const student = RAEngine.getBaseTable("Student");
      const enroll = RAEngine.getBaseTable("Enrollment");
      const loj = RAEngine.leftOuterJoin(student, enroll);
      const slice = RAEngine.project(loj, ["s_id", "name", "c_id", "grade"]);
      return {
        result: slice,
        trace: [
          { step: "Step 1: Inner Join Matches", desc: "Finds all student tuples with at least one enrollment (13 tuples).", table: RAEngine.naturalJoin(student, enroll) },
          { step: "Step 2: Dangling Tuple Preservation", desc: "Fiona (s6) is padded with null and added to the output.", table: slice }
        ]
      };
    }
  },
  {
    id: "division_all_cs",
    name: "Universal Division (Students in ALL CS Courses)",
    category: "advanced",
    badge: "Division (÷)",
    math: "π[s_id, c_id](Enrollment) ÷ π[c_id]( σ[dept='CS'](Course) )",
    desc: "Academic universal quantification: identifies which student(s) have completed EVERY Computer Science course offered (CS101, CS102, CS201, CS301).",
    run() {
      const course = RAEngine.getBaseTable("Course");
      const enroll = RAEngine.getBaseTable("Enrollment");
      const csCourses = RAEngine.project(RAEngine.select(course, r => r.dept === "CS", "dept='CS'"), ["c_id"]);
      const pairs = RAEngine.project(enroll, ["s_id", "c_id"]);
      return RAEngine.divisionWithTrace(pairs, csCourses, ["s_id"], ["c_id"]);
    }
  },
  {
    id: "antijoin_unassigned_prof",
    name: "Anti-Semi-Join (Faculty Not Teaching)",
    category: "joins",
    badge: "Anti-Join (▷)",
    math: "Instructor ▷ Teaches",
    desc: "Finds instructors who have NO active teaching assignments. Computed algebraically as Instructor - (Instructor ⋉ Teaches).",
    run() {
      const inst = RAEngine.getBaseTable("Instructor");
      const teaches = RAEngine.getBaseTable("Teaches");
      const anti = RAEngine.antiJoin(inst, teaches);
      return {
        result: anti,
        trace: [
          { step: "Step 1: Semi-Join (Instructors Who Teach)", desc: "Instructors who have at least one course in Teaches (i1, i2, i3, i4, i5).", table: RAEngine.semiJoin(inst, teaches) },
          { step: "Step 2: Difference from All Instructors", desc: "Identifies Claude Shannon (i6) who teaches 0 courses.", table: anti }
        ]
      };
    }
  },
  {
    id: "max_salary_no_agg",
    name: "Maximum Without Aggregation (Highest Paid)",
    category: "academic",
    badge: "No Aggregates",
    math: "π[i_id](Instructor) - π[I1.i_id]( σ[I1.sal < I2.sal](Instructor × Instructor) )",
    desc: "Classic University CS Challenge: Find the top earner using only Cartesian Product and Set Difference without using MAX() or GROUP BY.",
    run() {
      const inst = RAEngine.getBaseTable("Instructor");
      const cp = RAEngine.crossProduct(inst, inst, "I1", "I2");
      const lower = RAEngine.select(cp, r => r["I1.salary"] < r["I2.salary"], "I1.salary < I2.salary");
      const lowerIds = RAEngine.project(lower, ["I1.i_id"]);
      // rename back for difference
      const lowerTable = new RelTable("LowerEarners", ["i_id"], lowerIds.rows.map(r => ({ i_id: r["I1.i_id"] })));
      const allIds = RAEngine.project(inst, ["i_id"]);
      const maxId = RAEngine.difference(allIds, lowerTable);
      const topInst = RAEngine.naturalJoin(inst, maxId);
      const result = RAEngine.project(topInst, ["i_id", "name", "salary"]);
      return {
        result,
        trace: [
          { step: "Step 1: Cross-Product Instructor × Instructor", desc: "All 36 pairs of instructor comparisons.", table: cp },
          { step: "Step 2: Identify Who Earns Less Than Someone", desc: "Filter I1.salary < I2.salary (Ada, Gauss, Noether, Feynman, Shannon).", table: lowerTable },
          { step: "Step 3: Set Difference", desc: "All Instructors - Lower Earners = Alan Turing (120,000).", table: result }
        ]
      };
    }
  },
  {
    id: "exactly_one_course",
    name: "Counting Without COUNT (Exactly 1 Course)",
    category: "academic",
    badge: "Set Counting",
    math: "(At-Least-1 Course) - (At-Least-2 Courses)",
    desc: "Finds students who have enrolled in EXACTLY one course. Evaluated by taking all enrolled students and subtracting those who appear in at least two distinct courses.",
    run() {
      const enroll = RAEngine.getBaseTable("Enrollment");
      const student = RAEngine.getBaseTable("Student");
      const atLeast1 = RAEngine.project(enroll, ["s_id"]);
      
      const cp = RAEngine.crossProduct(enroll, enroll, "E1", "E2");
      const diffCourses = RAEngine.select(cp, r => r["E1.s_id"] === r["E2.s_id"] && r["E1.c_id"] !== r["E2.c_id"], "E1.s_id=E2.s_id ∧ E1.c_id≠E2.c_id");
      const atLeast2 = new RelTable("AtLeastTwo", ["s_id"], diffCourses.rows.map(r => ({ s_id: r["E1.s_id"] })));

      const exactly1 = RAEngine.difference(atLeast1, atLeast2);
      const result = RAEngine.project(RAEngine.naturalJoin(student, exactly1), ["s_id", "name", "major"]);
      return {
        result,
        trace: [
          { step: "Step 1: Enrolled in ≥ 1 Course", desc: "{s1, s2, s3, s4, s5}.", table: atLeast1 },
          { step: "Step 2: Enrolled in ≥ 2 Distinct Courses", desc: "Self-join requires E1.c_id ≠ E2.c_id: {s1, s2, s3, s4}.", table: atLeast2 },
          { step: "Step 3: Difference (≥ 1) - (≥ 2)", desc: "Yields {s5} (Evan).", table: result }
        ]
      };
    }
  },
  {
    id: "grouping_having",
    name: "Aggregation & Grouping (_dept γ ...)",
    category: "extended",
    badge: "Aggregation (γ)",
    math: "σ[avg_salary > 108000]( _dept γ [COUNT(i_id)→headcount, AVG(salary)→avg_salary](Instructor) )",
    desc: "Equivalent to SQL 'GROUP BY dept HAVING AVG(salary) > 108000'. Partitions instructors by department, calculates metrics, and filters out departments below the threshold.",
    run() {
      const inst = RAEngine.getBaseTable("Instructor");
      const grouped = RAEngine.aggregate(inst, ["dept"], [
        { type: "COUNT", attr: "i_id", as: "headcount" },
        { type: "AVG", attr: "salary", as: "avg_salary" }
      ]);
      const filtered = RAEngine.select(grouped, r => r.avg_salary > 108000, "avg_salary > 108000");
      return {
        result: filtered,
        trace: [
          { step: "Step 1: Group By Department & Aggregate", desc: "Computes count and average salary per department.", table: grouped },
          { step: "Step 2: Selection (HAVING clause)", desc: "Keeps CS ($110,000) and Math ($111,000); Physics ($105,000) is filtered.", table: filtered }
        ]
      };
    }
  }
];

// University Exam Dataset (10 High-Yield Questions)
const EXAM_QUESTIONS = [
  {
    id: "q1",
    section: "Section A: Theory",
    points: 10,
    title: "Question 1: The Closure Property",
    prompt: "Why is the <strong>Closure Property</strong> considered the foundational cornerstone of Relational Algebra and modern query engines?",
    options: [
      { id: "opt1", text: "Because every relational operator accepts relations as inputs and produces a relation as output, enabling arbitrary nesting and optimization." },
      { id: "opt2", text: "Because all database tables are closed to external access without administrative authorization." },
      { id: "opt3", text: "Because queries cannot evaluate if any foreign key points outside of the database schema." },
      { id: "opt4", text: "Because duplicate rows are automatically retained to prevent loss of cardinality." }
    ],
    correct: "opt1",
    hint: "Think about what allows you to write expressions like π( σ( R ⋈ S ) ).",
    solution: "The Closure Property ensures that the output of any algebraic operation is itself a relation. This permits arbitrary nesting of operators, representation as operator trees, and algebraic rewrites."
  },
  {
    id: "q2",
    section: "Section A: Theory",
    points: 10,
    title: "Question 2: Three-Valued Logic (3VL) and Nulls",
    prompt: "Consider relation <code>R(A, B)</code> with a tuple <code>t = (1, null)</code>. How does the selection <code>σ[(B = 5) ∨ ¬(B = 5)](R)</code> behave on tuple <code>t</code>?",
    options: [
      { id: "opt1", text: "The tuple is retained because a proposition and its negation always form a tautology (True ∨ False = True)." },
      { id: "opt2", text: "The tuple is rejected because comparisons with null yield Unknown, and Unknown ∨ Unknown = Unknown." },
      { id: "opt3", text: "The database crashes with a NullPointerException error." },
      { id: "opt4", text: "The tuple is converted to (1, 0) before evaluating." }
    ],
    correct: "opt2",
    hint: "In 3VL, what is the truth value of null = 5, and what does σ_p require to keep a tuple?",
    solution: "Comparisons with null yield 'Unknown'. In 3VL, Unknown ∨ ¬Unknown = Unknown ∨ Unknown = Unknown. In Relational Algebra, σ_p keeps a tuple if and only if the predicate evaluates strictly to True. Hence, tuple t is dropped!"
  },
  {
    id: "q3",
    section: "Section B: Evaluation",
    points: 10,
    title: "Question 3: Evaluation on Benchmark Database",
    prompt: "Evaluate: <code>π[name, gpa]( σ[(year = 1 ∨ major = 'Physics') ∧ gpa ≥ 3.0](Student) )</code> on our instantiated University database. Which student appears in the result?",
    options: [
      { id: "opt1", text: "Diana only (Physics, year 1, gpa 3.5)" },
      { id: "opt2", text: "Fiona only (Math, year 1, gpa 2.8)" },
      { id: "opt3", text: "Both Diana and Fiona" },
      { id: "opt4", text: "Alice, Bob, and Diana" }
    ],
    correct: "opt1",
    hint: "Check Fiona's GPA against the threshold gpa ≥ 3.0.",
    solution: "Diana: (1=1 ∨ 'Physics'='Physics') ∧ 3.5 ≥ 3.0 → True. Fiona: (1=1 ∨ False) ∧ 2.8 ≥ 3.0 → True ∧ False → False. Only Diana satisfies the predicate."
  },
  {
    id: "q4",
    section: "Section B: Evaluation",
    points: 10,
    title: "Question 4: Anti-Semi-Join Evaluation",
    prompt: "Evaluate the Anti-Semi-Join: <code>Instructor ▷ Teaches</code>. What is the resulting relation?",
    options: [
      { id: "opt1", text: "Claude Shannon (i6) with salary 95,000" },
      { id: "opt2", text: "Alan Turing and Ada Lovelace" },
      { id: "opt3", text: "Empty relation ∅ (all instructors teach)" },
      { id: "opt4", text: "Richard Feynman only" }
    ],
    correct: "opt1",
    hint: "Which instructor does not have any rows in Teaches?",
    solution: "The Anti-Semi-Join returns all tuples of Instructor that have NO matching foreign key in Teaches. Claude Shannon is the only instructor with 0 courses assigned."
  },
  {
    id: "q5",
    section: "Section B: Evaluation",
    points: 10,
    title: "Question 5: Division on Math Courses",
    prompt: "Evaluate: <code>π[s_id, c_id](Enrollment ⋈ σ[dept='Math'](Course)) ÷ π[c_id](σ[dept='Math'](Course))</code>. Who is the resultant student?",
    options: [
      { id: "opt1", text: "s3 (Charlie)" },
      { id: "opt2", text: "s2 (Bob)" },
      { id: "opt3", text: "s4 (Diana)" },
      { id: "opt4", text: "s1 (Alice)" }
    ],
    correct: "opt1",
    hint: "The Math courses are MATH101 and MATH102. Who took BOTH?",
    solution: "The target set contains MATH101 and MATH102. Bob (s2) took only MATH101; Diana (s4) took only MATH101; Charlie (s3) took both MATH101 and MATH102. Result: {s3} (Charlie)."
  },
  {
    id: "q6",
    section: "Section C: Formulation",
    points: 10,
    title: "Question 6: Minimum Salary Without MIN()",
    prompt: "Which algebraic expression correctly retrieves the ID of the instructor with the LOWEST salary without using MIN or aggregates?",
    options: [
      { id: "opt1", text: "π[i_id](Instructor) - π[I1.i_id]( σ[I1.salary > I2.salary](ρ_I1(Instructor) × ρ_I2(Instructor)) )" },
      { id: "opt2", text: "π[i_id](Instructor) - π[I1.i_id]( σ[I1.salary < I2.salary](ρ_I1(Instructor) × ρ_I2(Instructor)) )" },
      { id: "opt3", text: "σ[salary = 0](Instructor)" },
      { id: "opt4", text: "π[i_id](Instructor) ∩ π[i_id](Teaches)" }
    ],
    correct: "opt1",
    hint: "If someone earns MORE than another person (I1 > I2), can they be the lowest earner?",
    solution: "Option 1 filters for anyone who earns strictly more than someone else (I1.salary > I2.salary) and subtracts them from all instructors. The only person left is the one who earns more than no one: the minimum earner (Claude Shannon)!"
  },
  {
    id: "q7",
    section: "Section C: Formulation",
    points: 10,
    title: "Question 7: Students in At Least Two CS Courses",
    prompt: "How do you identify students enrolled in at least two distinct Computer Science courses using Codd primitives?",
    options: [
      { id: "opt1", text: "Self-join CS enrollments requiring E1.s_id = E2.s_id and E1.c_id ≠ E2.c_id, then project s_id." },
      { id: "opt2", text: "Filter Enrollment with σ[c_id ≥ 2](Enrollment)." },
      { id: "opt3", text: "Union Student with Course." },
      { id: "opt4", text: "Subtract Course from Student." }
    ],
    correct: "opt1",
    hint: "How do you check that a student has two different course records without COUNT?",
    solution: "Pairing a student's CS enrollments against themselves with the condition E1.c_id ≠ E2.c_id verifies that there exist two distinct courses for that student ID."
  },
  {
    id: "q8",
    section: "Section D: Optimization",
    points: 10,
    title: "Question 8: Selection Pushdown Across Set Union",
    prompt: "Is the algebraic rewrite <code>σ_c(R ∪ S) ≡ σ_c(R) ∪ σ_c(S)</code> mathematically sound?",
    options: [
      { id: "opt1", text: "Yes, because conjunction distributes over disjunction in propositional logic: (t ∈ R ∨ t ∈ S) ∧ c(t) ≡ (t ∈ R ∧ c(t)) ∨ (t ∈ S ∧ c(t))." },
      { id: "opt2", text: "No, because Set Union destroys attribute names." },
      { id: "opt3", text: "No, because the union operator is not commutative." },
      { id: "opt4", text: "Only when R and S have zero tuples." }
    ],
    correct: "opt1",
    hint: "Recall the set-theoretic definition of union: t belongs to R OR t belongs to S.",
    solution: "True. Selection distributes cleanly over Set Union, allowing optimizers to push filters into both union branches before combining."
  },
  {
    id: "q9",
    section: "Section D: Optimization",
    points: 10,
    title: "Question 9: Outer Join Pushdown Pitfall",
    prompt: "Why is the transformation <code>σ_c(R ⟕ S) ≡ R ⟕ σ_c(S)</code> (where c is a condition on S) generally INVALID in query optimization?",
    options: [
      { id: "opt1", text: "Because in the LHS, tuples with padded nulls in S evaluate to Unknown and are dropped, while in the RHS, unmatched R tuples are preserved with nulls." },
      { id: "opt2", text: "Because outer joins do not support primary keys." },
      { id: "opt3", text: "Because R and S must have identical degree." },
      { id: "opt4", text: "Because selection can never be pushed down any join." }
    ],
    correct: "opt1",
    hint: "What happens when c(null) is evaluated on an unmatched preserved row?",
    solution: "Applying σ_c on the outer join result converts non-matching rows to null, causing c to evaluate to Unknown and drop the row (acting like an inner join). Pushing it inside still preserves all R rows. The two expressions yield different results!"
  },
  {
    id: "q10",
    section: "Section A: Theory",
    points: 10,
    title: "Question 10: Set Difference Non-Commutativity",
    prompt: "Under what conditions does <code>R - S ≡ S - R</code> hold?",
    options: [
      { id: "opt1", text: "If and only if R = S (both relations contain the exact same set of tuples)." },
      { id: "opt2", text: "Whenever R and S have the same number of rows." },
      { id: "opt3", text: "It holds for all union-compatible relations." },
      { id: "opt4", text: "It never holds under any circumstance." }
    ],
    correct: "opt1",
    hint: "If R={1} and S={2}, does R - S equal S - R?",
    solution: "R - S = S - R implies (R \\ S) = (S \\ R), which can only occur if both differences are empty, meaning R ⊆ S and S ⊆ R, hence R = S."
  }
];

// App State
let currentScore = 0;
const answeredQuestions = new Set();

// Tab Switcher
function initNavigation() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(btn.dataset.target);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });
}

// Render Schema Explorer Tab
function initSchemaTab() {
  const container = document.getElementById("schema-tables-grid");
  if (!container) return;
  container.innerHTML = "";

  const tables = ["Student", "Course", "Enrollment", "Instructor", "Teaches", "Prereq"];
  tables.forEach(name => {
    const tableObj = RAEngine.getBaseTable(name);
    const rendered = renderTableHTML(tableObj, {
      title: `${name} Relation`,
      pk: UNIVERSITY_DATA[name].pk
    });
    container.appendChild(rendered);
  });
}

// Render Workbench Tab
function initWorkbenchTab() {
  const presetContainer = document.getElementById("preset-queries-list");
  if (!presetContainer) return;
  presetContainer.innerHTML = "";

  PRESETS.forEach((preset, index) => {
    const btn = document.createElement("button");
    btn.className = `preset-btn ${index === 0 ? "active" : ""}`;
    btn.innerHTML = `
      <div class="preset-title">
        <span>${preset.name}</span>
        <span class="badge badge-cyan">${preset.badge}</span>
      </div>
      <div class="preset-math">${preset.math}</div>
    `;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      runAndDisplayPreset(preset);
    });
    presetContainer.appendChild(btn);
  });

  // Run initial preset
  runAndDisplayPreset(PRESETS[0]);
}

function runAndDisplayPreset(preset) {
  const mathEl = document.getElementById("workbench-math-display");
  const descEl = document.getElementById("workbench-desc-display");
  const traceEl = document.getElementById("workbench-trace-display");
  const resultEl = document.getElementById("workbench-result-display");

  mathEl.textContent = preset.math;
  descEl.textContent = preset.desc;
  traceEl.innerHTML = "";
  resultEl.innerHTML = "";

  const execution = preset.run();

  // Render Execution Trace
  if (execution.trace && execution.trace.length > 0) {
    execution.trace.forEach(step => {
      const stepBox = document.createElement("div");
      stepBox.className = "trace-step";
      stepBox.innerHTML = `
        <h4>${step.step}</h4>
        <p>${step.desc}</p>
      `;
      stepBox.appendChild(renderTableHTML(step.table));
      traceEl.appendChild(stepBox);
    });
  }

  // Render Final Result
  resultEl.appendChild(renderTableHTML(execution.result, { title: "Final Result Relation" }));
}

// Query Tree Visualizer Tab
function initTreeVisualizerTab() {
  const treeContainer = document.getElementById("tree-diagram-container");
  const metricsContainer = document.getElementById("tree-metrics-box");
  const naiveBtn = document.getElementById("btn-tree-naive");
  const optBtn = document.getElementById("btn-tree-opt");

  function renderNaive() {
    naiveBtn.classList.add("active");
    optBtn.classList.remove("active");
    treeContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:1.25rem;">
        <div class="tree-node">π[title, name]<br><small>Final Projection</small></div>
        <div style="color:var(--accent-cyan);">↓</div>
        <div class="tree-node">σ[major='Math' ∧ grade='A' ∧ credits=3]<br><small>Combined Filter</small></div>
        <div style="color:var(--accent-cyan);">↓</div>
        <div class="tree-node">⋈ [c_id]<br><small>Join 2 (13 joined rows)</small></div>
        <div style="display:flex; gap:3rem;">
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="color:var(--accent-cyan);">↓</div>
            <div class="tree-node">⋈ [s_id]<br><small>Join 1 (13 joined rows)</small></div>
            <div style="display:flex; gap:1.5rem; margin-top:0.75rem;">
              <div class="tree-node leaf">Student<br><small>6 rows (all cols)</small></div>
              <div class="tree-node leaf">Enrollment<br><small>13 rows (all cols)</small></div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="color:var(--accent-cyan);">↓</div>
            <div class="tree-node leaf">Course<br><small>7 rows (all cols)</small></div>
          </div>
        </div>
      </div>
    `;

    metricsContainer.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
        <div class="stat-item"><span class="stat-num">13</span><span class="stat-label">Intermediate Tuples</span></div>
        <div class="stat-item"><span class="stat-num">104</span><span class="stat-label">Data Cells Materialized</span></div>
        <div class="stat-item"><span class="stat-num" style="color:var(--accent-rose)">100%</span><span class="stat-label">Baseline Cost</span></div>
      </div>
    `;
  }

  function renderOptimized() {
    optBtn.classList.add("active");
    naiveBtn.classList.remove("active");
    treeContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:1.25rem;">
        <div class="tree-node opt">π[title, name]<br><small>Root Output</small></div>
        <div style="color:var(--accent-emerald);">↓</div>
        <div class="tree-node opt">⋈ [c_id]<br><small>Join 2 (only 2 output rows!)</small></div>
        <div style="display:flex; gap:3rem;">
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="color:var(--accent-emerald);">↓</div>
            <div class="tree-node opt">⋈ [s_id]<br><small>Join 1 (only 3 matched rows!)</small></div>
            <div style="display:flex; gap:1.5rem; margin-top:0.75rem;">
              <div class="tree-node opt">π[s_id, name]<br>↑<br>σ[major='Math']<br>↑<br><span style="color:var(--text-accent)">Student (2 rows)</span></div>
              <div class="tree-node opt">π[s_id, c_id]<br>↑<br>σ[grade='A']<br>↑<br><span style="color:var(--text-accent)">Enrollment (6 rows)</span></div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="color:var(--accent-emerald);">↓</div>
            <div class="tree-node opt">π[c_id, title]<br>↑<br>σ[credits=3]<br>↑<br><span style="color:var(--text-accent)">Course (2 rows)</span></div>
          </div>
        </div>
      </div>
    `;

    metricsContainer.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
        <div class="stat-item"><span class="stat-num" style="color:var(--accent-emerald)">3</span><span class="stat-label">Intermediate Tuples</span></div>
        <div class="stat-item"><span class="stat-num" style="color:var(--accent-emerald)">6</span><span class="stat-label">Data Cells Materialized</span></div>
        <div class="stat-item"><span class="stat-num" style="color:var(--accent-emerald)">~94%</span><span class="stat-label">Memory Reduction</span></div>
      </div>
    `;
  }

  naiveBtn.addEventListener("click", renderNaive);
  optBtn.addEventListener("click", renderOptimized);
  renderOptimized();
}

// Render Examination Tab
function initExamTab() {
  const container = document.getElementById("exam-questions-list");
  if (!container) return;
  container.innerHTML = "";

  EXAM_QUESTIONS.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "quiz-card";
    card.id = `quiz-card-${q.id}`;

    const optionsHTML = q.options.map(opt => `
      <label class="quiz-option">
        <input type="radio" name="question_${q.id}" value="${opt.id}">
        <span>${opt.text}</span>
      </label>
    `).join("");

    card.innerHTML = `
      <div class="quiz-header">
        <div>
          <span class="badge badge-purple" style="margin-bottom:0.4rem;">${q.section}</span>
          <h3 class="quiz-title">${q.title}</h3>
        </div>
        <span class="quiz-points">${q.points} PTS</span>
      </div>
      <div class="quiz-prompt">${q.prompt}</div>
      <div class="quiz-options">${optionsHTML}</div>
      <div class="quiz-actions">
        <button class="btn-primary" id="btn-check-${q.id}">Submit Answer</button>
        <button class="btn-secondary" id="btn-hint-${q.id}">Hint</button>
        <button class="btn-secondary" id="btn-sol-${q.id}">Solution</button>
      </div>
      <div class="quiz-feedback" id="feedback-${q.id}"></div>
    `;

    container.appendChild(card);

    // Event handlers
    const checkBtn = card.querySelector(`#btn-check-${q.id}`);
    const hintBtn = card.querySelector(`#btn-hint-${q.id}`);
    const solBtn = card.querySelector(`#btn-sol-${q.id}`);
    const feedbackBox = card.querySelector(`#feedback-${q.id}`);

    hintBtn.addEventListener("click", () => {
      feedbackBox.className = "quiz-feedback show";
      feedbackBox.style.background = "rgba(245, 158, 11, 0.12)";
      feedbackBox.style.border = "1px solid rgba(245, 158, 11, 0.4)";
      feedbackBox.style.color = "#fde68a";
      feedbackBox.innerHTML = `💡 <strong>Pedagogical Hint:</strong> ${q.hint}`;
    });

    solBtn.addEventListener("click", () => {
      feedbackBox.className = "quiz-feedback show";
      feedbackBox.style.background = "rgba(99, 102, 241, 0.12)";
      feedbackBox.style.border = "1px solid rgba(99, 102, 241, 0.4)";
      feedbackBox.style.color = "#c7d2fe";
      feedbackBox.innerHTML = `📘 <strong>Formal CS Solution:</strong> ${q.solution}`;
    });

    checkBtn.addEventListener("click", () => {
      const selected = card.querySelector(`input[name="question_${q.id}"]:checked`);
      if (!selected) {
        alert("Please select an option first.");
        return;
      }

      const isCorrect = selected.value === q.correct;
      feedbackBox.className = `quiz-feedback show ${isCorrect ? "correct" : "incorrect"}`;

      if (isCorrect) {
        card.className = "quiz-card answered-correct";
        feedbackBox.innerHTML = `✅ <strong>Correct! (+${q.points} Points)</strong><br>${q.solution}`;
        if (!answeredQuestions.has(q.id)) {
          answeredQuestions.add(q.id);
          currentScore += q.points;
          updateExamScore();
        }
      } else {
        card.className = "quiz-card answered-incorrect";
        feedbackBox.innerHTML = `❌ <strong>Incorrect.</strong> Try reviewing the hint or the curriculum chapters before retrying.<br>${q.solution}`;
      }
    });
  });

  updateExamScore();
}

function updateExamScore() {
  const scoreEl = document.getElementById("exam-total-score");
  const answeredEl = document.getElementById("exam-answered-count");
  if (scoreEl) scoreEl.textContent = `${currentScore} / 100`;
  if (answeredEl) answeredEl.textContent = `${answeredQuestions.size} / ${EXAM_QUESTIONS.length}`;
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initSchemaTab();
  initWorkbenchTab();
  initTreeVisualizerTab();
  initExamTab();
});
