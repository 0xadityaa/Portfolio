import fs from "fs";
import matter from "gray-matter";
import { publishToDevto, publishToMedium } from "../api.mjs";

/**
 * Handles the 'blogPublish' event by publishing to Dev.to and Medium,
 * and updating the source note's frontmatter.
 * 
 * Supports incremental publishing: if one platform succeeds but the other
 * fails, it saves the success, and subsequent retries only attempt the failed platform.
 * 
 * @param {object} payload -filePath, title, content, tags
 */
export async function handleBlogPublish(payload) {
  const { filePath } = payload;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Source note file not found at: ${filePath}`);
  }

  // Load API keys from environment variables
  // (In local development/Next.js context, these can be set in .env files)
  const devtoApiKey = process.env.DEVTO_API_KEY || "mock";
  const mediumToken = process.env.MEDIUM_INTEGRATION_TOKEN || "mock";

  // 1. Read original file and parse frontmatter
  const originalContent = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(originalContent);
  const data = { ...parsed.data };

  let fileUpdated = false;
  let devtoError = null;
  let mediumError = null;

  // 2. Publish to Dev.to if not already done
  if (!data.devto_url) {
    try {
      console.log(`📤 Publishing "${data.title || payload.title}" to Dev.to...`);
      const devtoUrl = await publishToDevto(
        {
          title: data.title || payload.title,
          body: parsed.content,
          tags: data.tags || payload.tags || [],
        },
        devtoApiKey
      );
      data.devto_url = devtoUrl;
      fileUpdated = true;
      console.log(`🎉 Successfully published to Dev.to: ${devtoUrl}`);
    } catch (err) {
      devtoError = err;
      console.error(`🔴 Dev.to publishing failed:`, err.message || err);
    }
  } else {
    console.log(`⏭️ Dev.to already published at: ${data.devto_url}`);
  }

  // 3. Publish to Medium if not already done
  if (!data.medium_url) {
    try {
      console.log(`📤 Publishing "${data.title || payload.title}" to Medium...`);
      const mediumUrl = await publishToMedium(
        {
          title: data.title || payload.title,
          body: parsed.content,
          tags: data.tags || payload.tags || [],
        },
        mediumToken
      );
      data.medium_url = mediumUrl;
      fileUpdated = true;
      console.log(`🎉 Successfully published to Medium: ${mediumUrl}`);
    } catch (err) {
      mediumError = err;
      console.error(`🔴 Medium publishing failed:`, err.message || err);
    }
  } else {
    console.log(`⏭️ Medium already published at: ${data.medium_url}`);
  }

  // 4. If frontmatter was updated, write it back to the original source file
  if (fileUpdated) {
    // Preserve any existing comments or styling structure of the note body
    const updatedFileContent = matter.stringify(parsed.content, data);
    fs.writeFileSync(filePath, updatedFileContent, "utf-8");
    console.log(`💾 Updated source note frontmatter with published URL(s): ${filePath}`);
  }

  // 5. If there were errors, propagate them to trigger the queue retry
  if (devtoError || mediumError) {
    const errorMessages = [];
    if (devtoError) errorMessages.push(`Dev.to: ${devtoError.message || devtoError}`);
    if (mediumError) errorMessages.push(`Medium: ${mediumError.message || mediumError}`);
    throw new Error(`Publishing failed for platform(s): ${errorMessages.join(" | ")}`);
  }
}
