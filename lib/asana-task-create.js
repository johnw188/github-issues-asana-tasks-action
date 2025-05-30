// @ts-check

import { getCustomFieldForProject } from "./util/custom-field-helper.js";
import { getTasksApi } from "./asana-client.js";

/**
 *
 * @param {{name: string, html_notes: string}} content The contents of the task
 * @param {string} projectId numeric string of the project to put this task in
 * @param {string} repository The GitHub repository name
 * @param {string} creator The GitHub username of the issue creator
 * @param {string} githubUrl The GitHub issue URL
 */
export async function createTask(content, projectId, repository, creator, githubUrl) {
  // Get custom field IDs from environment
  const repositoryFieldGid = process.env.REPOSITORY_FIELD_ID;
  const creatorFieldGid = process.env.CREATOR_FIELD_ID;
  const githubUrlFieldGid = process.env.GITHUB_URL_FIELD_ID;
  
  let customFields = {};
  
  // Add repository field if configured
  if (repositoryFieldGid && repositoryFieldGid.trim() && repository) {
    const optionGid = await getCustomFieldForProject(repositoryFieldGid, repository);
    customFields[repositoryFieldGid] = optionGid;
  }
  
  // Add creator field if configured
  if (creatorFieldGid && creator) {
    customFields[creatorFieldGid] = `@${creator}`;
  }
  
  // Add GitHub URL field if configured
  if (githubUrlFieldGid && githubUrl) {
    customFields[githubUrlFieldGid] = githubUrl;
  }
  
  // Only add custom_fields if we have any
  const customFieldsWrapper = Object.keys(customFields).length > 0 
    ? { custom_fields: customFields }
    : {};
  
  const task_data = { 
    data: { 
      ...content, 
      projects: [projectId],
      ...customFieldsWrapper
    } 
  };
  const opts = { opt_fields: "permalink_url" };

  try {
    const tasksApiInstance = getTasksApi();
    const result = await tasksApiInstance.createTask(task_data, opts);
    return result.data.permalink_url;
  } catch (error) {
    console.error(error.response.status, error.response.body);
    throw error;
  }
}
