from app.quantum.adapters.base import QuantumBackendAdapter
from app.quantum.adapters.local_statevector import LocalStatevectorAdapter
from app.quantum.adapters.qiskit_aer import QiskitAerAdapter
from app.quantum.models import CircuitIR, SimulationOptions, SimulationResult, ValidationResult


class BackendUnavailableError(ValueError):
    pass


class QuantumOrchestrator:
    def __init__(self) -> None:
        self._adapters: dict[str, QuantumBackendAdapter] = {
            "local_statevector": LocalStatevectorAdapter(),
            "qiskit_aer": QiskitAerAdapter(),
        }

    def available_backends(self) -> list[str]:
        return list(self._adapters)

    def adapter_for(self, backend: str) -> QuantumBackendAdapter:
        if backend not in self._adapters:
            raise BackendUnavailableError(f"Backend '{backend}' is not available in this prototype.")
        return self._adapters[backend]

    def validate(self, circuit: CircuitIR, backend: str = "local_statevector") -> ValidationResult:
        return self.adapter_for(backend).validate(circuit)

    def simulate(self, circuit: CircuitIR, options: SimulationOptions) -> SimulationResult:
        return self.adapter_for(options.backend).simulate(circuit, options)


orchestrator = QuantumOrchestrator()

