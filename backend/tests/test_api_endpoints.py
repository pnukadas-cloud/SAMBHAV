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
        from unittest.mock import patch
        from app.services.gemini_service import GeminiService

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
        with patch.object(GeminiService, "generate_explanation", return_value=None):
            response = self.client.post("/api/ai/explain", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["source"], "fallback")
            self.assertTrue(len(data["explanation"]) > 20)
            self.assertIn("superposition", data["explanation"].lower())
            self.assertIsInstance(data["key_concepts"], list)
            self.assertIsInstance(data["suggestions"], list)

    def test_ai_explain_endpoint_with_question(self):
        from unittest.mock import patch
        from app.services.gemini_service import GeminiService

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
        with patch.object(GeminiService, "generate_explanation", return_value=None):
            response = self.client.post("/api/ai/explain", json=payload)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["source"], "fallback")
            explanation_lower = data["explanation"].lower()
            self.assertIn("superposition", explanation_lower)
            self.assertTrue("cx" in explanation_lower or "controlled" in explanation_lower or "cnot" in explanation_lower)

    def test_ai_tutor_all_8_required_questions(self):
        """Verify the 8 required AI tutor questions produce distinct, pedagogically accurate responses."""
        from unittest.mock import patch
        from app.services.gemini_service import GeminiService

        with patch.object(GeminiService, "generate_explanation", return_value=None):
            # QUESTION 1: "What is a qubit?" -> Explanation of qubits
            resp1 = self.client.post("/api/ai/explain", json={"question": "What is a qubit?"})
            self.assertEqual(resp1.status_code, 200)
            data1 = resp1.json()
            text1 = data1["explanation"].lower()
            self.assertTrue("qubit" in text1 and ("quantum bit" in text1 or "superposition" in text1 or "bloch" in text1))
            self.assertNotIn("bell state", text1)

            # QUESTION 2: "Why does the Hadamard gate create superposition?" -> Explanation of Hadamard/superposition
            resp2 = self.client.post("/api/ai/explain", json={"question": "Why does the Hadamard gate create superposition?"})
            self.assertEqual(resp2.status_code, 200)
            data2 = resp2.json()
            text2 = data2["explanation"].lower()
            self.assertTrue("hadamard" in text2 and ("superposition" in text2 or "basis" in text2 or "equal" in text2))

            # QUESTION 3: "What is quantum entanglement?" -> Explanation of entanglement
            resp3 = self.client.post("/api/ai/explain", json={"question": "What is quantum entanglement?"})
            self.assertEqual(resp3.status_code, 200)
            data3 = resp3.json()
            text3 = data3["explanation"].lower()
            self.assertTrue("entanglement" in text3 or "correlated" in text3 or "non-separable" in text3)

            # QUESTION 4: "Explain Grover's algorithm." -> Explanation of Grover's algorithm
            resp4 = self.client.post("/api/ai/explain", json={"question": "Explain Grover's algorithm."})
            self.assertEqual(resp4.status_code, 200)
            data4 = resp4.json()
            text4 = data4["explanation"].lower()
            self.assertTrue("grover" in text4 and ("oracle" in text4 or "diffusion" in text4 or "speedup" in text4 or "amplification" in text4))

            # QUESTION 5: "What does a CNOT gate do?" -> Explanation of CNOT
            resp5 = self.client.post("/api/ai/explain", json={"question": "What does a CNOT gate do?"})
            self.assertEqual(resp5.status_code, 200)
            data5 = resp5.json()
            text5 = data5["explanation"].lower()
            self.assertTrue("cnot" in text5 or "controlled-not" in text5 or "cx" in text5)
            self.assertTrue("target" in text5 and "control" in text5)

            # QUESTION 6: "Why does my current circuit produce these measurement probabilities?" -> Uses actual current circuit and simulation result
            resp6 = self.client.post("/api/ai/explain", json={
                "question": "Why does my current circuit produce these measurement probabilities?",
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
            self.assertEqual(resp6.status_code, 200)
            data6 = resp6.json()
            text6 = data6["explanation"].lower()
            self.assertTrue("born rule" in text6 or "amplitude" in text6 or "probability" in text6 or "probabilities" in text6)
            self.assertIn("00", text6)

            # QUESTION 7: "Give me a hint for this circuit instead of the answer." -> Hint based on current circuit/challenge context
            resp7 = self.client.post("/api/ai/explain", json={
                "question": "Give me a hint for this circuit instead of the answer.",
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
            self.assertEqual(resp7.status_code, 200)
            data7 = resp7.json()
            text7 = data7["explanation"].lower()
            self.assertTrue("hint" in text7 or "guide" in text7 or "try" in text7 or "cnot" in text7 or "link" in text7)

            # QUESTION 8: "Hello, can you help me understand quantum computing?" -> Conversational response, NOT Bell-state
            resp8 = self.client.post("/api/ai/explain", json={"question": "Hello, can you help me understand quantum computing?"})
            self.assertEqual(resp8.status_code, 200)
            data8 = resp8.json()
            text8 = data8["explanation"].lower()
            self.assertTrue("hello" in text8 or "tutor" in text8 or "welcome" in text8)
            self.assertNotIn("analyzing your active circuit configuration", text8)

            # Verify all 8 responses produce distinct explanations
            explanations = [
                data1["explanation"], data2["explanation"], data3["explanation"],
                data4["explanation"], data5["explanation"], data6["explanation"],
                data7["explanation"], data8["explanation"]
            ]
            self.assertEqual(len(set(explanations)), 8)

    def test_ai_tutor_honest_fallback_on_arbitrary_question(self):
        """Verify that unsupported questions produce an honest fallback instead of silently hijacking with Bell-state."""
        from unittest.mock import patch
        from app.services.gemini_service import GeminiService

        with patch.object(GeminiService, "generate_explanation", return_value=None):
            unsupported_q = "What is the capital of France?"
            payload = {
                "circuit": {
                    "qubits": 2,
                    "classicalBits": 2,
                    "operations": [
                        {"gate": "h", "targets": [0]},
                        {"gate": "cx", "controls": [0], "targets": [1]},
                    ],
                },
                "question": unsupported_q,
            }
            resp = self.client.post("/api/ai/explain", json=payload)
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["source"], "fallback")
            # Must reference the user's question honestly
            self.assertIn(unsupported_q, data["explanation"])
            # Must NOT claim this is a Bell-state circuit analysis
            self.assertNotIn("Analyzing your active circuit configuration", data["explanation"])

    def test_gemini_service_prompt_separation(self):
        """Verify prompt structure clearly prioritizes USER QUESTION and includes SUPPORTING context."""
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

        self.assertIn("USER QUESTION:\nWhy does this circuit create entanglement?", prompt)
        self.assertIn("INSTRUCTION:", prompt)
        self.assertIn("PRIMARY subject", prompt)
        self.assertIn("CURRENT CIRCUIT (Supporting Context):", prompt)
        self.assertIn("Step 1: H on qubit 0", prompt)
        self.assertIn("Step 2: CX (control: qubit 0, target: qubit 1)", prompt)
        self.assertIn("SIMULATION RESULT (Supporting Context):", prompt)
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


