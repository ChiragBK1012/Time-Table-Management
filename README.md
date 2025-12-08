# College Timetable Management Backend

A complete backend system for managing college timetables using Node.js, Express.js, and AWS DynamoDB.

## 🚀 Features

- **Dual Authentication System**

  - Admin authentication using email + password
  - Student authentication using USN + password
  - JWT token-based authentication
  - Separate middleware for admin and student routes

- **Timetable Management**

  - Add single slot or batch slots
  - Update and delete timetable entries
  - View weekly or daily timetables
  - Automatic duplicate slot validation

- **Database**
  - AWS DynamoDB with optimized table structure
  - AWS SDK v3 implementation

## 📋 Prerequisites

- Node.js (v14 or higher)
- AWS Account with DynamoDB access
- AWS Access Key ID and Secret Access Key

## 🔧 Installation

1. **Clone the repository and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   - Copy `.env.example` to `.env`
   - Fill in your AWS credentials and JWT secret:

   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_super_secret_jwt_key
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

3. **Create DynamoDB Tables:**

   📖 **For detailed step-by-step instructions, see [DYNAMODB_SETUP.md](./DYNAMODB_SETUP.md)**

   Quick summary:

   - Create IAM user with DynamoDB permissions
   - Get Access Key ID and Secret Access Key
   - Create two tables in AWS DynamoDB:

   **Table 1: Users**

   - Table name: `Users` (exact, case-sensitive)
   - Partition key: `PK` (String)
   - No sort key required

   **Table 2: TimeTable**

   - Table name: `TimeTable` (exact, case-sensitive)
   - Partition key: `PK` (String)
   - Sort key: `SK` (String)

## 🏃 Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## 📡 API Endpoints

### Authentication Endpoints

#### Admin Registration

```
POST /admin/register
Content-Type: application/json

{
  "email": "admin@college.edu",
  "password": "admin123",
  "name": "Admin Name"
}
```

#### Admin Login

```
POST /admin/login
Content-Type: application/json

{
  "email": "admin@college.edu",
  "password": "admin123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "email": "admin@college.edu",
    "name": "Admin Name",
    "userType": "ADMIN"
  }
}

Note: JWT token is automatically set as HTTP-only cookie (adminToken)
```

#### Admin Logout

```
POST /admin/logout

Response:
{
  "success": true,
  "message": "Admin logged out successfully"
}

Note: Clears the adminToken cookie
```

#### Student Registration

```
POST /student/register
Content-Type: application/json

{
  "usn": "1RI23IS050",
  "password": "student123",
  "name": "Student Name"
}
```

#### Student Login

```
POST /student/login
Content-Type: application/json

{
  "usn": "1RI23IS050",
  "password": "student123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "usn": "1RI23IS050",
    "name": "Student Name",
    "userType": "STUDENT"
  }
}
```

### Admin Timetable Endpoints (Protected)

**Note:** All admin endpoints require authentication. Authentication is handled via:

- **Cookies (Preferred)**: JWT token is automatically sent via HTTP-only cookie (`adminToken`) after login
- **Headers (Fallback)**: You can still use Bearer token in Authorization header:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

#### Add Single Slot

```
POST /admin/timetable/addSingleSlot
Authorization: Bearer <token>
Content-Type: application/json

{
  "year_section": "5A",
  "day": "MONDAY",
  "slot": 2,
  "subject": "DBMS",
  "faculty": "RSH",
  "room": "LHC-315",
  "type": "Theory"
}
```

#### Add Batch Slots for a Day

```
POST /admin/timetable/addBatchForDay
Authorization: Bearer <token>
Content-Type: application/json

{
  "year_section": "5A",
  "day": "MONDAY",
  "slots": [
    {
      "slot": 1,
      "subject": "OS",
      "faculty": "JDS",
      "room": "LHC-315",
      "type": "Theory"
    },
    {
      "slot": 2,
      "subject": "DBMS",
      "faculty": "RSH",
      "room": "LHC-315",
      "type": "Theory"
    }
  ]
}
```

#### Update Slot

