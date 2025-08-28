#!/usr/bin/env python3
"""
Find an available port for the Flask application
"""
import socket
from contextlib import closing

def find_free_port(start_port=5000, max_port=5010):
    """Find the first available port starting from start_port"""
    for port in range(start_port, max_port + 1):
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            try:
                sock.bind(('', port))
                return port
            except OSError:
                continue
    return None

if __name__ == "__main__":
    port = find_free_port()
    if port:
        print(port)
    else:
        print("5000")  # fallback
