// @ts-check

import { ApiClient, CustomFieldsApi } from "asana";

let client = ApiClient.instance;
let token = client.authentications["token"];
token.accessToken = process.env.ASANA_PAT;

// Debug logging for token in custom field helper
console.log("Custom field helper - ASANA_PAT present:", !!process.env.ASANA_PAT);

let customFieldsApiInstance = new CustomFieldsApi();

/**
 * Gets or creates a custom field option for the given repository
 * @param {string} customFieldGid The GID of the custom field
 * @param {string} repository The repository name to add as an option
 * @returns {Promise<string>} The GID of the custom field option
 */
export async function getCustomFieldForProject(customFieldGid, repository) {
  try {
    // Get the custom field with its options
    const opts = { opt_fields: "enum_options,enum_options.name" };
    const customField = await customFieldsApiInstance.getCustomField(customFieldGid, opts);
    
    // Check if the repository option already exists
    const existingOption = customField.data.enum_options?.find(
      option => option.name === repository
    );
    
    if (existingOption) {
      return existingOption.gid;
    }
    
    // Create a new option if it doesn't exist
    const newOptionData = {
      data: {
        name: repository,
        color: getColorForRepository(repository)
      }
    };
    
    const newOption = await customFieldsApiInstance.createEnumOptionForCustomField(
      customFieldGid,
      newOptionData
    );
    
    console.log(`Created new custom field option for repository: ${repository}`);
    return newOption.data.gid;
    
  } catch (error) {
    console.error("Error handling custom field:", error);
    throw error;
  }
}

/**
 * Gets a color for the repository based on its name
 * @param {string} repository The repository name
 * @returns {string} A color name for the Asana enum option
 */
function getColorForRepository(repository) {
  // Asana enum colors
  const colors = [
    "dark-red", "dark-orange", "dark-green", "dark-blue", 
    "dark-purple", "dark-pink", "light-red", "light-orange", 
    "light-green", "light-blue", "light-purple", "light-pink"
  ];
  
  // Simple hash function to consistently assign colors
  let hash = 0;
  for (let i = 0; i < repository.length; i++) {
    hash = ((hash << 5) - hash) + repository.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
}