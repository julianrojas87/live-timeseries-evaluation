# Download git submodules
git submodule update --init --recursive

# NPM install client experiment managers
cd experiments/poll/client
npm install
cd ../../pubsub/client
npm install

# Checkout client submodules to master branch and install them
cd ../../poll/client/client
git checkout master
npm install
cd ../../../pubsub/client/client
git checkout master
npm install

# Checkout docker-stats submodules to developemnt branch and install them
cd ../../../poll/docker-stats
git checkout development
npm install
cd ../../pubsub/docker-stats
git checkout development
npm install

# Checkout server submodules to development branch
cd ../../poll/server/replay-timeseries
git checkout development
cd ../timeseries-server
git checkout development
cd ../../../pubsub/server/replay-timeseries
git checkout development
cd ../timeseries-server
git checkout development
echo "Benchmark setup completed successfuly"
