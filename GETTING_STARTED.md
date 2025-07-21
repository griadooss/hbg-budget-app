# 🚀 Getting Started with HBG Budget App

Welcome to the **Homes Before Growth** Professional Political Party Accounting System!

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org/))
- **MySQL 8.0+** (Download from [mysql.com](https://dev.mysql.com/downloads/))
- **Git** (Download from [git-scm.com](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

## 🏗️ Project Structure

```
hbg-budget-app/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Authentication & error handling
│   │   └── index.ts      # Server entry point
│   ├── prisma/           # Database schema & migrations
│   └── package.json
├── frontend/             # Next.js React application
│   ├── app/              # Next.js 14 app directory
│   ├── components/       # Reusable React components
│   └── package.json
└── README.md
```

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Set Up Environment Variables

Create environment files from examples:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment (will be created later)
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your settings:

```env
# Database Connection
DATABASE_URL="mysql://username:password@localhost:3306/hbg_budget"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Party Configuration
PARTY_NAME="Homes Before Growth"
PARTY_ABN="your-abn-here"
```

### 3. Set Up Database

First, create the MySQL database:

```sql
-- Connect to MySQL and run:
CREATE DATABASE hbg_budget;
CREATE USER 'hbg_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON hbg_budget.* TO 'hbg_user'@'localhost';
FLUSH PRIVILEGES;
```

Then initialize the database:

```bash
# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:push

# Seed with initial data (categories, admin user, etc.)
cd backend && npm run db:seed
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:3000 (redirects to /dashboard)

## 🔐 First Login

The system creates a default admin user during seeding:

- **Email**: `admin@homesbeforegrowth.org`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

## 🎯 Key Features Available

### ✅ Completed (MVP Ready)
- ✅ **Complete Backend API** - All routes for transactions, categories, bank accounts, reports
- ✅ **Database Schema** - Based on your existing spreadsheet structure
- ✅ **Authentication System** - JWT-based with role management
- ✅ **Public Transparency API** - For your website integration
- ✅ **Compliance Features** - Political finance reporting built-in

### 🔄 In Progress
- 🔄 **Frontend Dashboard** - React components and pages
- 🔄 **Transaction Management UI** - Create, edit, view transactions
- 🔄 **Reporting Interface** - Generate compliance reports
- 🔄 **Public Dashboard** - For website transparency

## 📊 Database Structure

Your existing spreadsheet logic has been transformed into:

### **Transaction Categories** (from your lookup sheet)
- **Campaign Expenses**: Advertising, Printing, Signage, Digital Marketing
- **Administrative**: Office Supplies, Software, Website Hosting, Legal Fees
- **Event Costs**: Venue Hire, Catering, Equipment, Transport
- **Travel Expenses**: Fuel, Public Transport, Accommodation, Meals
- **Communication**: Phone Bills, Internet, Postage, Social Media
- **Merchandise**: T-Shirts, Banners, Pamphlets, Stickers
- **Compliance & Legal**: Electoral Commission, Legal Advice
- **Income Categories**: Membership Dues, Donations, Fundraising Events

### **Bank Accounts** (based on your accounts)
- UBank accounts, NAB accounts, Cash handling
- Automatic balance tracking and reconciliation

## 🌐 API Endpoints

### Public Endpoints (for website)
```
GET /api/public/financial-summary    # Current financial position
GET /api/public/quarterly-reports    # Published compliance reports
GET /api/public/annual-summary/:year # Annual financial breakdown
```

### Admin Endpoints (requires authentication)
```
POST /api/auth/login                 # User authentication
GET  /api/transactions               # List transactions (with filtering)
POST /api/transactions               # Create new transaction
GET  /api/categories                 # List all categories
GET  /api/bank-accounts             # List bank accounts
GET  /api/reports/financial-summary  # Generate financial reports
```

## 🛠️ Development Commands

```bash
# Backend only
cd backend
npm run dev          # Start backend development server
npm run db:studio    # Open Prisma database browser
npm run db:migrate   # Create new database migration

# Frontend only
cd frontend
npm run dev          # Start frontend development server
npm run build        # Build for production
npm run type-check   # TypeScript type checking

# Full stack
npm run dev          # Start both servers
npm run build        # Build entire application
```

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u hbg_user -p hbg_budget
```

### Port Conflicts
- Backend: Change `PORT` in `backend/.env`
- Frontend: Use `npm run dev -- -p 3001`

### Permission Issues
```bash
# Make sure you have write permissions
sudo chown -R $USER:$USER /home/jedaa/Workdir/WebApps/HBG-Budget-App
```

## 🚀 Next Steps

1. **Login** to the admin panel at http://localhost:3000
2. **Add your bank accounts** with real details
3. **Import existing transactions** from your spreadsheet
4. **Set up categories** specific to your needs
5. **Configure compliance settings** for Australian political finance laws

## 📞 Need Help?

The system is designed to be professional-grade and is template-ready for other political parties. Every component follows best practices for:

- ✅ **Security**: JWT authentication, role-based access, input validation
- ✅ **Compliance**: Built-in Australian political finance reporting
- ✅ **Transparency**: Public API for website integration
- ✅ **Scalability**: Professional database design and API structure
- ✅ **Maintainability**: TypeScript, comprehensive error handling

---

**🏠 "Making housing affordable, one vote at a time."** 