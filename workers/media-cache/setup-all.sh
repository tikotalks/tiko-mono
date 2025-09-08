#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Media Cache Worker - Complete Setup${NC}"
echo -e "${BLUE}==================================${NC}"

# Step 1: Install dependencies
echo -e "\n${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

# Step 2: Make scripts executable
echo -e "\n${YELLOW}Step 2: Making scripts executable...${NC}"
chmod +x scripts/*.sh

# Step 3: Run KV setup
echo -e "\n${YELLOW}Step 3: Setting up KV namespaces...${NC}"
./scripts/setup-kv.sh

# Check if setup was successful
if grep -q "REPLACE_WITH_.*_KV_NAMESPACE_ID" wrangler.toml; then
    echo -e "${RED}KV setup failed. Please check the output above.${NC}"
    exit 1
fi

echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}==================================${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo ""
echo "1. Set up secrets for production:"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_URL --env production${NC}"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY --env production${NC}"
echo ""
echo "2. Deploy to production:"
echo -e "   ${YELLOW}npm run deploy:production${NC}"
echo ""
echo "3. Test the deployment:"
echo -e "   ${YELLOW}npm run test:production${NC}"
echo ""
echo -e "${BLUE}For staging deployment:${NC}"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_URL --env staging${NC}"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY --env staging${NC}"
echo -e "   ${YELLOW}npm run deploy:staging${NC}"