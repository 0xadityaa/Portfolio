## Thread

I wrote a small script that reads real config.json files and works out how much memory a long context costs when you serve a model yourself. Here's what came out.
---
Llama 3.1 8B keeps 128 KiB of key/value cache per token. At 128k tokens that's 16 GiB for one user. The model's own weights are 15.0 GiB.
---
So at long context the model isn't the big thing on the GPU. The cache is. On one 80 GB card, I get 119 users at 4k tokens and 3 at 128k. Same model, same card.
---
The reason it isn't worse is grouped-query attention. Llama 3.1 8B shares 8 key/value heads across 32 query heads. Without that, one 128k user would need 64 GiB, and zero would fit.
---
fp8 cache halves it (7 users at 128k instead of 3), prefix sharing helps, and DeepSeek's latent attention breaks the formula. I computed this, I didn't benchmark it. Script and write-up: https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill

## Singles

Llama 3.1 8B: 128 KiB of KV cache per token. At 128k tokens that's 16 GiB for a single user, and the weights are 15.0 GiB. At long context the cache is the bigger line item.
---
One 80 GB GPU, Llama 3.1 8B in fp16: 119 full-length users at 4k tokens, 14 at 32k, 3 at 128k. Nothing about the model changed. Only how much each person pasted.
---
Grouped-query attention is a memory trick as much as a speed trick. Llama 3.1 70B would need 320 GiB of cache for one 128k user without it. With it: 40 GiB.
---
Qwen2.5 7B caches 56 KiB per token because it shares 4 key/value heads across 28 query heads. That's 7x smaller than the same model with a head per query, and it's why 8 users fit at 128k on one card.
---
Quick check on my own formula: the PagedAttention paper says OPT-13B needs 800 KB of cache per token. 2 x 5,120 x 40 layers x 2 bytes is 819,200. My script uses the same arithmetic on each model's real config.json.

## Substack Note

I wrote a small script that reads each open model's real config.json and works out how much GPU memory a long context costs. Here's what "128k context" costs.

Take Llama 3.1 8B. It keeps 128 KiB of key/value cache per token, so one user at 128k tokens needs 16 GiB. The model's own weights are 15.0 GiB. On one 80 GB card that's 119 users at 4k tokens, but only 3 at 128k. Same model, same card.

Grouped-query attention is why it isn't worse. Llama 3.1 8B shares 8 key/value heads across 32 query heads. Without it, one 128k user would need 64 GiB, and none would fit after the weights.

It's arithmetic from configs, not a benchmark, and fp8 cache, prefix sharing and DeepSeek-style latent attention all move the numbers. The post has the table, the caveats, and the script.

https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill
