#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Media Cache Worker - KV Setup${NC}"
echo "================================"

# Function to extract KV namespace ID from wrangler output
extract_kv_id() {
    echo "$1" | grep -o 'id = "[^"]*"' | sed 's/id = "\(.*\)"/\1/'
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Create development/preview KV namespace
echo -e "\n${YELLOW}Creating development KV namespace...${NC}"
DEV_OUTPUT=$(npx wrangler kv:namespace create "MEDIA_CACHE" --preview 2>&1)
DEV_ID=$(echo "$DEV_OUTPUT" | grep "id =" | head -1 | sed 's/.*id = "\([^"]*\)".*/\1/')
PREVIEW_ID=$(echo "$DEV_OUTPUT" | grep "preview_id =" | sed 's/.*preview_id = "\([^"]*\)".*/\1/')

if [ -z "$DEV_ID" ]; then
    echo -e "${RED}Failed to create development KV namespace${NC}"
    echo "$DEV_OUTPUT"
    exit 1
fi

echo -e "${GREEN}Development namespace created:${NC}"
echo "  ID: $DEV_ID"
echo "  Preview ID: $PREVIEW_ID"

# Create staging KV namespace
echo -e "\n${YELLOW}Creating staging KV namespace...${NC}"
STAGING_OUTPUT=$(npx wrangler kv:namespace create "MEDIA_CACHE" --env staging 2>&1)
STAGING_ID=$(echo "$STAGING_OUTPUT" | grep "id =" | sed 's/.*id = "\([^"]*\)".*/\1/')

if [ -z "$STAGING_ID" ]; then
    echo -e "${RED}Failed to create staging KV namespace${NC}"
    echo "$STAGING_OUTPUT"
    exit 1
fi

echo -e "${GREEN}Staging namespace created:${NC}"
echo "  ID: $STAGING_ID"

# Create production KV namespace
echo -e "\n${YELLOW}Creating production KV namespace...${NC}"
PROD_OUTPUT=$(npx wrangler kv:namespace create "MEDIA_CACHE" --env production 2>&1)
PROD_ID=$(echo "$PROD_OUTPUT" | grep "id =" | sed 's/.*id = "\([^"]*\)".*/\1/')

if [ -z "$PROD_ID" ]; then
    echo -e "${RED}Failed to create production KV namespace${NC}"
    echo "$PROD_OUTPUT"
    exit 1
fi

echo -e "${GREEN}Production namespace created:${NC}"
echo "  ID: $PROD_ID"

# Update wrangler.toml with the KV IDs
echo -e "\n${YELLOW}Updating wrangler.toml...${NC}"

# Backup original
cp wrangler.toml wrangler.toml.backup

# Update the file
sed -i.tmp "s/REPLACE_WITH_KV_NAMESPACE_ID/$DEV_ID/g" wrangler.toml
sed -i.tmp "s/REPLACE_WITH_PREVIEW_KV_NAMESPACE_ID/$PREVIEW_ID/g" wrangler.toml
sed -i.tmp "s/REPLACE_WITH_STAGING_KV_NAMESPACE_ID/$STAGING_ID/g" wrangler.toml
sed -i.tmp "s/REPLACE_WITH_PRODUCTION_KV_NAMESPACE_ID/$PROD_ID/g" wrangler.toml
rm -f wrangler.toml.tmp

echo -e "${GREEN}wrangler.toml updated successfully!${NC}"

# Instructions for secrets
echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Set up secrets for each environment:"
echo ""
echo "   Development:"
echo "   ${YELLOW}npx wrangler secret put SUPABASE_URL${NC}"
echo "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY${NC}"
echo ""
echo "   Staging:"
echo "   ${YELLOW}npx wrangler secret put SUPABASE_URL --env staging${NC}"
echo "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY --env staging${NC}"
echo ""
echo "   Production:"
echo "   ${YELLOW}npx wrangler secret put SUPABASE_URL --env production${NC}"
echo "   ${YELLOW}npx wrangler secret put SUPABASE_SERVICE_KEY --env production${NC}"
echo ""
echo "2. Deploy the worker:"
echo "   Development: ${YELLOW}npx wrangler deploy${NC}"
echo "   Staging: ${YELLOW}npx wrangler deploy --env staging${NC}"
echo "   Production: ${YELLOW}npx wrangler deploy --env production${NC}"
echo ""
echo -e "${GREEN}Setup complete!${NC}"