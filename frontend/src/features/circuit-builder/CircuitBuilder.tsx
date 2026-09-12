import type { CircuitIR, Gate } from "../../types";

const gates: Array<{ gate: Gate; label: string; hint: string }> = [
  { gate: "h", label: "H", hint: "Hadamard: creates superposition" },
  { gate: "x", label: "X", hint: "Bit flip gate" },
  { gate: "z", label: "Z", hint: "Phase flip gate" },
  { gate: "cx", label: "CX", hint: "Controlled NOT gate" },
  { gate: "measure", label: "M", hint: "Measurement" },
];

type Props = {
  circuit: CircuitIR;
  operationsByQubit: Record<number, Gate[]>;
  onChange: (circuit: CircuitIR) => void;
};

export function CircuitBuilder({ circuit, operationsByQubit, onChange }: Props) {
  function addGate(gate: Gate, target: number) {
    const operation =
      gate === "cx"
        ? { gate, controls: [0], targets: [target === 0 ? 1 : target] }
        : gate === "measure"
          ? { gate, targets: [target], classicalTargets: [target] }
          : { gate, targets: [target] };
    onChange({ ...circuit, operations: [...circuit.operations, operation] });
  }

  function clearCircuit() {
    onChange({ ...circuit, operations: [] });
  }

  return (
    <div className="builder-surface">
      <div className="gate-palette" aria-label="Quantum gates">
        {gates.map((item) => (
          <button
            key={item.gate}
            className="gate-token"
            draggable
            title={item.hint}
            onDragStart={(event) => event.dataTransfer.setData("gate", item.gate)}
            onClick={() => addGate(item.gate, 0)}
          >
            {item.label}
          </button>
        ))}
        <button className="clear-button" onClick={clearCircuit}>Clear</button>
      </div>

      <div className="wire-grid">
        {Array.from({ length: circuit.qubits }).map((_, qubit) => (
          <div
            className="wire-row"
            key={qubit}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const gate = event.dataTransfer.getData("gate") as Gate;
              if (gate) addGate(gate, qubit);
            }}
          >
            <span className="wire-label">q{qubit}</span>
            <span className="wire-line" />
            <div className="wire-ops">
              {(operationsByQubit[qubit] ?? []).map((gate, index) => (
                <span className="placed-gate" key={`${gate}-${index}`}>{gate.toUpperCase()}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

