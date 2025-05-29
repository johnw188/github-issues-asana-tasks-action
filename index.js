// @ts-check

import * as core from "@actions/core";
import * as github from "@actions/github";

import { findTaskContaining } from "./lib/asana-task-find.js";
import { markTaskComplete } from "./lib/asana-task-completed.js";
import { createTask } from "./lib/asana-task-create.js";
import { updateTask } from "./lib/asana-task-add-story.js";
import { updateTaskDescription } from "./lib/asana-task-update-description.js";

import { issueToTask } from "./lib/util/issue-to-task.js";

/**
 * Building from the docs here:
 * @link https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action
 */
try {
  const { eventName, payload } = github.context;
  const { action } = payload;

  // Get inputs from action
  const projectId = core.getInput('asana_project_id');
  process.env.ASANA_PAT = core.getInput('asana_pat');
  process.env.ASANA_PROJECT_ID = projectId;
  process.env.ASANA_CUSTOM_FIELD_ID = core.getInput('asana_custom_field_id');
  process.env.GITHUB_TOKEN = core.getInput('github_token');
  
  const issueSearchString = payload.issue?.html_url;

  console.log({ projectId, eventName, action });

  if (!projectId) {
    throw new Error("ASANA_PROJECT_ID environment variable is not set");
  }
  
  if (!issueSearchString) {
    throw new Error("Unable to find GitHub issue URL");
  }
  // NOTE: Actions must be validated to prevent running in the wrong context if the action is
  //       specified to run on all types or un-handled types.

  let result;

  if (eventName === "issues") {
    if (action === "opened") {
      const taskContent = await issueToTask(payload);
      const repository = payload.repository.name;
      result = await createTask(taskContent, projectId, repository);
    } else if (action === "edited") {
      // Update the existing task when issue is edited
      const theTask = await findTaskContaining(issueSearchString, projectId);
      const taskContent = await issueToTask(payload);
      result = await updateTaskDescription(theTask.gid, taskContent);
    } else if (action === "closed" || action === "reopened") {
      // mark action completed = true, or incomplete = false)

      const theTask = await findTaskContaining(issueSearchString, projectId);
      const completed = !!(action === "closed");
      result = await markTaskComplete(completed, theTask.gid);
    }
  } else if (eventName === "issue_comment" && action === "created") {
    const theTask = await findTaskContaining(issueSearchString, projectId);
    // Update task description to include the new comment
    const taskContent = await issueToTask(payload);
    result = await updateTaskDescription(theTask.gid, taskContent);
  }

  console.log({ eventName, action, result });

  if (result.errors) {
    core.setFailed(JSON.stringify(result, null, 2));
  }
} catch (error) {
  core.setFailed(error.message);
}