```
PUT /admin/timetable/updateSlot
Authorization: Bearer <token>
Content-Type: application/json

{
  "year_section": "5A",
  "day": "MONDAY",
  "slot": 2,
  "subject": "Advanced DBMS",
  "faculty": "RSH",
  "room": "LHC-320",
  "type": "Theory"
}
```

#### Delete Slot

```
DELETE /admin/timetable/deleteSlot?year_section=5A&day=MONDAY&slot=2
Authorization: Bearer <token>
```

### Student Timetable Endpoints (Protected)

**Note:** All student endpoints require authentication. Authentication is handled via:

- **Cookies (Preferred)**: JWT token is automatically sent via HTTP-only cookie (`studentToken`) after login
- **Headers (Fallback)**: You can still use Bearer token in Authorization header:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

#### Get Weekly Timetable

```
GET /student/timetable/weekly/5A
Authorization: Bearer <token>
```

#### Get Day Timetable

```
GET /student/timetable/day/5A/MONDAY
Authorization: Bearer <token>
```

## 🧪 Postman Testing Guide

### Step 1: Set Up Postman Environment

1. Create a new Postman Environment (e.g., "Timetable Management")
2. Add variables:
   - `base_url`: `http://localhost:3000`
   - `admin_token`: (will be set after login)
   - `student_token`: (will be set after login)

### Step 2: Test Admin Authentication

1. **Register Admin:**

   - Method: `POST`
   - URL: `{{base_url}}/admin/register`
   - Body (raw JSON):
     ```json
     {
       "email": "admin@college.edu",
       "password": "admin123",
       "name": "Admin User"
     }
     ```

2. **Login Admin:**
   - Method: `POST`
   - URL: `{{base_url}}/admin/login`
   - Body (raw JSON):
     ```json
     {
       "email": "admin@college.edu",
       "password": "admin123"
     }
     ```
   - **Note**: Cookie is automatically set by the server. No need to manually extract token.
   - For Postman: Enable "Send cookies" in request settings (Settings → Send cookies)
   - Optional: In Tests tab (if you want to use header-based auth as fallback):
     ```javascript
     if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       // Cookie is automatically sent, but you can also set header token if needed
       // pm.environment.set("admin_token", jsonData.token);
     }
     ```

### Step 3: Test Student Authentication

1. **Register Student:**

   - Method: `POST`
   - URL: `{{base_url}}/student/register`
   - Body (raw JSON):
     ```json
     {
       "usn": "1RI23IS050",
       "password": "student123",
       "name": "John Doe"
     }
     ```

2. **Login Student:**
   - Method: `POST`
   - URL: `{{base_url}}/student/login`
   - Body (raw JSON):
     ```json
     {
       "usn": "1RI23IS050",
       "password": "student123"
     }
     ```
   - **Note**: Cookie is automatically set by the server. No need to manually extract token.
   - For Postman: Enable "Send cookies" in request settings (Settings → Send cookies)
   - Optional: In Tests tab (if you want to use header-based auth as fallback):
     ```javascript
     if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       // Cookie is automatically sent, but you can also set header token if needed
       // pm.environment.set("student_token", jsonData.token);
     }
     ```

### Step 4: Test Admin Timetable Operations

1. **Add Single Slot:**

   - Method: `POST`
   - URL: `{{base_url}}/admin/timetable/addSingleSlot`
   - Headers:
     - `Authorization`: `Bearer {{admin_token}}`
   - Body (raw JSON):
     ```json
     {
       "year_section": "5A",
       "day": "MONDAY",
       "slot": 1,
       "subject": "Operating Systems",
       "faculty": "JDS",
       "room": "LHC-315",
       "type": "Theory"
     }
     ```

2. **Add Batch Slots:**

   - Method: `POST`
   - URL: `{{base_url}}/admin/timetable/addBatchForDay`
   - Headers:
     - `Authorization`: `Bearer {{admin_token}}`
   - Body (raw JSON):
     ```json
     {
       "year_section": "5A",
       "day": "MONDAY",
       "slots": [
         {
           "slot": 2,
           "subject": "DBMS",
           "faculty": "RSH",
           "room": "LHC-315",
           "type": "Theory"
         },
         {
           "slot": 3,
           "subject": "Computer Networks",
           "faculty": "ABC",
           "room": "LHC-320",
           "type": "Theory"
         }
       ]
     }
     ```

