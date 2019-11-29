#!/bin/sh

echo "Start running full node..."
(cd FullNode && nohup java -jar FullNode.jar -c config.conf --witness >/dev/null 2>&1 &)

sleep 10

echo "Start the http proxy..."
nohup scripts/generate_accounts.sh > /dev/null 2>&1 &

node /mcash/app
