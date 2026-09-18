import {
  AlertCircle,
  ArrowUpDown,
  Check,
  ChevronDown,
  Info,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useId, useState } from "react";
import type { CircuitIR, CircuitOperation, Gate, GridOperation } from "../../types";

export interface GateMeta {
  gate: Gate;
  label: string;
  category: "single" | "rotation" | "two-qubit" | "measure";
  hint: string;
  defaultAngle?: number;
}

export const GATE_CATALOG: GateMeta[] = [
  // 1-Qubit Gates
  { gate: "h", label: "H", category: "single", hint: "Hadamard: Creates equal superposition (|0⟩+|1⟩)/√2" },
  { gate: "x", label: "X", category: "single", hint: "Pauli-X: Bit flip (|0⟩ ↔ |1⟩)" },
  { gate: "y", label: "Y", category: "single", hint: "Pauli-Y: Bit and phase flip" },
  { gate: "z", label: "Z", category: "single", hint: "Pauli-Z: Phase flip (|1⟩ → -|1⟩)" },
  { gate: "s", label: "S", category: "single", hint: "Phase S: π/2 phase gate" },
  { gate: "t", label: "T", category: "single", hint: "T-Gate: π/4 phase gate" },

  // Rotations
  { gate: "rx", label: "Rx(θ)", category: "rotation", hint: "Rx: Rotation around X-axis by angle θ", defaultAngle: Math.PI },
  { gate: "ry", label: "Ry(θ)", category: "rotation", hint: "Ry: Rotation around Y-axis by angle θ", defaultAngle: Math.PI / 2 },
  { gate: "rz", label: "Rz(θ)", category: "rotation", hint: "Rz: Rotation around Z-axis by angle θ", defaultAngle: Math.PI },

  // 2-Qubit Gates
  { gate: "cx", label: "CX", category: "two-qubit", hint: "Controlled-NOT: Entangles control and target qubits" },
  { gate: "cz", label: "CZ", category: "two-qubit", hint: "Controlled-Z: Applies phase flip conditional on control" },
  { gate: "swap", label: "SWAP", category: "two-qubit", hint: "SWAP: Exchanges quantum states of two qubits" },

  // Measurement
  { gate: "measure", label: "M", category: "measure", hint: "Measure: Collapses state into classical bit" },
];

export const PRESET_CIRCUITS: Array<{ name: string; description: string; getCircuit: (qubits: number) => CircuitIR }> = [
  {
    name: "Bell State (|Φ⁺⟩)",
    description: "Entangled state (|00⟩ + |11⟩)/√2",
    getCircuit: () => ({
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    }),
  },
  {
    name: "Superposition (|0⟩ + |1⟩)/√2",
    description: "Single-qubit Hadamard superposition",
    getCircuit: () => ({
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    }),
  },
  {
    name: "GHZ State (3-Qubit)",
    description: "Maximally entangled state (|000⟩ + |111⟩)/√2",
    getCircuit: () => ({
      qubits: 3,
      classicalBits: 3,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "cx", controls: [1], targets: [2] },
        { gate: "measure", targets: [0, 1, 2], classicalTargets: [0, 1, 2] },
      ],
    }),
  },
  {
    name: "SWAP Test State",
    description: "State transfer from q0 (|1⟩) to q1 (|0⟩)",
    getCircuit: () => ({
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "x", targets: [0] },
        { gate: "swap", targets: [0, 1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    }),
  },
];

const STANDARD_ANGLES = [
  { label: "π/4 (45°)", value: Math.PI / 4 },
  { label: "π/2 (90°)", value: Math.PI / 2 },
  { label: "3π/4 (135°)", value: (3 * Math.PI) / 4 },
  { label: "π (180°)", value: Math.PI },
  { label: "3π/2 (270°)", value: (3 * Math.PI) / 2 },
  { label: "2π (360°)", value: 2 * Math.PI },
];

