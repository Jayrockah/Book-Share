# BookShare Production Setup Guide

This guide will walk you through setting up BookShare for production with Supabase, Firebase Auth, and Cloudinary.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account (https://supabase.com)
- Firebase account (https://firebase.google.com)
- Cloudinary account (https://cloudinary.com) - optional for now

### 2. Supabase Setup

#### Create a Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your project URL and anon key
3. Go to the SQL Editor in Supabase dashboard
4. Copy the entire contents of `supabase-schema.sql` and run it
5. Verify all tables were created successfully

#### Configure Row Level Security (RLS)

The schema file includes RLS policies, but verify they're enabled:
- Go to Database → Tables
- Check that RLS is enabled for all tables
- Policies should be automatically created

### 3. Firebase Setup

#### Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Authentication → Sign-in method → Phone
4. Add your app (Web)
5. Copy the Firebase config

#### Setup Phone Authentication

1. In Firebase Console → Authentication → Sign-in method
2. Enable "Phone" provider
3. Add test phone numbers for development (optional):
   - Example: +2348012345678 → OTP: 123456

### 4. Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Cloudinary (optional for now)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset

# Environment
VITE_ENV=development
```

### 5. Cloudinary Setup (Optional - for image uploads)

1. Go to https://cloudinary.com and create account
2. Go to Settings → Upload → Add upload preset
3. Set preset to "Unsigned"
4. Note your cloud name and preset name

### 6. Install Dependencies

```bash
npm install
```

Dependencies installed:
- `@supabase/supabase-js` - Supabase client
- `firebase` - Firebase SDK
- `@tanstack/react-query` - Data fetching and caching
- `axios` - HTTP client

### 7. Run Development Server

```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── config/
│   ├── supabase.js          # Supabase client initialization
│   └── firebase.js           # Firebase app initialization
├── services/
│   ├── authService.js        # Authentication logic
│   ├── bookService.js        # Book CRUD operations (TODO)
│   ├── transactionService.js # Transaction operations (TODO)
│   └── organizationService.js # Organization operations (TODO)
├── hooks/
│   ├── useAuth.js            # Auth hooks with React Query (TODO)
│   ├── useBooks.js           # Book data hooks (TODO)
│   └── useTransactions.js    # Transaction hooks (TODO)
├── context/
│   ├── AuthContext.jsx       # Auth context (to be updated)
│   └── DataContext.jsx       # Data context (to be migrated)
└── pages/
    └── ... (existing pages)
```

## 🔄 Migration Status

### ✅ Completed

1. Dependencies installed (Supabase, Firebase, React Query)
2. Environment variable setup
3. Supabase database schema created
4. Firebase configuration
5. Supabase client setup
6. Auth service created

### 🚧 In Progress

- [ ] Create remaining service layer files:
  - [ ] bookService.js
  - [ ] transactionService.js
  - [ ] organizationService.js
  - [ ] waitlistService.js
  - [ ] ratingService.js

- [ ] Setup React Query:
  - [ ] Create QueryClientProvider in App.jsx
  - [ ] Create custom hooks for data fetching
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] Update AuthContext:
  - [ ] Integrate Firebase Auth
  - [ ] Handle phone OTP flow
  - [ ] Sync with Supabase users table

- [ ] Migrate DataContext:
  - [ ] Replace localStorage calls with Supabase
  - [ ] Use React Query for caching
  - [ ] Add optimistic updates

### 📝 TODO

- [ ] Image upload functionality (Cloudinary)
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Offline support
- [ ] TypeScript migration (optional)

## 🎯 Next Steps

### Immediate (Week 1):

1. **Complete Service Layer**
   - Finish bookService.js
   - Finish transactionService.js
   - Finish organizationService.js

2. **Setup React Query**
   - Add QueryClientProvider
   - Create custom hooks
   - Replace Context API where appropriate

3. **Update Auth Flow**
   - Implement phone OTP login
   - Create user profile completion flow
   - Test auth persistence

### Short-term (Week 2-3):

4. **Migrate All Components**
   - Update HomePage to use new data layer
   - Update ProfilePage
   - Update all other pages

5. **Add Loading States**
   - Skeleton screens
   - Spinners
   - Error states

6. **Testing**
   - Test all user flows
   - Test offline behavior
   - Test error scenarios

### Medium-term (Week 4+):

7. **Polish**
   - Image uploads
   - In-app messaging
   - Push notifications
   - Analytics

8. **Production Deployment**
   - Deploy to Vercel/Netlify
   - Setup production Firebase/Supabase projects
   - Configure custom domain

## 🔐 Security Considerations

### Firebase Auth
- Phone numbers are verified via OTP
- Firebase handles authentication
- Never store passwords

### Supabase RLS
- All tables have Row Level Security enabled
- Users can only access their own data
- Public data (books, organizations) is readable by all
- Write operations are restricted to owners

### API Keys
- All API keys should be in `.env` file
- `.env` is gitignored
- Never commit secrets to git

## 📊 Database Design

### Key Tables:
- `users` - User profiles linked to Firebase UID
- `books` - User-owned books
- `borrow_transactions` - New transaction system
- `exchange_records` - Pickup and return details
- `organizations` - Book club organizations
- `waitlist` - Book waitlist entries

### Relationships:
- Books → Users (owner_id)
- Transactions → Books, Users (borrower, owner)
- Exchange Records → Transactions
- Organizations → Users (created_by)
- Organization Memberships → Organizations, Users

## 🐛 Troubleshooting

### Supabase Connection Issues
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
- Check Supabase dashboard for service status
- Verify RLS policies are correctly configured

### Firebase Auth Issues
- Ensure Phone authentication is enabled in Firebase Console
- Check Firebase config in .env
- Verify your domain is authorized in Firebase Console

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for conflicting dependencies

## 📞 Support

If you encounter issues:
1. Check the Supabase logs: Dashboard → Logs
2. Check Firebase Console → Authentication → Events
3. Check browser console for errors
4. Review this setup guide

## 🎉 Success Criteria

You'll know the migration is complete when:
- [x] Environment variables configured
- [x] Database schema deployed
- [ ] Firebase Auth working with phone OTP
- [ ] Users can sign up and log in
- [ ] Books are stored in Supabase
- [ ] Transactions work end-to-end
- [ ] Organizations are functional
- [ ] No localStorage dependencies
- [ ] Loading states implemented
- [ ] Error handling in place
