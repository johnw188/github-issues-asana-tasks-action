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
  const createdDate = new Date(created_at);
  const pstDate = createdDate.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  const pstTime = createdDate.toLocaleTimeString('en-US', { 
    timeZone: 'America/Los_Angeles', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const ukTime = createdDate.toLocaleTimeString('en-GB', { 
    timeZone: 'Europe/London', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  let conversationText = `**Created by:** [@${user.login}](${user.html_url}) • ${pstDate} at ${pstTime} PST (${ukTime} GMT)\n`;
  conversationText += `**GitHub:** ${html_url}<hr>\n\n`;
  conversationText += `${body || '_No description provided_'}`;

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
        conversationText += `<hr><h2>Comments</h2>\n\n`;
        
        for (const comment of comments) {
          const username = comment.user?.login || 'ghost';
          const userUrl = comment.user?.html_url || `https://github.com/${username}`;
          
          const commentDateTime = new Date(comment.created_at);
          const commentPstDate = commentDateTime.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
          const commentPstTime = commentDateTime.toLocaleTimeString('en-US', { 
            timeZone: 'America/Los_Angeles', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          const commentUkTime = commentDateTime.toLocaleTimeString('en-GB', { 
            timeZone: 'Europe/London', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          
          conversationText += `**[@${username}](${userUrl})** • ${commentPstDate} at ${commentPstTime} PST (${commentUkTime} GMT)\n`;
          conversationText += `${comment.body}\n\n`;
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
