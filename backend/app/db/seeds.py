import uuid
from app.auth.security import hash_password
from app.db.connection import get_db_connection, init_db


def seed_database() -> None:
    """Seeds the database with demo users, courses, modules, lessons, and progress data."""
    init_db()

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Check if demo student exists
        cursor.execute("SELECT id FROM users WHERE email = 'student@sambhav.edu'")
        existing_student = cursor.fetchone()
        student_pw = hash_password("QuantumLearner#2026")

        if existing_student:
            student_id = existing_student["id"]
            cursor.execute("UPDATE users SET password_hash = ?, role = 'student' WHERE id = ?", (student_pw, student_id))
        else:
            student_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
                """,
                (student_id, "Aarav Sharma", "student@sambhav.edu", student_pw, "student"),
            )

        # 2. Check if demo instructor exists
        cursor.execute("SELECT id FROM users WHERE email = 'instructor@sambhav.edu'")
        existing_instructor = cursor.fetchone()
        instructor_pw = hash_password("ProfessorQuantum#2026")

        if existing_instructor:
            instructor_id = existing_instructor["id"]
            cursor.execute("UPDATE users SET password_hash = ?, role = 'instructor' WHERE id = ?", (instructor_pw, instructor_id))
        else:
            instructor_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
                """,
                (instructor_id, "Dr. Neha Verma", "instructor@sambhav.edu", instructor_pw, "instructor"),
            )

        # 3. Seed additional students for classroom roster if needed
        additional_students = [
            ("Meera Patel", "meera.patel@sambhav.edu"),
            ("Ishaan Gupta", "ishaan.gupta@sambhav.edu"),
            ("Diya Sundaram", "diya.sundaram@sambhav.edu"),
            ("Rohan Kapoor", "rohan.kapoor@sambhav.edu"),
            ("Ananya Rao", "ananya.rao@sambhav.edu"),
        ]
        for name, email in additional_students:
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if not cursor.fetchone():
                u_id = str(uuid.uuid4())
                cursor.execute(
                    "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                    (u_id, name, email, hash_password("Quantum#2026"), "student"),
                )

        # 4. Check if courses exist
        cursor.execute("SELECT COUNT(*) as course_count FROM courses")
        if cursor.fetchone()["course_count"] == 0:
            courses_to_seed = [
                {
                    "id": "quantum-foundations",
                    "title": "Quantum Foundations",
                    "description": "From Classical Bits to Quantum Superposition and the Bloch Sphere",
                    "difficulty": "Beginner",
                    "modules": [
                        {
                            "id": "qf-m1",
                            "title": "Module 1: Qubits & Superposition",
                            "order": 1,
                            "lessons": [
                                ("qubit-basics", "1.1 The Qubit & Bloch Sphere", 12, 1),
                                ("superposition", "1.2 Creating Superposition with Hadamard (H)", 15, 2),
                                ("measurement", "1.3 Measurement Collapse & The Born Rule", 18, 3),
                            ],
                        },
                        {
                            "id": "qf-m2",
                            "title": "Module 2: Entanglement & Bell States",
                            "order": 2,
                            "lessons": [
                                ("bell-state", "2.1 Building a Bell State (|Φ⁺⟩)", 20, 1),
                                ("ghz-state", "2.2 Multi-Qubit GHZ Entanglement", 25, 2),
                            ],
                        },
                    ],
                },
                {
                    "id": "quantum-gates-logic",
                    "title": "Quantum Logic & Unitary Gates",
                    "description": "Pauli Transformations, Phase Shifts, and Rotations",
                    "difficulty": "Intermediate",
                    "modules": [
                        {
                            "id": "qgl-m1",
                            "title": "Module 1: Single-Qubit Rotations",
                            "order": 1,
                            "lessons": [
                                ("pauli-gates", "1.1 Pauli-X, Y, Z Matrix Transformations", 15, 1),
                                ("phase-gates", "1.2 Phase Shifts: S and T Gates", 20, 2),
                                ("arbitrary-rotations", "1.3 Continuous Rotations: Rx, Ry, Rz", 25, 3),
                            ],
                        },
                        {
                            "id": "qgl-m2",
                            "title": "Module 2: Multi-Qubit Interactions",
                            "order": 2,
                            "lessons": [
                                ("controlled-gates", "2.1 CNOT, CZ, and Controlled Phase", 20, 1),
                                ("swap-gate", "2.2 SWAP Gate & Quantum Permutations", 20, 2),
                            ],
                        },
                    ],
                },
                {
                    "id": "quantum-algorithms",
                    "title": "Core Quantum Algorithms",
                    "description": "Deutsch-Jozsa, Grover Search, and Quantum Teleportation",
                    "difficulty": "Advanced",
                    "modules": [
                        {
                            "id": "qa-m1",
                            "title": "Module 1: Quantum Oracles & Speedups",
                            "order": 1,
                            "lessons": [
                                ("deutsch-jozsa", "1.1 Deutsch-Jozsa Constant vs Balanced Oracle", 35, 1),
                                ("superdense-coding", "1.2 Superdense Coding: Transmitting 2 Bits with 1 Qubit", 30, 2),
                                ("teleportation", "1.3 Quantum Teleportation Protocol", 40, 3),
                            ],
                        },
                        {
                            "id": "qa-m2",
                            "title": "Module 2: Search & Phase Estimation",
                            "order": 2,
                            "lessons": [
                                ("grover-search", "2.1 Grover's Search Algorithm & Amplitude Amplification", 45, 1),
                                ("qpe-basics", "2.2 Quantum Phase Estimation Fundamentals", 50, 2),
                            ],
                        },
                    ],
                },
            ]

            for course in courses_to_seed:
                cursor.execute(
                    """
                    INSERT INTO courses (id, title, description, difficulty, created_by, published)
                    VALUES (?, ?, ?, ?, ?, 1)
                    """,
                    (course["id"], course["title"], course["description"], course["difficulty"], instructor_id),
                )

                for mod in course["modules"]:
                    cursor.execute(
                        """
                        INSERT INTO modules (id, course_id, title, order_index)
                        VALUES (?, ?, ?, ?)
                        """,
                        (mod["id"], course["id"], mod["title"], mod["order"]),
                    )

                    for l_id, l_title, l_min, l_ord in mod["lessons"]:
                        cursor.execute(
                            """
                            INSERT INTO lessons (id, module_id, title, content_markdown, estimated_minutes, order_index)
                            VALUES (?, ?, ?, ?, ?, ?)
                            """,
                            (
                                l_id,
                                mod["id"],
                                l_title,
                                f"# {l_title}\n\nInteractive quantum lesson covering principles and mathematical derivations.",
                                l_min,
                                l_ord,
                            ),
                        )

            # 5. Seed student initial progress (only for demo student)
            cursor.execute("SELECT COUNT(*) as prog_count FROM progress WHERE user_id = ?", (student_id,))
            if cursor.fetchone()["prog_count"] == 0:
                seed_progress = [
                    (student_id, "quantum-foundations", "qubit-basics", "completed", 100.0, 720),
                    (student_id, "quantum-foundations", "superposition", "completed", 100.0, 900),
                    (student_id, "quantum-foundations", "measurement", "completed", 95.0, 1100),
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

            # 6. Seed student saved circuits (only for demo student)
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
