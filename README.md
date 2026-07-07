# Green Horizon Farm Management System

This is a specialized management portal for the **Green Horizon Farm** roleplay business.

## Discord Authentication Setup

To make the "Login with Discord" button work, follow these steps:

### 1. Discord Developer Portal
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your application: **Green Horizon Farm**.
3. Navigate to **OAuth2 -> General**.
4. **Client ID**: `1523875371240656927`
5. **Client Secret**: `UfX1XMw40YzMtMTlV_3Ew-Af1jM5Abqx`
6. Click **Add Redirect** and paste this URL:
   `https://green-horizon-farm.firebaseapp.com/__/auth/handler`
   *(Replace 'green-horizon-farm' with your real Firebase Project ID found in config.ts)*
7. Click **Save Changes**.

### 2. Configure Firebase Console
1. Open your [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication -> Sign-in method**.
3. Click **Add new provider** and select **OpenID Connect (OIDC)**.
4. Set the **Provider ID** to `oidc.discord`.
5. Enter a name: `Discord`.
6. Set **Issuer URL** to `https://discord.com`.
7. Enter the **Client ID** and **Client Secret** provided above.
8. Click **Save**.

## Features
- **Farmers Portal**: For Harvesters and Farm Hands.
- **Security Portal**: Perimeter and asset protection.
- **Events Portal**: Community engagement tracking.
- **Finances Portal**: Ledger and accounting.
- **Manager Portal**: Operations oversight.
- **CEO Executive Portal**: Strategic control.
- **Admin Panel**: Technical system configuration (Ranks, Users, Forms).
