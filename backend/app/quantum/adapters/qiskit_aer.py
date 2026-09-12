from app.quantum.adapters.base import QuantumBackendAdapter
from app.quantum.adapters.local_statevector import LocalStatevectorAdapter
from app.quantum.models import CircuitIR, SimulationOptions, SimulationResult


class QiskitAerAdapter(QuantumBackendAdapter):
    name = "qiskit_aer"

    def simulate(self, circuit: CircuitIR, options: SimulationOptions) -> SimulationResult:
        try:
            from qiskit import QuantumCircuit, transpile
            from qiskit_aer import AerSimulator
        except Exception:
            result = LocalStatevectorAdapter().simulate(circuit, options)
            result.backend = "local_statevector"
            result.warnings.append("Qiskit Aer is not installed; used the local educational simulator.")
            return result

        qc = QuantumCircuit(circuit.qubits, max(circuit.classicalBits, circuit.qubits))
        for operation in circuit.operations:
            gate = operation.gate
            if gate == "h":
                qc.h(operation.targets[0])
            elif gate == "x":
                qc.x(operation.targets[0])
            elif gate == "y":
                qc.y(operation.targets[0])
            elif gate == "z":
                qc.z(operation.targets[0])
            elif gate == "s":
                qc.s(operation.targets[0])
            elif gate == "t":
                qc.t(operation.targets[0])
            elif gate == "rx":
                qc.rx(operation.params[0], operation.targets[0])
            elif gate == "ry":
                qc.ry(operation.params[0], operation.targets[0])
            elif gate == "rz":
                qc.rz(operation.params[0], operation.targets[0])
            elif gate == "cx":
                qc.cx(operation.controls[0], operation.targets[0])
            elif gate == "cz":
                qc.cz(operation.controls[0], operation.targets[0])
            elif gate == "swap":
                qc.swap(operation.targets[0], operation.targets[1])
            elif gate == "measure":
                for target_index, target in enumerate(operation.targets):
                    classical = operation.classicalTargets[target_index] if target_index < len(operation.classicalTargets) else target
                    qc.measure(target, classical)

        if not any(operation.gate == "measure" for operation in circuit.operations):
            qc.measure_all()
        simulator = AerSimulator()
        compiled = transpile(qc, simulator)
        raw_result = simulator.run(compiled, shots=options.shots).result()
        counts = raw_result.get_counts()
        probabilities = {basis: round(count / options.shots, 6) for basis, count in counts.items()}
        return SimulationResult(
            backend=self.name,
            shots=options.shots,
            counts=counts,
            probabilities=probabilities,
            statevector=[],
            bloch=[],
            warnings=["Qiskit execution completed. Statevector visualization is provided by the local adapter in this prototype."],
        )

