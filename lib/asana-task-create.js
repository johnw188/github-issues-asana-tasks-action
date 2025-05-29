// @ts-check

import { ApiClient, TasksApi, CustomFieldsApi } from "asana";
import { getCustomFieldForProject } from "./util/custom-field-helper.js";

let client = ApiClient.instance;
let token = client.authentications["token"];
token.accessToken = process.env.ASANA_PAT;

let tasksApiInstance = new TasksApi();
let customFieldsApiInstance = new CustomFieldsApi();

/**
 *
 * @param {{name: string, html_notes: string}} content The contents of the task
 * @param {string} projectId numeric string of the project to put this task in
 * @param {string} repository The GitHub repository name
 */
export async function createTask(content, projectId, repository) {
  // Find or create the repository custom field option
  const customFieldGid = process.env.ASANA_CUSTOM_FIELD_ID;
  
  let customFields = {};
  if (customFieldGid && repository) {
    const optionGid = await getCustomFieldForProject(customFieldGid, repository);
    customFields = {
      custom_fields: {
        [customFieldGid]: optionGid
      }
    };
  }
  
  const task_data = { 
    data: { 
      ...content, 
      projects: [projectId],
      ...customFields
    } 
  };
  const opts = { opt_fields: "permalink_url" };

  try {
    const result = await tasksApiInstance.createTask(task_data, opts);

    console.log({ result });
    return result.data.permalink_url;
  } catch (error) {
    console.error(error.response.status, error.response.body);
    return error.response.body;
  }
}
