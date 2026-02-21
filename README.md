# FleetFlow Pro - Hackathon Project

## Team Distribution (4 Main Files)
1. **Backend Lead** (`/server.ts`): Responsible for API, Database, and Server logic.
2. **Frontend Lead** (`/src/App.tsx`): Responsible for UI Components, Layouts, and React logic.
3. **Shared Lead** (`/src/shared.ts`): Responsible for Types, Interfaces, and Constants.
4. **Project Lead** (`/README.md`): Responsible for Documentation, Git Guide, and Configuration.

## Git Multi-Account Guide

To push to the same repository from four different accounts on different machines:

### 1. Set Identity Locally
Each team member should run these commands in their terminal:
```bash
git config user.name "Your Name"
git config user.email "your-email@example.com"
```

### 2. Handling Multiple Accounts on ONE Machine
If you are all using the same computer, use SSH keys for each account:
1. Generate keys: `ssh-keygen -t ed25519 -C "email@account1.com" -f ~/.ssh/id_ed25519_acc1`
2. Add to GitHub/GitLab settings.
3. Create a `~/.ssh/config` file:
```text
Host github-acc1
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_acc1

Host github-acc2
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_acc2
```
4. Clone using the alias: `git clone git@github-acc1:username/repo.git`

### 3. Pushing Changes
```bash
git add .
git commit -m "Update [Your File Name]"
git push origin main
```
