import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle
import numpy as np

# 16:9 Presentation Canvas (High-Res 300 DPI)
plt.rcParams['font.family'] = 'DejaVu Sans'
fig, ax = plt.subplots(figsize=(19.2, 10.8), dpi=300)

BG_CANVAS = '#FFFFFF'
fig.patch.set_facecolor(BG_CANVAS)
ax.set_facecolor(BG_CANVAS)

ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Color System
CARD_BORDER = '#1E293B'
CARD_BG = '#FFFFFF'

PILL_YELLOW_BG = '#FDE68A'
PILL_YELLOW_BORDER = '#D97706'
PILL_YELLOW_TEXT = '#1E293B'

PILL_BLUE_BG = '#BAE6FD'
PILL_BLUE_BORDER = '#0284C7'
PILL_BLUE_TEXT = '#1E293B'

PINK_BOX_BG = '#FECDD3'
PINK_BOX_BORDER = '#FB7185'
PINK_BOX_TEXT = '#881337'

GREEN_PILL_BG = '#BBF7D0'
GREEN_PILL_BORDER = '#22C55E'
GREEN_PILL_TEXT = '#14532D'

GREY_PILL_BG = '#F1F5F9'
GREY_PILL_BORDER = '#94A3B8'
GREY_PILL_TEXT = '#334155'

GRAD_TEAL = '#0D9488'
GRAD_GREEN = '#15803D'
GRAD_BLUE = '#1D4ED8'
GRAD_PURPLE = '#7C3AED'

def draw_card(x, y, w, h):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle="round,pad=0.0,rounding_size=1.0",
                         facecolor=CARD_BG,
                         edgecolor=CARD_BORDER,
                         linewidth=1.8,
                         zorder=2)
    ax.add_patch(box)

def draw_pill(x, y, w, h, bg, border, text, font_size=7.2, font_weight='normal', text_color='#1E293B'):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle="round,pad=0.0,rounding_size=0.35",
                         facecolor=bg,
                         edgecolor=border,
                         linewidth=1.1,
                         zorder=5)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=font_size, fontweight=font_weight, color=text_color, zorder=6)

def draw_action_badge(x, y, w, h, bg_color, text, font_size=8.0):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle="round,pad=0.0,rounding_size=1.2",
                         facecolor=bg_color,
                         edgecolor='none',
                         zorder=5)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=font_size, fontweight='bold', color='#FFFFFF', zorder=6)

def draw_pink_box(x, y, w, h, title, sub=""):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle="round,pad=0.0,rounding_size=0.5",
                         facecolor=PINK_BOX_BG,
                         edgecolor=PINK_BOX_BORDER,
                         linewidth=1.3,
                         zorder=5)
    ax.add_patch(box)
    if sub:
        ax.text(x + w/2, y + h/2 + 1.2, title, ha='center', va='center',
                fontsize=8.5, fontweight='bold', color=PINK_BOX_TEXT, zorder=6)
        ax.text(x + w/2, y + h/2 - 1.2, sub, ha='center', va='center',
                fontsize=6.8, color='#9F1239', zorder=6)
    else:
        ax.text(x + w/2, y + h/2, title, ha='center', va='center',
                fontsize=8.5, fontweight='bold', color=PINK_BOX_TEXT, zorder=6)

def draw_user_avatar(cx, cy):
    # Minimalist, clean non-enlarged avatar
    head = Circle((cx, cy + 1.2), 0.95, facecolor='none', edgecolor='#0F172A', linewidth=1.6, zorder=6)
    ax.add_patch(head)
    theta = np.linspace(0.12*np.pi, 0.88*np.pi, 100)
    rx = 2.0
    ry = 1.3
    sx = cx + rx * np.cos(theta)
    sy = (cy - 1.4) + ry * np.sin(theta)
    ax.plot(sx, sy, color='#0F172A', linewidth=1.6, zorder=6)