function formatAngle(rad: number): string {
  if (Math.abs(rad - Math.PI) < 0.001) return "π";
  if (Math.abs(rad - Math.PI / 2) < 0.001) return "π/2";
  if (Math.abs(rad - Math.PI / 4) < 0.001) return "π/4";
  if (Math.abs(rad - (3 * Math.PI) / 4) < 0.001) return "3π/4";
  if (Math.abs(rad - (3 * Math.PI) / 2) < 0.001) return "3π/2";
  if (Math.abs(rad - 2 * Math.PI) < 0.001) return "2π";
  return `${rad.toFixed(2)} rad`;
}

export function getPartnerQubit(qubit: number, totalQubits: number): number {
  if (totalQubits < 2) return 0;
  if (qubit > 0) {
    return qubit - 1;
  }
  return qubit + 1;
}


// Convert CircuitIR operations into a stepped GridOperation array
export function irToGridOperations(circuit: CircuitIR): GridOperation[] {
  const gridOps: GridOperation[] = [];
  let currentStep = 0;

  for (let index = 0; index < circuit.operations.length; index++) {
    const op = circuit.operations[index];
    // Check if current step has collision with this operation's qubits
    const opQubits = [...(op.targets || []), ...(op.controls || [])];
    const collisionAtStep = gridOps.some(
      (existing) =>
        existing.step === currentStep &&
        [...(existing.targets || []), ...(existing.controls || [])].some((q) => opQubits.includes(q))
    );

    const step = collisionAtStep ? ++currentStep : currentStep;

    gridOps.push({
      ...op,
      id: `op-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      step,
    });
  }
  return gridOps;
}

// Convert GridOperation array back into standard CircuitIR
export function gridOperationsToIR(qubits: number, gridOps: GridOperation[]): CircuitIR {
  // Sort primarily by step ascending
  const sorted = [...gridOps].sort((a, b) => a.step - b.step);
  const operations: CircuitOperation[] = sorted.map((op) => {
    const cleanOp: CircuitOperation = {
      gate: op.gate,
      targets: op.targets,
    };
    if (op.controls && op.controls.length > 0) cleanOp.controls = op.controls;
    if (op.params && op.params.length > 0) cleanOp.params = op.params;
    if (op.classicalTargets && op.classicalTargets.length > 0) cleanOp.classicalTargets = op.classicalTargets;
    return cleanOp;
  });

  return {
    qubits,
    classicalBits: qubits,
    operations,
  };
}

type Props = {
  circuit: CircuitIR;
  onChange: (circuit: CircuitIR) => void;
};

export function CircuitBuilder({ circuit, onChange }: Props) {
  const [gridOps, setGridOps] = useState<GridOperation[]>(() => irToGridOperations(circuit));
  const [stepCount, setStepCount] = useState<number>(6);
  const [selectedGate, setSelectedGate] = useState<Gate>("h");
  const [selectedAngle, setSelectedAngle] = useState<number>(Math.PI);
  const [activeEditingOp, setActiveEditingOp] = useState<GridOperation | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ qubit: number; step: number } | null>(null);
  const [draggedGateType, setDraggedGateType] = useState<Gate | null>(null);
  const [draggedOpId, setDraggedOpId] = useState<string | null>(null);

  // Synchronize when external preset changes (e.g. Reset button)
  useEffect(() => {
    // Only resync if count of operations or qubits differs significantly
    const currentIR = gridOperationsToIR(circuit.qubits, gridOps);
    if (JSON.stringify(currentIR.operations) !== JSON.stringify(circuit.operations) || currentIR.qubits !== circuit.qubits) {
      const newOps = irToGridOperations(circuit);
      setGridOps(newOps);
      const maxStep = newOps.reduce((max, op) => Math.max(max, op.step), 0);
      if (maxStep >= stepCount) {
        setStepCount(Math.max(6, maxStep + 2));
      }
    }
  }, [circuit]);

  function emitChanges(newOps: GridOperation[], newQubits: number = circuit.qubits) {
    setGridOps(newOps);
    const newIR = gridOperationsToIR(newQubits, newOps);
    onChange(newIR);
  }

  function handleAddQubit() {
    if (circuit.qubits >= 6) return;
    const newQubits = circuit.qubits + 1;
    emitChanges(gridOps, newQubits);
  }

  function handleRemoveQubit() {
    if (circuit.qubits <= 1) return;
    const newQubits = circuit.qubits - 1;
    // Filter out operations referencing the removed qubit
    const validOps = gridOps.filter(
      (op) =>
        op.targets.every((t) => t < newQubits) &&
        (!op.controls || op.controls.every((c) => c < newQubits))
    );
    emitChanges(validOps, newQubits);
  }

  function handleAddStep() {
    if (stepCount >= 12) return;
    setStepCount((prev) => prev + 1);
  }

  function handleRemoveStep() {
    if (stepCount <= 4) return;
    // Check if operations exist on the last step
    const targetStep = stepCount - 1;
    const hasOpsOnLast = gridOps.some((op) => op.step === targetStep);
    if (hasOpsOnLast) {
      const validOps = gridOps.filter((op) => op.step < targetStep);
      emitChanges(validOps);
    }
    setStepCount((prev) => prev - 1);
  }

  function placeGateAt(gateType: Gate, targetQubit: number, step: number, customAngle?: number) {
    const meta = GATE_CATALOG.find((g) => g.gate === gateType);
    const angle = customAngle ?? (meta?.defaultAngle || selectedAngle);

    let updatedOps = gridOps.filter(
      (op) =>
        !(
          op.step === step &&
          (op.targets.includes(targetQubit) || (op.controls && op.controls.includes(targetQubit)))
        )
    );

    let newOp: GridOperation;

    if (gateType === "cx" || gateType === "cz") {
      const controlQubit = getPartnerQubit(targetQubit, circuit.qubits);
      // Clear control slot if occupied at destination step
      updatedOps = updatedOps.filter(
        (op) =>
          !(
            op.step === step &&
            (op.targets.includes(controlQubit) || (op.controls && op.controls.includes(controlQubit)))
          )
      );
      newOp = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        gate: gateType,
        step,
        targets: [targetQubit],
        controls: [controlQubit],
      };
    } else if (gateType === "swap") {
      const partnerQubit = getPartnerQubit(targetQubit, circuit.qubits);
      updatedOps = updatedOps.filter(
        (op) =>
          !(
            op.step === step &&
            (op.targets.includes(partnerQubit) || (op.controls && op.controls.includes(partnerQubit)))
          )
      );
      newOp = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        gate: gateType,
        step,
        targets: [Math.min(targetQubit, partnerQubit), Math.max(targetQubit, partnerQubit)],
      };
    } else if (gateType === "rx" || gateType === "ry" || gateType === "rz") {
      newOp = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        gate: gateType,
        step,
        targets: [targetQubit],
        params: [angle],
      };
    } else if (gateType === "measure") {
      newOp = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        gate: gateType,
        step,
        targets: [targetQubit],
        classicalTargets: [targetQubit],
      };
    } else {
      newOp = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        gate: gateType,
        step,
        targets: [targetQubit],
      };
    }

    updatedOps.push(newOp);
    emitChanges(updatedOps);
  }

  function handleDeleteOp(opId: string) {
    const updated = gridOps.filter((op) => op.id !== opId);
    emitChanges(updated);
    if (activeEditingOp?.id === opId) setActiveEditingOp(null);
  }

  function handleClearCircuit() {
    emitChanges([]);
    setActiveEditingOp(null);
  }

  function handleLoadPreset(preset: typeof PRESET_CIRCUITS[0]) {
    const newCircuit = preset.getCircuit(circuit.qubits);
    onChange(newCircuit);
    setActiveEditingOp(null);
  }

  function handleFlipControlTarget(op: GridOperation) {
    if (op.gate !== "cx" && op.gate !== "cz") return;
    if (!op.controls || op.controls.length === 0) return;
    const currentControl = op.controls[0];
    const currentTarget = op.targets[0];
    const updated = gridOps.map((item) => {
      if (item.id === op.id) {
        return {
          ...item,
          controls: [currentTarget],
          targets: [currentControl],
        };
      }
      return item;
    });
    emitChanges(updated);
    if (activeEditingOp?.id === op.id) {
      setActiveEditingOp({
        ...activeEditingOp,
        controls: [currentTarget],
        targets: [currentControl],
      });
    }
  }

  function handleUpdateAngle(op: GridOperation, newAngle: number) {
    const updated = gridOps.map((item) => {
      if (item.id === op.id) {
        return {
          ...item,
          params: [newAngle],
        };
      }
      return item;
    });
    emitChanges(updated);
    if (activeEditingOp?.id === op.id) {
      setActiveEditingOp({
        ...activeEditingOp,
        params: [newAngle],
      });
    }
  }

  function handleCellDrop(targetQubit: number, targetStep: number) {
    if (draggedGateType) {
      placeGateAt(draggedGateType, targetQubit, targetStep);
      setDraggedGateType(null);
    } else if (draggedOpId) {
      const op = gridOps.find((o) => o.id === draggedOpId);
      if (op) {
        let remaining = gridOps.filter((o) => o.id !== draggedOpId);

        if (op.gate === "cx" || op.gate === "cz") {
          const partner = getPartnerQubit(targetQubit, circuit.qubits);
          // Remove any colliding operations at destination step on both wires
          remaining = remaining.filter(
            (o) =>
              !(
                o.step === targetStep &&
                (o.targets.includes(targetQubit) ||
                  o.targets.includes(partner) ||
                  (o.controls && o.controls.includes(targetQubit)) ||
                  (o.controls && o.controls.includes(partner)))
              )
          );
          remaining.push({
            ...op,
            step: targetStep,
            targets: [targetQubit],
            controls: [partner],
          });
        } else if (op.gate === "swap") {
          const partner = getPartnerQubit(targetQubit, circuit.qubits);
          remaining = remaining.filter(
            (o) =>
              !(
                o.step === targetStep &&
                (o.targets.includes(targetQubit) ||
                  o.targets.includes(partner) ||
                  (o.controls && o.controls.includes(targetQubit)) ||
                  (o.controls && o.controls.includes(partner)))
              )
          );
          remaining.push({
            ...op,
            step: targetStep,
            targets: [Math.min(targetQubit, partner), Math.max(targetQubit, partner)],
          });
        } else {
          // Single qubit, rotation, or measurement
          remaining = remaining.filter(
            (o) =>
              !(
                o.step === targetStep &&
                (o.targets.includes(targetQubit) || (o.controls && o.controls.includes(targetQubit)))
              )
          );
          remaining.push({
            ...op,
            step: targetStep,
            targets: [targetQubit],
            classicalTargets: op.gate === "measure" ? [targetQubit] : undefined,
          });
        }
        emitChanges(remaining);
      }
      setDraggedOpId(null);
    }
  }

  // Find operations at a given step
  function getMultiQubitConnectorsAtStep(step: number) {
    return gridOps.filter(
      (op) => op.step === step && (op.gate === "cx" || op.gate === "cz" || op.gate === "swap")
    );
  }

  return (
    <div className="quantum-circuit-builder">
      {/* Top Toolbar: Qubit & Step count controls + Presets */}
      <div className="builder-top-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Qubits:</span>
          <div className="counter-pill">
            <button
              className="counter-btn"
              onClick={handleRemoveQubit}
              disabled={circuit.qubits <= 1}
              aria-label="Remove qubit"
            >
              <Minus size={14} />
            </button>
            <span className="counter-value">{circuit.qubits}</span>
            <button
              className="counter-btn"
              onClick={handleAddQubit}
              disabled={circuit.qubits >= 6}
              aria-label="Add qubit"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Steps:</span>
          <div className="counter-pill">
            <button
              className="counter-btn"
              onClick={handleRemoveStep}
              disabled={stepCount <= 4}
              aria-label="Remove step column"
            >
              <Minus size={14} />
            </button>
            <span className="counter-value">{stepCount}</span>
            <button
              className="counter-btn"
              onClick={handleAddStep}
              disabled={stepCount >= 12}
              aria-label="Add step column"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="toolbar-group presets-dropdown-group">
          <span className="toolbar-label">Presets:</span>
          <div className="preset-buttons">
            {PRESET_CIRCUITS.map((preset) => (
              <button
                key={preset.name}
                className="preset-chip"
                onClick={() => handleLoadPreset(preset)}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-spacer" />

        <button className="clear-circuit-btn" onClick={handleClearCircuit} title="Clear all gates">
          <Trash2 size={15} /> Clear
        </button>
      </div>

      {/* Gate Palette: Categorized quantum gate badges */}
      <div className="gate-palette-container" aria-label="Quantum Gate Palette">
        <div className="palette-section">
          <span className="palette-section-title">Single Qubit</span>
          <div className="palette-row">
            {GATE_CATALOG.filter((g) => g.category === "single").map((item) => (
              <button
                key={item.gate}
                className={`gate-palette-btn gate-single ${selectedGate === item.gate ? "is-active" : ""}`}
                draggable
                title={item.hint}
                onDragStart={(e) => {
                  e.dataTransfer.setData("gate", item.gate);
                  setDraggedGateType(item.gate);
                }}
                onClick={() => setSelectedGate(item.gate)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="palette-section">
          <span className="palette-section-title">Rotations</span>
          <div className="palette-row">
            {GATE_CATALOG.filter((g) => g.category === "rotation").map((item) => (
              <button
                key={item.gate}
                className={`gate-palette-btn gate-rotation ${selectedGate === item.gate ? "is-active" : ""}`}
                draggable
                title={`${item.hint} (Angle: ${formatAngle(selectedAngle)})`}
                onDragStart={(e) => {
                  e.dataTransfer.setData("gate", item.gate);
                  setDraggedGateType(item.gate);
                }}
                onClick={() => setSelectedGate(item.gate)}
              >
                {item.label}
              </button>
            ))}
            {/* Quick Angle Selector for rotations */}
            <div className="angle-picker-dropdown">
              <span className="angle-label">θ:</span>
              <select
                className="angle-select"
                value={selectedAngle}
                onChange={(e) => setSelectedAngle(parseFloat(e.target.value))}
                title="Select rotation angle for Rx/Ry/Rz"
              >
                {STANDARD_ANGLES.map((ang) => (
                  <option key={ang.label} value={ang.value}>
                    {ang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="palette-section">
          <span className="palette-section-title">2-Qubit Entanglers</span>
          <div className="palette-row">
            {GATE_CATALOG.filter((g) => g.category === "two-qubit").map((item) => (
              <button
                key={item.gate}
                className={`gate-palette-btn gate-two-qubit ${selectedGate === item.gate ? "is-active" : ""}`}
                draggable
                disabled={circuit.qubits < 2}
                title={circuit.qubits < 2 ? "Requires at least 2 qubits" : item.hint}
                onDragStart={(e) => {
                  if (circuit.qubits < 2) return;
                  e.dataTransfer.setData("gate", item.gate);
                  setDraggedGateType(item.gate);
                }}
                onClick={() => {
                  if (circuit.qubits >= 2) setSelectedGate(item.gate);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="palette-section">
          <span className="palette-section-title">Measurement</span>
          <div className="palette-row">
            {GATE_CATALOG.filter((g) => g.category === "measure").map((item) => (
              <button
                key={item.gate}
                className={`gate-palette-btn gate-measure ${selectedGate === item.gate ? "is-active" : ""}`}
                draggable
                title={item.hint}
                onDragStart={(e) => {
                  e.dataTransfer.setData("gate", item.gate);
                  setDraggedGateType(item.gate);
                }}
                onClick={() => setSelectedGate(item.gate)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty Circuit Warning Banner */}
      {gridOps.length === 0 && (
        <div className="empty-circuit-alert" role="alert">
          <AlertCircle size={18} className="alert-icon" />
          <div className="alert-content">
            <strong>Your circuit is empty.</strong>
            <span>Click any gate from the palette or drag it onto the circuit grid below to build your circuit.</span>
          </div>
        </div>
      )}

      {/* Quantum Circuit Grid Board */}
      <div className="circuit-grid-wrapper">
        <div className="circuit-grid-container">
          {/* Time Step Header Columns */}
          <div className="circuit-grid-header">
            <div className="header-cell-qubit">Wire</div>
            <div className="header-cell-init">|ψ₀⟩</div>
            {Array.from({ length: stepCount }).map((_, stepIdx) => (
              <div key={`step-head-${stepIdx}`} className="header-cell-step">
                Step {stepIdx + 1}
              </div>
            ))}
          </div>

          {/* Qubit Wire Rows */}
          <div className="circuit-wires-grid">
            {Array.from({ length: circuit.qubits }).map((_, qubitIdx) => (
              <div key={`wire-row-${qubitIdx}`} className="circuit-wire-row">
                {/* Wire label & initial state |0⟩ */}
                <div className="wire-header">
                  <span className="wire-badge">q{qubitIdx}</span>
                </div>
                <div className="wire-init-state">|0⟩</div>

                {/* Continuous Wire Line in background */}
                <div className="wire-continuous-line" />

                {/* Time Step Slots */}
                <div className="wire-slots-track">
                  {Array.from({ length: stepCount }).map((_, stepIdx) => {
                    // Find if any operation sits on this qubit & step
                    const op = gridOps.find((o) => {
                      if (o.step !== stepIdx) return false;
                      return (
                        o.targets.includes(qubitIdx) ||
                        (o.controls && o.controls.includes(qubitIdx))
                      );
                    });

                    // Multi-qubit role: control, target, or swap target
                    const isControl = op?.controls?.includes(qubitIdx);
                    const isTarget = op?.targets?.includes(qubitIdx);
                    const isHovered =
                      hoveredCell?.qubit === qubitIdx && hoveredCell?.step === stepIdx;

                    return (
                      <div
                        key={`cell-${qubitIdx}-${stepIdx}`}
                        className={`circuit-cell ${op ? "has-gate" : "is-empty"} ${
                          isHovered ? "is-hovered" : ""
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setHoveredCell({ qubit: qubitIdx, step: stepIdx });
                        }}
                        onDragLeave={() => setHoveredCell(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setHoveredCell(null);
                          handleCellDrop(qubitIdx, stepIdx);
                        }}
                        onClick={() => {
                          if (!op && selectedGate) {
                            placeGateAt(selectedGate, qubitIdx, stepIdx);
                          } else if (op) {
                            setActiveEditingOp(op);
                          }
                        }}
                      >
                        {/* Render gate node if present */}
                        {op ? (
                          <div
                            className={`circuit-node node-${op.gate} ${
                              isControl ? "node-control-dot" : ""
                            } ${activeEditingOp?.id === op.id ? "node-selected" : ""}`}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setDraggedOpId(op.id);
                            }}
                          >
                            {/* Gate Content Display */}
                            {op.gate === "cx" && isControl && (
                              <div className="control-dot-circle" title={`Control for CX on q${op.targets[0]}`} />
                            )}
                            {op.gate === "cx" && isTarget && (
                              <div className="target-target-circle" title={`Target for CX from q${op.controls?.[0]}`}>
                                <span className="target-symbol">⊕</span>
                              </div>
                            )}

                            {op.gate === "cz" && isControl && (
                              <div className="control-dot-circle" title={`Control for CZ on q${op.targets[0]}`} />
                            )}
                            {op.gate === "cz" && isTarget && (
                              <div className="gate-box gate-box-z" title="CZ target">
                                Z
                              </div>
                            )}

                            {op.gate === "swap" && (
                              <div className="swap-cross" title="SWAP gate">
                                ✕
                              </div>
                            )}

                            {op.gate === "measure" && (
                              <div className="measure-box" title="Measurement">
                                <span className="measure-meter">◵</span>
                                <span className="measure-lbl">M</span>
                              </div>
                            )}

                            {(op.gate === "rx" || op.gate === "ry" || op.gate === "rz") && (
                              <div className="rotation-box" title={`${op.gate.toUpperCase()}(${formatAngle(op.params?.[0] ?? Math.PI)})`}>
                                <span className="rot-name">{op.gate.toUpperCase()}</span>
                                <span className="rot-angle-tag">{formatAngle(op.params?.[0] ?? Math.PI)}</span>
                              </div>
                            )}

                            {["h", "x", "y", "z", "s", "t"].includes(op.gate) && (
                              <div className="standard-gate-box">
                                {op.gate.toUpperCase()}
                              </div>
                            )}

                            {/* Node action buttons: delete & edit */}
                            <button
                              className="node-delete-btn"
                              title="Delete gate"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOp(op.id);
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="empty-cell-placeholder" title="Click or drop gate here">
                            <span className="plus-hint">+</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Vertical Multi-Qubit Connector Lines Overlay */}
            <svg className="multi-qubit-svg-overlay" aria-hidden="true">
              {Array.from({ length: stepCount }).map((_, stepIdx) => {
                const multiOps = getMultiQubitConnectorsAtStep(stepIdx);
                return multiOps.map((op) => {
                  let qA = 0;
                  let qB = 0;
                  if ((op.gate === "cx" || op.gate === "cz") && op.controls && op.controls.length > 0) {
                    qA = op.controls[0];
                    qB = op.targets[0];
                  } else if (op.gate === "swap" && op.targets.length >= 2) {
                    qA = op.targets[0];
                    qB = op.targets[1];
                  } else {
                    return null;
                  }

                  const minQ = Math.min(qA, qB);
                  const maxQ = Math.max(qA, qB);

                  // Calculate approximate slot centers
                  // Each wire row is 56px high + 10px gap, with header offset
                  const slotWidth = 72;
                  const rowHeight = 66; // 56px wire row + 10px gap
                  const headerWidth = 100; // Qubit label + initial state width
                  const xCenter = headerWidth + stepIdx * slotWidth + slotWidth / 2;
                  const yTop = minQ * rowHeight + 28;
                  const yBottom = maxQ * rowHeight + 28;

                  return (
                    <g key={`connector-${op.id}`}>
                      <line
                        x1={xCenter}
                        y1={yTop}
                        x2={xCenter}
                        y2={yBottom}
                        stroke="#0f1923"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </g>
                  );
                });
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Inline Inspector / Gate Property Editor */}
      {activeEditingOp && (
        <div className="gate-inspector-panel">
          <div className="inspector-header">
            <Sliders size={16} />
            <h4>
              Selected Gate: <strong>{activeEditingOp.gate.toUpperCase()}</strong> (Step {activeEditingOp.step + 1})
            </h4>
            <button className="inspector-close-btn" onClick={() => setActiveEditingOp(null)}>
              <X size={14} />
            </button>
          </div>

          <div className="inspector-body">
            {(activeEditingOp.gate === "cx" || activeEditingOp.gate === "cz") && (
              <div className="inspector-controls">
                <div className="inspector-field">
                  <span>Control: <strong>q{activeEditingOp.controls?.[0]}</strong></span>
                  <span>Target: <strong>q{activeEditingOp.targets[0]}</strong></span>
                </div>
                <button
                  className="inspector-action-btn"
                  onClick={() => handleFlipControlTarget(activeEditingOp)}
                  title="Switch control and target wires"
                >
                  <ArrowUpDown size={14} /> Flip Control & Target
                </button>
              </div>
            )}

            {(activeEditingOp.gate === "rx" || activeEditingOp.gate === "ry" || activeEditingOp.gate === "rz") && (
              <div className="inspector-controls">
                <div className="inspector-field">
                  <span>Angle θ:</span>
                  <select
                    className="angle-select"
                    value={activeEditingOp.params?.[0] ?? Math.PI}
                    onChange={(e) => handleUpdateAngle(activeEditingOp, parseFloat(e.target.value))}
                  >
                    {STANDARD_ANGLES.map((ang) => (
                      <option key={ang.label} value={ang.value}>
                        {ang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              className="inspector-delete-btn"
              onClick={() => handleDeleteOp(activeEditingOp.id)}
            >
              <Trash2 size={14} /> Remove Gate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
