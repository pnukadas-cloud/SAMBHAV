import math
import unittest

from app.quantum.models import CircuitIR, CircuitOperation, SimulationOptions
from app.quantum.orchestrator import orchestrator
from app.quantum.adapters.local_statevector import LocalStatevectorAdapter


class TestQuantumBackend(unittest.TestCase):
    def setUp(self):
        self.simulator = LocalStatevectorAdapter()

    def test_single_qubit_h(self):
        circuit = CircuitIR(
            qubits=1,
            classicalBits=1,
            operations=[CircuitOperation(gate="h", targets=[0])],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1000))
        self.assertAlmostEqual(result.probabilities.get("0", 0), 0.5, places=5)
        self.assertAlmostEqual(result.probabilities.get("1", 0), 0.5, places=5)
        self.assertEqual(len(result.statevector), 2)
        # Bloch vector for |+> is x=1, y=0, z=0
        self.assertEqual(len(result.bloch), 1)
        self.assertAlmostEqual(result.bloch[0].x, 1.0, places=5)
        self.assertAlmostEqual(result.bloch[0].y, 0.0, places=5)
        self.assertAlmostEqual(result.bloch[0].z, 0.0, places=5)

    def test_single_qubit_x(self):
        circuit = CircuitIR(
            qubits=1,
            classicalBits=1,
            operations=[CircuitOperation(gate="x", targets=[0])],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1000))
        self.assertAlmostEqual(result.probabilities.get("1", 0), 1.0, places=5)
        self.assertNotIn("0", result.probabilities)

    def test_rotation_rx_pi(self):
        # Rx(pi) applied to |0> produces -i|1> (probability 1 for |1>)
        circuit = CircuitIR(
            qubits=1,
            classicalBits=1,
            operations=[CircuitOperation(gate="rx", targets=[0], params=[math.pi])],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1000))
        self.assertAlmostEqual(result.probabilities.get("1", 0), 1.0, places=4)

    def test_rotation_ry_pi(self):
        # Ry(pi) applied to |0> produces |1>
        circuit = CircuitIR(
            qubits=1,
            classicalBits=1,
            operations=[CircuitOperation(gate="ry", targets=[0], params=[math.pi])],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1000))
        self.assertAlmostEqual(result.probabilities.get("1", 0), 1.0, places=4)

    def test_bell_state(self):
        # H(0) + CX(0 -> 1) produces (|00> + |11>) / sqrt(2)
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                CircuitOperation(gate="h", targets=[0]),
                CircuitOperation(gate="cx", controls=[0], targets=[1]),
                CircuitOperation(gate="measure", targets=[0, 1], classicalTargets=[0, 1]),
            ],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1024))
        self.assertAlmostEqual(result.probabilities.get("00", 0), 0.5, places=5)
        self.assertAlmostEqual(result.probabilities.get("11", 0), 0.5, places=5)
        self.assertNotIn("01", result.probabilities)
        self.assertNotIn("10", result.probabilities)
        self.assertEqual(sum(result.counts.values()), 1024)

    def test_reversed_control_bell_state(self):
        # H(1) + CX(1 -> 0) produces (|00> + |11>) / sqrt(2)
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                CircuitOperation(gate="h", targets=[1]),
                CircuitOperation(gate="cx", controls=[1], targets=[0]),
            ],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1024))
        self.assertAlmostEqual(result.probabilities.get("00", 0), 0.5, places=5)
        self.assertAlmostEqual(result.probabilities.get("11", 0), 0.5, places=5)

    def test_swap_gate(self):
        # X(0) -> state |10>, SWAP(0, 1) -> state |01>
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                CircuitOperation(gate="x", targets=[0]),
                CircuitOperation(gate="swap", targets=[0, 1]),
            ],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=512))
        self.assertAlmostEqual(result.probabilities.get("01", 0), 1.0, places=5)

    def test_cz_gate(self):
        # Observability test for CZ phase flip:
        # |00> -> X(0) -> |10> -> H(1) -> (|10> + |11>)/sqrt(2)
        # -> CZ(0, 1) -> (|10> - |11>)/sqrt(2) = |1>|-> -> H(1) -> |11> (100% |11>)
        # If CZ was a no-op, H(1)H(1)=I would leave the state as |10> (100% |10>)
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                CircuitOperation(gate="x", targets=[0]),
                CircuitOperation(gate="h", targets=[1]),
                CircuitOperation(gate="cz", controls=[0], targets=[1]),
                CircuitOperation(gate="h", targets=[1]),
            ],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1000))
        self.assertAlmostEqual(result.probabilities.get("11", 0), 1.0, places=5)
        self.assertNotIn("10", result.probabilities)

    def test_ghz_state_3_qubits(self):
        # H(0) + CX(0 -> 1) + CX(1 -> 2) produces (|000> + |111>) / sqrt(2)
        circuit = CircuitIR(
            qubits=3,
            classicalBits=3,
            operations=[
                CircuitOperation(gate="h", targets=[0]),
                CircuitOperation(gate="cx", controls=[0], targets=[1]),
                CircuitOperation(gate="cx", controls=[1], targets=[2]),
            ],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1024))
        self.assertAlmostEqual(result.probabilities.get("000", 0), 0.5, places=5)
        self.assertAlmostEqual(result.probabilities.get("111", 0), 0.5, places=5)

    def test_validation_invalid_qubit(self):
        circuit = CircuitIR(
            qubits=2,
            operations=[CircuitOperation(gate="h", targets=[3])],
        )
        validation = orchestrator.validate(circuit)
        self.assertFalse(validation.valid)
        self.assertTrue(any("invalid qubit" in err for err in validation.errors))

    def test_validation_missing_rotation_param(self):
        circuit = CircuitIR(
            qubits=1,
            operations=[CircuitOperation(gate="rx", targets=[0], params=[])],
        )
        validation = orchestrator.validate(circuit)
        self.assertFalse(validation.valid)
        self.assertTrue(any("rotation parameter" in err for err in validation.errors))

    def test_validation_cx_same_control_target(self):
        circuit = CircuitIR(
            qubits=2,
            operations=[CircuitOperation(gate="cx", controls=[0], targets=[0])],
        )
        validation = orchestrator.validate(circuit)
        self.assertFalse(validation.valid)
        self.assertTrue(any("must be distinct" in err for err in validation.errors))

    def test_validation_swap_same_targets(self):
        circuit = CircuitIR(
            qubits=2,
            operations=[CircuitOperation(gate="swap", targets=[1, 1])],
        )
        validation = orchestrator.validate(circuit)
        self.assertFalse(validation.valid)
        self.assertTrue(any("must be distinct" in err for err in validation.errors))

    def test_dirac_notation_output(self):
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                CircuitOperation(gate="h", targets=[0]),
                CircuitOperation(gate="cx", controls=[0], targets=[1]),
            ],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1000))
        self.assertTrue(result.dirac.startswith("|ψ⟩ ="))
        self.assertIn("|00⟩", result.dirac)
        self.assertIn("|11⟩", result.dirac)


if __name__ == "__main__":
    unittest.main()
