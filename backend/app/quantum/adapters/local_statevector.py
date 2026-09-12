import cmath
import math
from collections import Counter

from app.quantum.adapters.base import QuantumBackendAdapter
from app.quantum.models import BlochVector, CircuitIR, SimulationOptions, SimulationResult, StateAmplitude


class LocalStatevectorAdapter(QuantumBackendAdapter):
    name = "local_statevector"

    def simulate(self, circuit: CircuitIR, options: SimulationOptions) -> SimulationResult:
        validation = self.validate(circuit)
        if not validation.valid:
            raise ValueError("; ".join(validation.errors))

        state = [0j] * (2**circuit.qubits)
        state[0] = 1 + 0j

        for operation in circuit.operations:
            if operation.gate == "measure":
                continue
            if operation.gate in {"h", "x", "y", "z", "s", "t"}:
                state = self._apply_single_qubit_gate(state, circuit.qubits, operation.targets[0], self._gate_matrix(operation.gate))
            elif operation.gate in {"rx", "ry", "rz"}:
                state = self._apply_single_qubit_gate(
                    state,
                    circuit.qubits,
                    operation.targets[0],
                    self._rotation_matrix(operation.gate, operation.params[0]),
                )
            elif operation.gate in {"cx", "cz"}:
                state = self._apply_controlled_gate(
                    state,
                    circuit.qubits,
                    operation.controls[0],
                    operation.targets[0],
                    self._gate_matrix("x" if operation.gate == "cx" else "z"),
                )
            elif operation.gate == "swap":
                state = self._apply_swap(state, circuit.qubits, operation.targets[0], operation.targets[1])

        probabilities = self._probabilities(state, circuit.qubits)
        counts = self._deterministic_counts(probabilities, options.shots)
        amplitudes = self._state_amplitudes(state, circuit.qubits) if options.includeStatevector else []
        bloch = self._bloch_vectors(state, circuit.qubits)
        return SimulationResult(
            backend=self.name,
            shots=options.shots,
            counts=counts,
            probabilities=probabilities,
            statevector=amplitudes,
            bloch=bloch,
            warnings=validation.warnings,
        )

    def _gate_matrix(self, gate: str) -> tuple[tuple[complex, complex], tuple[complex, complex]]:
        inv_sqrt_2 = 1 / math.sqrt(2)
        gates = {
            "h": ((inv_sqrt_2, inv_sqrt_2), (inv_sqrt_2, -inv_sqrt_2)),
            "x": ((0, 1), (1, 0)),
            "y": ((0, -1j), (1j, 0)),
            "z": ((1, 0), (0, -1)),
            "s": ((1, 0), (0, 1j)),
            "t": ((1, 0), (0, cmath.exp(1j * math.pi / 4))),
        }
        return gates[gate]

    def _rotation_matrix(self, gate: str, theta: float) -> tuple[tuple[complex, complex], tuple[complex, complex]]:
        c = math.cos(theta / 2)
        s = math.sin(theta / 2)
        if gate == "rx":
            return ((c, -1j * s), (-1j * s, c))
        if gate == "ry":
            return ((c, -s), (s, c))
        return ((cmath.exp(-1j * theta / 2), 0), (0, cmath.exp(1j * theta / 2)))

    def _apply_single_qubit_gate(self, state: list[complex], qubits: int, target: int, matrix) -> list[complex]:
        next_state = state[:]
        mask = 1 << (qubits - target - 1)
        for basis in range(len(state)):
            if basis & mask:
                continue
            paired = basis | mask
            zero = state[basis]
            one = state[paired]
            next_state[basis] = matrix[0][0] * zero + matrix[0][1] * one
            next_state[paired] = matrix[1][0] * zero + matrix[1][1] * one
        return next_state

    def _apply_controlled_gate(self, state: list[complex], qubits: int, control: int, target: int, matrix) -> list[complex]:
        next_state = state[:]
        control_mask = 1 << (qubits - control - 1)
        target_mask = 1 << (qubits - target - 1)
        for basis in range(len(state)):
            if not basis & control_mask or basis & target_mask:
                continue
            paired = basis | target_mask
            zero = state[basis]
            one = state[paired]
            next_state[basis] = matrix[0][0] * zero + matrix[0][1] * one
            next_state[paired] = matrix[1][0] * zero + matrix[1][1] * one
        return next_state

    def _apply_swap(self, state: list[complex], qubits: int, first: int, second: int) -> list[complex]:
        next_state = state[:]
        first_mask = 1 << (qubits - first - 1)
        second_mask = 1 << (qubits - second - 1)
        for basis in range(len(state)):
            first_bit = bool(basis & first_mask)
            second_bit = bool(basis & second_mask)
            if first_bit == second_bit:
                continue
            swapped = basis ^ first_mask ^ second_mask
            next_state[swapped] = state[basis]
        return next_state

    def _probabilities(self, state: list[complex], qubits: int) -> dict[str, float]:
        return {
            format(index, f"0{qubits}b"): round(abs(amplitude) ** 2, 6)
            for index, amplitude in enumerate(state)
            if abs(amplitude) ** 2 > 1e-9
        }

    def _deterministic_counts(self, probabilities: dict[str, float], shots: int) -> dict[str, int]:
        counts = Counter({basis: int(round(probability * shots)) for basis, probability in probabilities.items()})
        difference = shots - sum(counts.values())
        if difference and counts:
            most_likely = max(counts, key=counts.get)
            counts[most_likely] += difference
        return dict(counts)

    def _state_amplitudes(self, state: list[complex], qubits: int) -> list[StateAmplitude]:
        amplitudes: list[StateAmplitude] = []
        for index, amplitude in enumerate(state):
            if abs(amplitude) <= 1e-9:
                continue
            amplitudes.append(
                StateAmplitude(
                    basis=format(index, f"0{qubits}b"),
                    real=round(amplitude.real, 6),
                    imag=round(amplitude.imag, 6),
                    magnitude=round(abs(amplitude), 6),
                    phase=round(cmath.phase(amplitude), 6),
                )
            )
        return amplitudes

    def _bloch_vectors(self, state: list[complex], qubits: int) -> list[BlochVector]:
        if qubits != 1:
            return []
        alpha = state[0]
        beta = state[1]
        x = 2 * (alpha.conjugate() * beta).real
        y = 2 * (alpha.conjugate() * beta).imag
        z = abs(alpha) ** 2 - abs(beta) ** 2
        return [BlochVector(qubit=0, x=round(x, 6), y=round(y, 6), z=round(z, 6))]

