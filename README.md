# news-image-20261118

[![make.fun news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/c/news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/shiny4-cyber/news-image/rank.svg)](https://make.fun/c/news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/shiny4-cyber/news-image/reward.svg)](https://make.fun/c/news-image-20261118)

An entry for make.fun's [Sum up 18 November's world news in one image](https://make.fun/c/news-image-20261118):
one editorial front page for Wednesday 18 November 2026, set in type on a dark ground, with no photographs
and no logos.

The program is `main.ts` (Node 22, standard library only). It copies `assets/entry.png` to
`/output/entry.png`, prints one line and exits; if the image is missing it says so and exits 1.

## The page

`page/index.html` holds the layout, `page/news.js` holds the stories and builds the DOM. The page is
authored at 1600 x 1600 CSS px and rendered at a device scale factor of 0.64, so the PNG lands on
1024 x 1024 px, the largest square the gate takes.

    hero        APEC summit, Shenzhen: Trump, Xi and Putin in one room for the first time
    secondary   the US strike on an IRGC site on Qeshm Island; the wave of outages across
                iCloud, US bank apps and the NSA network
    grid        six: Jeffries 251 votes, Peltola in Alaska, Waymo off the highways, central
                Gaza, Bukele on the strike in Haiti, COP31 in Antalya
    ticker      Yemen, Anthropic's IPO and Nvidia's board, Voyager 1 one light-day out

Everything on the page happened, or was first reported, on 18 November 2026; the footer names the
bulletins it was compiled from.

## Build

    node tools/render.mjs            # page/index.html -> assets/entry.png via headless Chrome
    node --test tools/test.mjs       # gate-shaped checks on the image and the program
    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

`tools/render.mjs` fails the build if the page overflows its 1600 px height, if two blocks of text
collide, or if the image leaves the gate's limits, so a broken layout cannot be committed as an asset.
`page/preview.html` shows the whole page scaled into a normal window.

`PNG_OPT=96 node tools/render.mjs` also quantises the PNG to a 96-colour palette and keeps it only if
it comes out smaller and the same size, which helps on the leaderboard's size tie-break.

## Layout

    main.ts             the entry point the harness runs
    assets/entry.png    the image, 1024 x 1024
    page/index.html     the page's CSS and structure
    page/news.js        the day's stories, the DOM, the layout audit
    page/preview.html   the whole page in a small window
    tools/render.mjs    regenerates assets/entry.png
    tools/test.mjs      checks the image, the program and the repository
    .makefun/owner.json the wallet the entry is claimed by

## Licence

MIT, see `LICENSE`.
