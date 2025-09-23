# KMS AI Leaderboard - AI FOR EVERYONE

A modern, responsive web application for KMS Technology's AI community initiative. This platform allows employees to share AI tips, participate in challenges, and track progress through an interactive leaderboard system.

## Features

- **Modern UI/UX**: Built with Tailwind CSS and custom animations
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Interactive Navigation**: Smooth transitions between sections
- **AI Playbook**: Social media-style cards for sharing AI tips
- **Tip Submission**: Easy-to-use form for contributing AI tips
- **Leaderboard System**: Individual and team rankings
- **Rewards Tracking**: Points system with various reward tiers
- **Google Sheets Integration**: Backend data management
- **Accessibility**: WCAG compliant with keyboard navigation support

## Project Structure

```
kms-ai-leaderboard/
├── index.html                    # Main HTML file
├── script.js                     # Core JavaScript functionality
├── styles.css                    # Custom CSS styles and animations
├── google-sheets-integration.js  # Google Sheets API integration
├── README.md                     # Project documentation
└── assets/                       # Images and other assets (optional)
```

## Quick Start

1. **Clone or download** the project files
2. **Open `index.html`** in a modern web browser
3. **Navigate** through different sections using the top navigation
4. **Submit tips** using the "Tip Submission" form
5. **View leaderboards** and track progress

## Sections Overview

### 1. About the Program
- Program introduction and objectives
- KMS branding and visual elements
- Community-driven initiative description

### 2. AI Playbook
- Social media-style tip cards
- Filtering by categories (Development Hub, Testing Hub)
- Interactive engagement features (likes, comments, shares)

### 3. How to Participate
- Process flowchart visualization
- Step-by-step participation guide
- Tip submission form with validation

### 4. Scheme & Rewards
- Detailed rewards structure
- Points system explanation
- Interactive leaderboard with Individual/Team tabs
- Prize tiers and qualification criteria

### 5. FAQs
- Common questions and answers
- Program guidelines and policies
- Cross-references to other sections

## Google Sheets Integration

### Setup Instructions

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Sheets API

2. **Generate API Credentials**
   - Create an API key or OAuth 2.0 client ID
   - Configure authorized domains if using OAuth

3. **Create Google Spreadsheet**
   ```
   Sheet 1: "Tips"
   Columns: Timestamp | Email | Content | Status | Comments | Level | Points | Reactions
   
   Sheet 2: "ApprovedTips" 
   Columns: ID | Timestamp | Email | Content | Status | Category | Level | Points | Reactions | Comments
   
   Sheet 3: "Leaderboard"
   Columns: Function/Program | Account | Points | Points/Team Size
   ```

4. **Configure Integration**
   - Update `SPREADSHEET_ID` in `google-sheets-integration.js`
   - Replace `YOUR_API_KEY` with your actual API key
   - Add Google API library to HTML:
   ```html
   <script src="https://apis.google.com/js/api.js"></script>
   ```

5. **Enable Enhanced Features**
   ```javascript
   // Replace the default app initialization with:
   const app = new AILeaderboardAppWithSheets();
   ```

### Data Structure

#### Tips Sheet
| Column | Description | Example |
|--------|-------------|---------|
| A | Timestamp | 2024-01-15T10:30:00Z |
| B | Email | user@kms-technology.com |
| C | Content | "Use ChatGPT for code review..." |
| D | Status | Pending/Approved/Rejected |
| E | Comments | AI Taskforce feedback |
| F | Level | Basic/Intermediate/Advanced |
| G | Points | 50 |
| H | Reactions | 25 |

#### Leaderboard Sheet
| Column | Description | Example |
|--------|-------------|---------|
| A | Function/Program | Development Team |
| B | Account | John Doe |
| C | Points | 450 |
| D | Points/Team Size | 90 |

## Customization

### Colors and Branding
Update the Tailwind configuration in `index.html`:
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'kms-blue': '#00BFFF',      // Primary brand color
                'kms-dark-blue': '#1E40AF',  // Secondary brand color
                'kms-light-blue': '#E0F2FE'  // Background accent
            }
        }
    }
}
```

### Content Management
- **Tip Categories**: Update filter buttons in `getPlaybookContent()`
- **FAQ Items**: Modify `getFAQsContent()` method
- **Reward Tiers**: Adjust values in `getRewardsContent()`

### Styling
- **Animations**: Customize in `styles.css`
- **Responsive Breakpoints**: Modify media queries
- **Component Styles**: Update Tailwind classes in JavaScript templates

## Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile 80+
- **Features**: ES6+ JavaScript, CSS Grid, Flexbox, CSS Custom Properties

## Performance Optimization

- **Lazy Loading**: Images and content sections load on demand
- **Caching**: Browser caching for static assets
- **Minification**: Consider minifying CSS/JS for production
- **CDN**: Using CDN for external libraries (Tailwind, FontAwesome)

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Visible focus indicators

## Development

### Local Development
1. Use a local web server (not file:// protocol) for full functionality
2. Python: `python -m http.server 8000`
3. Node.js: `npx http-server`
4. VS Code: Use Live Server extension

### Testing
- **Cross-browser testing** on major browsers
- **Mobile testing** on various devices
- **Accessibility testing** with screen readers
- **Performance testing** with Lighthouse

## Deployment

### Simple Hosting
- Upload files to any web server
- Ensure HTTPS for Google Sheets API
- Configure CORS if needed

### GitHub Pages
```bash
git add .
git commit -m "Deploy KMS AI Leaderboard"
git push origin main
```
Enable GitHub Pages in repository settings

### Production Checklist
- [ ] Replace API keys with production values
- [ ] Configure Google Sheets permissions
- [ ] Test all form submissions
- [ ] Verify responsive design
- [ ] Check accessibility compliance
- [ ] Optimize images and assets

## Support and Maintenance

### Regular Updates
- **Content**: Update FAQ and reward information
- **Data**: Monitor Google Sheets integration
- **Security**: Keep API keys secure and rotated

### Troubleshooting
- **Google Sheets not loading**: Check API key and permissions
- **Form not submitting**: Verify network connectivity
- **Mobile issues**: Test on actual devices, not just browser dev tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary to KMS Technology. All rights reserved.

## Contact

For technical support or questions about the AI FOR EVERYONE initiative, contact the KMS AI Taskforce team.

---

**Built with ❤️ by the KMS AI Taskforce**
