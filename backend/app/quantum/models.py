from typing import Literal

from pydantic import BaseModel, Field, field_validator


SupportedGate = Literal["h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "cx", "cz", "swap", "measure"]


class CircuitOperation(BaseModel):
    gate: SupportedGate
    targets: list[int] = Field(default_factory=list)
    controls: list[int] = Field(default_factory=list)
    params: list[float] = Field(default_factory=list)
    classicalTargets: list[int] = Field(default_factory=list)


class CircuitIR(BaseModel):
    qubits: int = Field(ge=1, le=8)
    classicalBits: int = Field(default=0, ge=0, le=8)
    operations: list[CircuitOperation] = Field(default_factory=list)

    @field_validator("operations")
    @classmethod
    def require_operations(cls, operations: list[CircuitOperation]) -> list[CircuitOperation]:
        if not operations:
            raise ValueError("Circuit must contain at least one operation.")
        return operations


class SimulationOptions(BaseModel):
    backend: str = "local_statevector"
    shots: int = Field(default=1024, ge=1, le=8192)
    includeStatevector: bool = True


class SimulationRequest(BaseModel):
    circuit: CircuitIR
    options: SimulationOptions = Field(default_factory=SimulationOptions)


class StateAmplitude(BaseModel):
    basis: str
    real: float
    imag: float
    magnitude: float
    phase: float


class BlochVector(BaseModel):
    qubit: int
    x: float
    y: float
    z: float


class SimulationResult(BaseModel):
    backend: str
    shots: int
    counts: dict[str, int]
    probabilities: dict[str, float]
    statevector: list[StateAmplitude] = Field(default_factory=list)
    bloch: list[BlochVector] = Field(default_factory=list)
    dirac: str = Field(default="")
    warnings: list[str] = Field(default_factory=list)


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

