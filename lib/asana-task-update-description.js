// @ts-check

import { getTasksApi } from "./asana-client.js";

/**
 * Updates an existing task's description with new content
 * @param {string} task_gid The GID of the task to update
 * @param {{name: string, html_notes: string}} content The new content for the task
 */
export async function updateTaskDescription(task_gid, content) {
  const tasksApiInstance = getTasksApi();
  
  const task_data = { data: content };
  const opts = { opt_fields: "permalink_url" };

  try {
    const result = await tasksApiInstance.updateTask(task_data, task_gid, opts);
    console.log({ result });
    return result.data.permalink_url;
  } catch (error) {
    console.error(error.response.status, error.response.body);
    return error.response.body;
  }
}