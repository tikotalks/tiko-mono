#!/bin/bash

# Test CORS preflight request
echo "Testing CORS preflight request to R2..."
echo "====================================="

curl -X OPTIONS \
  'https://media.dc2b7d14a69351375cab6de9a13ddee9.eu.r2.cloudflarestorage.com/test' \
  -H 'Origin: http://localhost:5200' \
  -H 'Access-Control-Request-Method: PUT' \
  -H 'Access-Control-Request-Headers: content-type,x-amz-content-sha256,x-amz-date,x-amz-user-agent' \
  -v 2>&1 | grep -E "(< HTTP|< access-control|< Access-Control)"

echo -e "\n\nIf you see Access-Control headers above, CORS is configured."
echo "If not, the CORS policy hasn't been applied properly."