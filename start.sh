#!/bin/bash
docker build -t boot2root-server .
docker run -d --name att-def-prep -p 5001:5001 -p 5000:5000 -p 8000:8000 -p 8080:8080 -p 31337:31337 boot2root-server