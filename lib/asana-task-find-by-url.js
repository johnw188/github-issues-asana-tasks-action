// @ts-check

/**
 * This searches for tasks using Asana's search API to find tasks
 * with a specific GitHub URL in a custom field.
 */

import { getTasksApi } from "./asana-client.js";

/**
 * Search for a task by GitHub URL using custom field
 * @param {string} githubUrl The GitHub issue URL to search for
 * @param {string} workspaceId The workspace to search in
 * @returns {Promise<object|null>} The task if found, null otherwise
 */
export async function findTaskByGithubUrl(githubUrl, workspaceId) {
  const githubUrlFieldGid = process.env.GITHUB_URL_FIELD_ID;
  
  // If no custom field is configured, return null
  if (!githubUrlFieldGid) {
    return null;
  }
  
  const tasksApiInstance = getTasksApi();
  
  try {
    // Search for tasks with this GitHub URL in the custom field
    const searchParams = {
      "custom_fields.any": `${githubUrlFieldGid}.value.contains="${githubUrl}"`,
      resource_subtype: "default_task",
      opt_fields: "name,completed,created_at,modified_at,notes,html_notes,permalink_url,gid,custom_fields"
    };
    
    const results = await tasksApiInstance.searchTasksForWorkspace(workspaceId, searchParams);
    
    // Get the first matching task
    for (const task of results) {
      // Double-check the custom field value matches exactly
      const customFields = task.custom_fields || [];
      const githubUrlField = customFields.find(f => f.gid === githubUrlFieldGid);
      
      if (githubUrlField && githubUrlField.text_value === githubUrl) {
        console.log(`Found task by GitHub URL: ${task.gid}`);
        return task;
      }
    }
    
    console.log(`No task found with GitHub URL: ${githubUrl}`);
    return null;
    
  } catch (error) {
    console.error("Error searching for task by GitHub URL:", error.message);
    // Fall back to null if search fails
    return null;
  }
}