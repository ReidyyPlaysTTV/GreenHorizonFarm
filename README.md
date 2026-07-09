
# Green Horizon Farm Management System

This is a specialized management portal for the **Green Horizon Farm** roleplay business.

## Deployment & Repository Management

### Changing the GitHub Repository
If you need to move this project to a different GitHub account or repository, follow these steps:

1. **Update Local Git Remote:**
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO_NAME.git
   git push -u origin main
   ```

2. **Update Firebase App Hosting Connection:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Select **App Hosting** from the Build menu.
   - Select your existing backend.
   - Go to **Settings** > **Deployment**.
   - Click **Change Repository** and link the new GitHub project.

## Features
- **Farmers Portal**: Logistics control and real-time operation alerts.
- **Security Portal**: Perimeter protection and incident logging.
- **Events Portal**: Community engagement and market planning.
- **Finances Portal**: Real-time ledger and 60/40 profit split tracking.
- **Manager Portal**: Operational oversight and product catalog management.
- **CEO Executive Portal**: Strategic control and high-level decision making.
- **Admin Panel**: Technical configuration, User Search, and Diagnostics.

## Authentication
The application uses a secure IC (In-Character) login. 
- New staff must use the **Request Access** link on the landing page.
- Management approves requests and onboards users directly to the roster.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: MariaDB (External Hosting)
- **Styling**: Tailwind CSS + ShadCN UI (RGB Animated Groups)
- **Hosting**: Firebase App Hosting
