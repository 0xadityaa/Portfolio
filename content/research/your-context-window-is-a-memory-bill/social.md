## Thread

One user pasting 128k tokens into Llama 3.1 8B needs 16 GiB of cache. The model's weights are 15.0 GiB. Here's the arithmetic, from real config files.
---
Llama 3.1 8B keeps 128 KiB of key/value cache per token. Times 131,072 tokens is 16 GiB, for one person. The weights are paid once. The cache is paid per user.
---
On one 80 GB card: 119 full-length users at 4k tokens, 3 at 128k. Same model, same card. Only how much each person pasted changed.
---
Why isn't it worse? Grouped-query attention. Llama 3.1 8B shares 8 key/value heads across 32 query heads. Without that, one 128k user would need 64 GiB, and none would fit.
---
fp8 cache halves it (7 users at 128k, not 3). Prefix sharing helps. DeepSeek's latent attention breaks the formula. This is arithmetic, not a benchmark. Write-up and script: https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill

## Singles

At 128k tokens, Llama 3.1 8B's KV cache for one user is 16 GiB. The model itself is 15.0 GiB. So at long context, you're buying GPU memory for the cache.
---
119 users at 4k tokens. 3 at 128k. Same model, same 80 GB card, same code. So the context you allow decides how many people you can serve.
---
Llama 3.1 70B without grouped-query attention: 320 GiB of cache for one 128k user. With it: 40 GiB. So GQA is a memory trick as much as a speed trick.
---
Why does Qwen2.5 7B fit 8 users at 128k? It caches 56 KiB per token, sharing 4 key/value heads across 28 query heads. Seven times smaller than a head per query. So kv_heads is the number to read in a config.
---
Check on my formula: the PagedAttention paper says OPT-13B needs 800 KB of cache per token. 2 x 5,120 x 40 layers x 2 bytes is 819,200. So the same arithmetic works on each model's config.json.

## Substack Note

One user pasting 128k tokens into Llama 3.1 8B needs 16 GiB of memory for the cache alone. The model's weights are 15.0 GiB.

That's the KV cache: the keys and values the server saves for every token it has already read, so it doesn't recompute them. Llama 3.1 8B keeps 128 KiB per token. The weights are paid once, but the cache is paid per user. On one 80 GB card that's 119 users at 4k tokens and only 3 at 128k. Same model, same card.

Grouped-query attention is why it isn't worse. Llama 3.1 8B shares 8 key/value heads across 32 query heads, so without it one 128k user would need 64 GiB.

I only did arithmetic from real config files. I haven't run it on a GPU, and fp8 cache and prefix sharing move the numbers. The post has the table and the caveats.

https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill
