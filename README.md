# 🕒 Employee Time Tracking Application

A comprehensive, full-stack employee time tracking system built with React, TypeScript, and MySQL. Features real-time activity monitoring, role-based access control, and detailed analytics.

## ✨ Features

### 🔐 **Authentication & Security**
- Role-based access control (Admin/User)
- Secure token-based authentication
- Password hashing and validation
- Session management with auto-logout

### 👨‍💼 **Admin Dashboard**
- User management (create, view, monitor)
- Real-time employee activity monitoring
- Comprehensive analytics and statistics
- Work time tracking across all employees
- Activity logs and session history

### 👤 **Employee Dashboard**
- One-click check-in/check-out
- Real-time activity tracking
- Personal work session history
- Data export (JSON/CSV formats)
- Activity statistics and insights

### 📊 **Core Functionality**
- Automatic activity detection
- Idle time monitoring and management
- Work session recording with timestamps
- Real-time dashboard updates
- Responsive design for all devices
- MySQL database integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL database (Hostinger recommended)
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd employee-time-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Copy and edit environment file
cp .env.example .env
```

4. **Update .env with your MySQL credentials**
```env
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=timetracker_db
DB_USER=your-username
DB_PASSWORD=your-password
```

5. **Start the application**
```bash
npm run dev
```

6. **Access the application**
- Open http://localhost:5173
- Login with demo credentials (see below)

## 🔑 Demo Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system administration

### Employee Accounts
All employee accounts use password: `user123`

- `john.doe` - John Doe
- `jane.smith` - Jane Smith  
- `mike.wilson` - Mike Wilson
- `sarah.johnson` - Sarah Johnson
- `david.brown` - David Brown
- `lisa.davis` - Lisa Davis

## 🗄️ Database Setup

### Automatic Setup
The application automatically:
- Creates required MySQL tables
- Sets up proper indexes and relationships
- Seeds demo data on first run

### Manual Setup (if needed)
See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions including:
- Hostinger MySQL configuration
- Manual table creation scripts
- Troubleshooting guide

## 🌐 Deployment

### Recommended: Hostinger
1. **Full-stack support** with Node.js
2. **Built-in MySQL** database
3. **Easy environment** management

### Alternative: Vercel + External DB
1. **Frontend deployment** on Vercel
2. **Database hosting** on PlanetScale/Railway
3. **Serverless functions** for API

### See Full Guide
Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## 📱 Application Functionality

### For Administrators
1. **User Management**
   - Create new employee accounts
   - View all employee statistics
   - Monitor real-time activity status
   - Access comprehensive work reports

2. **Analytics Dashboard**
   - Total registered employees
   - Currently active employees  
   - Aggregate work time statistics
   - Activity trends and patterns

3. **System Oversight**
   - Real-time employee monitoring
   - Work session management
   - Activity log review
   - Data export capabilities

### For Employees
1. **Time Tracking**
   - Simple check-in/check-out process
   - Automatic activity detection
   - Idle time monitoring
   - Session pause/resume

2. **Personal Analytics**
   - Daily/weekly work summaries
   - Activity count tracking
   - Work pattern insights
   - Historical session data

3. **Data Management**
   - Export personal work data
   - View detailed activity logs
   - Track productivity metrics
   - Session history review

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Date-fns** for date handling
- **Vite** for build tooling

### Backend
- **Node.js** runtime
- **MySQL2** for database connectivity
- **Connection pooling** for performance
- **Environment-based** configuration

### Database
- **MySQL** with InnoDB engine
- **Optimized indexes** for performance
- **Foreign key constraints** for data integrity
- **JSON fields** for metadata storage

## 📊 Database Schema

### Users Table
- User authentication and profile data
- Role-based access control
- Activity status tracking
- Work time accumulation

### Activity Logs Table  
- Detailed activity tracking
- Check-in/check-out events
- Idle period monitoring
- Metadata storage for events

### Work Sessions Table
- Complete session records
- Time tracking with precision
- Activity count per session
- Date-based organization

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Project Structure
```
src/
├── components/          # React components
│   ├── AdminDashboard.tsx
│   ├── UserDashboard.tsx
│   └── LoginForm.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/              # Custom hooks
│   └── useActivityTracker.ts
├── utils/              # Utility functions
│   ├── database.ts
│   ├── storage.ts
│   └── auth.ts
├── types/              # TypeScript definitions
│   └── index.ts
└── main.tsx           # Application entry point
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Admin login functionality
- [ ] Employee login functionality  
- [ ] User creation by admin
- [ ] Check-in/check-out process
- [ ] Activity tracking accuracy
- [ ] Data export features
- [ ] Responsive design
- [ ] Database persistence

### Automated Testing (Future)
- Unit tests for utilities
- Integration tests for API
- E2E tests for user flows
- Performance testing

## 🔒 Security Features

### Authentication
- Secure password hashing
- Token-based session management
- Role-based access control
- Automatic session expiration

### Database Security
- Prepared statements (SQL injection prevention)
- Connection pooling with limits
- Environment-based credentials
- Foreign key constraints

### Frontend Security
- Input validation and sanitization
- Secure token storage
- HTTPS enforcement (production)
- XSS protection

## 📈 Performance Optimizations

### Database
- Optimized indexes on frequently queried columns
- Connection pooling for concurrent users
- Efficient query patterns
- Proper foreign key relationships

### Frontend
- Component lazy loading
- Efficient re-rendering with React hooks
- Optimized bundle size with Vite
- Responsive images and assets

### Real-time Updates
- Intelligent polling intervals
- Minimal data transfer
- Efficient state management
- Background sync capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
1. **Database Connection**: Check .env configuration
2. **Login Problems**: Verify seeded data exists
3. **Build Errors**: Clear node_modules and reinstall
4. **Performance**: Check database indexes

### Getting Help
- Check the troubleshooting guides
- Review browser console errors
- Verify environment configuration
- Test with demo credentials

## 🎯 Roadmap

### Upcoming Features
- [ ] Advanced reporting and analytics
- [ ] Email notifications for admins
- [ ] Mobile app development
- [ ] Integration with HR systems
- [ ] Advanced user permissions
- [ ] Automated backup system

### Performance Improvements
- [ ] Redis caching implementation
- [ ] Database query optimization
- [ ] CDN integration
- [ ] Progressive Web App features

---

**Built with ❤️ for efficient employee time management**