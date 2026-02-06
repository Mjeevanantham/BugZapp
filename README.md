# BugZapp QA Automation Platform

BugZapp is an AI-assisted QA automation platform that combines [Browserbase's Stagehand](https://stagehand.dev) with [Mastra](https://mastra.ai/) to discover bugs, capture evidence, store reports, and publish issues to GitHub or Jira. It includes a lightweight QA dashboard UI for browsing test runs, bug reports, and evidence artifacts.

## Overview

BugZapp enables AI agents to interact with web pages through the Mastra framework using Stagehand's browser automation capabilities. It provides tools for navigation, observation, extraction, and action execution, plus a QA assertion workflow that captures evidence on failures, stores bug reports, and optionally publishes them to external trackers.

## Features

- **Web Navigation**: Navigate to websites programmatically.
- **Element Observation**: Identify and locate elements on web pages.
- **Action Execution**: Perform actions like clicking buttons or filling forms.
- **Data Extraction**: Extract structured data from web pages.
- **QA Assertions**: Capture bug reports, evidence, and metadata when checks fail.
- **Evidence Capture**: Store screenshots, HTML snapshots, console logs, and network errors.
- **Bug Report Storage**: Save bug reports and test runs locally or in SQLite.
- **External Publishing**: Publish bug reports to GitHub Issues and/or Jira.
- **QA Dashboard**: Review runs, bug reports, evidence, and export reports.
- **Analytics (PostHog)**: Optional UI analytics for QA dashboard usage.

## Installation

### Prerequisites

- Node.js 22.13.0 or later
- pnpm
- Browserbase account
- AI model provider credentials (OpenAI, Anthropic, etc.)

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/mastra-ai/template-browsing-agent.git
   cd template-browsing-agent
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Create a `.env` file with your API keys:
   ```
   BROWSERBASE_PROJECT_ID=your_project_id
   BROWSERBASE_API_KEY=your_api_key
   OPENAI_API_KEY=your_openai_key
   MODEL=openai/gpt-4o

   # QA Storage
   QA_STORAGE_TYPE=json # or sqlite
   QA_STORAGE_DIR=./qa-storage
   QA_STORAGE_SQLITE_PATH=./qa-storage/qa.sqlite

   # GitHub Issue Publishing
   QA_GITHUB_TOKEN=your_github_token
   QA_GITHUB_REPO=your_org/your_repo
   QA_GITHUB_API_URL=https://api.github.com

   # Jira Issue Publishing
   QA_JIRA_BASE_URL=https://your-domain.atlassian.net
   QA_JIRA_EMAIL=you@example.com
   QA_JIRA_API_TOKEN=your_jira_token
   QA_JIRA_PROJECT_KEY=PROJ
   QA_JIRA_ISSUE_TYPE=Bug

   # PostHog (optional UI analytics)
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

## Model Configuration

This template supports any AI model provider through Mastra's model router. You can use models from:

- **OpenAI**: `openai/gpt-4o-mini`, `openai/gpt-4o`
- **Anthropic**: `anthropic/claude-sonnet-4-5-20250929`, `anthropic/claude-haiku-4-5-20250929`
- **Google**: `google/gemini-2.5-pro`, `google/gemini-2.0-flash-exp`
- **Groq**: `groq/llama-3.3-70b-versatile`, `groq/llama-3.1-8b-instant`
- **Cerebras**: `cerebras/llama-3.3-70b`
- **Mistral**: `mistral/mistral-medium-2508`

Set the `MODEL` environment variable in your `.env` file to your preferred model.

## Usage

### Running the development server

```
pnpm run dev
```

This starts the Mastra development server and the QA dashboard UI (served from `src/ui`).

### Running the QA dashboard

The UI server lives at `src/ui/server.ts`. If you run it separately, make sure the same `.env` values are available so the UI can access PostHog and QA storage. The UI server reads:

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

You can run the server with any TypeScript runner (for example, `tsx`), or integrate it into your deployment pipeline.

## Architecture

### Core Components

1. **Stagehand Session Manager**
   - Handles browser session initialization and management
   - Implements automatic session timeouts
   - Provides error recovery and reconnection logic

2. **Mastra Tools**
   - `pageActTool`: Performs actions on web pages.
   - `pageObserveTool`: Identifies elements on web pages.
   - `pageExtractTool`: Extracts structured data from web pages.
   - `pageNavigateTool`: Navigates to URLs.
   - `qaAssertTool`: Runs assertions and captures bug reports + evidence on failure.
   - `qaPublishIssueTool`: Publishes stored bug reports to GitHub/Jira.

3. **QA Storage Layer**
   - `LocalJsonQaStorage`: Writes bug reports and test runs to JSON files.
   - `SqliteQaStorage`: Persists runs and bug reports in SQLite.

4. **QA Dashboard UI**
   - Lists test runs and bug reports.
   - Shows evidence artifacts, logs, and export options.
   - Enables publishing bug reports to external trackers.

5. **Issue Publishing Integrations**
   - GitHub Issues API and Jira REST API integration for bug reports.
   - Links external issue metadata back into stored bug reports.

### Flow Diagram

```
User Query → Mastra Agent → Stagehand Tools → Browser Interaction → Evidence Capture → QA Storage
     ↘ (optional) Issue Publishing → GitHub/Jira
     ↘ QA Dashboard → Review & Export
```

## How it Works (End-to-End Flow)

1. **Agent session starts** using Stagehand and a configured model provider.
2. **Agent navigates and interacts** with a target site using page tools.
3. **Assertions run** via `qaAssertTool`; failures trigger evidence capture.
4. **Bug report is stored** in QA storage (JSON or SQLite).
5. **Optional publishing** pushes the report to GitHub/Jira and stores external links.
6. **QA dashboard** displays runs, bug reports, evidence, and export options.

## Tech Stack

- **TypeScript / Node.js** for backend and tooling.
- **Mastra** for agent orchestration and tool execution.
- **Stagehand (Browserbase)** for browser automation.
- **Zod** for schema validation.
- **SQLite** (optional) for QA storage.
- **Vanilla JS + HTML/CSS** for the QA dashboard UI.

## Third-Party Services

- **Browserbase Stagehand**: Automated browser sessions.
- **Mastra**: Agent framework.
- **OpenAI / Anthropic / Google / Groq / Cerebras / Mistral**: Optional LLM providers via Mastra model routing.
- **GitHub Issues**: Bug report publishing.
- **Jira**: Bug report publishing.
- **PostHog**: Optional analytics for UI usage.

## Configuration

The project can be configured through the `.env` file and by modifying the agent instructions in `src/mastra/agents/qa-agent.ts`.

## Credits

This project is built with:

- [Mastra](https://mastra.ai) - AI Agent framework
- [Stagehand by Browserbase](https:/stagehand.dev) - Browser automation
- [OpenAI](https://openai.com/) - AI models
- [PostHog](https://posthog.com/) - Analytics