def draw_bot_avatar(cx, cy):
    # Minimalist AI Robot Icon
    head = FancyBboxPatch((cx - 1.0, cy - 0.2), 2.0, 2.0,
                          boxstyle="round,pad=0.0,rounding_size=0.4",
                          facecolor='none', edgecolor='#0F172A', lw=1.6, zorder=6)
    ax.add_patch(head)
    # Eyes
    ax.plot([cx - 0.4, cx + 0.4], [cy + 0.9, cy + 0.9], 'o', color='#0F172A', markersize=3, zorder=7)
    # Antenna
    ax.plot([cx, cx], [cy + 1.8, cy + 2.5], color='#0F172A', lw=1.4, zorder=6)
    ax.plot(cx, cy + 2.6, 'o', color='#0F172A', markersize=3, zorder=7)

def draw_straight_arrow(x1, y1, x2, y2, label=""):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->,head_width=0.3,head_length=0.4",
                                color="#64748B", lw=1.5),
                zorder=4)
    if label:
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2
        ax.text(mx, my + 1.0, label, ha='center', va='center',
                fontsize=7.2, fontweight='bold', color='#334155',
                bbox=dict(boxstyle="round,pad=0.15", fc="#FFFFFF", ec="#E2E8F0", lw=0.8),
                zorder=7)

# ==========================================
# 0. HEADER & TITLE (CLEAN, NO SIH, NO 2026)
# ==========================================
ax.text(50, 96.0, "P L A T F O R M   P R E V I E W", ha='center', va='center',
        fontsize=24, fontweight='bold', color='#0F172A')

# ==========================================
# 1. TOP-LEFT CARD: Quantum Instructor (Role: instructor)
# ==========================================
draw_card(2, 53, 46, 39)

