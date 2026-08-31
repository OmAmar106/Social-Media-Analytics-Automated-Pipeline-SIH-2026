# Social Media Analytics

A social intelligence dashboard and research platform for monitoring online conversations, trend velocity, sentiment shifts, platform performance, and audience behavior across major social channels.

This repository combines a modern frontend analytics workspace with an experimental backend for data processing, scraping, and sentiment analysis. The current implementation contains a polished dashboard experience with mock analytics data and a Python backend scaffold that is ready for real ingestion and model integration.

SIH 2026, PS ID: 26152 

## Overview

The project is designed to help analysts, marketers, and researchers:

- Track trending topics and viral keywords across multiple platforms
- Monitor overall sentiment levels and sentiment drift over time
- Compare platform performance and reach
- Explore audience and demographic patterns
- Review propagation and cascade behavior of emerging trends
- Query social content and run high-level intelligence workflows
- Use a chatbot-style AI interface to investigate signals in the corpus

The application is built around the concept of a unified command center: one workspace to view social conversations, detect emerging topics, and understand how narratives spread.

## Screenshot

<img width="1854" height="932" alt="image" src="https://github.com/user-attachments/assets/72bc8d21-d379-45ea-9642-68f8040df9b7" />

<img width="1854" height="932" alt="image" src="https://github.com/user-attachments/assets/3e62350c-49b7-44d5-a1a7-fdb0e286d451" />

<img width="1854" height="932" alt="image" src="https://github.com/user-attachments/assets/b917c0e5-b4a3-4668-88d5-3dd90c1cd31b" />

<img width="1854" height="932" alt="image" src="https://github.com/user-attachments/assets/424c479f-653b-464b-b1b5-2be62fb1a1fc" />

<img width="1854" height="932" alt="image" src="https://github.com/user-attachments/assets/8610e07c-6130-4ea0-9090-6d4d217020d7" />

## Demo

### Frontend

The frontend is a React + TypeScript app using Vite and a modern design system. It includes:

- Command center dashboard with KPI cards and trend rankings
- Sentiment analysis pages by platform and trend
- Audience and demographic views
- Viral keyword insights
- Platform comparison screens
- Trend propagation graphs and content explorer
- AI-style assistant/chat interface
- Sidebar navigation and analyst-focused layout

### Backend

The backend is implemented in Python with Flask and contains a health API plus a foundation for future scraping and ML pipeline work. The repository also includes a sentiment-analysis package with components for:

- preprocessing
- model loading
- training logic
- inference orchestration
- configuration helpers

This area suggests the project is intended to evolve into a more complete data pipeline that ingests social data, runs NLP models, and serves analytics to the frontend.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- Radix UI primitives
- Recharts for data visualizations
- Lucide icons

### Backend

- Python 3
- Flask
- PyTorch
- Transformers
- Pandas / NumPy
- Hugging Face ecosystem

## Key Features

### 1. Social command center

The homepage provides a high-level overview with:

- document volume trends
- net sentiment status
- platform volume comparisons
- active trend rankings
- KPI cards summarizing social health and activity

### 2. Trend intelligence

Trend views highlight:

- growing topics
- engagement and velocity metrics
- platform spread
- sentiment direction
- status classification such as surging, rising, steady, or declining

### 3. Sentiment analysis

The app includes sentiment views across:

- platform-level sentiment snapshots
- trend-level sentiment breakdowns
- positive, neutral, and negative compositions

### 4. Propagation analysis

Propagation screens model how interest spreads across the network by visualizing:

- trend lifecycle behavior
- propagation paths
- audience signals
- cross-platform movement

### 5. Audience and content exploration

Users can investigate:

- demographic signals
- creator activity
- virality indicators
- filtered content records
- raw corpus exploration workflows

### 6. Chatbot-style analyst assistant

A route exists for AI-like question answering over trend and sentiment data, suggesting a future research assistant layer built on the corpus or model outputs.

## Data and Modeling Notes

The repository includes sample social data in the Twitter folder, including:

- `Tweets.csv`
- `Tw_age_gender.csv`
- `twitter_training.csv`
- `twitter_validation.csv`

These look like training and evaluation resources that can support model development, sentiment labeling, or demographic analysis. The current frontend consumes mock dataset objects rather than live API responses, which keeps the UI fully working without a live backend.

## How the System Works Today

At a high level, the project currently has two major layers:

1. Frontend analytics layer
   - interactive dashboard
   - charts and KPIs
   - route-based views
   - data fetching from local mock modules and app state

2. Backend ML/data layer
   - Flask API foundation
   - model training and inference support
   - preprocess and model configuration modules
   - room for future scraping and live dataset ingestion

This means the repository is best thought of as a social intelligence platform prototype / starter implementation, not solely a finished production system.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A terminal with bash or PowerShell

### 1. Install frontend dependencies

From the project root:

```bash
cd frontend
npm install
```

### 2. Run the frontend

```bash
cd frontend
npm run dev
```

The frontend will start in development mode using Vite. Open the local URL shown in the terminal.

### 3. Install backend dependencies

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# or .venv\Scripts\activate  # Windows PowerShell
pip install -r requirements.txt
```

### 4. Run the backend

```bash
cd backend
python main.py
```

The project also includes a shell script for convenience:

```bash
./backend/start_backend.sh
./frontend/start_frontend.sh
```

## Frontend Route Overview

The frontend currently includes route groups for:

- `/` – command center / overview dashboard
- `/trends` – detected trend list
- `/trends/$trendId` – detailed trend profile
- `/sentiment` – sentiment views
- `/platforms` – platform performance comparison
- `/keywords` – viral keyword insights
- `/audience` – demographic analysis
- `/propagation` – trend propagation and network flow
- `/content` – content exploration and filtering
- `/chatbot` – AI/chat-style analyst interaction
- `/explorer` – corpus/record search utilities

## Environment and Workflow Notes

- The frontend is structured to be data-driven and can be connected to a real API layer
- The backend is currently a minimal scaffold but includes ML-ready components
- The frontend is mostly working with static mock datasets, which makes local UI development fast and easy
- The repo is a strong base for future connection between scraping, NLP inference, and dashboard visualization

## Development Guidance

### Frontend development


```bash
cd frontend
npm install
npm run dev
```

### Backend development


```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Use the model modules in `backend/sentiment_analysis/` as the base for implementing text preprocessing, training jobs, and inference.

## Notes

This project is best understood as a prototype and research-oriented analytics platform. It already has a polished UI and a solid structure for future backend expansion, but the live data pipeline and production API integration are still in progress.
