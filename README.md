# Some100 - AI Chat Interface

A modern, sleek AI chat interface with an animated employee card system. Built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/caraulani/some100.git
cd some100
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

## 📁 Project Structure

```
some100/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx    # Main landing page with chat input
│   │   └── EmployeeCard.tsx   # Animated 3D employee ID card
│   ├── assets/
│   │   └── logo.svg           # Some100 logo
│   ├── types/
│   │   └── chat.ts           # TypeScript type definitions
│   ├── utils/
│   │   └── mockData.ts       # Mock data for AI responses
│   └── App.tsx               # Main app component
├── public/
│   └── background-video.mp4  # Point cloud animation background
└── package.json
```

## 🎨 Features

- **Animated Employee Card**: 3D tilt effect with hover animations
- **Smart Input Box**: Expandable textarea with file attachments
- **Focus States**: Ultra-refined glowing focus effects
- **Background Video**: Full-screen point cloud animation
- **Responsive Design**: Optimized for various screen sizes
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 🎯 Key Components

### LandingPage
The main interface featuring:
- Centered title with animated cursor
- Employee card that disappears after first message
- Input box with file attachment support
- Public/Private toggle
- Voice input button (placeholder)

### EmployeeCard
A futuristic ID card with:
- 3D perspective tilt on hover
- Holographic overlay effects
- Dotted profile silhouette
- Company logo watermark
- Gradient border

## 🔧 Configuration

### Fonts
The app uses **Saira** font from Google Fonts. It's automatically loaded via CDN in `index.html`.

### Background Video
To change the background video:
1. Add your video file to `/public/` 
2. Name it `background-video.mp4`
3. Or update the source in `LandingPage.tsx`

## 🚦 Testing

1. **Basic functionality test**:
   - Type in the input box
   - Attach files using the + button
   - Press Enter or click Send
   - Verify card disappears after sending

2. **Visual tests**:
   - Hover over the employee card - should tilt
   - Click input box - should glow
   - Check responsive layout on different screens

## 📝 Notes for Development

- The chat interface is currently using mock data
- To integrate real AI responses, update the logic in `handleSendMessage()`
- File attachments are stored in state but not processed yet
- The mic button is a placeholder for future voice input

## 🐛 Troubleshooting

### Port already in use
If port 5173 is busy, Vite will automatically use the next available port.

### Video not playing
- Check that `background-video.mp4` exists in `/public/`
- Ensure the video format is supported (MP4 recommended)
- Some browsers require user interaction before autoplay

### Fonts not loading
- Check internet connection (fonts load from Google)
- Verify `index.html` includes the font link

## 🤝 Contributing

1. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit
```bash
git add .
git commit -m "Add your feature description"
```

3. Push to GitHub
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request on GitHub

## 📄 License

Private repository - All rights reserved

## 👥 Team

- Created by: Julian & Claude Code
- Repository: https://github.com/caraulani/some100

---

For questions or issues, open an issue on GitHub or contact the team.# orchestratrator-ui-burner
