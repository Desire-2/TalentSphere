#!/usr/bin/env python3
"""
Quick secure key generator - single command version
Usage: python quick_key.py [length]
"""
import secrets
import sys

def generate_key(length=64):
    return secrets.token_urlsafe(length)

if __name__ == "__main__":
    length = int(sys.argv[1]) if len(sys.argv) > 1 else 64
    print(generate_key(length))
