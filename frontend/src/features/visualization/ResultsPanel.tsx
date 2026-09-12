import type { SimulationResult } from "../../types";

type Props = {
  result: SimulationResult | null;
};

export function ResultsPanel({ result }: Props) {
  if (!result) {
    return (
      <section className="panel">
        <h2>Simulation Results</h2>
        <p className="muted">Run a circuit to view measurement probabilities, counts, and state amplitudes.</p>
      </section>
    );
  }

  const probabilities = Object.entries(result.probabilities);
  const maxProbability = Math.max(...probabilities.map(([, value]) => value), 1);

  return (
    <section className="panel">
      <h2>Simulation Results</h2>
      <div className="result-meta">
        <span>{result.backend}</span>
        <span>{result.shots} shots</span>
      </div>

      {result.dirac && (
        <div className="dirac-banner">
          <div className="dirac-label">Quantum State (Dirac Notation)</div>
          <div className="dirac-equation" title="Statevector in Dirac bra-ket representation">
            {result.dirac}
          </div>
        </div>
      )}

      <div className="probability-list">
        {probabilities.map(([basis, probability]) => (
          <div className="probability-row" key={basis}>
            <span className="basis-state">|{basis}⟩</span>
            <div className="bar-track">
              <span className="bar-fill" style={{ width: `${(probability / maxProbability) * 100}%` }} />
            </div>
            <span>{Math.round(probability * 100)}%</span>
          </div>
        ))}
      </div>
      <h3>Statevector Amplitudes</h3>
      <div className="state-table">
        {result.statevector.map((item) => (
          <div key={item.basis}>
            <strong>|{item.basis}⟩</strong>
            <span>{item.real} {item.imag >= 0 ? "+" : ""}{item.imag}i</span>
          </div>
        ))}
      </div>
      {result.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
    </section>
  );
}
