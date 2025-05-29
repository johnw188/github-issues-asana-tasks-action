// @ts-check

import { ApiClient, TasksApi, CustomFieldsApi, StoriesApi } from "asana";

let initialized = false;
let tasksApiInstance;
let customFieldsApiInstance;
let storiesApiInstance;

/**
 * Initialize the Asana client with the PAT from environment
 * Must be called after environment variables are set
 */
export function initializeAsanaClient() {
  if (initialized) {
    return;
  }
  
  const client = ApiClient.instance;
  const token = client.authentications["token"];
  token.accessToken = process.env.ASANA_PAT;
  
  // Debug logging
  console.log("Initializing Asana client");
  console.log("ASANA_PAT present:", !!process.env.ASANA_PAT);
  console.log("ASANA_PAT length:", process.env.ASANA_PAT ? process.env.ASANA_PAT.length : 0);
  
  tasksApiInstance = new TasksApi();
  customFieldsApiInstance = new CustomFieldsApi();
  storiesApiInstance = new StoriesApi();
  
  initialized = true;
}

/**
 * Get the Tasks API instance
 * @returns {TasksApi}
 */
export function getTasksApi() {
  if (!initialized) {
    throw new Error("Asana client not initialized. Call initializeAsanaClient() first.");
  }
  return tasksApiInstance;
}

/**
 * Get the Custom Fields API instance
 * @returns {CustomFieldsApi}
 */
export function getCustomFieldsApi() {
  if (!initialized) {
    throw new Error("Asana client not initialized. Call initializeAsanaClient() first.");
  }
  return customFieldsApiInstance;
}

/**
 * Get the Stories API instance
 * @returns {StoriesApi}
 */
export function getStoriesApi() {
  if (!initialized) {
    throw new Error("Asana client not initialized. Call initializeAsanaClient() first.");
  }
  return storiesApiInstance;
}