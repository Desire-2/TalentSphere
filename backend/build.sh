#!/usr/bin/env bash
# build.sh

set -o errexit  # exit on error

pip install --upgrade pip
pip install -r requirements.txt

# Run database initialization if needed
python init_db.py
