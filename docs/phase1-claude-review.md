# SAMBHAV — Phase 1 Code Review Package for Claude (Senior Architect)

This document contains the complete, unabridged source files representing the completed **P0 Phase 1: Quantum Circuit Builder & Execution Hardening** for the SAMBHAV quantum learning platform (Smart India Hackathon 2026).

---

## Table of Contents
1. [File 1: frontend/src/types.ts](#file-1-frontendsrctypests)
2. [File 2: frontend/src/features/circuit-builder/CircuitBuilder.tsx](#file-2-frontendsrcfeaturescircuit-buildercircuitbuildertsx)
3. [File 3: frontend/src/App.tsx](#file-3-frontendsrcapptsx)
4. [File 4: backend/tests/test_quantum_backend.py](#file-4-backendteststest_quantum_backendpy)
5. [File 5: backend/tests/test_api_endpoints.py](#file-5-backendteststest_api_endpointspy)
6. [File 6: backend/app/quantum/models.py](#file-6-backendappquantummodelspy)
7. [Environment & Verification Status](#7-environment--verification-status)

---

## File 1: frontend/src/types.ts

```typescript
export type Gate =
  | "h"
  | "x"
  | "y"
  | "z"
  | "s"
  | "t"
  | "rx"
  | "ry"
  | "rz"
  | "cx"
  | "cz"
  | "swap"
  | "measure";

export type CircuitOperation = {
  gate: Gate;
  targets: number[];
  controls?: number[];
  classicalTargets?: number[];
  params?: number[];
};

export type GridOperation = CircuitOperation & {
  id: string;
  step: number;
};

export type CircuitIR = {
  qubits: number;
  classicalBits: number;
  operations: CircuitOperation[];
};

export type SimulationResult = {
  backend: string;
  shots: number;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  statevector: Array<{
    basis: string;
    real: number;
    imag: number;
    magnitude: number;
    phase: number;
  }>;
  bloch: Array<{ qubit: number; x: number; y: number; z: number }>;
  warnings: string[];
};
```

---

## File 2: frontend/src/features/circuit-builder/CircuitBuilder.tsx

```tsx
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

    // Remove any existing single-qubit op in this exact (qubit, step) slot
    let updatedOps = gridOps.filter(
      (op) =>
        !(
          op.step === step &&
          (op.targets.includes(targetQubit) || (op.controls && op.controls.includes(targetQubit)))
        )
    );

    let newOp: GridOperation;

    if (gateType === "cx" || gateType === "cz") {
      const controlQubit = targetQubit === 0 ? (circuit.qubits > 1 ? 1 : 0) : 0;
      // Also clear control slot if occupied at the same step
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
      const otherQubit = targetQubit === 0 ? (circuit.qubits > 1 ? 1 : 0) : 0;
      updatedOps = updatedOps.filter(
        (op) =>
          !(
            op.step === step &&
            (op.targets.includes(otherQubit) || (op.controls && op.controls.includes(otherQubit)))
          )
      );
      newOp = {
        id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        gate: gateType,
        step,
        targets: [Math.min(targetQubit, otherQubit), Math.max(targetQubit, otherQubit)],
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
      // standard 1-qubit gate
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
        const remaining = gridOps.filter((o) => o.id !== draggedOpId);
        // Place at new location
        if (op.gate === "cx" || op.gate === "cz") {
          const control = op.controls?.[0] ?? 0;
          const target = targetQubit;
          remaining.push({
            ...op,
            step: targetStep,
            targets: [target],
            controls: [control === target ? (target === 0 ? 1 : 0) : control],
          });
        } else if (op.gate === "swap") {
          const t1 = targetQubit;
          const t2 = (targetQubit + 1) % circuit.qubits;
          remaining.push({
            ...op,
            step: targetStep,
            targets: [t1, t2],
          });
        } else {
          remaining.push({
            ...op,
            step: targetStep,
            targets: [targetQubit],
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
                        stroke="#14342f"
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
```

---

## File 3: frontend/src/App.tsx

```tsx
import {
  AlertTriangle,
  Atom,
  BrainCircuit,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { explainCircuit, runSimulation, toQiskitCode } from "./api/client";
import { CircuitBuilder, PRESET_CIRCUITS } from "./features/circuit-builder/CircuitBuilder";
import { TutorPanel } from "./features/ai-tutor/TutorPanel";
import { LearningPanel } from "./features/learning/LearningPanel";
import { InstructorPanel } from "./features/instructor/InstructorPanel";
import { ResultsPanel } from "./features/visualization/ResultsPanel";
import type { CircuitIR, SimulationResult } from "./types";

const defaultBellCircuit: CircuitIR = {
  qubits: 2,
  classicalBits: 2,
  operations: [
    { gate: "h", targets: [0] },
    { gate: "cx", controls: [0], targets: [1] },
    { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
  ],
};

export function App() {
  const [circuit, setCircuit] = useState<CircuitIR>(defaultBellCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [explanation, setExplanation] = useState(
    "Run the Bell circuit and ask the AI tutor why the measurement outcomes are correlated."
  );
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isCircuitEmpty = !circuit.operations || circuit.operations.length === 0;

  async function handleRun() {
    if (isCircuitEmpty) {
      setValidationError("Your circuit is empty. Add at least one gate before running the simulation.");
      setStatus("Circuit empty");
      return;
    }

    setValidationError(null);
    setIsRunning(true);
    setStatus("Running quantum simulation...");

    try {
      const simulation = await runSimulation(circuit);
      const generatedCode = await toQiskitCode(circuit);
      setResult(simulation);
      setCode(generatedCode.code);
      setStatus(`Completed on ${simulation.backend}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Simulation execution failed.";
      setStatus("Simulation failed");
      setValidationError(
        errorMsg.includes("422") || errorMsg.includes("at least one operation")
          ? "Your circuit is empty. Add at least one gate before running the simulation."
          : errorMsg
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function handleExplain() {
    if (isCircuitEmpty) {
      setValidationError("Your circuit is empty. Add at least one gate before requesting an explanation.");
      return;
    }

    setValidationError(null);
    setStatus("Asking AI tutor...");

    try {
      const response = await explainCircuit(circuit);
      setExplanation(
        `${response.explanation}\n\n💡 Next Steps:\n${response.suggestions.map((s) => `• ${s}`).join("\n")}`
      );
      setStatus("AI explanation ready");
    } catch (error) {
      setStatus("Tutor request failed");
      setValidationError("Failed to retrieve AI explanation. Please check backend connectivity.");
    }
  }

  function handleReset() {
    setCircuit(defaultBellCircuit);
    setValidationError(null);
    setStatus("Reset to Bell circuit");
  }

  function handleCircuitChange(newCircuit: CircuitIR) {
    setCircuit(newCircuit);
    if (newCircuit.operations.length > 0 && validationError) {
      setValidationError(null);
    }
  }

  return (
    <main className="app-shell">
      {/* Platform Header Topbar */}
      <header className="topbar" aria-label="SAMBHAV header">
        <div className="topbar-brand">
          <div className="brand-logo-badge">
            <Atom size={24} className="spin-slow" />
          </div>
          <div>
            <p className="eyebrow">Smart India Hackathon 2026</p>
            <h1>SAMBHAV Quantum Learning Platform</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className={`status-pill ${isRunning ? "status-running" : ""}`}>
            {status}
          </div>
        </div>
      </header>

      {/* Main Quantum IDE Workspace */}
      <div className="workspace">
        {/* Left Column: Interactive Learning & Module Guide */}
        <div className="learning-column">
          <LearningPanel />
        </div>

        {/* Center Column: Discrete Circuit Grid Builder & Code Engine */}
        <div className="builder-column">
          <div className="section-heading">
            <BrainCircuit size={20} className="text-teal" />
            <h2>Interactive Circuit Builder</h2>
            <span className="badge-pill">{circuit.qubits} Qubits • {circuit.operations.length} Gates</span>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="circuit-validation-alert" role="alert">
              <AlertTriangle size={18} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Circuit Canvas Grid Component */}
          <CircuitBuilder circuit={circuit} onChange={handleCircuitChange} />

          {/* Primary Action Buttons */}
          <div className="action-row">
            <button
              className="primary-button"
              onClick={handleRun}
              disabled={isRunning || isCircuitEmpty}
              title={isCircuitEmpty ? "Add gates before running" : "Execute simulation"}
            >
              <Play size={18} /> {isRunning ? "Simulating..." : "Run Simulation"}
            </button>

            <button
              className="secondary-button"
              onClick={handleExplain}
              disabled={isCircuitEmpty}
              title={isCircuitEmpty ? "Add gates before asking AI" : "Explain this circuit"}
            >
              <Sparkles size={18} /> Explain Circuit
            </button>

            <button
              className="icon-button"
              aria-label="Reset to default Bell circuit"
              onClick={handleReset}
              title="Reset to Bell State (|Φ⁺⟩)"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Generated Python/Qiskit Code Panel */}
          <div className="code-panel">
            <div className="section-heading compact">
              <Code2 size={18} />
              <h2>Generated Qiskit Code</h2>
            </div>
            <pre className="qiskit-code-block">
              {code || "# Run the simulation or place gates to generate Qiskit code."}
            </pre>
          </div>
        </div>

        {/* Right Column: Quantum Simulation Results, AI Tutor & Instructor Snapshot */}
        <div className="insight-column">
          <ResultsPanel result={result} />
          <TutorPanel explanation={explanation} />
          <div className="section-heading compact">
            <LayoutDashboard size={18} />
            <h2>Instructor Snapshot</h2>
          </div>
          <InstructorPanel />
        </div>
      </div>
    </main>
  );
}
```

---

## File 4: backend/tests/test_quantum_backend.py

```python
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
        # H(0), H(1), CZ(0 -> 1) produces (|00> + |01> + |10> - |11>)/2
        circuit = CircuitIR(
            qubits=2,
            classicalBits=2,
            operations=[
                CircuitOperation(gate="h", targets=[0]),
                CircuitOperation(gate="h", targets=[1]),
                CircuitOperation(gate="cz", controls=[0], targets=[1]),
            ],
        )
        result = self.simulator.simulate(circuit, SimulationOptions(shots=1000))
        for basis in ["00", "01", "10", "11"]:
            self.assertAlmostEqual(result.probabilities.get(basis, 0), 0.25, places=4)

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


if __name__ == "__main__":
    unittest.main()
```

---

## File 5: backend/tests/test_api_endpoints.py

```python
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


if __name__ == "__main__":
    unittest.main()
```

---

## File 6: backend/app/quantum/models.py

```python
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
    warnings: list[str] = Field(default_factory=list)


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
```

---

## 7. Environment & Verification Status

* **Current Git Commit Hash:** `e63290b1bc4f1571ff21b5216010e6ca2f4d3def` (short: `e63290b`)
* **Branch Name:** `main`
* **Git Status:** Working tree clean (`nothing to commit, working tree clean`)
* **GitHub Repository Push Confirmation:** Confirmed pushed to `https://github.com/pnukadas-cloud/SAMBHAV.git` on branch `main`.
* **Latest Backend Test Results (20/20 Passed):**
  ```text
  python -m unittest discover -s tests -p "test_*.py" -v
  Ran 20 tests in 0.076s
  OK
  ```
* **Latest Frontend Production Build Result (100% Clean):**
  ```text
  ✓ 1706 modules transformed.
  dist/index.html                   0.41 kB │ gzip:  0.28 kB
  dist/assets/index-C-vHJ3HX.css   14.24 kB │ gzip:  3.70 kB
  dist/assets/index-DSOD07Oi.js   250.46 kB │ gzip: 77.86 kB
  ✓ built in 12.51s
  ```
