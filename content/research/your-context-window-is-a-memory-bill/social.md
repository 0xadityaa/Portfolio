## Hook

One user pasting 128k tokens into Llama 3.1 8B needs 16 GiB of KV cache. The model's weights are 15.0 GiB. On one 80 GB card that's 119 users at 4k tokens and 3 at 128k.

What context cap are you running, and who picked it?

[image: public/images/blog/kv-cache-vs-weights.svg]

## Thread

One user pasting 128k tokens costs 16 GiB of GPU memory on Llama 3.1 8B. The model itself is 15.0 GiB. I worked out what that does to an 80 GB card, from real config.json files. Here's what moved the number, and what didn't:
---
On one 80 GB card: 119 full-length users at 4k tokens. 3 at 128k.

Same model, same code. Concurrency drops about 40x, because the weights are paid once and the cache is paid per user.
---
Llama 3.1 8B keeps 128 KiB of KV cache per token. Times 131,072 tokens is 16 GiB, for one person.

Qwen2.5 7B keeps 56 KiB, so one 128k user is 7 GiB and 8 fit.
---
Why isn't it worse? Grouped-query attention. Llama 3.1 8B shares 8 KV heads across 32 query heads. Without that, one 128k user needs 64 GiB and zero fit.
---
The 70B models don't fit on one card: Llama 3.1 70B is 131.4 GiB of weights. Pool four cards, idealised, and 4 users fit at 128k. Without GQA it's 320 GiB per user and none do.
---
The strongest objection: this is arithmetic, not a benchmark. fp8 cache halves it (7 users at 128k, not 3), prefix caching shares common prompts, and I didn't subtract activation or framework overhead. Those discount the bill. They don't remove it.
---
Rule of thumb: 2 x layers x kv_heads x head_dim x 2 bytes per token. Multiply by your longest context and your users, add the weights. Can't say how many hit max context at once? Cap it before buying the card.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill

## Singles

I computed Llama 3.1 8B's KV cache at 128k tokens from its config.json: 16 GiB for one user. The weights are 15.0 GiB. At long context, the cache is the bigger half of the memory bill.
---
Model cards advertise 128k context. They don't print what it costs per user: 16 GiB on Llama 3.1 8B, 7 GiB on Qwen2.5 7B, 40 GiB on Llama 3.1 70B. The kv_heads field in config.json tells you.
---
119 concurrent users at 4k tokens. 3 at 128k. Same Llama 3.1 8B, same 80 GB card. The context cap you set decides your capacity.
---
Common advice: size the GPU for the model. What the config arithmetic says: at 128k, Llama 3.1 8B's cache is 16 GiB per user against 15.0 GiB of weights. Size for the cache.
---
Sizing a self-hosted LLM? Bytes per token = 2 x layers x kv_heads x head_dim x 2 (fp16). Multiply by max context and concurrent users, add the weights. That's your memory floor. Skip it and the fourth long-context user finds out for you.

## Reply prompts

For a post about ever-bigger context windows: self-hosting numbers from config.json, Llama 3.1 8B's KV cache is 16 GiB per user at 128k, more than its 15.0 GiB of weights. On one 80 GB card that's 3 users.
For a post about grouped-query attention: Llama 3.1 8B shares 8 KV heads across 32 query heads, so 128 KiB per token instead of 512. Without it, one 128k user would need 64 GiB.
For a post about quantization: an fp8 KV cache takes Llama 3.1 8B's 128k cost from 16 GiB to 8 GiB per user, 7 users on 80 GB instead of 3. Quantizing only the weights leaves that term as it is.

## Substack Note

One user pasting 128k tokens into Llama 3.1 8B needs 16 GiB of GPU memory for the cache alone. The model's weights are 15.0 GiB.

That's the KV cache: the keys and values a server saves for every token it has already read, so it doesn't recompute them. Llama 3.1 8B keeps 128 KiB per token. The weights are paid once. The cache is paid per user. On one 80 GB card that's 119 users at 4k tokens and 3 at 128k, same model, same card.

Grouped-query attention is why it isn't worse. Llama 3.1 8B shares 8 key/value heads across 32 query heads, so without it one 128k user would need 64 GiB.

This is arithmetic from real config files, not a benchmark. I haven't run it on a GPU, and fp8 cache and prefix sharing move the numbers. The table and the caveats are in the post.

https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill
