import { devto } from "./devto.mjs";
import { hackernews } from "./hackernews.mjs";
import { medium } from "./medium.mjs";
import { substack } from "./substack.mjs";

/**
 * Every place a post is syndicated to. To add one, write a module with
 * { name, field, secret?, publish?, manual? } and list it here.
 * See docs/publishing.md.
 */
export const platforms = [devto, medium, substack, hackernews];
