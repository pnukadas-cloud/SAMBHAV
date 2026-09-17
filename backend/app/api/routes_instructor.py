import json
import logging
from typing import Any, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.security import require_role
from app.db import repository
from app.services.gemini_service import GeminiService

logger = logging.getLogger("sambhav.routes_instructor")
router = APIRouter()
gemini_service = GeminiService()


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class CreateClassRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(default="")
    enrollment_code: Optional[str] = None


class EnrollStudentRequest(BaseModel):
    student_id_or_email: str = Field(..., min_length=3)


class CreateAssignmentRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    type: Literal["lesson", "assessment", "lab", "challenge"]
    target_id: str = Field(...)
    due_date: Optional[str] = None


class CreateLessonAuthoringRequest(BaseModel):
    module_id: str = Field(default="module-0")
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(default="")
    difficulty: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    estimated_minutes: int = Field(default=15, ge=1, le=180)
    prerequisites: str = Field(default="")
    content_markdown: str = Field(default="")
    learning_objectives: Optional[list[str]] = Field(default_factory=list)
    structured_sections: Optional[dict[str, Any]] = None
    quantum_config: Optional[dict[str, Any]] = None
    assessment: Optional[dict[str, Any]] = None
    ai_context: Optional[dict[str, Any]] = None
    status: Literal["draft", "published"] = "draft"


class UpdateLessonAuthoringRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[Literal["Beginner", "Intermediate", "Advanced"]] = None
    estimated_minutes: Optional[int] = None
    prerequisites: Optional[str] = None
    content_markdown: Optional[str] = None
    learning_objectives: Optional[list[str]] = None
    structured_sections: Optional[dict[str, Any]] = None
    quantum_config: Optional[dict[str, Any]] = None
    assessment: Optional[dict[str, Any]] = None
    ai_context: Optional[dict[str, Any]] = None
    status: Optional[Literal["draft", "published"]] = None


class PublishLessonRequest(BaseModel):
    status: Literal["draft", "published"]


class CreateAssessmentRequest(BaseModel):
    course_id: str = Field(default="quantum-foundations")
    module_id: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(default="")
    type: Literal["quiz", "coding_challenge", "exam"] = "quiz"
    duration_minutes: int = Field(default=30, ge=1, le=180)
    passing_score: float = Field(default=70.0, ge=0, le=100)
    questions: list[dict[str, Any]] = Field(default_factory=list)
    published: bool = True


class UpdateAssessmentRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[Literal["quiz", "coding_challenge", "exam"]] = None
    duration_minutes: Optional[int] = None
    passing_score: Optional[float] = None
    questions: Optional[list[dict[str, Any]]] = None
    published: Optional[bool] = None


class GradeSubmissionRequest(BaseModel):
    score: float = Field(..., ge=0, le=100)
    feedback: str = Field(default="")


class CreateLabAssignmentRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5)
    class_id: Optional[str] = None
    learning_objective: str = Field(default="")
    qubits: int = Field(default=2, ge=1, le=16)
    starter_circuit: Optional[dict[str, Any]] = None
    required_gates: Optional[list[str]] = Field(default_factory=list)
    expected_result: str = Field(default="")
    hints: Optional[list[str]] = Field(default_factory=list)
    difficulty: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    deadline: Optional[str] = None
    marks: int = Field(default=100, ge=1, le=1000)
    instructions: str = Field(default="")


class UpdateLabAssignmentRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    class_id: Optional[str] = None
    learning_objective: Optional[str] = None
    qubits: Optional[int] = None
    starter_circuit: Optional[dict[str, Any]] = None
    required_gates: Optional[list[str]] = None
    expected_result: Optional[str] = None
    hints: Optional[list[str]] = None
    difficulty: Optional[Literal["Beginner", "Intermediate", "Advanced"]] = None
    deadline: Optional[str] = None
    marks: Optional[int] = None
    instructions: Optional[str] = None


class AIGenerateRequest(BaseModel):
    action: Literal[
        "generate_lesson",
        "generate_quiz",
        "generate_challenge",
        "generate_lab",
        "teaching_plan",
        "explain_weakness",
        "remediation_plan",
        "class_summary"
    ]
    topic: str = Field(..., min_length=2)
    level: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    context: Optional[dict[str, Any]] = None


# ==========================================
# INSTRUCTOR DASHBOARD & ANALYTICS
# ==========================================

