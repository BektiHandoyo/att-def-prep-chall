#!/bin/bash
pip install flask pwntools
exec sh -c "while :; do rm -rf /tmp/pwn*; sleep 10m; done" &
python3 server.py 