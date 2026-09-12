from abc import ABC, abstractmethod

from app.quantum.models import CircuitIR, SimulationOptions, SimulationResult, ValidationResult


class QuantumBackendAdapter(ABC):
    name: str

    def validate(self, circuit: CircuitIR) -> ValidationResult:
        errors: list[str] = []
        warnings: list[str] = []
        for index, operation in enumerate(circuit.operations):
            referenced = operation.targets + operation.controls
            for qubit in referenced:
                if qubit < 0 or qubit >= circuit.qubits:
                    errors.append(f"Operation {index + 1} references invalid qubit {qubit}.")
            for bit in operation.classicalTargets:
                if bit < 0 or bit >= max(circuit.classicalBits, 1):
                    errors.append(f"Operation {index + 1} references invalid classical bit {bit}.")
            if operation.gate in {"cx", "cz"} and len(operation.controls) != 1:
                errors.append(f"Operation {index + 1} gate {operation.gate.upper()} requires exactly one control.")
            if operation.gate in {"rx", "ry", "rz"} and len(operation.params) != 1:
                errors.append(f"Operation {index + 1} gate {operation.gate.upper()} requires one rotation parameter.")
            if operation.gate == "swap" and len(operation.targets) != 2:
                errors.append(f"Operation {index + 1} SWAP requires two target qubits.")
        if circuit.qubits > 5:
            warnings.append("Prototype visualizations are most responsive up to 5 qubits.")
        return ValidationResult(valid=not errors, errors=errors, warnings=warnings)

    @abstractmethod
    def simulate(self, circuit: CircuitIR, options: SimulationOptions) -> SimulationResult:
        raise NotImplementedError

