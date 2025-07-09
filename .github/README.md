# CI/CD Configuration

This directory contains GitHub Actions workflows for building and deploying the Tiko monorepo apps.

## Workflows

### 1. Build and Deploy Web Apps (`build-and-deploy.yml`)

Automatically builds and deploys all web applications to Netlify when code is pushed to `main` or `develop` branches.

**Apps deployed:**
- Cards → https://cards.tiko.mt
- Radio → https://radio.tiko.mt  
- Timer → https://timer.tiko.mt
- Type → https://type.tiko.mt
- Yes-No → https://yes-no.tiko.mt

**Required GitHub Secrets:**
- `NETLIFY_AUTH_TOKEN` - Your Netlify personal access token

**Automatic Site Creation:**
- Sites are automatically created with names: `cards-tiko`, `radio-tiko`, etc.
- Custom domains are automatically configured: `cards.tiko.mt`, `radio.tiko.mt`, etc.
- No manual site setup required!

### 2. iOS Apps (`ios-apps.yml`)

Prepared workflow for building iOS apps using Capacitor. Currently disabled pending Capacitor setup.

**To enable iOS builds:**
1. Install Capacitor dependencies:
   ```bash
   pnpm add @capacitor/core @capacitor/cli @capacitor/ios
   ```

2. Create `capacitor.config.ts` for each app:
   ```typescript
   import { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'mt.tiko.appname',
     appName: 'App Name',
     webDir: 'dist',
     server: {
       androidScheme: 'https'
     }
   };

   export default config;
   ```

3. Initialize iOS platform for each app:
   ```bash
   cd apps/appname
   npx cap add ios
   npx cap sync ios
   ```

4. Uncomment the iOS build steps in the workflow

## Setup Instructions

### 1. GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
```

That's it! The Netlify CLI will automatically:
- Create sites if they don't exist
- Configure custom domains
- Deploy to the correct environment

### 2. Domain Configuration

Ensure your DNS is configured to point each subdomain to Netlify:

```
CNAME cards.tiko.mt → cards-tiko.netlify.app
CNAME radio.tiko.mt → radio-tiko.netlify.app
CNAME timer.tiko.mt → timer-tiko.netlify.app
CNAME type.tiko.mt → type-tiko.netlify.app
CNAME yes-no.tiko.mt → yes-no-tiko.netlify.app
```

The workflow will automatically configure these custom domains in Netlify.

## Deployment Process

1. **Automatic Deployment**: Push to `main` or `develop` triggers builds
2. **Manual Deployment**: Use GitHub Actions "Run workflow" button
3. **Pull Request Previews**: PRs get preview deployments with comments

## Monitoring

- Build status: Check Actions tab in GitHub
- Deployment status: Check Netlify dashboard
- Site health: Monitor each app at their respective domains

## Troubleshooting

**Build fails:**
- Check the Actions logs
- Verify all secrets are set correctly
- Ensure all apps build successfully locally

**Deployment fails:**
- Verify Netlify site IDs are correct
- Check Netlify auth token has proper permissions
- Verify domain configuration

**Missing apps:**
- Add new apps to the matrix strategy in `build-and-deploy.yml`
- Create corresponding `netlify.toml` files
- Add new GitHub secrets for additional sites