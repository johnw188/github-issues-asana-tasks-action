# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a GitHub Action that creates and manages Asana Tasks from GitHub Issues. The action listens for issue events (created, edited, closed, reopened) and issue comments, then synchronizes these with Asana Tasks in a single configured project. Tasks include the full conversation history and are tagged with the repository name via a custom field.

## Commands

### Build
```bash
npm run build
```
Builds the action using `@vercel/ncc` into the `dist/` directory.

### Test
```bash
npm test
```
Runs the test suite using Vitest with coverage reporting.

### Version Management
```bash
npm version [patch|minor|major]
```
Updates version in package.json, README.md, and dist/package.json, generates changelog, and commits changes.

## Architecture

### Core Workflow
1. **Event Handling** (`index.js`): Main entry point that handles GitHub webhook events
   - Issues opened → Creates Asana task with full conversation
   - Issues edited → Updates task description with latest conversation
   - Issues closed/reopened → Updates task completion status
   - Issue comments → Updates task description with full conversation

2. **Asana Integration** (`lib/`):
   - `asana-task-create.js`: Creates new tasks from issues with custom field support
   - `asana-task-find.js`: Finds existing tasks by GitHub issue URL
   - `asana-task-completed.js`: Updates task completion status
   - `asana-task-add-story.js`: Adds comments/stories to tasks
   - `asana-task-update-description.js`: Updates task description

3. **Utilities** (`lib/util/`):
   - `issue-to-task.js`: Converts GitHub issue data (with comments) to Asana task format
   - `comment-to-story.js`: Converts GitHub comments to Asana stories
   - `markdown-to-asana-html.js`: Converts GitHub markdown to Asana-compatible HTML
   - `custom-field-helper.js`: Manages custom field options for repository names
   - `find-asana-urls.js`: Finds Asana URLs in text
   - `format-api-error.js`: Formats API errors for logging

### Key Integration Points
- **Authentication**: Uses Asana Personal Access Token (PAT) from action input
- **Project Configuration**: Single Asana project ID configured via action input
- **Repository Tagging**: Optional custom field for repository names (auto-creates options)
- **Task Identification**: Tasks are linked via GitHub issue permalink stored in task notes
- **Full Conversation**: Task descriptions include complete issue history with all comments

### Testing
- Test files in `test/` directory mirror the lib structure
- Fixtures in `test/fixtures/` provide sample GitHub webhook payloads
- Coverage reporting enabled with lcov, clover, json, and text reporters