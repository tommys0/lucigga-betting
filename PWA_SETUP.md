# PWA Setup Guide - Add to Home Screen

Your app is now configured as a Progressive Web App (PWA) and can be added to home screens on mobile devices!

## ✅ What's Been Configured

- **Mobile responsive design** - Works great on all screen sizes
- **PWA manifest** - Enables "Add to Home Screen"
- **Persistent login** - Stay logged in for 30 days
- **Optimized viewport** - Perfect for mobile use

## 📱 How to Add to Home Screen

### iPhone/iPad (Safari)
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Lucka Betting" and tap "Add"
5. The app icon will appear on your home screen!

### Android (Chrome)
1. Open the app in Chrome
2. Tap the three dots menu
3. Tap "Add to Home Screen" or "Install App"
4. Confirm by tapping "Add"
5. The app icon will appear on your home screen!

## 🎨 Creating App Icons (Required)

You need to create two icon files:

### Option 1: Use an Online Tool
1. Go to https://www.favicon-generator.org/
2. Upload a simple image (clock emoji screenshot, purple gradient, etc.)
3. Generate and download icons
4. Rename them to:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)
5. Place both files in `/public/` folder

### Option 2: Create Manually
Using any image editor (Photoshop, GIMP, Canva, etc.):

**icon-192.png:**
- Size: 192x192 pixels
- Background: Purple gradient (#581c87 to #be185d)
- Add: ⏰ emoji or "LB" text in white
- Save as PNG

**icon-512.png:**
- Size: 512x512 pixels
- Same design as above
- Save as PNG

### Quick Text-Based Icons
```bash
# Create simple colored squares (temporary solution)
cd public
convert -size 192x192 xc:#581c87 icon-192.png
convert -size 512x512 xc:#581c87 icon-512.png
```

## 🔄 Session Persistence

Users will now stay logged in for **30 days**! They won't need to log in every time they open the app on their phone.

**Features:**
- ✅ Login once, stay logged in
- ✅ Works across app restarts
- ✅ Secure cookie-based authentication
- ✅ Auto-logout after 30 days of inactivity

## 📊 Mobile Features

- **Responsive header** - Adapts to small screens
- **Touch-friendly buttons** - Larger tap targets
- **Optimized forms** - Easy to fill on mobile
- **Smooth scrolling** - Native app feel
- **No zoom needed** - Perfect viewport scaling

## 🎯 Best Practices for Daily Use

1. **Morning Routine:**
   - Open app from home screen
   - Already logged in!
   - Quickly place your bet
   - Takes < 30 seconds

2. **TV Display:**
   - Open `/players` on classroom TV
   - Shows live leaderboard
   - Auto-refreshes every 5 seconds

3. **Admin:**
   - Add users once
   - They stay logged in on their phones
   - Easy daily betting

## 🔧 Troubleshooting

**"Add to Home Screen" not showing?**
- Make sure you're using Safari (iOS) or Chrome (Android)
- Some browsers don't support PWA features
- Try accessing via the network IP address

**Not staying logged in?**
- Check that cookies are enabled
- Don't use incognito/private mode
- Make sure you don't clear browser data

**Icons not showing?**
- Create the icon files as described above
- Clear browser cache and reinstall
- Check that files are named exactly: `icon-192.png` and `icon-512.png`

## 🚀 Network Access

Access from any device on same WiFi:
```
http://YOUR-NETWORK-IP:3000
```

Check the dev server output for your network IP!

## 💡 Tips

- **First time setup:** Each person adds app to their home screen once
- **Daily use:** Just tap the icon - instant access, already logged in!
- **Updates:** If you change the app, users might need to refresh once
- **Offline:** App won't work offline (needs server connection)

Enjoy your mobile betting experience! 🎲📱
