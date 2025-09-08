#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to production
ENVIRONMENT=${1:-production}

echo -e "${BLUE}Media Cache Worker - Deployment${NC}"
echo "================================"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if wrangler.toml has been configured
if grep -q "REPLACE_WITH_.*_KV_NAMESPACE_ID" wrangler.toml; then
    echo -e "${RED}Error: wrangler.toml has not been configured${NC}"
    echo "Run: npm run setup:kv"
    exit 1
fi

# Deploy based on environment
case $ENVIRONMENT in
  "development"|"dev")
    echo -e "${YELLOW}Deploying to development...${NC}"
    npx wrangler deploy
    ;;
  "staging"|"stage")
    echo -e "${YELLOW}Deploying to staging...${NC}"
    npx wrangler deploy --env staging
    ;;
  "production"|"prod")
    echo -e "${YELLOW}Deploying to production...${NC}"
    npx wrangler deploy --env production
    ;;
  *)
    echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
    echo "Valid environments: development, staging, production"
    exit 1
    ;;
esac

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Deployment successful!${NC}"
    
    # Show the URL based on environment
    case $ENVIRONMENT in
      "development"|"dev")
        echo "URL: Will be provided by wrangler dev server"
        ;;
      "staging"|"stage")
        echo "URL: https://staging-tikoapi.org/media/cache"
        ;;
      "production"|"prod")
        echo "URL: https://tikoapi.org/media/cache"
        ;;
    esac
else
    echo -e "\n${RED}Deployment failed!${NC}"
    exit 1
fi