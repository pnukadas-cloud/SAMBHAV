import math
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.gemini_service import GeminiService


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
        with patch.object(GeminiService, "generate_explanation", return_value="The circuit creates the maximally entangled Bell state."):
            response = self.client.post("/api/ai/explain", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["source"], "gemini")
            self.assertTrue(len(data["explanation"]) > 10)
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
        with patch.object(GeminiService, "generate_explanation", return_value="Superposition on control qubit combined with CX entangles both qubits."):
            response = self.client.post("/api/ai/explain", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["source"], "gemini")
            self.assertIn("superposition", data["explanation"].lower())

    def test_ai_tutor_all_8_required_questions(self):
        """Verify the 8 required AI tutor questions route strictly to Gemini and return source='gemini'."""
        questions = [
            "What is a qubit?",
            "Why does the Hadamard gate create superposition?",
            "What is quantum entanglement?",
            "Explain Grover's algorithm.",
            "What does a CNOT gate do?",
            "Why does my current circuit produce these measurement probabilities?",
            "Give me a hint for this circuit instead of the answer.",
            "Hello, can you help me understand quantum computing?",
        ]

        def mock_gemini(question=None, **kwargs):
            return f"Gemini physical explanation for: {question}"

        with patch.object(GeminiService, "generate_explanation", side_effect=mock_gemini):
            for q in questions:
                resp = self.client.post("/api/ai/explain", json={"question": q})
                self.assertEqual(resp.status_code, 200)
                data = resp.json()
                self.assertEqual(data["source"], "gemini")
                self.assertIn(q, data["explanation"])
                self.assertTrue(len(data["key_concepts"]) > 0)
                self.assertTrue(len(data["suggestions"]) > 0)

    def test_gemini_service_prompt_separation(self):
        """Verify prompt structure clearly prioritizes USER QUESTION and includes SUPPORTING context."""
        from app.quantum.models import CircuitIR, SimulationResult

        service = GeminiService()
        circuit = CircuitIR(qubits=2, classicalBits=2, operations=[{"gate": "h", "targets": [0]}, {"gate": "cx", "controls": [0], "targets": [1]}])
        sim = SimulationResult(
            backend="local_statevector",
            shots=1024,
            counts={"00": 512, "11": 512},
            probabilities={"00": 0.5, "11": 0.5},
            statevector=[],
            bloch=[],
            dirac="0.707|00⟩ + 0.707|11⟩",
            warnings=[],
        )
        prompt = service.build_prompt(
            question="Why does this circuit create entanglement?",
            circuit=circuit,
            sim_result=sim,
            lesson_context={"title": "Bell States", "objective": "Create EPR pairs", "course": "Quantum Fundamentals"},
        )

        self.assertIn("USER QUESTION:\nWhy does this circuit create entanglement?", prompt)
        self.assertIn("INSTRUCTION:", prompt)
        self.assertIn("Answer the user's question directly", prompt)
        self.assertIn("CURRENT CIRCUIT (Supporting Context):", prompt)
        self.assertIn("Step 1: H on qubit 0", prompt)
        self.assertIn("Step 2: CX (control: qubit 0, target: qubit 1)", prompt)
        self.assertIn("SIMULATION RESULT (Supporting Context):", prompt)
        self.assertIn("Dirac Statevector: 0.707|00⟩ + 0.707|11⟩", prompt)
        self.assertIn("LESSON CONTEXT:", prompt)
        self.assertIn("Lesson: Bell States", prompt)

    def test_gemini_mocked_success_response(self):
        """Verify that Gemini returns source='gemini'."""
        with patch.object(GeminiService, "generate_explanation", return_value="The Hadamard gate creates an equal superposition of basis states."):
            resp = self.client.post("/api/ai/explain", json={"question": "Why does H create superposition?"})
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["source"], "gemini")
            self.assertEqual(data["explanation"], "The Hadamard gate creates an equal superposition of basis states.")

    def test_api_security_no_key_leakage(self):
        """Verify that API keys or environment secrets are NEVER leaked in API response payloads."""
        with patch.object(GeminiService, "generate_explanation", return_value="A qubit is a quantum bit."):
            resp = self.client.post("/api/ai/explain", json={"question": "What is a qubit?"})
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertNotIn("api_key", str(data).lower())
            self.assertNotIn("gemini_api_key", str(data).lower())
            self.assertNotIn("secret", str(data).lower())

    def test_ai_generate_challenge_endpoint(self):
        payload = {
            "learnerLevel": "intermediate",
            "topic": "Quantum Entanglement and Bell States",
            "current_circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [{"gate": "h", "targets": [0]}],
            },
            "weak_concepts": ["controlled-gates", "entanglement"],
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
        self.assertEqual(data.get("source"), "gemini")
        self.assertTrue(len(data["hints"]) >= 1)

    def test_ai_explain_circuit_endpoint(self):
        payload = {
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "controls": [0], "targets": [1]},
                ],
            },
            "learnerLevel": "beginner",
        }
        with patch.object(GeminiService, "generate_explanation", return_value="Circuit analysis by Gemini AI."):
            response = self.client.post("/api/ai/explain-circuit", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["mode"], "gemini")
            self.assertEqual(data["explanation"], "Circuit analysis by Gemini AI.")


if __name__ == "__main__":
    unittest.main()
