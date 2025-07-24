# EXACT Steps to Add CORS Headers in Cloudflare

## 1. Log into Cloudflare
Go to: https://dash.cloudflare.com

## 2. Select Your Domain
Click on the domain that hosts `media.tikocdn.org` (likely `tikocdn.org`)

## 3. Navigate to Transform Rules
In the left sidebar, look for:
- **Rules** (it has a shield icon)
- Click on **Rules**
- Then click on **Transform Rules**

## 4. Create a Transform Rule
1. Click on **"Create rule"** button
2. Choose **"Modify Response Header"** tab

## 5. Configure the Rule

### Rule name:
`R2 CORS Headers`

### If... (When incoming requests match...)
Choose "Custom filter expression" and enter:
```
(http.host eq "media.tikocdn.org")
```

### Then... (Modify response header)
Click "Add" for each header:

**Header 1:**
- Set: `Static`
- Header name: `Access-Control-Allow-Origin`
- Value: `*`

**Header 2:**
- Set: `Static`
- Header name: `Access-Control-Allow-Methods`
- Value: `GET, HEAD, OPTIONS, PUT, POST, DELETE`

**Header 3:**
- Set: `Static`
- Header name: `Access-Control-Allow-Headers`
- Value: `*`

**Header 4:**
- Set: `Static`
- Header name: `Access-Control-Max-Age`
- Value: `86400`

## 6. Deploy
Click **"Deploy"** button at the bottom

## 7. Update Your Code
In your `.env` file, change:
```
R2_ENDPOINT=https://media.tikocdn.org
```

## Visual Guide:
```
Cloudflare Dashboard
└── Your Domain (tikocdn.org)
    └── Rules (in sidebar)
        └── Transform Rules
            └── Create rule
                └── Modify Response Header
                    └── Add headers as shown above
```

## Note:
If you can't find "Rules" in the sidebar, it might be under:
- "Security" → "WAF" → "Custom rules"
- Or "Configuration" → "Rules"

The exact location depends on your Cloudflare plan and interface version.