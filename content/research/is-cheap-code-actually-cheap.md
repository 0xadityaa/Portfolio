# Research note: Is Cheap Code Actually Cheap?

Written 27 November 2026. A philosophy-and-tech essay (tag `philosophy`, `syndicate: false`, so site, X and Substack only). The idea came from the post Aditya shared, https://bexx.io/post/the-jevons-paradox-of-automated-code/. It is used only for the idea and is credited with one link in the opening; the structure, examples and phrasing are not taken from it.

## What this adds

The Jevons rebound applied to AI-generated code, with the argument that the cost moves to the things that did not get cheaper (reading, review, upkeep, deciding what not to build). The Stoic thread is Seneca on owning only as many books as you can read, not the dichotomy of control from the silence post.

## Claims and sources

All checked 27 November 2026.

| Claim | Source |
| --- | --- |
| Quote: "It is wholly a confusion of ideas to suppose that the economical use of fuel is equivalent to a diminished consumption. The very contrary is the truth." | Jevons, *The Coal Question* (1865), chapter 7, https://www.econlib.org/library/YPDBooks/Jevons/jvnCQ7.html |
| Quote: coal used in a branch "is the product of the number of separate works, and the average number of tons consumed in each"; the blast-furnace mechanism (cheaper iron, more demand, more furnaces); the engine's history is "a history of successive steps of economy" | same chapter |
| Alcott's survey of Jevons's claim and the rebound/backfire debate | Alcott (2005), "Jevons' paradox", Ecological Economics 54(1), 9-21, https://doi.org/10.1016/j.ecolecon.2005.03.020 (abstract read in the paper's PDF) |
| Evidence for backfire is far from conclusive; economy-wide rebound may be larger than assumed | Sorrell (2009), "Jevons' Paradox revisited", Energy Policy 37(4), 1456-1469, https://doi.org/10.1016/j.enpol.2008.12.003 (abstract summary via EconPapers; paper not read in full) |
| Elasticity form: fuel burned is $$k\,e^{1-\varepsilon}$$ | Derived in the post from $$Q = k\,e^{-\varepsilon}$$ with price proportional to $$e$$. Aditya's simplification, labelled as such in the post |
| UK coal output: 71.5 Mt a year (1853-62 average), 106.2, 140.3, 172.6, 206.6, 258.0 (1903-12), and 292.0 in 1913; 1913 is about 4.1 times the first figure; output fell after 1913 | DESNZ, "Historical coal data: coal production, availability and consumption", sheet "Coal Production", column "Total Output", https://www.gov.uk/government/statistical-data-sets/historical-coal-data-coal-production-availability-and-consumption (file `Coal_since_1853.xls`, last saved July 2026). Pre-1913 rows are ten-year annual averages (footnote 5) |
| 986M commits in 2025 (+25%), 43.2M pull requests merged a month (+23%); growth accelerated in early 2025 alongside the Copilot coding agent preview; "observational signals rather than causal claims" | GitHub, Octoverse 2025, https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/ (published 28 October 2025). The report also says "nearly 1 billion" in one place; the post uses the 986M figure |
| Dijkstra: lines of code are "lines spent", not "lines produced" | EWD 1036, "On the cruelty of really teaching computing science", 2 December 1988, https://www.cs.utexas.edu/~EWD/transcriptions/EWD10xx/EWD1036.html |
| DORA 2024: AI adoption "accompanied by an estimated decrease in delivery throughput by 1.5%, and an estimated reduction in delivery stability by 7.2%"; "AI does not appear to be a panacea" | Google Cloud, "Announcing the 2024 DORA report", 22 October 2024, https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report |
| Seneca: "since you cannot read all the books which you may possess, it is enough to possess only as many books as you can read"; "Everywhere means nowhere" | Letter 2 to Lucilius, Gummere translation, https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_2 |
| Temperance is one of the four basic Stoic virtues | Standard; not linked in the post as a numeric or contested claim |

## Figures

- `public/images/blog/jevons-coal-output.svg`: real data, the gov.uk series above. Values are rounded to the nearest million tonnes.
- `public/images/blog/jevons-cheap-code.svg`: illustrative, labelled as such. There is no source for cost per line, code volume or review capacity as curves.

## Left out because it could not be sourced

- Any number for how much of the recent GitHub growth is AI-written code, or for how review time has changed. GitHub's report does not make the causal claim.
- A time series for steam engine efficiency (duty per bushel). The chart shows coal output only, and the caption says it does not show the cause.
- Any figure for the maintenance cost per line of code.
- The 2025 DORA findings, which were only available through secondary write-ups.

## From Aditya

All first-person lines are arguments ("I think", "my bet"), not anecdotes. No personal experience is claimed. He should check that he agrees with the bet in "What gets scarce" and the dare in the takeaway.
