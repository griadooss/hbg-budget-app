# HBG Budget App

Professional Political Party Accounting System for **Homes Before Growth**

## 🏠 About Homes Before Growth

Addressing Australia's housing affordability crisis where Sydney's median home price is 13x the median adult wage, and Perth's is 8x. This system provides transparent, compliant financial management for political parties fighting for housing affordability.

## 🎯 Project Vision

A modern, professional accounting system that:
- ✅ Ensures political finance law compliance
- ✅ Provides real-time financial transparency
- ✅ Offers robust internal admin tools
- ✅ Can be templated for other political organizations
- ✅ Showcases professional governance standards

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui

### Project Structure
```
hbg-budget-app/
├── frontend/          # Next.js React application
├── backend/           # Node.js Express API
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation
```bash
# Install all dependencies
npm run install:all

# Set up environment variables (see .env.example files)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Set up database
npm run db:generate
npm run db:push

# Start development servers
npm run dev
```

## 📊 Core Features

### MVP (Phase 1)
- [x] Project setup and architecture
- [ ] Transaction management (income/expenses)
- [ ] Category and subcategory system
- [ ] Bank account management
- [ ] Basic admin portal
- [ ] Public transparency dashboard

### Future Phases
- [ ] Advanced reporting and analytics
- [ ] Political finance compliance automation
- [ ] Multi-party template system
- [ ] API for third-party integrations
- [ ] Mobile application

## 🎨 Design Principles

1. **Transparency First**: Public accountability is core to democracy
2. **Compliance by Design**: Built-in political finance law adherence
3. **Professional Grade**: Enterprise-level security and reliability
4. **Template Ready**: Easily configurable for other organizations
5. **User-Centric**: Intuitive for both admins and public users

## 🔐 Security & Compliance

- Role-based access control
- Audit trails for all transactions
- Data encryption at rest and in transit
- Regular automated backups
- Political finance law compliance features

## 📈 Monetization Strategy

This system is designed to be:
1. **Tailored for HBG**: Custom implementation for Homes Before Growth
2. **Template for Others**: Configurable system for political parties globally
3. **SaaS Platform**: Subscription-based service for political organizations

## 🤝 Contributing

This project follows democratic principles - transparency, accountability, and collaboration.

## 📄 License

MIT License - Built for the public good

---

**"Making housing affordable, one vote at a time."** 🏠 # Trigger new deployment - mar 22 lug 2025, 17:33:40, AWST
# Force deployment with env vars - mar 22 lug 2025, 17:47:50, AWST
