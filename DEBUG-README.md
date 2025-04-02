# MotivateMe App Debugging

This guide provides instructions for troubleshooting the MotivateMe app using the debug tools we've created.

## Available Debug Files

1. **debug.html** - A version of the app with built-in console logging for DOM elements, error tracking, and event simulation
2. **fix-app.js** - A simplified JavaScript file with defensive coding to avoid common errors
3. **simple-index.html** - A clean HTML file designed to work with the fix-app.js

## Using debug.html

The debug.html file includes a special debug console that appears at the bottom of the page. This console will show:
- Missing DOM elements
- Local storage operations
- Click event logs
- Any JavaScript errors

To use the debug console:
1. Open debug.html in your browser
2. The debug console will appear at the bottom of the page
3. Click the "Toggle Console" button to hide/show the console
4. Interact with the app and watch the logs in real-time

### Debug Functions

The debug console includes special testing functions:
- `simulateClick(selector)` - Test what happens when you click on an element
- `checkElement(id)` - Verify if a DOM element exists and log its properties
- `checkLocalStorage()` - Display current localStorage contents for the app

Example: In your browser console, try:
```javascript
checkElement('task-input');
simulateClick('#add-task-btn');
checkLocalStorage();
```

## Using the Simple Version

If you're having issues with the regular version of the app, try the simplified version:

1. Open **simple-index.html** in your browser
2. This file uses **fix-app.js** instead of the regular app.js
3. All core functionality should work, but with more defensive coding

The simplified version includes:
- Null checks before accessing DOM elements
- Try/catch blocks around localStorage operations
- More logging to help identify issues
- Simplified event binding

## Common Issues and Solutions

1. **Missing Elements**
   - Check the debug console for "Element not found" messages
   - Ensure all HTML elements have the correct IDs

2. **Event Listeners Not Working**
   - Use `simulateClick()` to test if events are properly bound
   - Check the console for any JavaScript errors

3. **Data Not Saving**
   - Use `checkLocalStorage()` to verify data is being saved
   - Check for localStorage permission issues in your browser

4. **Visual/Style Issues**
   - Compare the DOM structure between debug.html and index.html
   - Check for missing CSS classes or styles

## How to Restore Your Data

If you need to reset your app data:
1. Go to Settings in the app
2. Click "Reset All Data"

Or, to manually clear data:
```javascript
localStorage.removeItem('motivateMeData');
```

## Reporting Issues

If you find bugs that aren't resolved by these debugging tools:
1. Note the exact steps to reproduce the issue
2. Copy any error messages from the debug console
3. Take a screenshot showing the problem
4. File a detailed report including all of the above information 