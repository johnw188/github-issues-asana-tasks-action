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
  const repository = payload.repository;
  const owner = repository.owner;
  const repoName = repository.name;

  const name = title;
  
  // Build the conversation text
  let conversationText = `**Created by:** [@${user.login}](${user.html_url}) • ${new Date(created_at).toLocaleDateString()}\n`;
  conversationText += `**GitHub:** ${html_url}\n`;
  conversationText += `---\n`;
  conversationText += `${body || '_No description provided_'}\n`;

  // Get all comments if this is not an issue creation
  if (payload.action !== "opened") {
    try {
      const octokit = getOctokit(process.env.GITHUB_TOKEN);
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: owner.login,
        repo: repoName,
        issue_number: number
      });

      if (comments.length > 0) {
        conversationText += `\n---\n## Comments\n`;
        
        for (const comment of comments) {
          const username = comment.user?.login || 'ghost';
          const userUrl = comment.user?.html_url || `https://github.com/${username}`;
          const commentDate = new Date(comment.created_at).toLocaleDateString();
          const commentTime = new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          conversationText += `\n**[@${username}](${userUrl})** • ${commentDate} at ${commentTime}\n`;
          conversationText += `${comment.body}\n`;
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
