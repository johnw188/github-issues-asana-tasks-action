# GitHub Issues To Asana Tasks

#### Version 0.0.24

This integration creates Asana Tasks from GitHub issues in a single designated Asana project. Once linked, Asana tasks will be updated when Issues are edited or commented upon. The linked Asana Task will be completed when the GitHub issue is closed.

## Key Features

- Creates tasks in a single Asana project for all GitHub issues
- Includes the entire issue conversation (description + comments) in the task description
- Sets a custom field with the repository name (automatically creates new options as needed)
- Sets a custom field with the issue creator's GitHub username
- Updates task description when issues are edited or new comments are added
- Marks tasks complete/incomplete when issues are closed/reopened

## Issues as Tasks

Tasks are a better mirror of Issues than Pull Requests. Issues are created because something needs doing, eg. _there is a task to be done._ Pull Requests are often created specifically to resolve an issue, eg. _to complete a task._

|                           | Task           | Issue         | Pull Request          |
| ------------------------- | -------------- | ------------- | --------------------- |
| **Feature/Bug Described** | Task Created   | Issue Created | -                     |
| **Creative/Research**     | Task Updated   | Issue Updated | -                     |
| **Work Started**          | Task Updated   | Issue Updated | Pull Request Created  |
| **Work Completed**        | Task Completed | Issue Closed  | Pull Request Accepted |

### Other wins

Because development happens on GitHub, having Issues attached to the code greatly reduces developer friction and prevents flow-breaking context shifts. Issues are attached to the code, and can be updated and resolved as part of the normal Git workflow. Issue creation is significantly more robust and faster using GitHub on Mobile, so QA can happen anywhere on a single device -- activating Mobile-friendly in-between spaces like subway commutes and other downtime.

## Example Action

To use this action, add a workflow like this to your repo:

```yaml
name: GitHub Issues to Asana Tasks

on:
  issues:
    types: [opened, edited, closed, reopened]
  issue_comment:
    types: [created]

jobs:
  issues-to-tasks:
    runs-on: ubuntu-latest

    steps:
      - name: GitHub Issues To Asana Tasks
        uses: ideasonpurpose/github-issues-asana-tasks-action@v0.0.24
        with:
          asana_pat: ${{ secrets.ASANA_PAT }}
          asana_project_id: '1234567890123456'  # Your Asana project ID
          repository_field_id: '1234567890123456'  # Optional: Custom field for repository name
          creator_field_id: '1234567890123456'  # Optional: Custom field for issue creator
```

## How it works

After adding the GitHub Action to a repository, you need to:

1. Store an [Asana Personal Access Token](https://developers.asana.com/docs/personal-access-token) as a **GitHub Secret** named **`ASANA_PAT`**
2. Configure the action with your Asana project ID
3. Optionally, create a single-select custom field in your Asana project for repository names and provide its ID
4. Optionally, create a text custom field in your Asana project for issue creators and provide its ID

- **On Issue Creation**<br>
  Creates a new Task in the configured Asana project. The task description includes the issue details, author information, and a link back to the GitHub issue.

- **On Issue Edit or Comment**<br>
  Updates the existing Asana task with the full conversation history, including all comments. This ensures the Asana task always reflects the complete GitHub discussion.

- **On Issue Closed/Re-opened**<br>
  Updates the Asana task's `completed` status to match the GitHub issue state. 

### About Personal Access Tokens

API operations authenticated with Personal Access Tokens will assume the identity of the user who created the token. We recommend creating a bot account in your Asana workspace. Log in as the bot user and follow [Asana's documentation for creating a Personal Access Token](https://developers.asana.com/docs/personal-access-token).
