import unittest
from app.quantum.models import CircuitIR, SimulationOptions
from app.quantum.orchestrator import orchestrator


class TestVerifiedAlgorithms(unittest.TestCase):
    def setUp(self):
        self.options = SimulationOptions(backend="local_statevector", shots=1024, includeStatevector=True)

    def test_1_bell_state_algorithm(self):
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "controls": [0], "targets": [1]},
                {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        self.assertAlmostEqual(res.probabilities.get("00", 0.0), 0.5, places=2)
        self.assertAlmostEqual(res.probabilities.get("11", 0.0), 0.5, places=2)
        self.assertEqual(res.probabilities.get("01", 0.0), 0.0)
        self.assertEqual(res.probabilities.get("10", 0.0), 0.0)

    def test_2_ghz_state_algorithm(self):
        circuit = CircuitIR(
            qubits=3,
            classicalBits=3,
            operations=[
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "controls": [0], "targets": [1]},
                {"gate": "cx", "controls": [1], "targets": [2]},
                {"gate": "measure", "targets": [0, 1, 2], "classicalTargets": [0, 1, 2]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        self.assertAlmostEqual(res.probabilities.get("000", 0.0), 0.5, places=2)
        self.assertAlmostEqual(res.probabilities.get("111", 0.0), 0.5, places=2)
        self.assertEqual(sum(v for k, v in res.probabilities.items() if k not in ["000", "111"]), 0.0)

    def test_3_superdense_coding_encoding_11(self):
        # Transmit message '11'
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                # 1. Prepare Bell pair
                {"gate": "h", "targets": [0]},
                {"gate": "cx", "controls": [0], "targets": [1]},
                # 2. Alice encodes '11' using X and Z on qubit 0
                {"gate": "x", "targets": [0]},
                {"gate": "z", "targets": [0]},
                # 3. Bob decodes
                {"gate": "cx", "controls": [0], "targets": [1]},
                {"gate": "h", "targets": [0]},
                {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        # Outcome on measurement of q0, q1 must be 11
        self.assertAlmostEqual(res.probabilities.get("11", 0.0), 1.0, places=2)

    def test_4_deutsch_jozsa_balanced_oracle(self):
        # Deutsch-Jozsa with balanced oracle f(x) = x (CX on q0 -> q1)
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                # Initialize ancilla qubit 1 to |1>
                {"gate": "x", "targets": [1]},
                # Superposition on both qubits
                {"gate": "h", "targets": [0]},
                {"gate": "h", "targets": [1]},
                # Balanced Oracle: f(x)=x
                {"gate": "cx", "controls": [0], "targets": [1]},
                # Interference on input qubit
                {"gate": "h", "targets": [0]},
                # Measurement
                {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        # For a balanced function, input qubit 0 must measure '1' with 100% certainty (bitstrings starting with '1')
        p_q0_is_1 = sum(prob for basis, prob in res.probabilities.items() if basis[0] == "1")
        self.assertAlmostEqual(p_q0_is_1, 1.0, places=2)

    def test_5_deutsch_jozsa_constant_oracle(self):
        # Deutsch-Jozsa with constant oracle f(x) = 0 (Identity)
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                # Initialize ancilla qubit 1 to |1>
                {"gate": "x", "targets": [1]},
                # Superposition on both qubits
                {"gate": "h", "targets": [0]},
                {"gate": "h", "targets": [1]},
                # Constant Oracle: f(x)=0 (No gate applied)
                # Interference on input qubit
                {"gate": "h", "targets": [0]},
                # Measurement
                {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        # For a constant function, input qubit 0 must measure '0' with 100% certainty (bitstrings starting with '0')
        p_q0_is_0 = sum(prob for basis, prob in res.probabilities.items() if basis[0] == "0")
        self.assertAlmostEqual(p_q0_is_0, 1.0, places=2)

    def test_6_grover_search_2_qubit(self):
        # 2-qubit Grover searching for target |11>
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                # Equal superposition
                {"gate": "h", "targets": [0]},
                {"gate": "h", "targets": [1]},
                # Oracle marking |11> via Controlled-Z
                {"gate": "cz", "controls": [0], "targets": [1]},
                # Grover Diffusion Operator
                {"gate": "h", "targets": [0]},
                {"gate": "h", "targets": [1]},
                {"gate": "x", "targets": [0]},
                {"gate": "x", "targets": [1]},
                {"gate": "cz", "controls": [0], "targets": [1]},
                {"gate": "x", "targets": [0]},
                {"gate": "x", "targets": [1]},
                {"gate": "h", "targets": [0]},
                {"gate": "h", "targets": [1]},
                # Measurement
                {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        # Target |11> must be amplified to 100% probability in exactly 1 iteration!
        self.assertAlmostEqual(res.probabilities.get("11", 0.0), 1.0, places=2)

    def test_7_quantum_phase_estimation_eigenvalue(self):
        # QPE for Pauli-Z on eigenstate |1> (eigenvalue -1 = e^{i*pi}, phase phi = 1/2 -> binary .1)
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                # Prepare eigenstate |1> on qubit 1
                {"gate": "x", "targets": [1]},
                # Superposition on counting qubit 0
                {"gate": "h", "targets": [0]},
                # Controlled-Z (Controlled unitary)
                {"gate": "cz", "controls": [0], "targets": [1]},
                # Inverse QFT (Hadamard on counting qubit)
                {"gate": "h", "targets": [0]},
                # Measure counting qubit and eigenstate qubit
                {"gate": "measure", "targets": [0, 1], "classicalTargets": [0, 1]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        # Counting qubit q0 must measure 1 with 100% certainty (bitstrings starting with '1')
        p_counting_is_1 = sum(prob for basis, prob in res.probabilities.items() if basis[0] == "1")
        self.assertAlmostEqual(p_counting_is_1, 1.0, places=2)

    def test_8_quantum_teleportation_protocol(self):
        # Quantum Teleportation of state |1> from Alice (q0) to Bob (q2)
        circuit = CircuitIR(
            qubits=3,
            classicalBits=3,
            operations=[
                # 1. Alice prepares unknown state |psi> = |1> on qubit 0
                {"gate": "x", "targets": [0]},
                # 2. Shared EPR Bell pair creation between Alice (q1) and Bob (q2)
                {"gate": "h", "targets": [1]},
                {"gate": "cx", "controls": [1], "targets": [2]},
                # 3. Alice performs Bell-basis measurement operations
                {"gate": "cx", "controls": [0], "targets": [1]},
                {"gate": "h", "targets": [0]},
                # 4. Bob applies conditional quantum corrections (coherent teleportation protocol)
                {"gate": "cx", "controls": [1], "targets": [2]},
                {"gate": "cz", "controls": [0], "targets": [2]},
                # 5. Measure all qubits
                {"gate": "measure", "targets": [0, 1, 2], "classicalTargets": [0, 1, 2]},
            ],
        )
        res = orchestrator.simulate(circuit, self.options)
        
        # Verify: For any measurement outcome on Alice's qubits (q0, q1), Bob's qubit (q2) must be in state |1>!
        # This means all non-zero probability states must end with '1' ("001", "011", "101", "111")
        p_bob_qubit_is_1 = sum(prob for basis, prob in res.probabilities.items() if basis[2] == "1")
        self.assertAlmostEqual(p_bob_qubit_is_1, 1.0, places=2)
        
        # Verify 0 probability for states where Bob's qubit is 0 ("000", "010", "100", "110")
        p_bob_qubit_is_0 = sum(prob for basis, prob in res.probabilities.items() if basis[2] == "0")
        self.assertAlmostEqual(p_bob_qubit_is_0, 0.0, places=2)


if __name__ == "__main__":
    unittest.main()


