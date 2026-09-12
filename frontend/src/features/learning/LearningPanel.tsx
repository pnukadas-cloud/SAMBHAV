export function LearningPanel() {
  return (
    <aside className="lesson-panel">
      <p className="eyebrow">Lesson</p>
      <h2>Build a Bell State</h2>
      <p>
        A Bell state is one of the simplest examples of quantum entanglement. Start by placing qubit 0 into
        superposition with H, then use CX to correlate qubit 1 with it.
      </p>
      <div className="lesson-steps">
        <span>1. Add H on q0</span>
        <span>2. Add CX from q0 to q1</span>
        <span>3. Measure both qubits</span>
      </div>
      <div className="progress-box">
        <strong>Learning Progress</strong>
        <div className="progress-track"><span style={{ width: "42%" }} /></div>
        <small>3 lessons complete</small>
      </div>
    </aside>
  );
}