# Yellow Features (Left Column)
draw_pill(4.0, 86.5, 20.5, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Classroom Management Console", 7.2)
draw_pill(4.0, 82.0, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Quantum Challenge Studio", 7.0)
draw_pill(14.7, 82.0, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Cohort Velocity Tracker", 7.0)
draw_pill(4.0, 77.5, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Circuit Templates & Rubrics", 6.8)
draw_pill(14.7, 77.5, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Automated Gradebook", 7.0)

# Blue Actions (Right 2 Columns)
draw_pill(26.0, 86.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Create & Assign Labs", 7.0)
draw_pill(36.7, 86.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Review Submissions", 7.0)
draw_pill(26.0, 82.0, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "AI Hint Customization", 6.8)
draw_pill(36.7, 82.0, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Track Student Errors", 6.8)
draw_pill(26.0, 77.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Course Module Publishing", 6.8)
draw_pill(36.7, 77.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Export Class Gradebooks", 6.8)

# Lower Area of Card 1: Avatar + Name + Action Badges
draw_user_avatar(6.0, 63.5)
ax.text(9.5, 64.5, "Quantum Instructor", fontsize=14.0, fontweight='bold', color='#0F172A', va='center')
ax.text(9.5, 61.5, "Role: instructor", fontsize=8.5, fontweight='bold', color='#64748B', va='center')

draw_action_badge(28.0, 65.2, 18.2, 3.8, GRAD_TEAL, "Lab & Curriculum Management", 7.4)
draw_action_badge(28.0, 59.8, 18.2, 3.8, GRAD_GREEN, "Real-Time Cohort Analytics", 7.6)


# ==========================================
# 2. TOP-RIGHT CARD: Quantum Learner (Role: student)
# ==========================================
draw_card(52, 53, 46, 39)

# Yellow Features (Left Column)
draw_pill(54.5, 86.5, 20.0, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Visual Drag-and-Drop Circuit Lab", 7.2)
draw_pill(54.5, 82.0, 20.0, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Bloch Sphere & Statevector Visuals", 7.0)
draw_pill(54.5, 77.5, 20.0, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Quantum Challenge Arena & Leaderboard", 6.8)

# Blue Actions (Right 2 Columns)
draw_pill(76.0, 86.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Build Multi-Qubit Circuits", 6.8)
draw_pill(86.7, 86.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Run Real-Time Simulations", 6.8)
draw_pill(76.0, 82.0, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Solve Quantum Puzzles", 7.0)
draw_pill(86.7, 82.0, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Earn Badges & Mastery", 7.0)
draw_pill(76.0, 77.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Algorithm Visualizers", 7.0)
draw_pill(86.7, 77.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Export to Qiskit / QASM", 6.8)

# Lower Area of Card 2: Avatar + Name + Action Badge
draw_user_avatar(56.0, 63.5)
ax.text(59.5, 64.5, "Quantum Learner", fontsize=14.0, fontweight='bold', color='#0F172A', va='center')
ax.text(59.5, 61.5, "Role: student", fontsize=8.5, fontweight='bold', color='#64748B', va='center')

draw_action_badge(77.5, 62.5, 18.8, 4.2, GRAD_BLUE, "Hands-On Quantum Learning", 7.8)
ax.text(86.9, 58.2, "Self-paced experimentation & mastery", fontsize=7.6, color='#475569', ha='center', va='center')


# ==========================================
# 3. BOTTOM-LEFT CARD: AI Quantum Tutor (Adaptive Engine)
# ==========================================
draw_card(2, 9, 46, 39)

# Yellow Features (Left 2 Columns)
draw_pill(4.0, 42.5, 20.5, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Gemini 1.5/2.0 Quantum Assistant", 7.2)
draw_pill(4.0, 38.0, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Cognitive Error Detection", 6.8)
draw_pill(14.7, 38.0, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Adaptive Difficulty Scaling", 6.8)
draw_pill(4.0, 33.5, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "QASM Syntax Explainer", 6.8)
draw_pill(14.7, 33.5, 9.8, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Misconception Diagnosis", 6.8)

# Blue Actions (Right 2 Columns)
draw_pill(26.0, 42.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Real-Time Circuit Analysis", 6.8)
draw_pill(36.7, 42.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Step-by-Step Progressive Hints", 6.6)
draw_pill(26.0, 38.0, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Quantum Theory Q&A", 7.0)
draw_pill(36.7, 38.0, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Algorithmic Walkthroughs", 6.8)
draw_pill(26.0, 33.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Bloch Rotation Guidance", 6.8)
draw_pill(36.7, 33.5, 9.8, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Contextual Lab Feedback", 6.8)

# Lower Area of Card 3: Bot Avatar + Title + Action Badge
draw_bot_avatar(6.0, 18.5)
ax.text(9.5, 19.5, "AI Quantum Tutor", fontsize=14.5, fontweight='bold', color='#0F172A', va='center')
ax.text(9.5, 16.5, "Gemini Cognitive Engine", fontsize=8.5, fontweight='bold', color='#7C3AED', va='center')

draw_action_badge(28.0, 16.5, 18.2, 4.4, GRAD_PURPLE, "Real-Time Adaptive Guidance", 7.8)


# ==========================================
# 4. BOTTOM-RIGHT CARD: System and Server (SAMBHAV Core Cloud)
# ==========================================
draw_card(52, 9, 46, 39)

# Left stacked pink boxes (Security & Quantum Verification)
draw_pink_box(54.0, 31.0, 12.5, 12.0, "Security & Auth Layer", "PBKDF2 • JWT • 6-Digit OTP")
draw_pink_box(54.0, 16.5, 12.5, 12.0, "Quantum Verification", "State Fidelity & Unitary Check")

# Center Tech Stack Logos (Small, Clean & Proportionate):
# 1. FastAPI Badge
box_api = FancyBboxPatch((69.0, 37.5), 4.2, 3.8,
                         boxstyle="round,pad=0.0,rounding_size=0.4",
                         facecolor="#DCFCE7", edgecolor="#22C55E", lw=1.3, zorder=5)
ax.add_patch(box_api)
ax.text(71.1, 39.4, "FastAPI", fontsize=8.0, fontweight='bold', color="#166534", ha='center', va='center', zorder=6)

# 2. React TS Badge
box_react = FancyBboxPatch((74.0, 37.5), 4.2, 3.8,
                          boxstyle="round,pad=0.0,rounding_size=0.4",
                          facecolor="#E0F2FE", edgecolor="#0284C7", lw=1.3, zorder=5)
ax.add_patch(box_react)
ax.text(76.1, 39.4, "React/TS", fontsize=7.5, fontweight='bold', color="#0369A1", ha='center', va='center', zorder=6)

# 3. PostgreSQL Badge
box_pg = FancyBboxPatch((79.0, 37.5), 3.8, 3.8,
                        boxstyle="round,pad=0.0,rounding_size=0.4",
                        facecolor="#DBEAFE", edgecolor="#2563EB", lw=1.3, zorder=5)
ax.add_patch(box_pg)
ax.text(80.9, 39.4, "SQL", fontsize=8.5, fontweight='bold', color="#1E40AF", ha='center', va='center', zorder=6)

# 4. Qiskit Badge
box_qiskit = FancyBboxPatch((83.5, 37.5), 4.0, 3.8,
                            boxstyle="round,pad=0.0,rounding_size=0.4",
                            facecolor="#F3E8FF", edgecolor="#9333EA", lw=1.3, zorder=5)
ax.add_patch(box_qiskit)
ax.text(85.5, 39.4, "Qiskit", fontsize=8.0, fontweight='bold', color="#6B21A8", ha='center', va='center', zorder=6)

# 5. Cloud Lambda
ax.text(91.0, 39.4, "λ", fontsize=16, fontweight='bold', color='#EA580C', ha='center', va='center', zorder=6)

# Center Stacked Colored Data Pills
draw_pill(68.5, 32.5, 12.5, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "User, Course & Progress Store", 6.2)
draw_pill(68.5, 27.5, 12.5, 3.2, PINK_BOX_BG, PINK_BOX_BORDER, "Simulation & Statevector Engine", 6.2)
draw_pill(68.5, 22.5, 12.5, 3.2, GREEN_PILL_BG, GREEN_PILL_BORDER, "AI Tutor & Hint Generator", 6.5)

# Right Stacked Grey Automation Pills
draw_pill(82.5, 32.5, 13.5, 3.2, GREY_PILL_BG, GREY_PILL_BORDER, "Automated Code Grading", 6.8)
draw_pill(82.5, 27.5, 13.5, 3.2, GREY_PILL_BG, GREY_PILL_BORDER, "Qiskit & OpenQASM Exporters", 6.5)
draw_pill(82.5, 22.5, 13.5, 3.2, GREY_PILL_BG, GREY_PILL_BORDER, "Async OTP & Email Dispatcher", 6.5)

# Bottom Label: System and Server
ax.text(75.0, 13.5, "System and Server (SAMBHAV Core Cloud)", fontsize=14.0, fontweight='bold', color='#0F172A', ha='center', va='center')


# ==========================================
# 5. STRAIGHT CONNECTING FLOW ARROWS
# ==========================================
# Horizontal straight arrow: Instructor -> Student (Assigns Labs & Courses)
draw_straight_arrow(48.0, 72.5, 52.0, 72.5)

# Vertical straight arrow: Learner -> System & Server (Executes Simulations & Circuits)
draw_straight_arrow(75.0, 53.0, 75.0, 48.0)

# Horizontal straight arrow: AI Tutor -> System & Server (Model Inference & State Evaluation)
draw_straight_arrow(48.0, 28.5, 52.0, 28.5)

# Vertical straight arrow: AI Tutor -> Learner (Direct Real-time Adaptive Hints)
draw_straight_arrow(25.0, 48.0, 25.0, 53.0)


# ==========================================
# 6. BOTTOM-LEFT LEGEND
# ==========================================
draw_pill(2.0, 2.0, 8.0, 3.2, PILL_YELLOW_BG, PILL_YELLOW_BORDER, "Features", 8.0, font_weight='bold')
draw_pill(11.0, 2.0, 8.0, 3.2, PILL_BLUE_BG, PILL_BLUE_BORDER, "Actions", 8.0, font_weight='bold')

# Save outputs to primary locations
out1 = r"c:\Users\Punith Venkat Sai\OneDrive\Desktop\SAMBHAV\platform_preview.jpg"
out2 = r"c:\Users\Punith Venkat Sai\OneDrive\Desktop\SAMBHAV\docs\platform_preview.jpg"
out3 = r"c:\Users\Punith Venkat Sai\OneDrive\Desktop\SAMBHAV\docs\platform_architecture_preview.jpg"

plt.savefig(out1, format='jpg', dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.savefig(out2, format='jpg', dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.savefig(out3, format='jpg', dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close()

print(f"Generated clean authentic SAMBHAV Platform Preview at: {out1}")
