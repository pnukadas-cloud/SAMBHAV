import math
import unittest
from fastapi.testclient import TestClient

from app.main import app


class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "sambhav-api"})

    def test_run_simulation_h_gate(self):
        payload = {
            "circuit": {
                "qubits": 1,
                "classicalBits": 1,
                "operations": [{"gate": "h", "targets": [0]}],
            },
            "options": {"backend": "local_statevector", "shots": 1000},
        }
        response = self.client.post("/api/simulations/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["backend"], "local_statevector")
        self.assertAlmostEqual(data["probabilities"]["0"], 0.5, places=5)
        self.assertAlmostEqual(data["probabilities"]["1"], 0.5, places=5)
        self.assertIn("dirac", data)
        self.assertIn("|0⟩", data["dirac"])
        self.assertIn("|1⟩", data["dirac"])

    def test_run_simulation_x_gate(self):
        payload = {
            "circuit": {
                "qubits": 1,
                "classicalBits": 1,
                "operations": [{"gate": "x", "targets": [0]}],
            },
            "options": {"backend": "local_statevector", "shots": 1000},
        }
        response = self.client.post("/api/simulations/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertAlmostEqual(data["probabilities"]["1"], 1.0, places=5)
        self.assertEqual(data["dirac"], "|ψ⟩ = |1⟩")

    def test_run_simulation_bell_state(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "controls": [0], "targets": [1]},
                    {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
                ],
            },
            "options": {"backend": "local_statevector", "shots": 1024},
        }
        response = self.client.post("/api/simulations/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertAlmostEqual(data["probabilities"]["00"], 0.5, places=5)
        self.assertAlmostEqual(data["probabilities"]["11"], 0.5, places=5)
        self.assertNotIn("01", data["probabilities"])
        self.assertNotIn("10", data["probabilities"])
        self.assertIn("|00⟩", data["dirac"])
        self.assertIn("|11⟩", data["dirac"])

    def test_run_simulation_reversed_cx(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [1]},
                    {"gate": "cx", "controls": [1], "targets": [0]},
                ],
            },
            "options": {"backend": "local_statevector", "shots": 1024},
        }
        response = self.client.post("/api/simulations/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertAlmostEqual(data["probabilities"]["00"], 0.5, places=5)
        self.assertAlmostEqual(data["probabilities"]["11"], 0.5, places=5)

    def test_run_simulation_rotations(self):
        payload = {
            "circuit": {
                "qubits": 1,
                "classicalBits": 1,
                "operations": [{"gate": "rx", "targets": [0], "params": [math.pi]}],
            },
            "options": {"backend": "local_statevector", "shots": 1000},
        }
        response = self.client.post("/api/simulations/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertAlmostEqual(data["probabilities"]["1"], 1.0, places=4)

    def test_run_simulation_swap_gate(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "x", "targets": [0]},
                    {"gate": "swap", "targets": [0, 1]},
                ],
            },
            "options": {"backend": "local_statevector", "shots": 512},
        }
        response = self.client.post("/api/simulations/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertAlmostEqual(data["probabilities"]["01"], 1.0, places=5)

    def test_qiskit_code_generation(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "controls": [0], "targets": [1]},
                    {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
                ],
            },
            "framework": "qiskit",
        }
        response = self.client.post("/api/circuits/to-code", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("QuantumCircuit(2, 2)", data["code"])
        self.assertIn("qc.h(0)", data["code"])
        self.assertIn("qc.cx(0, 1)", data["code"])
        self.assertIn("qc.measure(0, 0)", data["code"])

    def test_empty_circuit_backend_validation(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [],
            }
        }
        response = self.client.post("/api/simulations/run", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_ai_explain_endpoint_default(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "controls": [0], "targets": [1]},
                ],
            },
            "lesson_context": {
                "title": "Bell States",
                "objective": "Understand maximum quantum entanglement",
            },
        }
        response = self.client.post("/api/ai/explain", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["source"], ["llm", "fallback"])
        self.assertTrue(len(data["explanation"]) > 20)
        self.assertIn("Bell", data["explanation"])
        self.assertIsInstance(data["key_concepts"], list)
        self.assertIsInstance(data["suggestions"], list)

    def test_ai_explain_endpoint_with_question(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "controls": [0], "targets": [1]},
                ],
            },
            "question": "Why did this circuit create entanglement?",
        }
        response = self.client.post("/api/ai/explain", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["source"], ["llm", "fallback"])
        explanation_lower = data["explanation"].lower()
        self.assertIn("superposition", explanation_lower)
        self.assertTrue("cx" in explanation_lower or "controlled" in explanation_lower or "cnot" in explanation_lower)


    def test_ai_generate_challenge_endpoint(self):
        payload = {
            "learnerLevel": "intermediate",
            "topic": "Quantum Entanglement and Bell States",
            "current_circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [{"gate": "h", "targets": [0]}]
            },
            "weak_concepts": ["controlled-gates", "entanglement"]
        }
        response = self.client.post("/api/ai/generate-challenge", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("title", data)
        self.assertIn("description", data)
        self.assertIn("task", data)
        self.assertIn("hints", data)
        self.assertIn("targetExpected", data)
        self.assertIn("qubits", data)
        self.assertIn(data.get("source"), ["llm", "curated_fallback", "rule-based-generator"])
        self.assertTrue(len(data["hints"]) >= 1)



if __name__ == "__main__":
    unittest.main()

