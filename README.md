# Experiment: publishing 1 time series as Linked Data

Research questions:
 * Cost-efficiency of different interfaces under increasing load: how many clients need to be connected to a pubsub system for it to work better in a pull based system? 
 * What’s the optimal amount of observations in a pull-based document?


## 1. Testing - for different set-ups - the increase in possible reusers until 100%?

Can we assume that when you would increase RAM + CPU of a server, the number of possible clients scales linearly with it?

Should we quantify how much RAM+CPU we marginally/amortized would need for 1 request for a certain data interface?

## 2. Testing when pubsub is worse then poll

If number of users increase on the X axis, and Y axis is the latency, CPU time or RAM consumption and bandwidth. At what number of reusers would it be more cost-efficient to choose a polling approach?

* Depending on number of updates as well...

## 3. With summaries, we increase performance of n° of documents
