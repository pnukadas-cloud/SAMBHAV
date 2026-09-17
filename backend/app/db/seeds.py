import uuid
from app.auth.security import hash_password
from app.db.connection import get_db_connection, init_db


def seed_database() -> None:
    """Seeds the database with canonical SAMBHAV curriculum (Modules 0-9), users, and initial state."""
    init_db()

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Ensure demo instructor exists
        cursor.execute("SELECT id FROM users WHERE email = 'instructor@sambhav.edu'")
        row = cursor.fetchone()
        if row:
            instructor_id = row["id"]
        else:
            instructor_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    instructor_id,
                    "Dr. Neha Verma",
                    "instructor@sambhav.edu",
                    hash_password("ProfessorQuantum#2026"),
                    "instructor",
                ),
            )

        # 2. Ensure demo student exists
        cursor.execute("SELECT id FROM users WHERE email = 'student@sambhav.edu'")
        row = cursor.fetchone()
        if row:
            student_id = row["id"]
        else:
            student_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    student_id,
                    "Aarav Sharma",
                    "student@sambhav.edu",
                    hash_password("QuantumLearner#2026"),
                    "student",
                ),
            )

        # 3. Seed Canonical 10-Module SAMBHAV Curriculum
        cursor.execute("SELECT COUNT(*) as mod_count FROM modules WHERE course_id = 'quantum-foundations'")
        if cursor.fetchone()["mod_count"] < 10:
            cursor.execute("DELETE FROM progress WHERE course_id IN ('quantum-gates-logic', 'quantum-algorithms', 'quantum-foundations')")
            cursor.execute("DELETE FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id IN ('quantum-gates-logic', 'quantum-algorithms', 'quantum-foundations'))")
            cursor.execute("DELETE FROM modules WHERE course_id IN ('quantum-gates-logic', 'quantum-algorithms', 'quantum-foundations')")
            cursor.execute("DELETE FROM courses WHERE id IN ('quantum-gates-logic', 'quantum-algorithms', 'quantum-foundations')")
            courses_to_seed = [
                {
                    "id": "quantum-foundations",
                    "title": "SAMBHAV Quantum Learning Journey",
                    "description": "The unified, globally relevant interactive curriculum from mathematical foundations to algorithms, hardware, simulation and research.",
                    "difficulty": "Beginner",
                    "modules": [
                        {
                            "id": "module-0",
                            "title": "Module 0: Mathematical & Computational Foundations",
                            "order": 0,
                            "lessons": [
                                ("complex-vectors", "0.1 Complex Numbers, Vectors & Orthogonality", 20, 1),
                                ("matrix-tensor-products", "0.2 Matrix Algebra, Eigenvalues & Tensor Products", 25, 2),
                                ("prob-complexity", "0.3 Probability Distributions & Computational Complexity", 20, 3),
                            ],
                        },
                        {
                            "id": "module-1",
                            "title": "Module 1: Quantum Foundations",
                            "order": 1,
                            "lessons": [
                                ("qubit-basics", "1.1 The Qubit, Dirac Notation & Bloch Sphere", 18, 1),
                                ("superposition", "1.2 Creating Superposition with Hadamard (H)", 15, 2),
                                ("measurement", "1.3 Measurement Collapse & The Born Rule", 18, 3),
                                ("observables-evolution", "1.4 Observables, Hermitian Operators & Unitary Time Evolution", 22, 4),
                            ],
                        },
                        {
                            "id": "module-2",
                            "title": "Module 2: Multi-Qubit Systems & Quantum Circuits",
                            "order": 2,
                            "lessons": [
                                ("pauli-rotations", "2.1 Pauli Transformations & Continuous Rotations (Rx, Ry, Rz)", 20, 1),
                                ("phase-gates", "2.2 Phase Shifts & Universality: S and T Gates", 20, 2),
                                ("bell-state", "2.3 Building a Bell State (|Φ⁺⟩) & Entanglement", 20, 3),
                                ("ghz-state", "2.4 Multi-Qubit GHZ State & SWAP Networks", 25, 4),
                            ],
                        },
                        {
                            "id": "module-3",
                            "title": "Module 3: Quantum Programming & Simulation Lab",
                            "order": 3,
                            "lessons": [
                                ("statevector-simulation", "3.1 Interactive Quantum Simulation & Statevector Inspection", 20, 1),
                                ("qiskit-code-gen", "3.2 Qiskit Code Generation & Python Integration", 22, 2),
                                ("circuit-optimization", "3.3 Quantum Debugging, Depth & Circuit Optimization", 25, 3),
                            ],
                        },
                        {
                            "id": "module-4",
                            "title": "Module 4: Fundamental Quantum Algorithms",
                            "order": 4,
                            "lessons": [
                                ("deutsch-jozsa", "4.1 Quantum Oracles: Deutsch & Deutsch-Jozsa Algorithm", 30, 1),
                                ("bernstein-simon", "4.2 Bernstein-Vazirani & Simon's Periodicity Algorithm", 35, 2),
                                ("grovers-search", "4.3 Grover's Search & Amplitude Amplification", 45, 3),
                                ("qpe-shor", "4.4 Quantum Phase Estimation (QPE) & Shor's Factoring", 50, 4),
                            ],
                        },
                        {
                            "id": "module-5",
                            "title": "Module 5: Quantum Information & Communication",
                            "order": 5,
                            "lessons": [
                                ("teleportation", "5.1 Quantum Teleportation Protocol", 35, 1),
                                ("superdense-coding", "5.2 Superdense Coding: Transmitting 2 Bits with 1 Qubit", 25, 2),
                                ("density-matrices", "5.3 Density Matrices, Mixed States & Von Neumann Entropy", 30, 3),
                                ("bb84-cryptography", "5.4 Quantum Key Distribution: BB84 & B92 Protocols", 30, 4),
                            ],
                        },
                        {
                            "id": "module-6",
                            "title": "Module 6: Quantum Noise & Error Correction",
                            "order": 6,
                            "lessons": [
                                ("noise-decoherence", "6.1 Quantum Noise Channels, Relaxation (T1) & Dephasing (T2)", 25, 1),
                                ("shor-error-code", "6.2 Quantum Error Correction: Bit-Flip & Shor 9-Qubit Code", 35, 2),
                                ("stabilizer-surface-codes", "6.3 Stabilizer Formalism, Surface Codes & Fault Tolerance", 40, 3),
                            ],
                        },
                        {
                            "id": "module-7",
                            "title": "Module 7: Quantum Computing Applications",
                            "order": 7,
                            "lessons": [
                                ("vqe-quantum-chemistry", "7.1 Variational Quantum Eigensolver (VQE) & Molecular Simulation", 35, 1),
                                ("qaoa-optimization", "7.2 Quantum Approximate Optimization Algorithm (QAOA)", 35, 2),
                                ("qml-quantum-sensing", "7.3 Quantum Machine Learning & Quantum Metrology", 30, 3),
                            ],
                        },
                        {
                            "id": "module-8",
                            "title": "Module 8: Quantum Hardware & Real-World Systems",
                            "order": 8,
                            "lessons": [
                                ("qubit-modalities", "8.1 Superconducting Transmons & Trapped-Ion Processors", 25, 1),
                                ("photonic-neutral-atoms", "8.2 Photonic, Neutral Atom & Silicon Spin Qubits", 25, 2),
                                ("cryogenics-control-nisq", "8.3 Cryogenics, Microwave Control & NISQ Constraints", 25, 3),
                            ],
                        },
                        {
                            "id": "module-9",
                            "title": "Module 9: Research & Advanced Quantum Computing",
                            "order": 9,
                            "lessons": [
                                ("quantum-complexity", "9.1 Computational Complexity: P, NP, BPP, BQP & QMA", 30, 1),
                                ("paper-reproduction", "9.2 Reading Quantum Papers & Reproducing Published Circuits", 35, 2),
                                ("research-methodology", "9.3 Research Project Workflow, Benchmarking & Experimentation", 30, 3),
                            ],
                        },
                    ],
                }
            ]

            for course in courses_to_seed:
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO courses (id, title, description, difficulty, created_by, published)
                    VALUES (?, ?, ?, ?, ?, 1)
                    """,
                    (course["id"], course["title"], course["description"], course["difficulty"], instructor_id),
                )

                for mod in course["modules"]:
                    cursor.execute(
                        """
                        INSERT OR REPLACE INTO modules (id, course_id, title, order_index)
                        VALUES (?, ?, ?, ?)
                        """,
                        (mod["id"], course["id"], mod["title"], mod["order"]),
                    )

                    for l_id, l_title, l_min, l_ord in mod["lessons"]:
                        cursor.execute(
                            """
                            INSERT OR REPLACE INTO lessons (id, module_id, title, content_markdown, estimated_minutes, order_index)
                            VALUES (?, ?, ?, ?, ?, ?)
                            """,
                            (
                                l_id,
                                mod["id"],
                                l_title,
                                f"# {l_title}\n\nInteractive quantum lesson covering intuition, mathematics, visual simulation, and knowledge check.",
                                l_min,
                                l_ord,
                            ),
                        )

            # 4. Seed student initial progress (for demo student)
            cursor.execute("SELECT COUNT(*) as prog_count FROM progress WHERE user_id = ?", (student_id,))
            if cursor.fetchone()["prog_count"] == 0:
                seed_progress = [
                    (student_id, "quantum-foundations", "complex-vectors", "completed", 100.0, 720),
                    (student_id, "quantum-foundations", "qubit-basics", "completed", 100.0, 900),
                    (student_id, "quantum-foundations", "superposition", "completed", 100.0, 950),
                    (student_id, "quantum-foundations", "bell-state", "in_progress", 80.0, 450),
                ]
                for u_id, c_id, l_id, stat, sc, ts in seed_progress:
                    cursor.execute(
                        """
                        INSERT INTO progress (id, user_id, course_id, lesson_id, status, score, time_spent_seconds)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (str(uuid.uuid4()), u_id, c_id, l_id, stat, sc, ts),
                    )

            # 5. Seed student saved circuit (for demo student)
            cursor.execute("SELECT COUNT(*) as circ_count FROM circuits WHERE owner_id = ?", (student_id,))
            if cursor.fetchone()["circ_count"] == 0:
                bell_ir_json = '{"qubits":2,"classicalBits":2,"operations":[{"gate":"h","targets":[0]},{"gate":"cx","controls":[0],"targets":[1]},{"gate":"measure","targets":[0,1],"classicalTargets":[0,1]}]}'
                cursor.execute(
                    """
                    INSERT INTO circuits (id, owner_id, title, description, circuit_ir_json, framework)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid.uuid4()),
                        student_id,
                        "Maximally Entangled Bell State (|Φ⁺⟩)",
                        "Standard 2-qubit Einstein-Podolsky-Rosen (EPR) pair.",
                        bell_ir_json,
                        "qiskit",
                    ),
                )
