#!/bin/bash

docker build . -t gcr.io/mechmania2017/flush-old-versions:latest
docker push gcr.io/mechmania2017/flush-old-versions:latest
kubectl apply -f app.yaml
kubectl delete pods -l app=flush-old-versions