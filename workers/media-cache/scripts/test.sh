#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to production URL
ENVIRONMENT=${1:-production}

echo -e "${BLUE}Media Cache Worker - Test${NC}"
echo "========================="

# Set URL based on environment
case $ENVIRONMENT in
  "development"|"dev"|"local")
    URL="http://localhost:8787"
    ;;
  "staging"|"stage")
    URL="https://staging-tikoapi.org/media/cache"
    ;;
  "production"|"prod")
    URL="https://tikoapi.org/media/cache"
    ;;
  *)
    echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
    echo "Valid environments: development, staging, production"
    exit 1
    ;;
esac

echo -e "Testing: ${YELLOW}$URL${NC}"
echo ""

# Test 1: Basic request
echo -e "${YELLOW}Test 1: Basic Request${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
    
    # Check if response has expected fields
    if echo "$BODY" | grep -q '"media"' && echo "$BODY" | grep -q '"cachedAt"' && echo "$BODY" | grep -q '"deploymentVersion"'; then
        echo -e "${GREEN}✓ Response structure valid${NC}"
        
        # Count media items
        MEDIA_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
        echo -e "${GREEN}✓ Media items: $MEDIA_COUNT${NC}"
    else
        echo -e "${RED}✗ Invalid response structure${NC}"
        echo "$BODY" | head -100
    fi
else
    echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
    echo "$BODY"
fi

# Test 2: Check cache headers
echo -e "\n${YELLOW}Test 2: Cache Headers${NC}"
HEADERS=$(curl -s -I "$URL")
CACHE_STATUS=$(echo "$HEADERS" | grep -i "x-cache-status" | cut -d' ' -f2 | tr -d '\r')
VERSION=$(echo "$HEADERS" | grep -i "x-deployment-version" | cut -d' ' -f2 | tr -d '\r')

if [ -n "$CACHE_STATUS" ]; then
    echo -e "${GREEN}✓ Cache Status: $CACHE_STATUS${NC}"
else
    echo -e "${RED}✗ No cache status header${NC}"
fi

if [ -n "$VERSION" ]; then
    echo -e "${GREEN}✓ Deployment Version: $VERSION${NC}"
else
    echo -e "${RED}✗ No deployment version header${NC}"
fi

# Test 3: Force refresh
echo -e "\n${YELLOW}Test 3: Force Refresh${NC}"
REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" "$URL?refresh=true")
REFRESH_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)

if [ "$REFRESH_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Force refresh successful${NC}"
    
    # Check if cache was missed this time
    REFRESH_HEADERS=$(curl -s -I "$URL?refresh=true")
    REFRESH_CACHE_STATUS=$(echo "$REFRESH_HEADERS" | grep -i "x-cache-status" | cut -d' ' -f2 | tr -d '\r')
    
    if [ "$REFRESH_CACHE_STATUS" = "MISS" ]; then
        echo -e "${GREEN}✓ Cache was refreshed (MISS)${NC}"
    else
        echo -e "${YELLOW}⚠ Cache status: $REFRESH_CACHE_STATUS${NC}"
    fi
else
    echo -e "${RED}✗ Force refresh failed: $REFRESH_CODE${NC}"
fi

echo -e "\n${GREEN}Test complete!${NC}"