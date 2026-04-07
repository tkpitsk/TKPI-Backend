# TKPI Backend

TKPI Backend is the server-side API for the TKPI Management System. It provides authentication, employee management, attendance tracking, advance payment handling, and reminder services for the frontend application.

## Features

- User authentication with JWT
- Role-based access control
- Employee CRUD operations
- Attendance marking and monthly attendance summaries
- Advance payment tracking
- Reminder and expiry date management
- RESTful API structure
- MongoDB database integration
- Input validation and error handling

## Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **bcryptjs**
- **dotenv**
- **CORS**

## Project Structure

```bash
TKPI-Backend/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── config/
├── server.js
├── app.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- npm or yarn

### Installation

```bash
git clone https://github.com/tkpitsk/TKPI-Backend.git
cd TKPI-Backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tkpi
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## Running the Project

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get logged-in user profile

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/me` - Get current user attendance

### Advances
- `POST /api/advances` - Add advance payment
- `GET /api/advances` - Get all advance records
- `GET /api/advances/me` - Get current user advances

### Reminders
- `POST /api/reminders` - Create reminder
- `GET /api/reminders` - Get all reminders
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

## Authentication & Roles

| Role | Access |
|------|--------|
| Admin | Full access to all resources |
| Manager | Manage employees, attendance, advances, reminders |
| Employee | View own profile, attendance, and advances |

## Database Models

- **User** - stores user details, roles, and login credentials
- **Employee** - stores employee profile data
- **Attendance** - stores attendance status and dates
- **Advance** - stores advance payment details
- **Reminder** - stores reminders and expiry-related data

## Validation & Security

- Passwords are hashed using bcryptjs
- JWT tokens secure protected routes
- Middleware enforces role-based permissions
- API requests are validated before database operations
- CORS configured for frontend integration

## Deployment

### Environment Setup
Make sure the following variables are configured in production:

```env
PORT=5000
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=strong_secure_secret
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Suggested Deployment Platforms
- Render
- Railway
- DigitalOcean
- VPS or cloud server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit and push
5. Open a pull request

## License

Add your preferred license here.

## Support

For issues or feature requests, open a GitHub issue in this repository.
