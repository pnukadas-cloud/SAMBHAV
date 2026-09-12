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
        self.assertIn(data["source"], ["gemini", "llm", "fallback"])
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
        self.assertIn(data["source"], ["gemini", "llm", "fallback"])
        explanation_lower = data["explanation"].lower()
        self.assertIn("superposition", explanation_lower)
        self.assertTrue("cx" in explanation_lower or "controlled" in explanation_lower or "cnot" in explanation_lower)

    def test_ai_tutor_all_required_questions(self):
        """Verify the 6 required AI tutor questions produce distinct, pedagogically accurate responses."""
        # 1. "What is a qubit?"
        resp1 = self.client.post("/api/ai/explain", json={"question": "What is a qubit?"})
        self.assertEqual(resp1.status_code, 200)
        data1 = resp1.json()
        text1 = data1["explanation"].lower()
        self.assertTrue("qubit" in text1 and ("quantum bit" in text1 or "superposition" in text1 or "bloch" in text1))
        self.assertNotIn("bell state", text1)

        # 2. "Why does the Hadamard gate create superposition?"
        resp2 = self.client.post("/api/ai/explain", json={"question": "Why does the Hadamard gate create superposition?"})
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.json()
        text2 = data2["explanation"].lower()
        self.assertTrue("hadamard" in text2 and ("superposition" in text2 or "basis" in text2 or "equal" in text2))

        # 3. "Why is my CNOT circuit producing this result?"
        resp3 = self.client.post("/api/ai/explain", json={
            "question": "Why is my CNOT circuit producing this result?",
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "controls": [0], "targets": [1]},
                ],
            },
            "simulation_result": {
                "probabilities": {"00": 0.5, "11": 0.5},
                "dirac": "0.707|00⟩ + 0.707|11⟩",
            }
        })
        self.assertEqual(resp3.status_code, 200)
        data3 = resp3.json()
        text3 = data3["explanation"].lower()
        self.assertTrue("cnot" in text3 or "cx" in text3 or "controlled-not" in text3)
        self.assertTrue("entanglement" in text3 or "bell" in text3 or "linear" in text3 or "superposition" in text3)

        # 4. "What happens if I remove the Hadamard gate?"
        resp4 = self.client.post("/api/ai/explain", json={
            "question": "What happens if I remove the Hadamard gate?",
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [
                    {"gate": "h", "targets": [0]},
                    {"gate": "cx", "controls": [0], "targets": [1]},
                ],
            }
        })
        self.assertEqual(resp4.status_code, 200)
        data4 = resp4.json()
        text4 = data4["explanation"].lower()
        self.assertTrue("remove" in text4 or "hadamard" in text4)
        self.assertTrue("superposition" in text4 or "|0" in text4 or "ground state" in text4)

        # 5. "Explain quantum entanglement like I'm a beginner."
        resp5 = self.client.post("/api/ai/explain", json={"question": "Explain quantum entanglement like I'm a beginner."})
        self.assertEqual(resp5.status_code, 200)
        data5 = resp5.json()
        text5 = data5["explanation"].lower()
        self.assertTrue("entanglement" in text5 or "correlated" in text5 or "non-separable" in text5)

        # 6. "Give me a hint instead of the answer."
        resp6 = self.client.post("/api/ai/explain", json={
            "question": "Give me a hint instead of the answer.",
            "circuit": {
                "qubits": 2,
                "classicalBits": 2,
                "operations": [{"gate": "h", "targets": [0]}],
            },
            "lesson_context": {
                "title": "Creating Entangled States",
                "objective": "Use CNOT to entangle qubits.",
            }
        })
        self.assertEqual(resp6.status_code, 200)
        data6 = resp6.json()
        text6 = data6["explanation"].lower()
        self.assertTrue("hint" in text6 or "guide" in text6 or "try" in text6 or "look at" in text6)

        # Verify all 6 responses produce distinct explanations
        explanations = [data1["explanation"], data2["explanation"], data3["explanation"], data4["explanation"], data5["explanation"], data6["explanation"]]
        self.assertEqual(len(set(explanations)), 6)

    def test_gemini_service_prompt_separation(self):
        """Verify prompt structure clearly distinguishes USER QUESTION, CURRENT CIRCUIT, SIMULATION RESULT, LESSON CONTEXT."""
        from app.services.gemini_service import GeminiService
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

        self.assertIn("USER QUESTION:", prompt)
        self.assertIn("Why does this circuit create entanglement?", prompt)
        self.assertIn("CURRENT CIRCUIT:", prompt)
        self.assertIn("Step 1: H on qubit 0", prompt)
        self.assertIn("Step 2: CX (control: qubit 0, target: qubit 1)", prompt)
        self.assertIn("SIMULATION RESULT:", prompt)
        self.assertIn("Dirac Statevector: 0.707|00⟩ + 0.707|11⟩", prompt)
        self.assertIn("LESSON CONTEXT:", prompt)
        self.assertIn("Lesson: Bell States", prompt)

    def test_gemini_mocked_success_response(self):
        """Verify that when Gemini returns a valid response, the API returns source='gemini'."""
        from unittest.mock import patch
        from app.services.gemini_service import GeminiService

        with patch.object(GeminiService, "generate_explanation", return_value="The Hadamard gate creates an equal superposition of basis states."):
            resp = self.client.post("/api/ai/explain", json={"question": "Why does H create superposition?"})
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["source"], "gemini")
            self.assertEqual(data["explanation"], "The Hadamard gate creates an equal superposition of basis states.")

    def test_api_security_no_key_leakage(self):
        """Verify that API keys or environment secrets are NEVER leaked in API response payloads."""
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


