// @ts-check

import { getTasksApi } from "./asana-client.js";

/**
 * Toggle task completion
 *
 * @param {boolean} status True for completed, false for incomplete
 * @param {string} task_gid
 * @returns
 */
export async function markTaskComplete(status, task_gid) {
  const tasksApiInstance = getTasksApi();
  
  try {
    const opts = { opt_fields: "permalink_url" };
    const result = await tasksApiInstance.updateTask(
      { data: { completed: !!status } },
      task_gid,
      opts
    );

    console.log({ status, task_gid, result });

    return result;
  } catch (error) {
    console.log("error in markTaskComplete", error);
    console.error(error.response?.status, error.response?.body);
    return error.response?.body;
  }
}
