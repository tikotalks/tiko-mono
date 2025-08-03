# Translation Keys to Add for Deployment Enhancement

These translation keys need to be added to the database for the deployment and backup features:

## Deployment Keys
- `admin.navigation.deployment` = "Deployment"
- `admin.navigation.deploymentBackups` = "Database Backups"
- `deployment.version` = "Version"
- `deployment.buildNumber` = "Build"
- `deployment.commit` = "Commit"

## Backup Keys
- `deployment.backups.title` = "Database Backups"
- `deployment.backups.subtitle` = "Monitor and trigger database backups via GitHub Actions"
- `deployment.backups.create` = "Trigger Backup"
- `deployment.backups.createFirst` = "Trigger First Backup"
- `deployment.backups.loading` = "Loading backup runs..."
- `deployment.backups.empty.title` = "No backup runs found"
- `deployment.backups.empty.description` = "Trigger your first backup to get started with database management."
- `deployment.backups.createdAt` = "Created"
- `deployment.backups.triggeredBy` = "Triggered by"
- `deployment.backups.workflow` = "Workflow"
- `deployment.backups.branch` = "Branch"
- `deployment.backups.metadata` = "Metadata"
- `deployment.backups.download` = "View Run"
- `deployment.backups.viewOnGithub` = "View on GitHub"
- `deployment.backups.details` = "Details"
- `deployment.backups.delete` = "Delete"
- `deployment.backups.deleteNotSupported` = "GitHub workflow runs cannot be deleted"
- `deployment.backups.status.creating` = "Running"
- `deployment.backups.status.success` = "Success"
- `deployment.backups.status.failed` = "Failed"
- `deployment.backups.confirm.title` = "Trigger New Backup"
- `deployment.backups.confirm.description` = "This will trigger a new backup workflow in the tiko-db-backup repository. Please provide a name and optional description."
- `deployment.backups.form.name` = "Backup Name"
- `deployment.backups.form.namePlaceholder` = "Enter backup name"
- `deployment.backups.form.description` = "Description"
- `deployment.backups.form.descriptionPlaceholder` = "Optional description"
- `deployment.backups.success.created` = "Backup workflow triggered successfully"
- `deployment.backups.error.create` = "Failed to trigger backup workflow"
- `deployment.backups.error.load` = "Failed to load backup runs"
- `deployment.backups.error.download` = "Failed to open GitHub run"
- `deployment.backups.details.title` = "Backup Run Details for {name}"

## Existing Translation Key Still Needed
- `auth.skipLogin` = "Skip Login"