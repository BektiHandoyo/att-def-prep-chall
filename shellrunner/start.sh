#!/bin/bash
pip install flask pwntools
chmod +x main
exec sh -c "while :; do rm -rf /tmp/pwn*; sleep 10m; done" &
python3 server.py 