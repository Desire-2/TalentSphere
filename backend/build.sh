#!/usr/bin/env bash
# build.sh

set -o errexit  # exit on error

pip install --upgrade pip
pip install -r requirements.txt

echo "Build completed successfully!"
