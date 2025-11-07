# SAT-YUG: AI-Based Timetable Generation System
### (Samay Anukoolit Tantra for YUva Gaurav)

[![SIH 2025](https://img.shields.io/badge/SIH_2025-Problem_Statement_25091-blue.svg)](https://sih.gov.in/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/chanikkyasaai/satyug)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[span_0](start_span)[span_1](start_span)SAT-YUG** is an intelligent, proactive 3-Tier system designed to solve the complex, large-scale scheduling challenges introduced by India's **National Education Policy (NEP) 2020**[span_0](end_span)[span_1](end_span).

It moves beyond simple "timetable generation" to create a holistic, end-to-end management system that prevents conflicts before they happen, ensures optimal resource utilization, and provides a stress-free experience for students and administrators.

**[Watch the SAT-YUG Video Demo]**

---

## 🎯 The Problem: From a Puzzle to Chaos

[span_2](start_span)Before NEP 2020, timetabling was a predictable puzzle with limited variables[span_2](end_span).

[span_3](start_span)With the introduction of flexible, multidisciplinary credit structures (Majors, Minors, Skill-Based courses), the system has become a **chaotic problem with thousands of independent student choices**[span_3](end_span). [span_4](start_span)A traditional, reactive approach of solving this *after* registration is **guaranteed to fail**[span_4](end_span).

## [span_5](start_span)💡 Our Insight: "We didn't build a better solver; we architected a better system."[span_5](end_span)

Our solution is a **Three-Tier Proactive System** that manages and constrains the problem from the very beginning.

### 🏛️ The SAT-YUG 3-Tier Architecture

#### **[span_6](start_span)Tier 1: Strategic Planner (Pre-Semester)**[span_6](end_span)
*Before* registration opens, admins can plan, forecast, and pre-emptively solve resource crunches.
* **[span_7](start_span)[span_8](start_span)Predictive Demand Forecasting:** Uses **SARIMA & XGBoost** to analyze historical enrollment data and recommend adding or removing course sections[span_7](end_span)[span_8](end_span).
* **[span_9](start_span)"What-If" Scenario Engine:** Allows admins to simulate the impact of decisions (e.g., "What if Prof. X takes a sabbatical?")[span_9](end_span).
* **[span_10](start_span)[span_11](start_span)Proactive Load Balancing:** Build rich faculty profiles (expertise, preferences, workload caps) to distribute courses fairly *before* the semester begins[span_10](end_span)[span_11](end_span).

#### **[span_12](start_span)Tier 2: Guided Choice Portal (Live Registration)**[span_12](end_span)
*During* registration, the system guides students toward a valid, clash-free schedule.
* **[span_13](start_span)[span_14](start_span)Real-time Validation:** Powered by **Google OR-Tools (CP-SAT Solver)**, the system validates every single student choice against all constraints in milliseconds[span_13](end_span)[span_14](end_span).
* **[span_15](start_span)Intelligent Nudges:** If a student selects a clashing course, the system provides immediate, helpful alternatives (e.g., "The morning section clashes... an afternoon section is 85% full and fits your schedule.")[span_15](end_span).

#### **[span_16](start_span)Tier 3: Dynamic Optimizer (Live Semester)**[span_16](end_span)
*After* the semester begins, the system handles real-world chaos with grace.
* **Instant Optimization:** If a faculty member calls in sick, an admin flags them as "Unavailable."
* **[span_17](start_span)Ranked Solutions:** The system instantly generates a ranked list of the best-fit substitutes based on expertise, availability, and workload, allowing the admin to solve the problem in seconds[span_17](end_span).

### ✨ Key Features at a Glance

* **Frugal Innovation for Mass Scale:** Designed for real-world government colleges. It avoids complex legacy integration by using simple **Excel/CSV data intake**.
* **[span_18](start_span)Conversational AI Assistant:** An optional AI assistant (powered by **Gemini API**) allows students and admins to use natural language queries like, "Find me a 3-credit humanities course on a Friday"[span_18](end_span).
* **Proven, Scalable Stack:** A modern, high-performance tech stack built for reliability and scale.
* **End-to-End User Flow:** A complete application flow covering planning, registration, and live management.

---

## 🔧 Technology Stack & Architecture

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

### Main Architecture Diagram
![SAT-YUG Main Architecture](https://i.imgur.com/your-architecture-diagram-link.png)
*(**Note:** You should upload your architecture diagram to GitHub or an image host and paste the link here.)*

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


**Team {X}** - Smart India Hackathon 2025


