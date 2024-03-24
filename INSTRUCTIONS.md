# Installating
To install everything needed to run the experiments, run `./install.sh`.
This will install the necessary client NPM modules and git submodules.

# Running
There are 2 experiments, pubsub and poll. Poll sets up a simple HTTP server and
connects different amounts of clients to it, to see the impact on server and client
performance. Pubsub does the same but with a websockets interface, and has a similar
interface.

To run an experiment, simply run the `experiment.sh` file in the appropriate folder:
```
cd poll
./experiment MIN MAX INCR TIME
```

This example instantiates a poll server and connects MIN clients to it for TIME seconds.
After TIME seconds, these clients are killed, and MIN + INCR clients are created and
connected. This repeats itself until the amount of clients is MAX.

# Results
Client stats are saved in `results/client` and server stats are saved in `results/server`
in the experiment folder (e.g. `poll/results/client` and `poll/results/server`).

# TODO
- Server result file must be cleaned (header line is added every 3 seconds).
- More configurable options (e.g. polling interval)
