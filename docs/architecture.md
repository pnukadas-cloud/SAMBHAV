# SAMBHAV Architecture

SAMBHAV is an AI-powered interactive quantum learning platform. The core design principle is that the frontend, backend, AI tutor, and quantum execution layer communicate through explicit contracts instead of framework-specific shortcuts.

## High-Level System

```text
React Frontend
  -> FastAPI Backend
    -> PostgreSQL data layer
    -> Redis job queue
    -> Quantum orchestration service
      -> Backend adapters: local statevector, Qiskit Aer, PennyLane, Cirq
    -> AI tutor service
```

## Key Decisions

- The visual circuit builder stores circuits as a neutral JSON circuit IR.
- Quantum framework adapters convert the IR into framework-specific objects.
- Simulation results are normalized before they reach the frontend.
- Small demo circuits can run synchronously; larger circuits should be queued.
- AI tutoring is split into specific tasks: concept explanation, circuit explanation, code generation, debugging, optimization, and recommendations.

## MVP Demonstration Flow

1. Student opens a quantum lesson.
2. Student builds a Bell state circuit visually.
3. Backend validates the circuit IR.
4. Simulation runs through the quantum backend orchestrator.
5. Frontend renders counts, probabilities, statevector, and Bloch data.
6. Student asks AI tutor for an explanation.
7. Instructor dashboard shows progress and simulation activity.

