# Green Horizon Farm Management System

This is a specialized management portal for the **Green Horizon Farm** roleplay business.

## Discord Authentication Setup

To make the "Login with Discord" button work, follow these steps:

### 1. Create a Discord Application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **"New Application"** and name it "Green Horizon Farm".
3. Navigate to **OAuth2 -> General**.
4. Copy your **Client ID**.
5. Click **Reset Secret** to get your **Client Secret**.

### 2. Configure Firebase Console
1. Open your [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication -> Sign-in method**.
3. Click **Add new provider** and select **OpenID Connect (OIDC)**.
4. Set the **Provider ID** to `oidc.discord`.
5. Enter a name (e.g., "Discord").
6. Set **Issuer URL** to `https://discord.com`.
7. Enter the **Client ID** and **Client Secret** you got from Discord.
8. **CRITICAL**: Copy the **Callback URL** provided by Firebase at the bottom of this setup window.

### 3. Finalize Discord Settings
1. Go back to the Discord Developer Portal under **OAuth2 -> General**.
2. Click **Add Redirect** and paste the **Callback URL** you copied from Firebase.
3. Click **Save Changes**.

## Features
- **Farmers Portal**: For Harvesters and Farm Hands.
- **Security Portal**: Perimeter and asset protection.
- **Events Portal**: Community engagement tracking.
- **Finances Portal**: Ledger and accounting.
- **Manager Portal**: Operations oversight.
- **CEO Executive Portal**: Strategic control.
- **Admin Panel**: Technical system configuration (Ranks, Users, Forms).
