// @ts-check

import { renderMarkdown } from "./markdown-to-asana-html.js";
import { getOctokit } from "@actions/github";

/**
 * Converts a GitHub Issue (with all comments) to an Asana Task format
 *
 *  - Add the issue number to the title, eg. Fix blue widgets #44
 *  - Include the entire conversation (issue + comments) in the description
 *  - Translate raw markdown body to HTML (for html_notes)
 *
 * @param {object} payload The GitHub webhook payload
 * @link https://docs.github.com/en/rest/issues/issues
 *
 * @returns {Promise<object>}
 */
export async function issueToTask(payload) {
  const { title, number, body, html_url, user, created_at, updated_at } = payload.issue;
  const { owner, repo } = payload.repository;

  const name = `${title} #${number}`;
  
  // Build the conversation text
  let conversationText = `# ${title}\n\n`;
  conversationText += `**Created by:** [@${user.login}](${user.html_url})\n`;
  conversationText += `**Created at:** ${new Date(created_at).toLocaleString()}\n`;
  if (updated_at !== created_at) {
    conversationText += `**Updated at:** ${new Date(updated_at).toLocaleString()}\n`;
  }
  conversationText += `**GitHub Issue:** ${html_url}\n\n`;
  conversationText += `---\n\n`;
  conversationText += `## Issue Description\n\n${body || '_No description provided_'}\n\n`;

  // Get all comments if this is not an issue creation
  if (payload.action !== "opened") {
    try {
      const octokit = getOctokit(process.env.GITHUB_TOKEN);
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: owner.login,
        repo: repo.name,
        issue_number: number
      });

      if (comments.length > 0) {
        conversationText += `---\n\n## Comments\n\n`;
        
        for (const comment of comments) {
          conversationText += `### [@${comment.user.login}](${comment.user.html_url}) - ${new Date(comment.created_at).toLocaleString()}\n\n`;
          conversationText += `${comment.body}\n\n`;
          conversationText += `[View comment](${comment.html_url})\n\n`;
          conversationText += `---\n\n`;
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      conversationText += `\n\n_Error fetching comments from GitHub_\n`;
    }
  }
  
  const html_notes = renderMarkdown(conversationText);

  return { name, html_notes };
}
