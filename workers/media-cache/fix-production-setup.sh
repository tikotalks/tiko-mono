#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Media Cache Worker - Fix Production Setup${NC}"
echo "========================================="

# First, let's update wrangler
echo -e "\n${YELLOW}Updating Wrangler to latest version...${NC}"
npm install --save-dev wrangler@4

echo -e "\n${YELLOW}Creating production KV namespace...${NC}"
# Try to create the production namespace
PROD_OUTPUT=$(npx wrangler kv:namespace create "MEDIA_CACHE" --env production 2>&1)
PROD_ID=$(echo "$PROD_OUTPUT" | grep "id =" | sed 's/.*id = "\([^"]*\)".*/\1/')

if [ -n "$PROD_ID" ]; then
    echo -e "${GREEN}Production namespace created:${NC}"
    echo "  ID: $PROD_ID"
    
    # Update wrangler.toml
    sed -i.bak "s/REPLACE_WITH_PRODUCTION_KV_NAMESPACE_ID/$PROD_ID/g" wrangler.toml
    echo -e "${GREEN}wrangler.toml updated with production KV ID${NC}"
else
    echo -e "${YELLOW}Could not create production namespace automatically.${NC}"
    echo -e "${YELLOW}You can create it manually later or use staging for now.${NC}"
    echo ""
    echo "Manual command to create production namespace:"
    echo -e "${BLUE}npx wrangler kv:namespace create \"MEDIA_CACHE\" --env production${NC}"
fi

echo -e "\n${GREEN}Current Setup Status:${NC}"
echo "✅ Development KV namespace configured"
echo "✅ Staging KV namespace configured"
if [ -n "$PROD_ID" ]; then
    echo "✅ Production KV namespace configured"
else
    echo "⚠️  Production KV namespace needs manual configuration"
fi

echo -e "\n${BLUE}Next Steps:${NC}"
echo ""
echo "1. Test with development environment first:"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_URL${NC}"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY${NC}"
echo -e "   ${YELLOW}npx wrangler dev${NC}"
echo ""
echo "2. Deploy to staging:"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_URL --env staging${NC}"
echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY --env staging${NC}"
echo -e "   ${YELLOW}npm run deploy:staging${NC}"
echo ""
if [ -n "$PROD_ID" ]; then
    echo "3. Deploy to production:"
    echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_URL --env production${NC}"
    echo -e "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY --env production${NC}"
    echo -e "   ${YELLOW}npm run deploy:production${NC}"
fi