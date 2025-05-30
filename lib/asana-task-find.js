// @ts-check

/**
 * This scans tasks in a project looking for a task with a description
 * containing a specific url (the Issue url).
 */

import { getTasksApi, getProjectsApi } from "./asana-client.js";
import { findTaskByGithubUrl } from "./asana-task-find-by-url.js";

/**
 * Search Project tasks for a note containing a given string
 * @param {string} needle string to search for in Task notes
 * @param {string} projectId numeric string gid of the project to search in
 */
export async function findTaskContaining(needle, projectId) {
  // If custom field search is available, use it exclusively
  const githubUrlFieldId = process.env.GITHUB_URL_FIELD_ID;
  if (githubUrlFieldId) {
    try {
      // We need the workspace ID for the search API
      // Get it from the project
      const projectsApiInstance = getProjectsApi();
      const projectOpts = { opt_fields: "workspace" };
      const project = await projectsApiInstance.getProject(projectId, projectOpts);
      const workspaceId = project.workspace.gid;
      
      // Search by custom field
      const taskByUrl = await findTaskByGithubUrl(needle, workspaceId);
      console.log(taskByUrl ? "Found task using custom field search" : "No task found with GitHub URL");
      return taskByUrl;
    } catch (error) {
      console.error("Custom field search error:", error.message);
      return null;
    }
  }
  
  // Only use full scan if no custom field is configured
  console.log("No GitHub URL field configured, using full project scan");
  const tasksApiInstance = getTasksApi();
  
  let taskRequests = 1;
  let tasksSearched = 0;
  let foundTask = false;

  const opts = {
    // completed_since: "2012-02-22T02:06:58.158Z",
    limit: 10,
    opt_fields: "name,created_at,modified_at,notes,html_notes,permalink_url",
  };
  try {
    let query = await tasksApiInstance.getTasksForProject(projectId, opts);
    let tasks = query.data;

    while (!foundTask) {
      for (let n = 0; n < tasks.length; n++) {
        // Look for the specific pattern "GitHub:</strong> <a href="[needle]"
        // This ensures we only match the header link, not comment links
        const pattern = `GitHub:</strong> <a href="${needle}"`;
        const search = tasks[n].html_notes.indexOf(pattern);
        tasksSearched++;
        // console.log({ indexOf: search, gid: tasks[n].gid, tasksSearched });
        if (search > -1) {
          foundTask = tasks[n];
          // console.log(foundTask);
          break;
        }
      }

      if (foundTask) {
        break;
      }

      // console.log("getting more tasks");

      query = await query.nextPage();
      if (!query.data) {
        // console.log("Nothing else to get");
        console.log('here?')
        break;
      }
      taskRequests++;
      // console.log("got more:", query.data.length, "page:", taskRequests);
      tasks = query.data;
    }

    console.log(
      "Done!, Searched",
      tasksSearched,
      "tasks across",
      taskRequests,
      "requests."
    );

    //TODO: Handle errors
    return foundTask;
  } catch (error) {
    console.error(error.response.status, error.response.body);
    return error.response.body;
  }
}
