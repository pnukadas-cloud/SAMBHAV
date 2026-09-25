SAMBHAV

AI-Powered Interactive Quantum Algorithm Learning Platform

Smart India Hackathon 2026 — Problem Statement 26140

SAMBHAV is an AI-powered interactive learning and experimentation platform designed to make quantum computing easier to understand through visual learning, interactive quantum circuits, simulation, algorithm exploration, challenges, and AI-guided assistance.

Instead of relying only on theory or requiring access to physical quantum hardware, SAMBHAV provides a browser-based environment where learners can build circuits, simulate quantum states, visualize results, explore algorithms, and receive contextual help from an AI Quantum Tutor.

🚀 Live Platform

🌐 SAMBHAV

https://sambhav-quantum-app.web.app/

The platform is publicly deployed and can be explored directly in a browser.

🎯 Problem Statement

SIH 2026 — PS 26140

AI-Based Interactive Quantum Algorithm Learning Platform

Quantum computing concepts such as qubits, superposition, entanglement, quantum gates, and algorithms are highly abstract and difficult to visualize.

Existing learning resources are often theory-heavy and provide limited opportunities for hands-on experimentation. Access to physical quantum hardware is also limited.

SAMBHAV addresses this by combining:

Structured quantum learning

Interactive circuit construction

Quantum simulation

State and measurement visualization

Algorithm experimentation

AI-powered tutoring

Challenges and quizzes

Progress tracking

Instructor-oriented learning tools

into a single browser-based platform.

✨ Key Features

📚 Interactive Learning

SAMBHAV provides structured learning content covering fundamental quantum concepts and quantum algorithms.

Learners can move from:

Quantum Foundations → Quantum Circuits → Entanglement → Quantum Algorithms

with interactive elements integrated into the learning experience.

⚛️ Quantum Circuit Builder

Build quantum circuits using an interactive visual circuit interface.

Supported operations include:

Hadamard H

Pauli-X X

Pauli-Y Y

Pauli-Z Z

Phase gates S, T

Rotation gates Rx, Ry, Rz

Controlled-X CX

Controlled-Z CZ

SWAP

The circuit representation is validated before simulation.

🧮 Quantum Simulation

SAMBHAV includes a custom statevector-based quantum simulation engine.

Current capabilities include:

Up to 8 qubits

Statevector simulation

Measurement probabilities

Deterministic shot simulation

Quantum gate execution

Single-qubit Bloch-vector visualization

Circuit validation

This allows learners to experiment with quantum circuits directly in the browser without requiring physical quantum hardware.

🔬 Quantum Visualization

Quantum states and circuit behaviour are presented visually to make abstract concepts easier to understand.

Visual learning includes:

Quantum circuit diagrams

Measurement probabilities

Statevector information

Bloch-sphere representation

Algorithm outputs

🧠 AI Quantum Tutor

SAMBHAV integrates Google Gemini as a server-side AI assistant.

The AI Tutor can help learners with:

Quantum concept explanations

Circuit explanations

Debugging assistance

Algorithm understanding

Learning questions

Challenge generation

AI requests are processed through the backend so that the Gemini API key is not exposed in the frontend.

🧪 Quantum Algorithms

SAMBHAV includes verified implementations and learning experiences for quantum algorithms including:

Bell State

GHZ State

Superdense Coding

Deutsch-Jozsa

Grover's Search

Quantum Phase Estimation

Quantum Teleportation

These algorithms can be explored through the platform's circuit and simulation environment.

🎯 Challenges & Quizzes

The platform provides interactive learning activities designed to encourage experimentation and practice.

Learners can:

Attempt quantum challenges

Test circuit concepts

Complete quizzes

Experiment with algorithms

Receive AI-assisted guidance

👨‍🏫 Instructor Platform

SAMBHAV also includes instructor-oriented functionality for managing and understanding learner activity.

Available instructor capabilities include:

Instructor dashboard

Learner directory

Curriculum management

Lesson builder

Assessment management

Lab assignment management

Cohort/class views

Analytics

AI educator assistance

Student preview

🔐 Authentication & Security

SAMBHAV implements role-based access control for different platform users.

Supported roles include:

Student

Instructor

The backend provides:

OTP-based authentication

JWT-based sessions

Role-based authorization

Server-side protected instructor routes

Password/key hashing mechanisms

Server-side Gemini API configuration

Sensitive API credentials are never intended to be exposed to the browser.

