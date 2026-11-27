---
title: Is Cheap Code Actually Cheap?
publishedAt: '2026-11-27T12:00:00Z'
summary: >-
  Efficient engines made Britain burn more coal. Cheap AI code follows the same arithmetic, and what runs short is judgment.
tags:
  - philosophy
  - ai
  - software
draft: true
syndicate: false
---

In 1865 William Stanley Jevons published *The Coal Question*, a book about whether Britain would run out of coal. One chapter makes a claim that sounds backwards on the first read. Each generation of steam engine got more work out of a ton of coal than the one before it, and Britain answered by burning far more coal, not less. Jevons did not file that under coincidence ([chapter 7](https://www.econlib.org/library/YPDBooks/Jevons/jvnCQ7.html)):

> “It is wholly a confusion of ideas to suppose that the economical use of fuel is equivalent to a diminished consumption. The very contrary is the truth.”

Is cheap code actually cheap? Writing it is. Owning it is not, and the cheaper the first gets, the more of the second you end up holding. What runs short is the slow, human part: reading what was written, judging whether it should exist, and deciding what not to build.

I came back to that sentence after reading [a post on bexx.io](https://bexx.io/post/the-jevons-paradox-of-automated-code/) that points it at automated code. This is my version of the argument, with the philosophy I think it needs.

## What Jevons actually claimed

Jevons gave the mechanism in one sentence: “The number of tons of coal used in any branch of industry is the product of the number of separate works, and the average number of tons consumed in each.” Efficiency shrinks the second factor. It also makes the work profitable, so the first factor grows. In his example, a blast-furnace that needs less coal earns more, new capital arrives, iron gets cheaper, demand for iron rises, and eventually the extra furnaces more than make up for the smaller appetite of each.

$$\text{coal burned} = N \times c$$

Here $$N$$ is the number of furnaces and $$c$$ the coal each one uses. Later economists wrote the same thing with demand elasticity. Let $$e$$ be the fuel needed per unit of useful work, so the price of that work is proportional to $$e$$ while coal stays the same price. If demand for work is $$Q = k\,e^{-\varepsilon}$$, then fuel burned is

$$C = Q \times e = k\,e^{-\varepsilon} \times e = k\,e^{\,1-\varepsilon}$$

When $$\varepsilon > 1$$, making the engine more efficient (a smaller $$e$$) raises $$C$$. That is the whole paradox: demand that grows faster than the price falls. When $$\varepsilon < 1$$ you still get a rebound, but total use falls. (This is my simplification, with the price of work tied to fuel alone.) [Alcott's 2005 survey](https://doi.org/10.1016/j.ecolecon.2005.03.020) lays out Jevons's claim and the rebound debate it started, and [Sorrell's 2009 review](https://doi.org/10.1016/j.enpol.2008.12.003) of the evidence finds it far from conclusive. So this is not a law of nature. It is a bet on how hungry demand is.

![Bar chart of Britain's coal output in million tonnes a year: a ten-year average of 72 for 1853 to 1862, rising every decade to 258 for 1903 to 1912, and 292 in 1913](/images/blog/jevons-coal-output.svg "Coal mined in Britain: annual averages over ten-year spans, then the single year 1913. Data: [DESNZ historical coal data](https://www.gov.uk/government/statistical-data-sets/historical-coal-data-coal-production-availability-and-consumption), checked 27 November 2026. The chart shows output rising, not why.")

Output in 1913 was about four times the average of the 1850s. Steam engines are not the only reason, and I come back to that below.

## Is the demand for software that hungry?

For software, I think the answer has been yes for decades. Compilers, open source libraries and cloud platforms each made code cheaper to produce, and as far as I can see the world got more software each time, not less. Every internal tool nobody would fund at last year's price, every one-off script, every third dashboard on the same data: all of it was waiting for the price to drop.

The numbers I can check point the same way, with a caveat. GitHub's [Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) counts more than 986 million commits pushed in 2025, up 25%, and 43.2 million pull requests merged a month on average, up 23%. GitHub says growth accelerated in early 2025, around the time Copilot's coding agent went into preview, and then calls these “observational signals rather than causal claims.” So I cannot tell you how much of it is AI. I can say the direction is what Jevons would predict, and the opposite of what “AI will shrink the work” predicts.

## Code is spent, not produced

Edsger Dijkstra put the right frame on this in 1988, in [EWD 1036](https://www.cs.utexas.edu/~EWD/transcriptions/EWD10xx/EWD1036.html): “if we wish to count lines of code, we should not regard them as ‘lines produced’ but as ‘lines spent’.” A line is a cost, and the cost does not stop when it is typed. Someone has to read it later, cover it with a test, patch it when a dependency turns out to be vulnerable, migrate it, and eventually delete it.

$$\text{upkeep} = L \times u$$

Take $$L$$ as lines of code and $$u$$ as the yearly cost of carrying one of them. AI tools cut the price of making $$L$$ bigger. As far as I can tell they did not cut $$u$$ by the same factor, and that is the part of Jevons's argument people skip. The effect lands on the cheapened input, but the bill lands on whatever is not cheaper. A photocopier makes copies nearly free and the filing cabinet still fills up. If cheap writing quadruples $$L$$ while $$u$$ holds still, upkeep quadruples, and so does the surface someone has to keep secure.

![Illustrative curves over time: the cost to write a line falls, code written climbs, and what people can review stays flat, leaving a widening gap between code written and code read](/images/blog/jevons-cheap-code.svg "Illustrative, not data: no measurements sit behind these curves. They draw the argument above, with review capacity held flat because a reviewer reads at human speed.")

## What gets scarce

When writing was the slow step, it was also a limit. A team could not ship more than it could type, and that kept the codebase roughly the size of the team's attention. Remove the limit and the constraint moves to the next slowest step, which is reading. A reviewer reads a diff at the speed of a person reading, whoever wrote it. The 2024 [DORA report](https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report) found that as AI adoption rose it “was accompanied by an estimated decrease in delivery throughput by 1.5%, and an estimated reduction in delivery stability by 7.2%.” That is an association from one survey, and the same report finds real benefits for individuals and says AI “does not appear to be a panacea.” I read it as a hint about where the pressure goes, not a verdict.

Temperance is one of the four basic virtues the Stoics counted, and it is the one you practise when nothing outside you says stop. Seneca ran into a version of this with books. In [his second letter to Lucilius](https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_2), in Gummere's translation, he writes: “since you cannot read all the books which you may possess, it is enough to possess only as many books as you can read.” In the same letter: “Everywhere means nowhere.” Swap books for code and the sentence still works. It is enough to own as much code as you can read.

Here is my bet. The scarce skills will be the old unglamorous ones: reading a diff closely, writing the one-paragraph spec that makes a feature unnecessary, deleting what is no longer earning its upkeep, and saying no to the thing that is cheap to build and expensive to keep. Typing was never the hard part. It just used to hide the hard part.

## Where I'd stop trusting this post

**Jevons's paradox is a case, not a law.** It needs elasticity above 1, and Sorrell's review of the evidence finds it far from conclusive. Britain's coal output also fell after 1913 (it is in the same [dataset](https://www.gov.uk/government/statistical-data-sets/historical-coal-data-coal-production-availability-and-consumption)), so the climb in the first chart did not go on forever.

**The coal chart shows output, not cause.** Population, railways and exports all grew too, and nothing in the chart separates them from engine efficiency. Jevons's mechanism is an argument I find convincing, not something the bars prove.

**The GitHub numbers cannot be pinned on AI.** GitHub says so itself. They show more code moving, not that cheap generation caused it.

**I have not measured upkeep per line.** The second figure is a drawing, and the claim that $$u$$ did not fall is mine. The strongest objection is that the same models that write code can review it, test it and delete it. If review gets cheaper at the rate writing did, the gap in that figure closes and so does my argument. I have not tested that, and it may already be happening in places I have not looked.

**The DORA figures are from one survey in 2024.** They are associations, from a year when the tools were different from today's.

## The takeaway

Before you accept a block of generated code, price it: who reads this, who patches it when its dependency breaks, and when does it get deleted? If nobody can answer, it was not cheap. It was a loan. A quick experiment for your own repo: take last month's merged changes and count how many a second person read line by line. That ratio is your review capacity, and it tells you how much code you can afford to keep adding.

If someone shows me a team whose maintenance and review load fell while its code volume rose, I will happily retract all of this. Until then I will treat each line as spent. A cheaper furnace does not mean a smaller fire, and somebody still has to stand next to it.
