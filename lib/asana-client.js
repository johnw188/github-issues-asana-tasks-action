// @ts-check

import { ApiClient, TasksApi, CustomFieldsApi, StoriesApi, ProjectsApi } from "asana";

let initialized = false;
let tasksApiInstance;
let customFieldsApiInstance;
let storiesApiInstance;
let projectsApiInstance;

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
  
  
  tasksApiInstance = new TasksApi();
  customFieldsApiInstance = new CustomFieldsApi();
  storiesApiInstance = new StoriesApi();
  projectsApiInstance = new ProjectsApi();
  
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

/**
 * Get the Projects API instance
 * @returns {ProjectsApi}
 */
export function getProjectsApi() {
  if (!initialized) {
    throw new Error("Asana client not initialized. Call initializeAsanaClient() first.");
  }
  return projectsApiInstance;
}