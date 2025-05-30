export const id = 401;
export const ids = [401];
export const modules = {

/***/ 8401:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2186);
/* harmony import */ var _actions_github__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5438);
/* harmony import */ var _lib_asana_task_find_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7902);
/* harmony import */ var _lib_asana_task_completed_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(2798);
/* harmony import */ var _lib_asana_task_create_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(4255);
/* harmony import */ var _lib_asana_task_update_description_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(9448);
/* harmony import */ var _lib_util_issue_to_task_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(8688);
/* harmony import */ var _lib_asana_client_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(2190);
// @ts-check











/**
 * Sync all issues from the repository to Asana
 */
async function syncAllIssues() {
  try {
    // Get inputs from action
    const projectId = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('asana_project_id');
    const asanaPat = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('asana_pat');
    const repositoryFieldId = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('repository_field_id');
    const creatorFieldId = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('creator_field_id');
    const githubToken = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('github_token');
    const syncClosed = _actions_core__WEBPACK_IMPORTED_MODULE_0__.getInput('sync_closed_issues') === 'true';
    
    // Set environment variables
    process.env.ASANA_PAT = asanaPat;
    process.env.ASANA_PROJECT_ID = projectId;
    process.env.REPOSITORY_FIELD_ID = repositoryFieldId;
    process.env.CREATOR_FIELD_ID = creatorFieldId;
    process.env.GITHUB_TOKEN = githubToken;
    
    // Initialize Asana client after environment variables are set
    (0,_lib_asana_client_js__WEBPACK_IMPORTED_MODULE_7__/* .initializeAsanaClient */ .V0)();
    
    if (!projectId) {
      throw new Error("ASANA_PROJECT_ID is not set");
    }
    
    // Get GitHub context
    const { owner, repo } = _actions_github__WEBPACK_IMPORTED_MODULE_1__.context.repo;
    const octokit = _actions_github__WEBPACK_IMPORTED_MODULE_1__.getOctokit(githubToken);
    
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
          repository: _actions_github__WEBPACK_IMPORTED_MODULE_1__.context.payload.repository || {
            name: repo,
            owner: { login: owner }
          }
        };
        
        // Check if task already exists
        const existingTask = await (0,_lib_asana_task_find_js__WEBPACK_IMPORTED_MODULE_2__/* .findTaskContaining */ .l)(issue.html_url, projectId);
        
        if (!existingTask) {
          // Create new task
          console.log(`  Creating new task...`);
          const taskContent = await (0,_lib_util_issue_to_task_js__WEBPACK_IMPORTED_MODULE_6__/* .issueToTask */ .U)(payload);
          const creator = issue.user.login;
          await (0,_lib_asana_task_create_js__WEBPACK_IMPORTED_MODULE_4__/* .createTask */ .v)(taskContent, projectId, repo, creator);
          
          // If issue is closed, mark the task as complete
          if (issue.state === 'closed') {
            const newTask = await (0,_lib_asana_task_find_js__WEBPACK_IMPORTED_MODULE_2__/* .findTaskContaining */ .l)(issue.html_url, projectId);
            if (newTask) {
              await (0,_lib_asana_task_completed_js__WEBPACK_IMPORTED_MODULE_3__/* .markTaskComplete */ .T)(true, newTask.gid);
            }
          }
          
          created++;
          console.log(`  ✅ Created task for issue #${issue.number}`);
        } else {
          // Update existing task
          console.log(`  Updating existing task...`);
          const taskContent = await (0,_lib_util_issue_to_task_js__WEBPACK_IMPORTED_MODULE_6__/* .issueToTask */ .U)(payload);
          await (0,_lib_asana_task_update_description_js__WEBPACK_IMPORTED_MODULE_5__/* .updateTaskDescription */ .$)(existingTask.gid, taskContent);
          
          // Update completion status
          const shouldBeCompleted = issue.state === 'closed';
          if (existingTask.completed !== shouldBeCompleted) {
            await (0,_lib_asana_task_completed_js__WEBPACK_IMPORTED_MODULE_3__/* .markTaskComplete */ .T)(shouldBeCompleted, existingTask.gid);
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
      _actions_core__WEBPACK_IMPORTED_MODULE_0__.setFailed(`Sync completed with ${errors} errors`);
    }
    
  } catch (error) {
    _actions_core__WEBPACK_IMPORTED_MODULE_0__.setFailed(error.message);
  }
}

// Run the sync
syncAllIssues();

/***/ })

};
