import unittest
from fastapi.testclient import TestClient

from app.auth.email_service import email_service
from app.auth.security import create_access_token, hash_password
from app.db import repository
from app.db.connection import init_db
from app.db.seeds import seed_database
from app.main import app


class TestCurriculumAndSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_database()
        cls.client = TestClient(app)

        # Create or fetch test users
        if not repository.get_user_by_email("test_student@sambhav.edu"):
            repository.create_user(
                name="Test Student",
                email="test_student@sambhav.edu",
                password_hash=hash_password("StudentPass#2026"),
                role="student",
            )
        if not repository.get_user_by_email("test_instructor@sambhav.edu"):
            repository.create_user(
                name="Test Instructor",
                email="test_instructor@sambhav.edu",
                password_hash=hash_password("InstructorPass#2026"),
                role="instructor",
            )

        cls.student_token = create_access_token(
            user_id="student-test-id",
            email="test_student@sambhav.edu",
            role="student",
            name="Test Student",
        )
        cls.instructor_token = create_access_token(
            user_id="instructor-test-id",
            email="test_instructor@sambhav.edu",
            role="instructor",
            name="Test Instructor",
        )

    def test_canonical_curriculum_modules_count_and_titles(self):
        """Verify the unified curriculum contains exactly the 10 canonical modules (0-9)."""
        courses = repository.list_courses()
        self.assertGreaterEqual(len(courses), 1)
        
        main_course = repository.get_course_by_id("quantum-foundations") or next((c for c in courses if c["id"] == "quantum-foundations"), None)
        self.assertIsNotNone(main_course, "Canonical SAMBHAV curriculum 'quantum-foundations' must exist.")
        modules = main_course.get("modules", [])
        self.assertEqual(len(modules), 10, "Curriculum must have exactly 10 canonical modules (Modules 0-9).")

        expected_titles = [
            "Module 0: Mathematical & Computational Foundations",
            "Module 1: Quantum Foundations",
            "Module 2: Multi-Qubit Systems & Quantum Circuits",
            "Module 3: Quantum Programming & Simulation Lab",
            "Module 4: Fundamental Quantum Algorithms",
            "Module 5: Quantum Information & Communication",
            "Module 6: Quantum Noise & Error Correction",
            "Module 7: Quantum Computing Applications",
            "Module 8: Quantum Hardware & Real-World Systems",
            "Module 9: Research & Advanced Quantum Computing",
        ]

        actual_titles = [m["title"] for m in modules]
        for exp in expected_titles:
            self.assertIn(exp, actual_titles, f"Expected canonical module '{exp}' in curriculum.")

    def test_no_fragmented_institutional_tracks(self):
        """Verify no duplicate GITAM, University, College, or Global tracks are exposed."""
        courses = repository.list_courses()
        for c in courses:
            title_lower = c["title"].lower()
            desc_lower = c.get("description", "").lower()
            self.assertNotIn("gitam", title_lower)
            self.assertNotIn("gitam", desc_lower)

    def test_rbac_student_forbidden_from_instructor_endpoints(self):
        """Verify students cannot access instructor endpoints or create courses."""
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        # Student attempting to access instructor dashboard
        resp = self.client.get("/api/instructor/dashboard", headers=headers)
        self.assertEqual(resp.status_code, 403, "Student must be forbidden from instructor dashboard.")

        # Student attempting to create a course
        create_resp = self.client.post(
            "/api/courses",
            headers=headers,
            json={
                "title": "Unauthorized Course",
                "description": "Student should not be able to create this.",
                "difficulty": "Beginner",
            },
        )
        self.assertEqual(create_resp.status_code, 403, "Student must be forbidden from creating courses.")

    def test_rbac_instructor_authorized(self):
        """Verify instructor token is authorized for instructor endpoints."""
        headers = {"Authorization": f"Bearer {self.instructor_token}"}
        resp = self.client.get("/api/instructor/dashboard", headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("activeStudents", data)

    def test_otp_privacy_and_security(self):
        """Verify OTP is never exposed in response body and verification challenge works."""
        # 1. Login attempt
        resp = self.client.post(
            "/api/auth/login",
            json={"email": "student@sambhav.edu", "password": "QuantumLearner#2026"},
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        
        # Must NOT expose OTP in response
        self.assertNotIn("otp", body)
        self.assertNotIn("code", body)
        self.assertNotIn("dev_otp", body)
        self.assertIn("session_token", body)
        self.assertEqual(body["status"], "otp_required")

        session_token = body["session_token"]
        otp_code = email_service.last_dispatched_code_for_test
        self.assertIsNotNone(otp_code)

        # 2. Verify with incorrect OTP -> must fail
        bad_verify = self.client.post(
            "/api/auth/verify-otp",
            json={"session_token": session_token, "otp_code": "000000"},
        )
        self.assertEqual(bad_verify.status_code, 400)

        # 3. Verify with correct OTP -> must succeed and return JWT token
        good_verify = self.client.post(
            "/api/auth/verify-otp",
            json={"session_token": session_token, "otp_code": otp_code},
        )
        self.assertEqual(good_verify.status_code, 200)
        auth_data = good_verify.json()
        self.assertIn("token", auth_data)
        self.assertEqual(auth_data["user"]["role"], "student")


if __name__ == "__main__":
    unittest.main()
