#!/bin/bash
# Generate secure keys quickly

echo "🔐 Quick Key Generator"
echo "SECRET_KEY: $(python -c 'import secrets; print(secrets.token_urlsafe(64))')"
echo "JWT_SECRET_KEY: $(python -c 'import secrets; print(secrets.token_hex(32))')"
