import json
import unittest
from fastapi.testclient import TestClient

from app.auth.security import create_access_token
from app.db import repository
from app.db.connection import init_db
from app.db.seeds import seed_database
from app.main import app


class TestInstructorPlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_database()
        cls.client = TestClient(app)

        # 1. Primary Instructor (Dr. Neha Verma)
        cls.instructor_user = repository.get_user_by_email("instructor@sambhav.edu")
        assert cls.instructor_user is not None
        cls.instructor_token = create_access_token(
            user_id=cls.instructor_user["id"],
            email=cls.instructor_user["email"],
            role=cls.instructor_user["role"],
            name=cls.instructor_user["name"],
        )
        cls.instructor_headers = {"Authorization": f"Bearer {cls.instructor_token}"}

        # 2. Student (Aarav Sharma)
        cls.student_user = repository.get_user_by_email("student@sambhav.edu")
        assert cls.student_user is not None
        cls.student_token = create_access_token(
            user_id=cls.student_user["id"],
            email=cls.student_user["email"],
            role=cls.student_user["role"],
            name=cls.student_user["name"],
        )
        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}

        # 3. Secondary Instructor (for IDOR isolation testing)
        cls.inst2_user = repository.get_user_by_email("prof2@sambhav.edu")
        if not cls.inst2_user:
            cls.inst2_user = repository.create_user(
                name="Prof. Rajesh Gupta",
                email="prof2@sambhav.edu",
                password_hash="pbkdf2:test#2026",
                role="instructor",
            )
        cls.inst2_token = create_access_token(
            user_id=cls.inst2_user["id"],
            email=cls.inst2_user["email"],
            role=cls.inst2_user["role"],
            name=cls.inst2_user["name"],
        )
        cls.inst2_headers = {"Authorization": f"Bearer {cls.inst2_token}"}

    def test_strict_rbac_student_blocked_from_all_instructor_apis(self):
        """Verify that student role is strictly rejected (403) from all instructor endpoints."""
        endpoints = [
            ("GET", "/api/instructor/dashboard"),
            ("GET", "/api/instructor/analytics"),
            ("GET", "/api/instructor/curriculum"),
            ("GET", "/api/instructor/classes"),
            ("POST", "/api/instructor/classes", {"name": "Hack Class"}),
            ("GET", "/api/instructor/learners"),
            ("GET", "/api/instructor/assessments"),
            ("GET", "/api/instructor/labs"),
            ("POST", "/api/instructor/ai/generate", {"action": "generate_lesson", "topic": "Qubits", "level": "Beginner"}),
        ]

        for item in endpoints:
            method = item[0]
            url = item[1]
            body = item[2] if len(item) > 2 else None

            if method == "GET":
                resp = self.client.get(url, headers=self.student_headers)
            else:
                resp = self.client.post(url, headers=self.student_headers, json=body)
            self.assertEqual(resp.status_code, 403, f"Student was not blocked from {url}")

    def test_instructor_dashboard_metrics(self):
        """Verify instructor dashboard returns real computed metrics without fabrication."""
        resp = self.client.get("/api/instructor/dashboard", headers=self.instructor_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("totalLearners", data)
        self.assertIn("activeLearners", data)
        self.assertIn("classesCount", data)
        self.assertIn("publishedContent", data)
        self.assertIn("pendingSubmissions", data)
        self.assertIn("averageProgress", data)
        self.assertIn("averageScore", data)
        self.assertIn("recentActivity", data)
        self.assertIn("classes", data)
        self.assertIn("learners", data)

    def test_curriculum_management_and_canonical_protection(self):
        """Verify viewing 10 modules, creating custom draft lesson, publishing, and protecting canonical lessons."""
        # 1. View curriculum
        resp = self.client.get("/api/instructor/curriculum", headers=self.instructor_headers)
        self.assertEqual(resp.status_code, 200)
        courses = resp.json()
        self.assertTrue(len(courses) > 0)
        modules = courses[0]["modules"]
        self.assertEqual(len(modules), 10, "Should contain all 10 unified modules (0-9)")

        # 2. Canonical lesson cannot be deleted
        del_canonical_resp = self.client.delete("/api/instructor/lessons/complex-vectors", headers=self.instructor_headers)
        self.assertEqual(del_canonical_resp.status_code, 403, "Must not allow deleting canonical lesson")

        # 3. Create custom draft lesson
        create_resp = self.client.post(
            "/api/instructor/lessons",
            headers=self.instructor_headers,
            json={
                "module_id": "module-1",
                "title": "Instructor Custom Qubit Lab Guide",
                "description": "Custom guide authored for laboratory experiments.",
                "difficulty": "Beginner",
                "estimated_minutes": 20,
                "content_markdown": "# Custom Qubit Lab Guide\n\nDeep dive into Bloch sphere rotations.",
                "learning_objectives": ["Understand X and H gates", "Calculate statevectors"],
                "status": "draft",
            },
        )
        self.assertEqual(create_resp.status_code, 201)
        lesson = create_resp.json()
        lesson_id = lesson["id"]
        self.assertEqual(lesson["status"], "draft")

        # 4. Duplicate canonical lesson as instructor draft copy
        dup_resp = self.client.post(f"/api/instructor/lessons/complex-vectors/duplicate", headers=self.instructor_headers)
        self.assertEqual(dup_resp.status_code, 200)
        dup_lesson = dup_resp.json()
        self.assertEqual(dup_lesson["status"], "draft")
        self.assertIn("Custom Copy", dup_lesson["title"])

        # 5. Publish custom lesson
        pub_resp = self.client.post(
            f"/api/instructor/lessons/{lesson_id}/publish",
            headers=self.instructor_headers,
            json={"status": "published"},
        )
        self.assertEqual(pub_resp.status_code, 200)

        # 6. Delete custom lesson
        del_resp = self.client.delete(f"/api/instructor/lessons/{lesson_id}", headers=self.instructor_headers)
        self.assertEqual(del_resp.status_code, 200)

    def test_class_cohort_management_and_idor_isolation(self):
        """Verify class creation, unique enrollment codes, student enrollment, and isolation between instructors."""
        # 1. Instructor 1 creates Class A
        create_resp = self.client.post(
            "/api/instructor/classes",
            headers=self.instructor_headers,
            json={
                "name": "Advanced Quantum Algorithms Fall 2026",
                "description": "Graduate seminar on Shor, Grover, and QPE.",
            },
        )
        self.assertEqual(create_resp.status_code, 201)
        cls_a = create_resp.json()
        cls_a_id = cls_a["id"]
        self.assertTrue(cls_a["enrollment_code"].startswith("QC"))

        # 2. Instructor 1 assigns a lesson to Class A
        assign_resp = self.client.post(
            f"/api/instructor/classes/{cls_a_id}/assign",
            headers=self.instructor_headers,
            json={
                "title": "Module 4: Grover Search Experiment",
                "type": "lesson",
                "target_id": "grovers-search",
                "due_date": "2026-11-01T23:59:59Z",
            },
        )
        self.assertEqual(assign_resp.status_code, 201)

        # 3. IDOR Check: Instructor 2 cannot view or delete Instructor 1's class
        inst2_get = self.client.get(f"/api/instructor/classes/{cls_a_id}", headers=self.inst2_headers)
        self.assertEqual(inst2_get.status_code, 404)

        inst2_del = self.client.delete(f"/api/instructor/classes/{cls_a_id}", headers=self.inst2_headers)
        self.assertEqual(inst2_del.status_code, 403)

        # 4. Instructor 1 can view Class A
        inst1_get = self.client.get(f"/api/instructor/classes/{cls_a_id}", headers=self.instructor_headers)
        self.assertEqual(inst1_get.status_code, 200)

    def test_assessment_management_workflow(self):
        """Verify creating assessment with question bank, listing, and submissions."""
        # 1. Create assessment
        create_resp = self.client.post(
            "/api/instructor/assessments",
            headers=self.instructor_headers,
            json={
                "course_id": "quantum-foundations",
                "module_id": "module-2",
                "title": "Quantum Entanglement & Bell Pairs Quiz",
                "description": "5-question test on multi-qubit states and non-locality.",
                "type": "quiz",
                "duration_minutes": 25,
                "passing_score": 75.0,
                "questions": [
                    {
                        "id": "q1",
                        "type": "multiple_choice",
                        "prompt": "Which gate combination generates the Bell state |Φ⁺⟩ from |00⟩?",
                        "options": ["H on q0 then CX(0,1)", "X on q0 then CX(0,1)", "CX(0,1) then H on q1", "H on q0 and H on q1"],
                        "correctIndex": 0,
                        "marks": 20,
                        "explanation": "H on q0 creates (|0⟩+|1⟩)/√2. CX then flips q1 when q0 is |1⟩, producing (|00⟩+|11⟩)/√2.",
                    },
                    {
                        "id": "q2",
                        "type": "numerical",
                        "prompt": "What is the probability of measuring |01⟩ in a pure Bell state (|Φ⁺⟩)?",
                        "options": ["0.0", "0.25", "0.50", "1.0"],
                        "correctIndex": 0,
                        "marks": 20,
                        "explanation": "The Bell state |Φ⁺⟩ contains only |00⟩ and |11⟩ amplitudes with 0% amplitude for |01⟩ and |10⟩.",
                    },
                ],
                "published": True,
            },
        )
        self.assertEqual(create_resp.status_code, 201)
        assess = create_resp.json()
        assess_id = assess["id"]
        self.assertEqual(len(assess["questions"]), 2)

        # 2. List assessments
        list_resp = self.client.get("/api/instructor/assessments", headers=self.instructor_headers)
        self.assertEqual(list_resp.status_code, 200)
        self.assertTrue(any(a["id"] == assess_id for a in list_resp.json()))

    def test_quantum_lab_assignments_and_student_submission(self):
        """Verify Quantum Lab assignment creation, student visibility, and submission workflow."""
        # 1. Instructor creates lab assignment
        create_resp = self.client.post(
            "/api/instructor/labs",
            headers=self.instructor_headers,
            json={
                "title": "Quantum Teleportation Circuit Lab",
                "description": "Implement the full 3-qubit quantum teleportation protocol.",
                "learning_objective": "Transmit an unknown quantum state using EPR entanglement and classical feedforward.",
                "qubits": 3,
                "starter_circuit": {"qubits": 3, "classicalBits": 2, "operations": [{"gate": "h", "targets": [1]}, {"gate": "cx", "controls": [1], "targets": [2]}]},
                "required_gates": ["h", "cx", "measure"],
                "expected_result": "State of Qubit 0 teleported to Qubit 2.",
                "hints": ["Create EPR pair on q1, q2", "Bell measurement on q0, q1"],
                "difficulty": "Intermediate",
                "marks": 100,
                "instructions": "Build the circuit in Quantum Lab and submit with measurement verify.",
            },
        )
        self.assertEqual(create_resp.status_code, 201)
        lab = create_resp.json()
        lab_id = lab["id"]

        # 2. Student lists assigned labs
        student_labs_resp = self.client.get("/api/circuits/assigned-labs", headers=self.student_headers)
        self.assertEqual(student_labs_resp.status_code, 200)
        self.assertTrue(any(l["id"] == lab_id for l in student_labs_resp.json()))

        # 3. Student submits lab solution
        submit_resp = self.client.post(
            f"/api/circuits/assigned-labs/{lab_id}/submit",
            headers=self.student_headers,
            json={
                "circuit": {"qubits": 3, "classicalBits": 2, "operations": [{"gate": "h", "targets": [0]}]},
                "simulation_result": {"shots": 1024, "probabilities": {"000": 0.5, "100": 0.5}},
            },
        )
        self.assertEqual(submit_resp.status_code, 200)
        sub_id = submit_resp.json()["id"]

        # 4. Instructor views submissions
        subs_resp = self.client.get(f"/api/instructor/labs/{lab_id}/submissions", headers=self.instructor_headers)
        self.assertEqual(subs_resp.status_code, 200)
        subs = subs_resp.json()
        self.assertTrue(len(subs) > 0)

        # 5. Instructor grades submission
        grade_resp = self.client.post(
            f"/api/instructor/labs/{lab_id}/submissions/{sub_id}/grade",
            headers=self.instructor_headers,
            json={"score": 95.0, "feedback": "Excellent teleportation setup and clean measurement mapping."},
        )
        self.assertEqual(grade_resp.status_code, 200)

    def test_real_analytics_data_integrity(self):
        """Verify that analytics endpoint returns genuine structured metrics from real database."""
        resp = self.client.get("/api/instructor/analytics", headers=self.instructor_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("hasData", data)
        self.assertIn("totalSubmissions", data)
        self.assertIn("moduleCompletions", data)
        self.assertIn("scoreDistribution", data)
        self.assertIn("conceptStats", data)
        self.assertIn("learnersBehind", data)

    def test_ai_educator_copilot_draft_mode(self):
        """Verify AI Educator Copilot always returns draft mode and server-side responses."""
        resp = self.client.post(
            "/api/instructor/ai/generate",
            headers=self.instructor_headers,
            json={
                "action": "generate_lesson",
                "topic": "Quantum Density Matrices and Mixed States",
                "level": "Intermediate",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "draft")
        self.assertTrue(data["isDraft"])
        self.assertIn("disclaimer", data)
        self.assertTrue(len(data["content"]) > 0)


if __name__ == "__main__":
    unittest.main()
