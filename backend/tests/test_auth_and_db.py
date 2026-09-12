import unittest
from fastapi.testclient import TestClient

from app.auth.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db import repository
from app.db.connection import init_db
from app.db.seeds import seed_database
from app.main import app


class TestAuthAndDatabase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_database()
        cls.client = TestClient(app)

    def test_password_hashing_and_verification(self):
        pw = "SuperSecureQuantumPass2026!"
        hashed = hash_password(pw)
        self.assertTrue(hashed.startswith("pbkdf2:sha256:"))
        self.assertTrue(verify_password(pw, hashed))
        self.assertFalse(verify_password("WrongPassword123", hashed))

    def test_access_token_creation_and_decoding(self):
        token = create_access_token(
            user_id="test-user-123",
            email="test@sambhav.edu",
            role="student",
            name="Test Student",
        )
        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["sub"], "test-user-123")
        self.assertEqual(decoded["email"], "test@sambhav.edu")
        self.assertEqual(decoded["role"], "student")

    def test_demo_student_login_with_otp_flow(self):
        # Step 1: Initiate login with valid credentials
        init_resp = self.client.post(
            "/api/auth/login",
            json={"email": "student@sambhav.edu", "password": "QuantumLearner#2026"},
        )
        self.assertEqual(init_resp.status_code, 200)
        init_data = init_resp.json()
        self.assertEqual(init_data["status"], "otp_required")
        self.assertIn("session_token", init_data)
        self.assertEqual(init_data["email"], "student@sambhav.edu")
        session_token = init_data["session_token"]
        dev_otp = init_data.get("dev_otp")
        self.assertIsNotNone(dev_otp)
        self.assertEqual(len(dev_otp), 6)

        # Step 2: Test incorrect OTP rejection
        wrong_otp_resp = self.client.post(
            "/api/auth/verify-otp",
            json={"session_token": session_token, "otp_code": "000000"},
        )
        self.assertEqual(wrong_otp_resp.status_code, 400)
        self.assertIn("Incorrect verification code", wrong_otp_resp.json()["detail"])

        # Step 3: Verify with correct OTP
        verify_resp = self.client.post(
            "/api/auth/verify-otp",
            json={"session_token": session_token, "otp_code": dev_otp},
        )
        self.assertEqual(verify_resp.status_code, 200)
        data = verify_resp.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "student@sambhav.edu")
        self.assertEqual(data["user"]["role"], "student")

        # Step 4: Verify OTP reuse is rejected (single-use)
        reused_resp = self.client.post(
            "/api/auth/verify-otp",
            json={"session_token": session_token, "otp_code": dev_otp},
        )
        self.assertEqual(reused_resp.status_code, 400)

    def test_demo_instructor_login_with_otp_flow(self):
        # Step 1: Initiate instructor login
        init_resp = self.client.post(
            "/api/auth/login",
            json={"email": "instructor@sambhav.edu", "password": "ProfessorQuantum#2026"},
        )
        self.assertEqual(init_resp.status_code, 200)
        init_data = init_resp.json()
        self.assertEqual(init_data["status"], "otp_required")
        session_token = init_data["session_token"]
        dev_otp = init_data.get("dev_otp")
        self.assertIsNotNone(dev_otp)

        # Step 2: Verify instructor OTP
        verify_resp = self.client.post(
            "/api/auth/verify-otp",
            json={"session_token": session_token, "otp_code": dev_otp},
        )
        self.assertEqual(verify_resp.status_code, 200)
        data = verify_resp.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "instructor@sambhav.edu")
        self.assertEqual(data["user"]["role"], "instructor")

    def test_otp_resend_rate_limiting(self):
        init_resp = self.client.post(
            "/api/auth/login",
            json={"email": "student@sambhav.edu", "password": "QuantumLearner#2026"},
        )
        self.assertEqual(init_resp.status_code, 200)
        session_token = init_resp.json()["session_token"]

        # Immediate resend request should trigger 429 Too Many Requests cooldown
        resend_resp = self.client.post(
            "/api/auth/resend-otp",
            json={"session_token": session_token},
        )
        self.assertEqual(resend_resp.status_code, 429)
        self.assertIn("Please wait", resend_resp.json()["detail"])

    def test_invalid_login_rejected(self):
        response = self.client.post(
            "/api/auth/login",
            json={"email": "student@sambhav.edu", "password": "InvalidPassword"},
        )
        self.assertEqual(response.status_code, 401)


    def test_get_me_with_valid_token(self):
        token = create_access_token(
            user_id="test-me-id",
            email="me@sambhav.edu",
            role="student",
            name="Me User",
        )
        response = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "me@sambhav.edu")

    def test_courses_and_modules_from_db(self):
        response = self.client.get("/api/courses")
        self.assertEqual(response.status_code, 200)
        courses = response.json()
        self.assertGreaterEqual(len(courses), 1)
        foundations = next((c for c in courses if c["id"] == "quantum-foundations"), None)
        self.assertIsNotNone(foundations)
        self.assertGreaterEqual(len(foundations.get("modules", [])), 1)

    def test_challenges_listing_and_bell_state_evaluation(self):
        # 1. List challenges
        resp = self.client.get("/api/challenges")
        self.assertEqual(resp.status_code, 200)
        challenges = resp.json()
        self.assertGreaterEqual(len(challenges), 3)

        # 2. Evaluate correct Bell state circuit
        bell_circuit = {
            "qubits": 2,
            "classicalBits": 2,
            "operations": [
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "controls": [0], "targets": [1]},
                {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
            ],
        }
        eval_resp = self.client.post(
            "/api/challenges/evaluate",
            json={"challenge_id": "bell-state-creation", "circuit": bell_circuit},
        )
        self.assertEqual(eval_resp.status_code, 200)
        res = eval_resp.json()
        self.assertTrue(res["passed"])
        self.assertEqual(res["score"], 100.0)
        self.assertGreater(res["xp_earned"], 0)

    def test_circuit_save_and_retrieve(self):
        # Create student user and get token
        student = repository.get_user_by_email("student@sambhav.edu")
        self.assertIsNotNone(student)
        token = create_access_token(
            user_id=student["id"],
            email=student["email"],
            role=student["role"],
            name=student["name"],
        )

        test_circuit = {
            "qubits": 2,
            "classicalBits": 2,
            "operations": [
                {"gate": "h", "targets": [0]},
                {"gate": "x", "targets": [1]},
            ],
        }

        save_resp = self.client.post(
            "/api/circuits/save",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Superposition Test Circuit",
                "circuit": test_circuit,
                "description": "H gate on q0 and X gate on q1",
            },
        )
        self.assertEqual(save_resp.status_code, 200)
        saved_id = save_resp.json()["circuit"]["id"]

        list_resp = self.client.get(
            "/api/circuits/my-circuits",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(list_resp.status_code, 200)
        user_circuits = list_resp.json()
        self.assertTrue(any(c["id"] == saved_id for c in user_circuits))

    def test_instructor_dashboard_authorization(self):
        # 1. Unauthenticated request -> 401 Unauthorized
        unauth_resp = self.client.get("/api/instructor/dashboard")
        self.assertEqual(unauth_resp.status_code, 401)

        # 2. Student token request -> 403 Forbidden
        student_token = create_access_token(
            user_id="student-123",
            email="student@sambhav.edu",
            role="student",
            name="Student User",
        )
        forbidden_resp = self.client.get(
            "/api/instructor/dashboard",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        self.assertEqual(forbidden_resp.status_code, 403)

        # 3. Instructor token request -> 200 OK
        instructor = repository.get_user_by_email("instructor@sambhav.edu")
        self.assertIsNotNone(instructor)
        instructor_token = create_access_token(
            user_id=instructor["id"],
            email=instructor["email"],
            role=instructor["role"],
            name=instructor["name"],
        )
        response = self.client.get(
            "/api/instructor/dashboard",
            headers={"Authorization": f"Bearer {instructor_token}"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("activeStudents", data)
        self.assertIn("averageScore", data)
        self.assertIn("commonMistakes", data)
        self.assertIn("students", data)

        # 4. Student token attempting to create course -> 403 Forbidden
        student_course_create_resp = self.client.post(
            "/api/courses",
            headers={"Authorization": f"Bearer {student_token}"},
            json={"title": "Unauthorized Course", "description": "Should fail", "difficulty": "Beginner"}
        )
        self.assertEqual(student_course_create_resp.status_code, 403)


    def test_instructor_course_authoring_and_student_access(self):
        instructor = repository.get_user_by_email("instructor@sambhav.edu")
        self.assertIsNotNone(instructor)
        instructor_token = create_access_token(
            user_id=instructor["id"],
            email=instructor["email"],
            role=instructor["role"],
            name=instructor["name"],
        )

        # 1. Instructor creates a new course
        new_course_payload = {
            "title": "Quantum Error Correction Masterclass",
            "description": "Comprehensive course on 3-qubit bit flip and Shor code.",
            "difficulty": "Advanced",
            "published": True
        }
        course_resp = self.client.post(
            "/api/courses",
            headers={"Authorization": f"Bearer {instructor_token}"},
            json=new_course_payload
        )
        self.assertEqual(course_resp.status_code, 201)
        course_data = course_resp.json()
        course_id = course_data["id"]
        self.assertEqual(course_data["title"], "Quantum Error Correction Masterclass")

        # 2. Instructor adds a module
        new_mod_payload = {
            "title": "Module 1: Bit-Flip Repetition Code",
            "order_index": 1
        }
        mod_resp = self.client.post(
            f"/api/courses/{course_id}/modules",
            headers={"Authorization": f"Bearer {instructor_token}"},
            json=new_mod_payload
        )
        self.assertEqual(mod_resp.status_code, 201)
        module_id = mod_resp.json()["id"]

        # 3. Instructor adds a lesson
        new_lesson_payload = {
            "title": "Bit-Flip Syndrome Measurement",
            "content_markdown": "# Quantum Error Correction\n\nProtects quantum information from decoherence.",
            "estimated_minutes": 25,
            "order_index": 1
        }
        lesson_resp = self.client.post(
            f"/api/courses/modules/{module_id}/lessons",
            headers={"Authorization": f"Bearer {instructor_token}"},
            json=new_lesson_payload
        )
        self.assertEqual(lesson_resp.status_code, 201)
        lesson_id = lesson_resp.json()["id"]

        # 4. Verify public / student can fetch this published course and lesson
        get_course_resp = self.client.get(f"/api/courses/{course_id}")
        self.assertEqual(get_course_resp.status_code, 200)
        loaded_course = get_course_resp.json()
        self.assertEqual(loaded_course["title"], "Quantum Error Correction Masterclass")
        self.assertEqual(len(loaded_course["modules"]), 1)
        self.assertEqual(len(loaded_course["modules"][0]["lessons"]), 1)
        self.assertEqual(loaded_course["modules"][0]["lessons"][0]["id"], lesson_id)
        self.assertEqual(loaded_course["modules"][0]["lessons"][0]["title"], "Bit-Flip Syndrome Measurement")


if __name__ == "__main__":
    unittest.main()

