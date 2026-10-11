# ExamForge AI — Automated Question Paper Generation System with Bloom's Taxonomy Mapping for CBSE/State Boards

An end-to-end Machine Learning educational platform that automates cognitive test generation aligned with Bloom’s Revised Taxonomy and difficulty balancing for CBSE and State Board curricula.

---

## 📌 Features & Architectural Highlights

1. **Dual Machine Learning Pipelines**:
   - **Model A (Bloom's Taxonomy Classifier)**: 6-Class text classification (`Remember`, `Understand`, `Apply`, `Analyze`, `Evaluate`, `Create`) using TF-IDF sublinear vectorization and multiclass Logistic Regression.
   - **Model B (Difficulty Classifier)**: 3-Tier classification (`Easy`, `Medium`, `Hard`) evaluating question linguistic and cognitive complexity.
2. **Deterministic Constraint-Based Selection**:
   - Precise filtering across subjects, topics, question types, and target Bloom/difficulty distributions.
   - Exact question count and total marks sum validation.
3. **Automated PDF Compilation**:
   - ReportLab generation engine producing board-compliant printable examination papers with instructions and mark allocations.
4. **Interactive SaaS Dashboard (8 Pages)**:
   - **Overview Dashboard**: High-level system statistics, workflow architecture, and live models status.
   - **Generate Question Paper**: Interactive configuration form with sliders for target Bloom and difficulty distributions.
   - **Paper Preview**: A4-styled preview with direct PDF download.
   - **Question Bank**: Searchable, paginated repository with Bloom/difficulty filters and modal to add teacher-verified questions.
   - **AI Classification**: Real-time NLP inference tool for arbitrary question text with class probability distribution.
   - **Model Performance**: Full evaluation suite showing accuracy, precision, recall, macro F1, and per-class metrics.
   - **Generation History**: Persisted database archive of all previous question papers.
   - **Settings & System**: Real-time service connectivity and health monitor.

---

## 🗄️ Dataset Source & License

- **Source Dataset**: `Uzaib52/edubloom-question-bank` (Hugging Face)
- **License**: MIT License
- **Total Questions Cleaned & Normalized**: 73,712 questions across 11 disciplines (Physics, Chemistry, Mathematics, Computer Science, Biology, Economics, History, Accounting, Psychology, Geography, Artificial Intelligence).

---

## 🚀 Getting Started & Execution

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup & Startup
```bash
cd backend
pip install -r requirements.txt

# Run dataset download & ETL (generates backend/data/questions_dataset.csv)
python data/download_dataset.py

# Train both ML pipelines & generate evaluation reports
python ml/train_models.py

# Start Flask REST API server (runs on http://localhost:5000)
python app.py
```

### 3. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
# Accessible at http://localhost:5173
```

### 4. Running Verification Test Suite
```bash
cd backend
python -m unittest tests/test_system.py -v
```

---

## 🔐 Authentication & Demonstration Credentials

ExamForge AI includes a centered login portal inspired by modern academic portals with JWT token verification and PBKDF2 password hashing.

### Demo Account (Auto-provisioned on startup)
- **Email**: `teacher@examforge.ai`
- **Password**: `ExamForge@2026`

*(The login screen also features a 1-click **"Fill Demo Credentials"** assistant button for convenience during college presentations).*

### Protected Endpoints & Route Access
- `/login` — Public authentication portal
- `/dashboard` — Protected overview and assessment analytics
- `/generate-paper` — Protected paper blueprint configurator
- `/question-bank` — Protected question repository
- `/classification` — Protected real-time ML inference
- `/model-performance` — Protected Scikit-Learn evaluation metrics
- `/history` — Protected exam archive and PDF downloads

---

## 📊 Evaluation Summary

- **Bloom's Classifier**: Tested on 14,743 held-out test questions. Accuracy: ~39.1%, Macro F1: ~35.4% (natural lexical overlap between subtle cognitive categories documented in `backend/reports/bloom_evaluation.json`).
- **Difficulty Classifier**: Tested on 14,743 held-out test questions. Accuracy: 100.0%, Macro F1: 100.0%.
- Both model pipelines saved in `backend/models/*.joblib`.
