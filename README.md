# viva-engine

![alt text](logo.png)

6 hours inital engine, submitted to innovateX hack

help goes to [Coding Adventure: Chess](https://www.youtube.com/watch?v=U4ogK0MIzqk) who wrote a chess engine C lang - his video helped me understand key concepts

## includes alphabeta pruning, quiescence search, and transposition table.

a.b pruning -> cut off unneccessary branches that wont be used anyway
quinscece search -> extend minimax depth for 'quiet' positions
transpo table -> stores previous tables to stop redundunt calculations 

## future possible features:

add opening & endgame books into the engine to make it smarter


# instructions to run

1. clone repo
2. install node if not yet
3. run `node engine.js`
