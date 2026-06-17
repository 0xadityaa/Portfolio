/**
 * API Clients for Dev.to and Medium with support for Mocking and local validation.
 */

// Helper to check if in mock mode
const isMock = (token) => !token || token.toLowerCase().startsWith("mock") || token === "YOUR_API_KEY" || token === "YOUR_TOKEN";

/**
 * Publishes an article to Dev.to
 * @param {object} article - Title, body, tags
 * @param {string} apiKey - Dev.to API Key
 * @returns {Promise<string>} - Published article URL
 */
export async function publishToDevto(article, apiKey) {
  if (apiKey === "fail") {
    throw new Error("Simulated network failure on Dev.to!");
  }

  if (isMock(apiKey)) {
    console.log("🤖 [Mock Mode] dev.to publishing triggered.");
    // Simulate a successful publish response
    const mockSlug = article.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    return `https://dev.to/mock_user/${mockSlug}_${Math.floor(Math.random() * 1000)}`;
  }

  const url = "https://dev.to/api/articles";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      article: {
        title: article.title,
        body_markdown: article.body,
        published: true,
        tags: article.tags || [],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dev.to API failed with status ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return result.url; // Returns the published article's URL
}

/**
 * Publishes an article to Medium
 * @param {object} article - Title, content, tags
 * @param {string} integrationToken - Medium Integration Token
 * @returns {Promise<string>} - Published post URL
 */
export async function publishToMedium(article, integrationToken) {
  if (integrationToken === "fail") {
    throw new Error("Simulated timeout on Medium API!");
  }

  if (isMock(integrationToken)) {
    console.log("🤖 [Mock Mode] Medium publishing triggered.");
    // Simulate a successful publish response
    const mockSlug = article.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    return `https://medium.com/@mock_user/${mockSlug}_${Math.floor(Math.random() * 1000)}`;
  }

  // 1. Get current user's profile details to retrieve the authorId
  const meUrl = "https://api.medium.com/v1/me";
  const meResponse = await fetch(meUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${integrationToken}`,
      "Accept": "application/json",
    },
  });

  if (!meResponse.ok) {
    const errorText = await meResponse.text();
    throw new Error(`Medium API Profile fetch failed with status ${meResponse.status}: ${errorText}`);
  }

  const meResult = await meResponse.json();
  const authorId = meResult.data.id;

  if (!authorId) {
    throw new Error("Medium API did not return a valid author ID.");
  }

  // 2. Publish post under the user's authorId
  const postUrl = `https://api.medium.com/v1/users/${authorId}/posts`;
  const postResponse = await fetch(postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${integrationToken}`,
    },
    body: JSON.stringify({
      title: article.title,
      contentFormat: "markdown",
      content: `# ${article.title}\n\n${article.body}`,
      publishStatus: "public",
      tags: article.tags || [],
    }),
  });

  if (!postResponse.ok) {
    const errorText = await postResponse.text();
    throw new Error(`Medium API Post creation failed with status ${postResponse.status}: ${errorText}`);
  }

  const postResult = await postResponse.json();
  return postResult.data.url; // Returns the published post's URL
}
