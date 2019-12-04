#!/bin/bash
set -e

if [ "$1" = 'quickstart' ]; then
    ##################### Handle SIGTERM #####################
    function _term() {
        printf "%s\n" "Caught terminate signal!"

        kill -SIGTERM $full_node_pid 2>/dev/null
        kill -SIGTERM $node_pid 2>/dev/null

        exit 0
    }

    trap _term SIGHUP SIGINT SIGTERM SIGQUIT

    ##################### Start application #####################
    echo "Start running full node..."
    cd /mcash/FullNode
    java -jar FullNode.jar -c config.conf --witness >/dev/null 2>&1 &
    full_node_pid=$!

    sleep 10

    echo "Start the http proxy..."
    nohup /mcash/scripts/generate_accounts.sh > /dev/null 2>&1 &

    node /mcash/app &
    node_pid=$!

    wait $node_pid
else
    exec "$@"
fi
