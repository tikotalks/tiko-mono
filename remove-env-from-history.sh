#!/bin/bash

echo "⚠️  WARNING: This will rewrite git history to remove .env file"
echo "This is a destructive operation that will:"
echo "1. Remove .env from ALL commits in history"
echo "2. Require force-pushing to remote"
echo "3. Require all team members to re-clone the repo"
echo ""
echo "Make sure you have:"
echo "✓ Backed up your .env file locally (.env.backup exists)"
echo "✓ Committed all your changes"
echo "✓ Coordinated with your team"
echo ""
read -p "Do you want to proceed? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🔄 Removing .env from git history..."
    
    # Using git filter-repo (recommended over filter-branch)
    if command -v git-filter-repo &> /dev/null
    then
        echo "Using git filter-repo..."
        git filter-repo --path .env --invert-paths --force
    else
        echo "git-filter-repo not found. Installing it is recommended:"
        echo "brew install git-filter-repo"
        echo ""
        echo "Alternative: Using git filter-branch (slower, less safe)..."
        FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force --index-filter \
            'git rm --cached --ignore-unmatch .env' \
            --prune-empty --tag-name-filter cat -- --all
    fi
    
    echo ""
    echo "✅ History rewritten locally"
    echo ""
    echo "Next steps:"
    echo "1. Review the changes: git log --oneline"
    echo "2. Force push to remote: git push origin --force --all"
    echo "3. Force push tags: git push origin --force --tags"
    echo "4. Clean up refs: git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin"
    echo "5. Garbage collect: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
    echo ""
    echo "⚠️  IMPORTANT: All team members should:"
    echo "   - Save any local changes"
    echo "   - Delete their local repo"
    echo "   - Re-clone from remote"
else
    echo "❌ Operation cancelled"
fi

# Restore the .env file locally
if [ -f .env.backup ]; then
    cp .env.backup .env
    echo "✅ .env file restored locally from backup"
fi