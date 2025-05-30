// @ts-check

/**
 * This scans tasks in a project looking for a task with a description
 * containing a specific url (the Issue url).
 */

import { getTasksApi } from "./asana-client.js";

/**
 * Search Project tasks for a note containing a given string
 * @param {string} needle string to search for in Task notes
 * @param {string} projectId numeric string gid of the project to search in
 */
export async function findTaskContaining(needle, projectId) {
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