@router.get("/dashboard")
def instructor_dashboard(current_user: dict = Depends(require_role("instructor"))) -> dict[str, Any]:
    """Protected endpoint returning genuine real instructor metrics with zero fabrication."""
    instructor_id = current_user["sub"]
    return repository.get_instructor_dashboard_data(instructor_id)


@router.get("/analytics")
def instructor_analytics(current_user: dict = Depends(require_role("instructor"))) -> dict[str, Any]:
    """Protected endpoint returning real calculated analytics from actual database records."""
    instructor_id = current_user["sub"]
    return repository.get_instructor_analytics(instructor_id)


# ==========================================
# CURRICULUM & LESSON AUTHORING
# ==========================================

@router.get("/curriculum")
def get_curriculum(current_user: dict = Depends(require_role("instructor"))) -> list[dict[str, Any]]:
    """Returns the unified 10-module curriculum merged with instructor-authored lessons."""
    instructor_id = current_user["sub"]
    return repository.list_curriculum_for_instructor(instructor_id)


@router.post("/lessons", status_code=status.HTTP_201_CREATED)
def create_lesson(
    payload: CreateLessonAuthoringRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Create a structured instructor lesson in Draft or Published state."""
    instructor_id = current_user["sub"]
    return repository.create_instructor_lesson(
        instructor_id=instructor_id,
        module_id=payload.module_id,
        title=payload.title,
        description=payload.description,
        difficulty=payload.difficulty,
        estimated_minutes=payload.estimated_minutes,
        prerequisites=payload.prerequisites,
        content_markdown=payload.content_markdown,
        learning_objectives=payload.learning_objectives,
        structured_sections=payload.structured_sections,
        quantum_config=payload.quantum_config,
        assessment_config=payload.assessment,
        ai_context=payload.ai_context,
        status=payload.status,
    )


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: str, current_user: dict = Depends(require_role("instructor"))) -> dict[str, Any]:
    """Fetch lesson details for authoring or preview."""
    lesson = repository.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.put("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: str,
    payload: UpdateLessonAuthoringRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Update an instructor-authored lesson. Refuses destructive overwrite of canonical lessons."""
    instructor_id = current_user["sub"]
    updated = repository.update_instructor_lesson(
        instructor_id=instructor_id,
        lesson_id=lesson_id,
        payload=payload.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(status_code=403, detail="Cannot modify canonical curriculum lesson or unauthorized lesson.")
    return updated


@router.post("/lessons/{lesson_id}/publish")
def publish_lesson(
    lesson_id: str,
    payload: PublishLessonRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Explicitly publish or unpublish an instructor-authored lesson."""
    instructor_id = current_user["sub"]
    success = repository.set_lesson_publish_status(instructor_id, lesson_id, payload.status)
    if not success:
        raise HTTPException(status_code=403, detail="Cannot modify status for canonical or unauthorized lesson.")
    return {"status": payload.status, "lessonId": lesson_id}


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Deletes an instructor-authored lesson. Strictly rejects deleting canonical lessons."""
    instructor_id = current_user["sub"]
    success = repository.delete_instructor_lesson(instructor_id, lesson_id)
    if not success:
        raise HTTPException(status_code=403, detail="Canonical curriculum lessons cannot be deleted or unauthorized.")
    return {"message": "Lesson deleted successfully"}


@router.post("/lessons/{lesson_id}/duplicate")
def duplicate_lesson(
    lesson_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Safely duplicate a canonical or existing lesson as a new draft instructor lesson."""
    instructor_id = current_user["sub"]
    copy = repository.duplicate_lesson_as_instructor_copy(instructor_id, lesson_id)
    if not copy:
        raise HTTPException(status_code=404, detail="Source lesson not found")
    return copy


# ==========================================
# CLASS & COHORT MANAGEMENT (IDOR-SAFE)
# ==========================================

@router.get("/classes")
def list_classes(current_user: dict = Depends(require_role("instructor"))) -> list[dict[str, Any]]:
    """List all classes/cohorts belonging to this authenticated instructor."""
    instructor_id = current_user["sub"]
    return repository.list_instructor_classes(instructor_id)


@router.post("/classes", status_code=status.HTTP_201_CREATED)
def create_class(
    payload: CreateClassRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Create a new class cohort with an auto-generated unique enrollment code."""
    instructor_id = current_user["sub"]
    return repository.create_class(
        instructor_id=instructor_id,
        name=payload.name,
        description=payload.description,
        enrollment_code=payload.enrollment_code,
    )


@router.get("/classes/{class_id}")
def get_class(
    class_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Get class details, enrolled students, and assignments for authorized instructor."""
    instructor_id = current_user["sub"]
    cls_data = repository.get_class_by_id(class_id, instructor_id=instructor_id)
    if not cls_data:
        raise HTTPException(status_code=404, detail="Class not found or unauthorized")
    return cls_data


@router.delete("/classes/{class_id}")
def delete_class(
    class_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Delete a class owned by the instructor."""
    instructor_id = current_user["sub"]
    success = repository.delete_class(class_id, instructor_id)
    if not success:
        raise HTTPException(status_code=403, detail="Class not found or unauthorized")
    return {"message": "Class deleted successfully"}


@router.post("/classes/{class_id}/enroll")
def enroll_student(
    class_id: str,
    payload: EnrollStudentRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Enroll a student into instructor's class by email or ID."""
    instructor_id = current_user["sub"]
    cls_data = repository.get_class_by_id(class_id, instructor_id=instructor_id)
    if not cls_data:
        raise HTTPException(status_code=404, detail="Class not found or unauthorized")
    success = repository.enroll_student_in_class(class_id, payload.student_id_or_email)
    if not success:
        raise HTTPException(status_code=404, detail="Student user not found in SAMBHAV system.")
    return {"message": "Student enrolled successfully", "classId": class_id}


@router.delete("/classes/{class_id}/students/{student_id}")
def remove_student(
    class_id: str,
    student_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Remove an enrolled student from an instructor's class."""
    instructor_id = current_user["sub"]
    success = repository.remove_student_from_class(class_id, student_id, instructor_id)
    if not success:
        raise HTTPException(status_code=403, detail="Class not found or unauthorized to modify.")
    return {"message": "Student removed from class successfully"}


@router.post("/classes/{class_id}/assign", status_code=status.HTTP_201_CREATED)
def create_class_assignment(
    class_id: str,
    payload: CreateAssignmentRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Assign a lesson, assessment, lab, or challenge to a class cohort."""
    instructor_id = current_user["sub"]
    assignment = repository.create_class_assignment(
        class_id=class_id,
        title=payload.title,
        assign_type=payload.type,
        target_id=payload.target_id,
        due_date=payload.due_date,
        instructor_id=instructor_id,
    )
    if not assignment:
        raise HTTPException(status_code=403, detail="Class not found or unauthorized")
    return assignment


# ==========================================
# LEARNERS (SCOPED & AUTHORIZED)
# ==========================================

@router.get("/learners")
def list_learners(current_user: dict = Depends(require_role("instructor"))) -> list[dict[str, Any]]:
    """List learners authorized for this instructor with progress, score, and weak concepts."""
    instructor_id = current_user["sub"]
    return repository.list_instructor_learners(instructor_id)


@router.get("/learners/{learner_id}")
def get_learner_detail(
    learner_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Get detailed student record with IDOR verification."""
    instructor_id = current_user["sub"]
    data = repository.get_learner_detail_for_instructor(instructor_id, learner_id)
    if not data:
        raise HTTPException(status_code=404, detail="Learner not found or unauthorized")
    return data


# ==========================================
# ASSESSMENTS MANAGEMENT
# ==========================================

@router.get("/assessments")
def list_assessments(current_user: dict = Depends(require_role("instructor"))) -> list[dict[str, Any]]:
    """List assessments created by the instructor."""
    instructor_id = current_user["sub"]
    return repository.list_instructor_assessments(instructor_id)


@router.post("/assessments", status_code=status.HTTP_201_CREATED)
def create_assessment(
    payload: CreateAssessmentRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Create a new assessment with question bank."""
    instructor_id = current_user["sub"]
    return repository.create_assessment(
        instructor_id=instructor_id,
        course_id=payload.course_id,
        module_id=payload.module_id,
        title=payload.title,
        description=payload.description,
        assess_type=payload.type,
        duration_minutes=payload.duration_minutes,
        passing_score=payload.passing_score,
        questions=payload.questions,
        published=payload.published,
    )


@router.get("/assessments/{assessment_id}")
def get_assessment(
    assessment_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Get assessment detail."""
    assessment = repository.get_assessment_by_id(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.put("/assessments/{assessment_id}")
def update_assessment(
    assessment_id: str,
    payload: UpdateAssessmentRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Update assessment and questions."""
    instructor_id = current_user["sub"]
    updated = repository.update_assessment(instructor_id, assessment_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=403, detail="Assessment not found or unauthorized")
    return updated


@router.delete("/assessments/{assessment_id}")
def delete_assessment(
    assessment_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Delete assessment."""
    instructor_id = current_user["sub"]
    success = repository.delete_assessment(instructor_id, assessment_id)
    if not success:
        raise HTTPException(status_code=403, detail="Assessment not found or unauthorized")
    return {"message": "Assessment deleted successfully"}


@router.get("/assessments/{assessment_id}/submissions")
def list_assessment_submissions(
    assessment_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> list[dict[str, Any]]:
    """List submissions for an assessment."""
    instructor_id = current_user["sub"]
    return repository.list_assessment_submissions(assessment_id, instructor_id)


@router.post("/assessments/{assessment_id}/submissions/{submission_id}/grade")
def grade_assessment_submission(
    assessment_id: str,
    submission_id: str,
    payload: GradeSubmissionRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Grade and add feedback to an assessment submission."""
    success = repository.grade_assessment_submission(submission_id, payload.score, payload.feedback)
    if not success:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Graded successfully", "submissionId": submission_id, "score": payload.score}


# ==========================================
# QUANTUM LAB ASSIGNMENTS
# ==========================================

@router.get("/labs")
def list_labs(current_user: dict = Depends(require_role("instructor"))) -> list[dict[str, Any]]:
    """List Quantum Lab experiment assignments."""
    instructor_id = current_user["sub"]
    return repository.list_instructor_labs(instructor_id)


@router.post("/labs", status_code=status.HTTP_201_CREATED)
def create_lab(
    payload: CreateLabAssignmentRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Create a new Quantum Lab assignment."""
    instructor_id = current_user["sub"]
    return repository.create_lab_assignment(
        instructor_id=instructor_id,
        title=payload.title,
        description=payload.description,
        class_id=payload.class_id,
        learning_objective=payload.learning_objective,
        qubits=payload.qubits,
        starter_circuit=payload.starter_circuit,
        required_gates=payload.required_gates,
        expected_result=payload.expected_result,
        hints=payload.hints,
        difficulty=payload.difficulty,
        deadline=payload.deadline,
        marks=payload.marks,
        instructions=payload.instructions,
    )


@router.get("/labs/{lab_id}")
def get_lab(
    lab_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Get lab assignment details."""
    lab = repository.get_lab_assignment_by_id(lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab assignment not found")
    return lab


@router.put("/labs/{lab_id}")
def update_lab(
    lab_id: str,
    payload: UpdateLabAssignmentRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Update lab assignment."""
    instructor_id = current_user["sub"]
    updated = repository.update_lab_assignment(instructor_id, lab_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=403, detail="Lab assignment not found or unauthorized")
    return updated


@router.delete("/labs/{lab_id}")
def delete_lab(
    lab_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Delete lab assignment."""
    instructor_id = current_user["sub"]
    success = repository.delete_lab_assignment(instructor_id, lab_id)
    if not success:
        raise HTTPException(status_code=403, detail="Lab assignment not found or unauthorized")
    return {"message": "Lab assignment deleted successfully"}


@router.get("/labs/{lab_id}/submissions")
def list_lab_submissions(
    lab_id: str,
    current_user: dict = Depends(require_role("instructor")),
) -> list[dict[str, Any]]:
    """List student submissions for a Quantum Lab experiment."""
    instructor_id = current_user["sub"]
    return repository.list_lab_submissions(lab_id, instructor_id)


@router.post("/labs/{lab_id}/submissions/{submission_id}/grade")
def grade_lab_submission(
    lab_id: str,
    submission_id: str,
    payload: GradeSubmissionRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """Grade and add feedback to a Quantum Lab submission."""
    success = repository.grade_lab_submission(submission_id, payload.score, payload.feedback)
    if not success:
        raise HTTPException(status_code=404, detail="Lab submission not found")
    return {"message": "Lab graded successfully", "submissionId": submission_id, "score": payload.score}


# ==========================================
# AI EDUCATOR COPILOT (SERVER-SIDE DRAFT ONLY)
# ==========================================

@router.post("/ai/generate")
def ai_educator_generate(
    payload: AIGenerateRequest,
    current_user: dict = Depends(require_role("instructor")),
) -> dict[str, Any]:
    """
    Server-side AI Educator generation endpoint.
    Strictly returns DRAFT proposals that require explicit instructor review before publishing.
    """
    action = payload.action
    topic = payload.topic
    level = payload.level
    ctx = payload.context or {}

    system_inst = (
        "You are SAMBHAV's AI Educator Copilot. You assist quantum instructors in creating rigorous, "
        "pedagogically sound quantum curriculum content, lesson drafts, quizzes, lab experiments, "
        "and teaching plans. Return clear, structured, ready-to-review draft material."
    )

    if action == "generate_lesson":
        prompt = (
            f"Generate a comprehensive, structured lesson draft on '{topic}' for {level} level learners in quantum computing.\n"
            "Include:\n"
            "1. Title\n"
            "2. 3 Specific Learning Objectives ('After this lesson, learners will be able to...')\n"
            "3. Concept & Intuition explanation\n"
            "4. Mathematical Formulation (Dirac kets, unitary matrices, state equations using standard LaTeX with $ and $$)\n"
            "5. Mathematical Derivation step-by-step\n"
            "6. Concrete Example\n"
            "7. Practical Application & Real-World Context\n"
            "8. 4 Key Takeaways\n"
            "9. Recommended Quantum Circuit configuration (number of qubits, starter gates, measurement)\n"
            "10. 1 Multiple-Choice Knowledge Check question with 4 options, correct answer index (0-3), and explanation."
        )
    elif action == "generate_quiz":
        prompt = (
            f"Generate a 5-question conceptual and calculation quiz draft on '{topic}' ({level} level).\n"
            "For each question provide:\n"
            "- Question prompt\n"
            "- 4 distinct options (A, B, C, D)\n"
            "- The correct option index (0 for A, 1 for B, 2 for C, 3 for D)\n"
            "- Detailed pedagogical explanation for why the correct answer is true and why common distractors are mistaken."
        )
    elif action == "generate_challenge":
        prompt = (
            f"Generate an interactive quantum circuit challenge draft on '{topic}' ({level} level).\n"
            "Include:\n"
            "- Title\n"
            "- Problem statement & goal\n"
            "- Initial starter circuit\n"
            "- Required quantum gates & constraints\n"
            "- Expected output statevector / measurement probability distribution\n"
            "- 2 progressive pedagogical hints."
        )
    elif action == "generate_lab":
        prompt = (
            f"Create a Quantum Lab experiment assignment draft for '{topic}' ({level} level).\n"
            "Include:\n"
            "- Title\n"
            "- Description & scientific motivation\n"
            "- Learning objectives\n"
            "- Target number of qubits\n"
            "- Starter circuit description\n"
            "- Required gates (e.g. H, CX, Rz)\n"
            "- Expected experimental measurement outcome\n"
            "- 3 hints for learners\n"
            "- Step-by-step experiment instructions."
        )
    elif action == "teaching_plan":
        prompt = (
            f"Create a detailed 60-minute interactive classroom teaching plan for teaching '{topic}' ({level} level).\n"
            "Break down into:\n"
            "- 0-10 min: Motivation, classical analogy & hook\n"
            "- 10-25 min: Mathematical formalism & Dirac notation derivation\n"
            "- 25-45 min: Live Quantum Lab simulation & circuit construction\n"
            "- 45-55 min: Interactive concept check & discussion questions\n"
            "- 55-60 min: Summary, key takeaways & homework assignment."
        )
    elif action == "explain_weakness":
        weak_concept = ctx.get("concept", topic)
        prompt = (
            f"Explain why quantum learners commonly struggle with '{weak_concept}' and provide a targeted 3-step remediation strategy.\n"
            "Include:\n"
            "1. Root cognitive misconception (e.g., confusing classical probabilities with complex probability amplitudes, or CNOT control/target roles)\n"
            "2. Visual/intuitive explanation to resolve the confusion\n"
            "3. 2 practice exercises to solidify understanding."
        )
    elif action == "remediation_plan":
        prompt = (
            f"Provide a structured remediation action plan for a student or cohort struggling with '{topic}'.\n"
            "Include recommended prerequisite review lessons, simplified circuit exercises in Quantum Lab, and progressive check-in questions."
        )
    else:  # class_summary
        prompt = (
            f"Provide an executive pedagogical summary and actionable teaching recommendations for a quantum computing class focusing on '{topic}'.\n"
            "Include suggestions on reinforcing foundational concepts, optimizing hands-on lab time, and bridging theory to algorithms."
        )

    ai_text = gemini_service.generate_raw(prompt, system_instruction=system_inst)

    return {
        "status": "draft",
        "action": action,
        "topic": topic,
        "level": level,
        "isDraft": True,
        "content": ai_text,
        "disclaimer": "AI-generated drafts require educator review before assigning or publishing.",
    }
