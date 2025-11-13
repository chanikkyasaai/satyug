# SAT-YUG: AI-Based Timetable Generation System
### (Samay Anukoolit Tantra for YUva Gaurav)

[![SIH 2025](https://img.shields.io/badge/SIH_2025-Problem_Statement_25091-blue.svg)](https://sih.gov.in/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/chanikkyasaai/satyug)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SAT-YUG** is an intelligent, proactive 3-Tier system designed to solve the complex, large-scale scheduling challenges introduced by India's **National Education Policy (NEP) 2020**.

It moves beyond simple "timetable generation" to create a holistic, end-to-end management system that prevents conflicts before they happen, ensures optimal resource utilization, and provides a stress-free experience for students and administrators.

**[Watch the SAT-YUG Video Demo]**

---

## 🎯 The Problem: From a Puzzle to Chaos

Before NEP 2020, timetabling was a predictable puzzle with limited variables.

With the introduction of flexible, multidisciplinary credit structures (Majors, Minors, Skill-Based courses), **and complex program requirements for ITEP/B.Ed. (like mandatory teaching practice and internships)**, the system has become a **chaotic problem with thousands of independent student choices**. A traditional, reactive approach of solving this *after* registration is **guaranteed to fail**.

## 💡 Our Insight: "We didn't build a better solver; we architected a better system."

Our solution is a **Three-Tier Proactive System** that manages and constrains the problem from the very beginning.

### 🏛️ The SAT-YUG 3-Tier Architecture

#### **Tier 1: Strategic Planner (Pre-Semester)**
*Before* registration opens, admins can plan, forecast, and pre-emptively solve resource crunches.
* **Predictive Demand Forecasting:** Uses **SARIMA & XGBoost** to analyze historical enrollment data and recommend adding or removing course sections.
* **"What-If" Scenario Engine:** Allows admins to simulate the impact of decisions (e.g., "What if Prof. X takes a sabbatical?").
* **Proactive Load Balancing:** Build rich faculty profiles (expertise, preferences, workload caps) to distribute courses fairly *before* the semester begins.
* **Manages Complex Program Constraints:** The planning engine is designed to model not just academic courses but also "block" constraints like multi-week 'Teaching Practice' or 'Internship' schedules. This ensures they are pre-allocated and faculty supervision is balanced *before* academic course selection begins.

#### **Tier 2: Guided Choice Portal (Live Registration)**
*During* registration, the system guides students toward a valid, clash-free schedule.
* **Real-time Validation:** Powered by **Google OR-Tools (CP-SAT Solver)**, the system validates every single student choice against all constraints in milliseconds.
* **Intelligent Nudges:** If a student selects a clashing course, the system provides immediate, helpful alternatives (e.g., "The morning section clashes... an afternoon section is 85% full and fits your schedule.").
* **Integrates Non-Academic Requirements:** The validation engine treats mandatory internships or practice schedules as a core part of a student's registration. It automatically blocks that time in a student's schedule, preventing them from registering for academic courses that would clash.

#### **Tier 3: Dynamic Optimizer (Live Semester)**
*After* the semester begins, the system handles real-world chaos with grace.
* **Instant Optimization:** If a faculty member calls in sick, an admin flags them as "Unavailable."
* **Ranked Solutions:** The system instantly generates a ranked list of the best-fit substitutes based on expertise, availability, and workload, allowing the admin to solve the problem in seconds.

### ✨ Key Features at a Glance

* **Frugal Innovation for Mass Scale:** Designed for real-world government colleges. It avoids complex legacy integration by using simple **Excel/CSV data intake**.
* **Built for Real-World Workflows:** Handles complex use cases like **B.Ed./M.Ed. teaching practice schedules** and **final-year internship blocks**, which are treated as high-priority constraints within the scheduling engine.
* **Conversational AI Assistant:** An optional AI assistant (powered by **Gemini API**) allows students and admins to use natural language queries like, "Find me a 3-credit humanities course on a Friday".
* **Exportable & Shareable:** Generates clean, optimized timetables in **PDF and Excel** formats for easy sharing and distribution to students and faculty.
* **Proven, Scalable Stack:** A modern, high-performance tech stack built for reliability and scale.
* **End-to-End User Flow:** A complete application flow covering planning, registration, and live management.

---

## 🔧 Technology Stack

Our system is built on a modern, decoupled, and scalable microservice-based architecture.

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL |
| **Core Optimization** | Google OR-Tools (CP-SAT) |
| **AI / Analytics** | XGBoost, SARIMA |
| **Task Queue** | Celery & Redis |
| **Deployment** | Docker |
| **Methodology** | Agile & CI/CD Principles |

---

## 🛣️ Roadmap & Phased Adoption

Our vision for SAT-YUG is a multi-phase platform designed for a real-world, nation-wide rollout.

* **Phase 1 (Current Prototype): Frugal Adoption**
    The current system uses a **frugal, file-based intake (Excel/CSV)**. This is a deliberate design choice to ensure that *any* government institution, regardless of its existing legacy software, can adopt our system immediately with zero integration overhead.

* **Phase 2: Full API-First Integration**
    The decoupled FastAPI backend is already built to support a full API-first model. This phase involves building robust connectors for direct integration with existing **Academic Management Systems (AMS)** and the **Academic Bank of Credits (ABC)** for seamless, real-time data synchronization.

* **Phase 3: Expanded AI Advisory**
    Evolve the "Conversational AI Assistant" from a simple query bot into a proactive academic advisor, helping students plan their entire 4-year degree path, not just a single semester.

---

## 🚀 Getting Started

You can run the entire SAT-YUG platform locally using Docker Compose (Recommended) or by setting up the services manually.

### Prerequisites
* Git
* Docker & Docker Compose (for the easy way)
* Python 3.10+ & Node.js 18+ (for the manual way)

### 1. Installation with Docker (Recommended)

This is the simplest way to get all services (backend, frontend, database, Redis) running.

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/chanikkyasaai/satyug.git](https://github.com/chanikkyasaai/satyug.git)
    cd satyug
    ```

2.  **Build and run the containers:**
    ```sh
    docker-compose up --build
    ```

3.  **Access the applications:**
    * **Frontend (React App):** `http://localhost:3000`
    * **Backend (FastAPI Docs):** `http://localhost:8000/docs`

### 2. Manual Installation

Follow these steps if you want to run each service individually.

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/chanikkyasaai/satyug.git](https://github.com/chanikkyasaai/satyug.git)
    cd satyug
    ```

2.  **Run the Backend (FastAPI):**
    ```sh
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
    *Note: This requires a running PostgreSQL database and Redis instance. You will need to create a `.env` file based on `.env.example`.*

3.  **Run the Frontend (React):**
    ```sh
    cd ../frontend  # From the root directory
    npm install
    npm start
    ```
    *The React app will open at `http://localhost:3000`.*

4.  **Run the Celery Worker:**
    ```sh
    cd backend  # From a new terminal
    source venv/bin/activate
    celery -A worker.celery_app worker --loglevel=info
    ```

---

## 📄 License

This project is distributed under the MIT License. See `LICENSE.txt` for more information.

## 👥 Our Team

**Team {X}** - Smart India Hackathon 2025
