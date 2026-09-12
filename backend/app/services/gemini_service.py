import json
import logging
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

from app.quantum.models import CircuitIR, SimulationResult

logger = logging.getLogger("sambhav.gemini_service")

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

SYSTEM_INSTRUCTION = (
    "You are SAMBHAV's Quantum Tutor, an online expert AI agent teaching quantum computing. "
    "Teach accurately, clearly, and engagingly. "
    "Answer the student's actual question directly first, explaining all concepts clearly. "
    "Use the provided circuit, simulation result, and lesson context when relevant. "
    "Do not invent simulation results. If information is insufficient, say so. "
    "Format your explanation in clean, natural plain text with clear paragraphs and bullet points. "
    "Avoid excessive raw markdown asterisks (**) or hashes (#) so it reads smoothly."
)

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
DEFAULT_TIMEOUT_SECONDS = 8.0


def _clean_plain_text(text: str) -> str:
    """Helper to clean unnecessary markdown syntax into clean readable text."""
    if not text:
        return ""
    # Strip markdown headers like ### or ##
    cleaned = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    return cleaned.strip()


class GeminiService:
    """
    Server-side Google Gemini AI Tutor service abstraction for SAMBHAV.
    Handles communication with Google's Gemini API securely from the backend.
    API keys are strictly kept server-side and never exposed to clients.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
    ):
        self._explicit_key = api_key
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.timeout = timeout

    @property
    def api_key(self) -> Optional[str]:
        """Fetch API key from backend environment variable GEMINI_API_KEY (or GOOGLE_API_KEY fallback)."""
        if self._explicit_key:
            return self._explicit_key
        if ENV_PATH.exists():
            load_dotenv(dotenv_path=ENV_PATH, override=True)
        return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    def is_configured(self) -> bool:
        """Check if a Gemini API key is available in the server environment."""
        key = self.api_key
        return bool(key and key.strip())

    def format_circuit_description(self, circuit: Optional[CircuitIR]) -> str:
        """Format structured CircuitIR into human-readable description for Gemini."""
        if not circuit or not circuit.operations:
            return "No active circuit."

        ops_desc = []
        for i, op in enumerate(circuit.operations):
            g = op.gate.upper()
            if op.controls:
                ctrl_str = ", ".join(f"qubit {c}" for c in op.controls)
                tgt_str = ", ".join(f"qubit {t}" for t in op.targets)
                ops_desc.append(f"Step {i+1}: {g} (control: {ctrl_str}, target: {tgt_str})")
            elif len(op.targets) > 1 and g == "SWAP":
                ops_desc.append(f"Step {i+1}: SWAP (qubits {op.targets[0]} and {op.targets[1]})")
            elif op.params:
                params_str = ", ".join(f"{p:.3f}" for p in op.params)
                tgt_str = ", ".join(f"qubit {t}" for t in op.targets)
                ops_desc.append(f"Step {i+1}: {g}({params_str}) on {tgt_str}")
            elif op.gate.lower() == "measure":
                targets = op.targets
                cl_targets = op.classicalTargets or op.targets
                tgt_str = ", ".join(f"q{t}->c{c}" for t, c in zip(targets, cl_targets))
                ops_desc.append(f"Step {i+1}: Measure ({tgt_str})")
            else:
                tgt_str = ", ".join(f"qubit {t}" for t in op.targets)
                ops_desc.append(f"Step {i+1}: {g} on {tgt_str}")

        return f"Qubits: {circuit.qubits}, Classical Bits: {circuit.classicalBits}\n" + "\n".join(f"- {op}" for op in ops_desc)

    def format_simulation_description(self, sim_result: Optional[SimulationResult]) -> str:
        """Format simulation results into clear statevector & probability summary for Gemini."""
        if not sim_result:
            return "No simulation result available."

        parts = []
        if sim_result.dirac:
            parts.append(f"Dirac Statevector: {sim_result.dirac}")
        if sim_result.probabilities:
            prob_items = [f"|{basis}⟩: {prob*100:.1f}%" for basis, prob in sim_result.probabilities.items() if prob > 0.0001]
            parts.append("Measurement Probabilities: " + (", ".join(prob_items) if prob_items else "None"))
        if sim_result.counts:
            counts_items = [f"|{basis}⟩: {count}" for basis, count in sim_result.counts.items()]
            parts.append(f"Shot Counts (shots={sim_result.shots}): " + ", ".join(counts_items))
        if sim_result.warnings:
            parts.append("Warnings: " + "; ".join(sim_result.warnings))

        return "\n".join(parts) if parts else "Simulation completed with ground state |0⟩."

    def format_lesson_description(self, lesson_context: Optional[Any]) -> str:
        """Format lesson context without inventing non-existent curriculum info."""
        if not lesson_context:
            return "No active lesson context."

        title = getattr(lesson_context, "title", None) or (lesson_context.get("title") if isinstance(lesson_context, dict) else None)
        objective = getattr(lesson_context, "objective", None) or (lesson_context.get("objective") if isinstance(lesson_context, dict) else None)
        course = getattr(lesson_context, "course", None) or (lesson_context.get("course") if isinstance(lesson_context, dict) else None)

        if not title and not objective and not course:
            return "No active lesson context."

        parts = []
        if course:
            parts.append(f"Course: {course}")
        if title:
            parts.append(f"Lesson: {title}")
        if objective:
            parts.append(f"Objective: {objective}")
        return "\n".join(parts)

    def build_prompt(
        self,
        question: Optional[str],
        circuit: Optional[CircuitIR] = None,
        sim_result: Optional[SimulationResult] = None,
        lesson_context: Optional[Any] = None,
    ) -> str:
        """
        Build the structured prompt for Gemini clearly establishing:
        - USER QUESTION as PRIMARY
        - INSTRUCTION prioritizing direct answer and conceptual clarity
        - LESSON CONTEXT
        - CURRENT CIRCUIT (supporting context)
        - SIMULATION RESULT (supporting context)
        """
        user_question = (question or "").strip()
        if not user_question:
            user_question = "Explain how this quantum circuit works step-by-step and why these measurement probabilities occur."

        circuit_desc = self.format_circuit_description(circuit)
        sim_desc = self.format_simulation_description(sim_result)
        lesson_desc = self.format_lesson_description(lesson_context)

        prompt = (
            "USER QUESTION:\n"
            f"{user_question}\n\n"
            "INSTRUCTION:\n"
            "1. Answer the user's question directly. The USER QUESTION above is your PRIMARY subject.\n"
            "2. Do not answer a different question, and do not assume the question is about the active circuit unless the user's question explicitly references it.\n"
            "3. If the user question is conceptual (e.g., 'What is a qubit?', 'Explain quantum entanglement', 'Explain Grover\\'s algorithm'), explain the concepts clearly with intuitive analogies and treat the circuit as optional background.\n"
            "4. If the user question refers to the current circuit, gate actions, or measurement probabilities, use the CURRENT CIRCUIT and SIMULATION RESULT provided below.\n"
            "5. If the user asks for a hint, give a progressive pedagogical hint that guides them without giving away the complete answer.\n"
            "6. If the user asks a greeting or general conversational query, respond warmly and guide them on how to explore quantum computing.\n"
            "7. Present your output in clean, readable plain text with neat paragraphs and bullet points without raw markdown hashes or excessive asterisks.\n\n"
            "LESSON CONTEXT:\n"
            f"{lesson_desc}\n\n"
            "CURRENT CIRCUIT (Supporting Context):\n"
            f"{circuit_desc}\n\n"
            "SIMULATION RESULT (Supporting Context):\n"
            f"{sim_desc}"
        )
        return prompt

    def generate_explanation(
        self,
        question: Optional[str],
        circuit: Optional[CircuitIR] = None,
        sim_result: Optional[SimulationResult] = None,
        lesson_context: Optional[Any] = None,
    ) -> Optional[str]:
        """
        Invoke Google's Gemini API using the server-side API key.
        Returns the text response or None if Gemini is unavailable, timed out, or unconfigured.
        Categorizes errors safely without exposing credentials.
        """
        key = self.api_key
        if not key or not key.strip():
            logger.info("Gemini API key is not configured. Falling back to deterministic engine.")
            return None

        prompt = self.build_prompt(
            question=question,
            circuit=circuit,
            sim_result=sim_result,
            lesson_context=lesson_context,
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={key}"
        headers = {"Content-Type": "application/json"}

        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_INSTRUCTION}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "topP": 0.95,
                "maxOutputTokens": 800,
            },
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")

            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                if response.status == 200:
                    res_body = response.read().decode("utf-8")
                    data = json.loads(res_body)
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            raw_text = parts[0]["text"].strip()
                            if raw_text:
                                return _clean_plain_text(raw_text)
        except urllib.error.HTTPError as e:
            # Safe server-side categorization without leaking key or full URL
            if e.code in (401, 403):
                logger.warning(f"Gemini API authentication/permission error [HTTP {e.code}]. Falling back to deterministic engine.")
            elif e.code == 404:
                logger.warning(f"Gemini model '{self.model}' not found [HTTP 404]. Falling back to deterministic engine.")
            elif e.code == 429:
                logger.warning("Gemini API quota exceeded/rate limited [HTTP 429]. Falling back to deterministic engine.")
            elif e.code in (500, 503, 504):
                logger.warning(f"Gemini API upstream service error [HTTP {e.code}]. Falling back to deterministic engine.")
            else:
                logger.warning(f"Gemini API HTTP error [HTTP {e.code}]. Falling back to deterministic engine.")
            return None
        except urllib.error.URLError as e:
            logger.warning(f"Gemini API network connection/timeout error: {type(e.reason).__name__}. Falling back to deterministic engine.")
            return None
        except Exception as e:
            logger.warning(f"Gemini service unexpected exception: {type(e).__name__}. Falling back to deterministic engine.")
            return None

        return None