3. **Update Slot:**

   - Method: `PUT`
   - URL: `{{base_url}}/admin/timetable/updateSlot`
   - Headers:
     - `Authorization`: `Bearer {{admin_token}}`
   - Body (raw JSON):
     ```json
     {
       "year_section": "5A",
       "day": "MONDAY",
       "slot": 2,
       "subject": "Advanced DBMS",
       "faculty": "RSH",
       "room": "LHC-320"
     }
     ```

4. **Delete Slot:**
   - Method: `DELETE`
   - URL: `{{base_url}}/admin/timetable/deleteSlot?year_section=5A&day=MONDAY&slot=3`
   - **Note**: Cookie is automatically sent. No headers needed if using cookies.
   - Optional Headers (if using Bearer token instead):
     - `Authorization`: `Bearer {{admin_token}}`

### Step 5: Test Student Timetable Operations

1. **Get Weekly Timetable:**

   - Method: `GET`
   - URL: `{{base_url}}/student/timetable/weekly/5A`
   - Headers:
     - `Authorization`: `Bearer {{student_token}}`

2. **Get Day Timetable:**
   - Method: `GET`
   - URL: `{{base_url}}/student/timetable/day/5A/MONDAY`
   - Headers:
     - `Authorization`: `Bearer {{student_token}}`

## 📊 Slot Timing Reference

- Slot 1: 9:00 – 9:55
- Slot 2: 9:55 – 10:50
- Slot 3: 11:05 – 12:00
- Slot 4: 12:00 – 12:55
- Slot 5: 1:45 – 2:40
- Slot 6: 2:40 – 3:35
- Slot 7: 3:35 – 4:30

## 🗂️ Project Structure

```
src/
├── config/
│   └── dynamoClient.js       # DynamoDB client configuration
├── controllers/
│   ├── adminAuthController.js
│   ├── studentAuthController.js
│   └── timetableController.js
├── middleware/
│   ├── adminAuth.js          # Admin authentication middleware
│   └── studentAuth.js        # Student authentication middleware
├── services/
│   ├── userService.js        # User authentication logic
│   └── timetableService.js   # Timetable CRUD operations
├── routes/
│   ├── adminRoutes.js
│   └── studentRoutes.js
├── app.js                    # Express app configuration
└── server.js                 # Server entry point
```

## 🔒 Security Features

- Password hashing using bcrypt (10 rounds)
- JWT token authentication with expiration (24 hours)
- **HTTP-only cookies** for secure token storage (prevents XSS attacks)
- **SameSite: strict** cookie policy (prevents CSRF attacks)
- **Secure flag** in production (HTTPS only)
- Role-based access control (Admin/Student)
- Input validation on all endpoints
- Duplicate slot prevention
- Fallback support for Bearer token in Authorization header

## ⚠️ Error Handling

All endpoints return consistent JSON error responses:

```json
{
  "success": false,
  "message": "Error message description"
}
```

## 📝 Notes

- All day names must be in uppercase (MONDAY, TUESDAY, etc.)
- Year sections are case-insensitive (will be converted to uppercase)
- Slot numbers must be between 1 and 7
- Type must be either "Theory" or "LAB"
- JWT tokens expire after 24 hours
- **Cookie-based authentication**: Tokens are stored in HTTP-only cookies (`adminToken` for admin, `studentToken` for students)
- **Postman Setup**: Enable "Send cookies" in Postman settings (Settings → Send cookies) to use cookie-based auth
- **Dual Auth Support**: System supports both cookie-based (preferred) and header-based (Bearer token) authentication

## 🐛 Troubleshooting

1. **DynamoDB Connection Issues:**

   - Verify AWS credentials in `.env`
   - Check AWS region configuration
   - Ensure tables are created with correct names

2. **Authentication Errors:**

   - Verify JWT_SECRET is set in `.env`
   - Check token format: `Bearer <token>`
   - Ensure token hasn't expired

3. **Validation Errors:**
   - Check all required fields are provided
   - Verify day names are uppercase
   - Ensure slot numbers are 1-7

## 📄 License

ISC

## 👨‍💻 Author

Backend System for College Timetable Management
