// @ts-check

import * as core from "@actions/core";
import * as github from "@actions/github";

import { findTaskContaining } from "./lib/asana-task-find.js";
import { markTaskComplete } from "./lib/asana-task-completed.js";
import { createTask } from "./lib/asana-task-create.js";
import { updateTaskDescription } from "./lib/asana-task-update-description.js";
import { issueToTask } from "./lib/util/issue-to-task.js";
import { initializeAsanaClient } from "./lib/asana-client.js";

/**
 * Sync all issues from the repository to Asana
 */
async function syncAllIssues() {
  try {
    // Get inputs from action
    const projectId = core.getInput('asana_project_id');
    const asanaPat = core.getInput('asana_pat');
    const repositoryFieldId = core.getInput('repository_field_id');
    const creatorFieldId = core.getInput('creator_field_id');
    const githubToken = core.getInput('github_token');
    const syncClosed = core.getInput('sync_closed_issues') === 'true';
    
    // Set environment variables
    process.env.ASANA_PAT = asanaPat;
    process.env.ASANA_PROJECT_ID = projectId;
    process.env.REPOSITORY_FIELD_ID = repositoryFieldId;
    process.env.CREATOR_FIELD_ID = creatorFieldId;
    process.env.GITHUB_TOKEN = githubToken;
    
    // Initialize Asana client after environment variables are set
    initializeAsanaClient();
    
    if (!projectId) {
      throw new Error("ASANA_PROJECT_ID is not set");
    }
    
    // Get GitHub context
    const { owner, repo } = github.context.repo;
    const octokit = github.getOctokit(githubToken);
    
    // Get all issues
    console.log(`Fetching ${syncClosed ? 'all' : 'open'} issues from ${owner}/${repo}...`);
    const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner,
      repo,
      state: syncClosed ? 'all' : 'open',
      per_page: 100
    });
    
    // Filter out pull requests
    const realIssues = issues.filter(issue => !issue.pull_request);
    console.log(`Found ${realIssues.length} issues to sync`);
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    // Process each issue
    for (const issue of realIssues) {
      try {
        console.log(`\nProcessing issue #${issue.number}: ${issue.title}`);
        
        // Build the payload similar to webhook
        const payload = {
          action: issue.state === 'closed' ? 'closed' : 'opened',
          issue: issue,
          repository: github.context.payload.repository || {
            name: repo,
            owner: { login: owner }
          }
        };
        
        // Check if task already exists
        const existingTask = await findTaskContaining(issue.html_url, projectId);
        
        if (!existingTask) {
          // Create new task
          console.log(`  Creating new task...`);
          const taskContent = await issueToTask(payload);
          const creator = issue.user.login;
          await createTask(taskContent, projectId, repo, creator);
          
          // If issue is closed, mark the task as complete
          if (issue.state === 'closed') {
            const newTask = await findTaskContaining(issue.html_url, projectId);
            if (newTask) {
              await markTaskComplete(true, newTask.gid);
            }
          }
          
          created++;
          console.log(`  ✅ Created task for issue #${issue.number}`);
        } else {
          // Update existing task
          console.log(`  Updating existing task...`);
          const taskContent = await issueToTask(payload);
          await updateTaskDescription(existingTask.gid, taskContent);
          
          // Update completion status
          const shouldBeCompleted = issue.state === 'closed';
          if (existingTask.completed !== shouldBeCompleted) {
            await markTaskComplete(shouldBeCompleted, existingTask.gid);
          }
          
          updated++;
          console.log(`  ✅ Updated task for issue #${issue.number}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing issue #${issue.number}:`, error.message);
        errors++;
      }
    }
    
    // Summary
    console.log('\n=== Sync Summary ===');
    console.log(`Total issues processed: ${realIssues.length}`);
    console.log(`Tasks created: ${created}`);
    console.log(`Tasks updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    
    if (errors > 0) {
      core.setFailed(`Sync completed with ${errors} errors`);
    }
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Run the sync
syncAllIssues();