# Property Management System (PMS) - Frontend

A modern, responsive React.js frontend application for the Property Management System - a comprehensive real estate platform for buying, selling, and renting properties.

## 🚀 Features

### User Features
- **User Registration & Authentication** with OTP verification
- **Property Search** with advanced filters (location, price, size, type)
- **Property Details** view with image galleries
- **Save/Favorite Properties** functionality
- **User Dashboard** with activity tracking
- **Transaction History** management
- **Real-time Messaging** with agents

### Agent Features
- **Agent Registration** with document verification
- **Property Management** - Add, edit, delete listings
- **Agent Dashboard** with performance metrics
- **Inquiry Management** system
- **Commission Tracking**
- **Professional Profile** management

### Admin Features
- **Comprehensive Admin Dashboard**
- **User & Agent Management**
- **Property Moderation**
- **Transaction Monitoring**
- **Analytics & Reports**
- **System Settings** configuration

## 🛠️ Technology Stack

- **React 18.2** - Frontend framework
- **React Router v6** - Routing
- **Tailwind CSS 3.3** - Styling
- **Radix UI** - Headless UI components
- **Zustand** - State management
- **React Query** - Data fetching & caching
- **React Hook Form** - Form handling
- **Axios** - API communication
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components
│   ├── property/     # Property-related components
│   └── agent/        # Agent-related components
├── pages/
│   ├── auth/         # Authentication pages
│   ├── dashboard/    # Dashboard pages
│   │   ├── user/     # User dashboard
│   │   ├── agent/    # Agent dashboard
│   │   └── admin/    # Admin dashboard
│   └── ...          # Other pages
├── services/         # API services
├── store/           # State management
└── lib/             # Utility functions
```

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sem7_project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm eject` - Ejects from Create React App (use with caution)

## 🎨 UI Components

The project uses a custom UI component library built with Radix UI and Tailwind CSS:

- **Button** - Various button styles and variants
- **Card** - Container component with header and content
- **Input** - Form input fields
- **Select** - Dropdown select component
- **Badge** - Status indicators
- **Avatar** - User/agent profile pictures
- **Tabs** - Tabbed navigation
- **Dialog/Modal** - Pop-up dialogs
- And many more...

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔐 Authentication Flow

1. **User Registration** → Email/OTP Verification → Login
2. **Agent Registration** → Document Upload → Admin Approval → Login
3. **Protected Routes** based on user roles (User, Agent, Admin)

## 🌐 API Integration

The frontend is designed to integrate with a RESTful API backend. Key endpoints include:

- `/auth/*` - Authentication endpoints
- `/properties/*` - Property CRUD operations
- `/users/*` - User management
- `/agents/*` - Agent management
- `/transactions/*` - Transaction handling
- `/admin/*` - Admin operations

## 📝 Environment Variables

```env
REACT_APP_API_URL=<your-api-url>
REACT_APP_GOOGLE_MAPS_KEY=<google-maps-api-key>
REACT_APP_CLOUDINARY_URL=<cloudinary-upload-url>
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- Frontend Development: React.js Team
- Backend Development: .NET Team
- UI/UX Design: Design Team
- Project Management: PM Team

## 📞 Support

For support, email support@propertyhub.com or raise an issue in the repository.

## 🔮 Future Enhancements

- [ ] Virtual Property Tours (360° view)
- [ ] AI-powered Property Recommendations
- [ ] Mortgage Calculator Integration
- [ ] Multi-language Support
- [ ] Progressive Web App (PWA) features
- [ ] Real-time notifications
- [ ] Advanced Analytics Dashboard
- [ ] Social Media Integration

## 🙏 Acknowledgments

- React.js Documentation
- Tailwind CSS
- Radix UI
- All open-source contributors
