#!/usr/bin/env bash

IMAGE_DIR=$1

JSON_FILE=data/hashes.json

for file in $IMAGE_DIR/*.webp; do
    if [ -f "$file" ]; then
        BLOCKHASH=`blockhash "$file" | cut -d" " -f1`
        PHASH=`phash "$file" --debug | cut -d" " -f1`
        echo "{\"blockhash\": \"$BLOCKHASH\", \"phash\": \"$PHASH\", \"file\": \"$(basename $file)\"}"
    fi
done | jq -s . > $JSON_FILE