🏗️ System Architecture

                    ┌───────────────────────┐
                    │       SAMBHAV         │
                    │   React + TypeScript  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      FastAPI API      │
                    │       Python          │
                    └───────────┬───────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
     Quantum Engine        AI Tutor          Application Data
     Statevector           Gemini            SQLite
     Simulation            Service
             │
             ▼
     Circuit Validation
     + Visualization
     + Algorithm Execution

🛠️ Technology Stack

Frontend

React 19

TypeScript

Vite

KaTeX

Lucide React

Vanilla CSS

Backend

Python 3.12

FastAPI

Pydantic

Uvicorn

python-dotenv

Quantum Computing

Custom statevector simulation engine

Circuit Intermediate Representation (CircuitIR)

Quantum circuit validation

Qiskit code generation

AI

Google Gemini

Server-side AI service

AI explanations

Circuit explanations

Debugging assistance

Challenge generation

Database

SQLite

Authentication & Security

JWT

PBKDF2-HMAC-SHA256

HMAC-SHA256

OTP authentication

Role-based access control

Deployment

Firebase Hosting — Frontend

Vercel — Backend

GitHub — Source Control

📂 Project Structure

SAMBHAV/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.*
│
├── backend/
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── schema.sql
│
├── docs/
│   └── project documentation
│
├── start-dev.bat
├── start-dev.ps1
└── README.md

⚡ Quick Start

Prerequisites

Make sure you have:

Python 3.12+

Node.js

npm

Git

Option 1 — One-Click Development

Windows Command Prompt

start-dev.bat

Windows PowerShell

.\start-dev.ps1

Option 2 — Manual Setup

1. Clone the Repository

git clone https://github.com/pnukadas-cloud/SAMBHAV.git
cd SAMBHAV

2. Start the Backend

cd backend

python -m venv .venv

Windows

.venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start FastAPI:

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

Backend:

http://127.0.0.1:8000

3. Start the Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://127.0.0.1:5173

🔑 Environment Variables

Create the required environment configuration for the backend.

Example:

GEMINI_API_KEY=your_gemini_api_key

The Gemini API key should remain server-side and must never be committed to GitHub or exposed through frontend code.

📡 Core API Endpoints

Quantum Simulation

POST /api/simulations/run

AI Tutor

POST /api/ai/explain
POST /api/ai/explain-circuit
POST /api/ai/generate-challenge
POST /api/ai/debug-code

Courses

GET /api/courses
GET /api/courses/{id}

Challenges

GET /api/challenges
POST /api/challenges/evaluate

Circuits

POST /api/circuits/save
GET /api/circuits/my-circuits

Learner Progress

GET /api/progress/me
POST /api/progress/record

Instructor

GET /api/instructor/dashboard
GET /api/instructor/students

🧪 Testing

The backend contains automated tests covering areas including:

Quantum engine behaviour

Quantum algorithms

Circuit validation

Authentication

Database operations

Role-based access control

Run backend tests with:

pytest

🌐 Deployment

Frontend

Hosted using Firebase Hosting:

https://sambhav-quantum-app.web.app/

Backend

Hosted using Vercel:

https://sambhav-tawny.vercel.app/

The frontend communicates with the deployed FastAPI backend through HTTPS APIs.

⚠️ Current Prototype Limitations

SAMBHAV is an SIH prototype and focuses on software-based quantum learning and simulation.

Currently:

Quantum simulation is software-based.

Physical quantum hardware execution is not included.

SQLite is used for application data.

The production serverless environment should not be treated as a permanent production database.

Qiskit is used for code generation/export rather than as the primary simulation engine.

Additional quantum backends can be integrated in future versions.

🔮 Future Scope

Potential future extensions include:

Additional quantum algorithms

Advanced quantum error correction learning

Expanded quantum information modules

Additional quantum SDK/code exporters

Cloud quantum hardware integration

More advanced learner analytics

Larger-scale institutional deployment

Expanded quantum machine learning content

Persistent production-grade database infrastructure

🎓 Educational Focus

SAMBHAV is designed around a simple learning progression:

Understand
    ↓
Visualize
    ↓
Build
    ↓
Simulate
    ↓
Experiment
    ↓
Debug
    ↓
Master

The goal is to move learners from abstract quantum theory to practical experimentation through an interactive learning environment.

🏆 Smart India Hackathon 2026

Problem Statement: 26140

Title: AI-Based Interactive Quantum Algorithm Learning Platform

Category: Software

Theme: Smart Automation

Project: SAMBHAV

👥 Team

Team Name: Expectó Codüm

SAMBHAV is developed as a Smart India Hackathon 2026 solution focused on making quantum computing education more interactive, accessible and practical.

📄 License

This project is developed as an educational and hackathon prototype.

See the repository for applicable licensing and usage information.
