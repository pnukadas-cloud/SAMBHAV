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

    def test_demo_student_login(self):
        response = self.client.post(
            "/api/auth/login",
            json={"email": "student@sambhav.edu", "password": "QuantumLearner#2026"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "student@sambhav.edu")
        self.assertEqual(data["user"]["role"], "student")

    def test_demo_instructor_login(self):
        response = self.client.post(
            "/api/auth/login",
            json={"email": "instructor@sambhav.edu", "password": "ProfessorQuantum#2026"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "instructor@sambhav.edu")
        self.assertEqual(data["user"]["role"], "instructor")

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


if __name__ == "__main__":
    unittest.main()
