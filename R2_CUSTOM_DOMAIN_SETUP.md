# Setting up R2 Custom Domain for media.tikocdn.org

## Steps to connect R2 bucket to custom domain:

1. **Go to Cloudflare Dashboard**
   - Navigate to your account
   - Click on "R2" in the left sidebar

2. **Select your bucket**
   - Click on the "media" bucket

3. **Settings tab**
   - Click on the "Settings" tab for the bucket

4. **Custom Domains section**
   - Find "Custom Domains" section
   - Click "Connect Domain"

5. **Add domain**
   - Enter: `media.tikocdn.org`
   - Click "Continue"

6. **Confirm**
   - Cloudflare will set up the necessary DNS records
   - Click "Connect domain"

## What this does:
- Makes all files in the R2 bucket accessible at https://media.tikocdn.org/
- Your existing image URLs (https://media.tikocdn.org/uploads/...) will work
- Supports Cloudflare's image transformation features (width, format, etc.)

## Note:
The worker is now handling API endpoints at api.tikocdn.org, completely separate from the media serving.