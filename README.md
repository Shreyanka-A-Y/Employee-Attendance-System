# Employee Attendance System

[![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)](https://github.com/Shreyanka-A-Y/Employee-Attendance-System)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)

A comprehensive Employee Attendance Management System built with **React**, **Node.js**, **Express**, and **MongoDB** (MERN Stack). The system supports two roles: Employee and Manager, with complete attendance tracking, reporting, and analytics features.

## Features

### Employee Features
- ✅ User Registration and Login
- ✅ Check-In / Check-Out functionality
- ✅ View personal attendance history (Table & Calendar view)
- ✅ Monthly attendance summary
- ✅ Dashboard with daily status, monthly stats, total hours, and recent attendance
- ✅ Profile management

### Manager Features
- ✅ Manager Login
- ✅ View all employees' attendance
- ✅ Filter attendance by employee, date, and status
- ✅ Team attendance summary with department-wise breakdown
- ✅ Export attendance data to CSV
- ✅ Dashboard with team statistics, late arrivals, absent list
- ✅ Weekly trend charts and department-wise analytics
- ✅ Team calendar view with color-coded attendance

## Tech Stack

### Frontend
- React 18.2.0
- Redux Toolkit for state management
- React Router for navigation
- Recharts for data visualization
- React Calendar for calendar views
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation

## Project Structure

```
employee-attendance-system/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Attendance.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   ├── dashboard.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── scripts/
│   │   └── seed.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── employee/
│   │   │   └── manager/
│   │   ├── store/
│   │   │   └── slices/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String ('employee' | 'manager'),
  employeeId: String (unique, optional),
  department: String,
  createdAt: Date
}
```

### Attendance Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date,
  checkInTime: Date,
  checkOutTime: Date,
  status: String ('present' | 'absent' | 'late' | 'half-day'),
  totalHours: Number,
  createdAt: Date
}
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/employee-attendance
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Note**: `FRONTEND_URL` is optional for local development. It's required in production for CORS configuration.

4. Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on your system
# For Windows: MongoDB should start automatically as a service
# For Mac/Linux: mongod
```

5. Seed the database (optional):
```bash
npm run seed
```

6. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Employee Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/today` - Get today's status
- `GET /api/attendance/my-history` - Get attendance history
- `GET /api/attendance/my-summary` - Get monthly summary

### Manager Attendance
- `GET /api/attendance/all` - Get all employees' attendance
- `GET /api/attendance/employee/:id` - Get specific employee's attendance
- `GET /api/attendance/summary` - Get team summary
- `GET /api/attendance/export` - Export CSV
- `GET /api/attendance/today-status` - Get today's status for all

### Dashboard
- `GET /api/dashboard/employee` - Employee dashboard data
- `GET /api/dashboard/manager` - Manager dashboard data

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/all` - Get all employees (Manager only)

## Default Credentials

After running the seed script, you can use these credentials:

### Manager
- Email: `manager@company.com`
- Password: `manager123`

### Employees
- Email: `alice@company.com` / Password: `employee123`
- Email: `bob@company.com` / Password: `employee123`
- Email: `carol@company.com` / Password: `employee123`
- Email: `david@company.com` / Password: `employee123`
- Email: `eva@company.com` / Password: `employee123`

## Usage Guide

### For Employees

1. **Register/Login**: Create an account or login with existing credentials
2. **Dashboard**: View today's status, monthly stats, and recent attendance
3. **Mark Attendance**: Check in when you arrive and check out when you leave
4. **History**: View your attendance history in table or calendar format
5. **Profile**: Update your name and department

### For Managers

1. **Login**: Login with manager credentials
2. **Dashboard**: View team statistics, late arrivals, and absent employees
3. **All Attendance**: View and filter all employees' attendance records
4. **Calendar**: View team attendance in a calendar format
5. **Reports**: Generate monthly reports and export to CSV

## Attendance Rules

- Check-in before 9:30 AM is considered **on-time** (status: present)
- Check-in after 9:30 AM is marked as **late** (status: late)
- Minimum 4 hours required for full day attendance
- Less than 4 hours is considered **half-day**
- No check-in is marked as **absent**

## Development

### Running in Development Mode

Backend (with nodemon):
```bash
cd backend
npm run dev
```

Frontend (with hot reload):
```bash
cd frontend
npm start
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

This creates an optimized production build in the `build` folder.

## Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Ensure MongoDB connection string is correct
3. Deploy to platforms like:
   - Heroku
   - AWS EC2
   - DigitalOcean
   - Railway
   - Render

### Frontend Deployment

1. Build the production version: `npm run build`
2. Deploy the `build` folder to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - GitHub Pages
   - Render (Static Site)

### Environment Variables for Production

**Backend:**
- `PORT`: Server port (usually set by hosting platform)
- `MONGODB_URI`: MongoDB connection string (e.g., MongoDB Atlas connection string)
- `JWT_SECRET`: Strong secret key for JWT tokens (use a secure random string)
- `NODE_ENV`: Set to `production`
- `FRONTEND_URL`: Your frontend URL for CORS configuration (optional, defaults to hardcoded value)

**Frontend:**
- `REACT_APP_API_URL`: Your backend API URL (should include `/api` at the end, e.g., `https://your-backend.onrender.com/api`)

**Note**: The code includes production fallbacks, but it's **highly recommended** to set these environment variables explicitly in your hosting platform for better control and flexibility.

### Deployment on Render

#### Backend Service Setup

1. Create a new **Web Service** on Render
2. Connect your repository
3. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. Add Environment Variables:
   ```
   PORT=5000 (or leave empty, Render will set it automatically)
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```

#### Frontend Service Setup

1. Create a new **Static Site** on Render
2. Connect your repository
3. Set the following:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-backend-service.onrender.com/api
   ```
   **Important**: Make sure the URL ends with `/api`

5. After deployment, trigger a new build to apply the environment variable

#### Example Configuration

If your services are deployed as:
- Frontend: `https://employee-attendance-system-1-uhmb.onrender.com`
- Backend: `https://employee-attendance-system-59im.onrender.com`

**Frontend Environment Variable:**
```
REACT_APP_API_URL=https://employee-attendance-system-59im.onrender.com/api
```

**Backend Environment Variable:**
```
FRONTEND_URL=https://employee-attendance-system-1-uhmb.onrender.com
```

### Troubleshooting Connection Issues

If you see "Unable to connect to server" error:

1. **Check Environment Variables**: Ensure `REACT_APP_API_URL` is set correctly in your frontend service
2. **Verify Backend URL**: Make sure the backend URL is accessible and includes `/api` at the end
3. **Check CORS**: Ensure `FRONTEND_URL` in backend matches your frontend URL exactly
4. **Redeploy**: After setting environment variables, trigger a new deployment
5. **Check Backend Health**: Visit `https://your-backend.onrender.com/api/health` to verify backend is running
6. **Browser Console**: Check browser console for specific error messages
7. **Network Tab**: Check browser DevTools Network tab to see if requests are being made and what errors they return

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Protected routes with role-based access control
- Input validation with express-validator
- CORS configuration

## Future Enhancements

- [ ] Email notifications for attendance
- [ ] Leave management system
- [ ] Shift management
- [ ] Mobile app (React Native)
- [ ] Biometric integration
- [ ] Advanced analytics and insights
- [ ] Multi-company support
- [ ] Real-time notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the repository.

## Author

Built with ❤️ for efficient employee attendance management.

