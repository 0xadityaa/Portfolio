## Hook

One long prompt eats more GPU than the model.

16 GiB: KV cache for one user at 128k tokens
15.0 GiB: Llama 3.1 8B's weights
3 users fit on an 80 GB card at 128k. 119 fit at 4k.

What context cap are you running?

[image: public/images/blog/kv-cache-vs-weights.svg]

## Thread

One long prompt eats more GPU than the model.

On Llama 3.1 8B, one user at 128k tokens needs 16 GiB of KV cache. The weights are 15.0 GiB. I worked it out from the real config.json files (arithmetic, no inference run). Here's what it does to one card ↓
---
Same model, same 80 GB card:

→ 119 users at 4k tokens
→ 14 users at 32k
→ 3 users at 128k

The weights are paid once. The cache is paid per user, and it grows with what each person pastes.
---
Where the 16 GiB comes from:

2 x layers x kv_heads x head_dim x 2 bytes

Llama 3.1 8B: 128 KiB per token. x 131,072 tokens = 16 GiB, for one person.

Qwen2.5 7B keeps 56 KiB per token. One 128k user is 7 GiB, and 8 fit.
---
Why isn't it worse? Grouped-query attention.

Llama 3.1 8B shares 8 KV heads across 32 query heads. Without that, one 128k user needs 64 GiB and none fit.

On the 70B it's 8x: 40 GiB per user as shipped, 320 GiB without.
---
The strongest objection: this is arithmetic, not a benchmark.

An fp8 cache halves it (7 users at 128k, not 3). Prefix caching shares common prompts. I also didn't subtract activations or framework overhead.

Those discount the bill. They don't remove it.
---
Want the KV cache calculator? Reply KV and I'll DM it.

It reads Hugging Face config.json files and prints cache per user and how many full-length users fit on your GPUs. Standard-library Python.
---
Rule of thumb: bytes per token x your longest context x your concurrent long users, then add the weights. That's your memory floor.

Can't say how many hit max context at once? Cap it before you buy the card.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill

## Singles

119 users at 4k tokens. 3 at 128k.

Same Llama 3.1 8B, same 80 GB card, same code. The only thing that changed is how much each person pastes.

Your context cap sets your capacity.
---
Most people size a GPU for the model. I computed the cache from config.json instead:

→ Llama 3.1 8B at 128k: 16 GiB per user
→ Its weights: 15.0 GiB
→ Qwen2.5 7B at 128k: 7 GiB per user

At long context, the cache is the bigger bill.
---
Eight users at 128k on Llama 3.1 8B is 128 GiB of KV cache.

The model itself is 15.0 GiB.

That's the real cost of "just allow long context".
---
Grouped-query attention cuts Llama 3.1 8B's KV cache 4x.

At 128k it's still 16 GiB per user, more than the 15.0 GiB of weights.

Without it, 64 GiB. A 4x saving doesn't make the cache small.
---
Memory floor for a self-hosted LLM:

2 x layers x kv_heads x head_dim x 2 bytes, per token. Times max context, times concurrent users. Add the weights.

Skip that sum and the fourth long-context user finds the limit for you.

## CTA

KV | the KV cache calculator | https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-context-window-is-a-memory-bill

## Reply prompts

On a post about ever-bigger context windows: the self-hosting bill is KV cache. From config.json, Llama 3.1 8B needs 16 GiB per user at 128k, more than its 15.0 GiB of weights. That's 3 users on an 80 GB card.
On a post about grouped-query attention: Llama 3.1 8B shares 8 KV heads across 32 query heads, so 128 KiB per token instead of 512. Without it, one 128k user would need 64 GiB.
On a post about quantization: an fp8 KV cache takes Llama 3.1 8B's 128k cost from 16 GiB to 8 GiB per user, so 7 users on 80 GB instead of 3. Weight-only quantization leaves that term alone.

## Substack Note

One user pasting 128k tokens into Llama 3.1 8B needs 16 GiB of GPU memory for the cache alone. The model's weights are 15.0 GiB.

That's the KV cache: the keys and values a server saves for every token it has already read, so it doesn't recompute them. Llama 3.1 8B keeps 128 KiB per token. The weights are paid once. The cache is paid per user. On one 80 GB card that's 119 users at 4k tokens and 3 at 128k, same model, same card.

Grouped-query attention is why it isn't worse. Llama 3.1 8B shares 8 key/value heads across 32 query heads, so without it one 128k user would need 64 GiB.

This is arithmetic from real config files, not a benchmark. I haven't run it on a GPU, and fp8 cache and prefix sharing move the numbers. The table and the caveats are in the post.

https://www.0xadityaa.dev/blog/your-context-window-is-a-memory-bill
