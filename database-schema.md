# Database Schema Documentation

## MongoDB Collections

### Users Collection

**Collection Name:** `users`

**Schema:**
```javascript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  name: String,                      // User's full name (required)
  email: String,                     // User's email (required, unique, lowercase)
  password: String,                  // Hashed password (required, min 6 chars)
  role: String,                      // User role: 'employee' or 'manager' (default: 'employee')
  employeeId: String,                // Unique employee identifier (optional, unique)
  department: String,                // Department name (optional)
  createdAt: Date                   // Account creation timestamp (auto-generated)
}
```

**Indexes:**
- `email`: Unique index
- `employeeId`: Unique sparse index (allows null values)

**Validation:**
- `name`: Required, trimmed
- `email`: Required, unique, lowercase, trimmed
- `password`: Required, minimum 6 characters, hashed before save
- `role`: Must be either 'employee' or 'manager'

**Pre-save Hook:**
- Password is automatically hashed using bcrypt before saving

**Methods:**
- `comparePassword(candidatePassword)`: Compares plain text password with hashed password

---

### Attendance Collection

**Collection Name:** `attendances`

**Schema:**
```javascript
{
  _id: ObjectId,                     // Auto-generated MongoDB ID
  userId: ObjectId,                   // Reference to User (required)
  date: Date,                        // Attendance date (required, default: current date)
  checkInTime: Date,                 // Check-in timestamp (optional)
  checkOutTime: Date,                 // Check-out timestamp (optional)
  status: String,                    // Attendance status: 'present', 'absent', 'late', 'half-day' (default: 'absent')
  totalHours: Number,                // Total working hours (default: 0, auto-calculated)
  createdAt: Date                    // Record creation timestamp (auto-generated)
}
```

**Indexes:**
- Compound unique index on `userId` and `date` (prevents duplicate records per user per day)

**Validation:**
- `userId`: Required, must reference valid User
- `date`: Required, defaults to current date
- `status`: Must be one of: 'present', 'absent', 'late', 'half-day'

**Pre-save Hook:**
- Automatically calculates `totalHours` if both `checkInTime` and `checkOutTime` are present
- Formula: `(checkOutTime - checkInTime) / (1000 * 60 * 60)` (converted to hours, rounded to 2 decimals)

**Status Logic:**
- `absent`: Default status, no check-in
- `present`: Check-in before 9:30 AM
- `late`: Check-in after 9:30 AM
- `half-day`: Total hours less than 4 hours

---

## Relationships

### User → Attendance (One-to-Many)
- One user can have multiple attendance records
- Attendance records reference user via `userId` field
- Use Mongoose `.populate()` to join user data with attendance records

---

## Sample Data Structure

### Sample User Document
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "password": "$2a$10$hashedpassword...",
  "role": "employee",
  "employeeId": "EMP001",
  "department": "Engineering",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Sample Attendance Document
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "date": "2024-01-15T00:00:00.000Z",
  "checkInTime": "2024-01-15T09:15:00.000Z",
  "checkOutTime": "2024-01-15T17:30:00.000Z",
  "status": "present",
  "totalHours": 8.25,
  "createdAt": "2024-01-15T09:15:00.000Z"
}
```

---

## Query Examples

### Find all attendance for a user
```javascript
Attendance.find({ userId: userId })
  .sort({ date: -1 })
```

### Find today's attendance for a user
```javascript
const today = new Date();
const start = new Date(today.setHours(0, 0, 0, 0));
const end = new Date(today.setHours(23, 59, 59, 999));

Attendance.findOne({
  userId: userId,
  date: { $gte: start, $lte: end }
})
```

### Find all employees' attendance with user details
```javascript
Attendance.find({})
  .populate('userId', 'name email employeeId department')
  .sort({ date: -1 })
```

### Monthly summary aggregation
```javascript
const start = new Date(year, month - 1, 1);
const end = new Date(year, month, 0, 23, 59, 59, 999);

Attendance.find({
  userId: userId,
  date: { $gte: start, $lte: end }
})
```

---

## Database Indexes

### Users Collection
- `email`: Unique index
- `employeeId`: Unique sparse index

### Attendance Collection
- `userId + date`: Compound unique index
- `userId`: Index for faster queries
- `date`: Index for date range queries

---

## Data Integrity

1. **Unique Constraints:**
   - Email must be unique across all users
   - Employee ID must be unique (if provided)
   - One attendance record per user per day

2. **Referential Integrity:**
   - Attendance records must reference valid users
   - Deleting a user should handle attendance records (cascade delete or set to null)

3. **Data Validation:**
   - All required fields are validated at the schema level
   - Email format validation
   - Password strength validation (minimum 6 characters)

---

## Migration Notes

If migrating from SQL to MongoDB:

1. **Users Table → Users Collection:**
   - `id` → `_id` (auto-generated)
   - All other fields map directly

2. **Attendance Table → Attendance Collection:**
   - `id` → `_id` (auto-generated)
   - `userId` remains as reference (ObjectId instead of integer)
   - Date fields remain as Date type
   - Status enum maps to string values

---

## Performance Considerations

1. **Indexes:**
   - Ensure indexes are created for frequently queried fields
   - Compound indexes for multi-field queries

2. **Pagination:**
   - Use `.limit()` and `.skip()` for large result sets
   - Consider cursor-based pagination for very large datasets

3. **Population:**
   - Use `.populate()` sparingly for large datasets
   - Consider using `.lean()` for read-only queries to improve performance

---

## Backup and Maintenance

1. **Regular Backups:**
   - Use MongoDB Atlas automated backups
   - Or schedule regular `mongodump` commands

2. **Data Cleanup:**
   - Consider archiving old attendance records
   - Implement data retention policies

3. **Monitoring:**
   - Monitor collection sizes
   - Track query performance
   - Set up alerts for slow queries

