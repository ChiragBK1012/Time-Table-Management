# DynamoDB Setup Guide

Complete step-by-step guide to set up AWS DynamoDB for the Timetable Management System.

## 📋 Prerequisites

- An AWS Account (create one at [aws.amazon.com](https://aws.amazon.com) if you don't have one)
- Basic understanding of AWS Console

---

## 🔐 Step 1: Create IAM User and Access Keys

### 1.1 Create IAM User

1. **Log in to AWS Console**

   - Go to [console.aws.amazon.com](https://console.aws.amazon.com)
   - Sign in with your AWS account

2. **Navigate to IAM**

   - Search for "IAM" in the top search bar
   - Click on "IAM" service

3. **Create New User**

   - Click on "Users" in the left sidebar
   - Click "Create user" button
   - Enter username: `timetable-management-user` (or any name you prefer)
   - Click "Next"

4. **Set Permissions**
   - Select "Attach policies directly"
   - Search for and select: **`AmazonDynamoDBFullAccess`**
   - Click "Next"
   - Review and click "Create user"

### 1.2 Create Access Keys

1. **Select the User**

   - Click on the user you just created

2. **Create Access Key**

   - Go to "Security credentials" tab
   - Scroll down to "Access keys" section
   - Click "Create access key"

3. **Choose Use Case**

   - Select "Application running outside AWS"
   - Click "Next"
   - (Optional) Add description: "Timetable Management Backend"
   - Click "Create access key"

4. **Save Credentials** ⚠️ **IMPORTANT**
   - **Access Key ID**: Copy and save this immediately
   - **Secret Access Key**: Click "Show" and copy this immediately
   - ⚠️ **You can only see the Secret Access Key once!**
   - Click "Done"

---

## 🗄️ Step 2: Create DynamoDB Tables

### 2.1 Navigate to DynamoDB

1. **Open DynamoDB Console**

   - In AWS Console, search for "DynamoDB"
   - Click on "DynamoDB" service

2. **Select Region**
   - Choose your preferred region (e.g., `us-east-1`, `us-west-2`, `ap-south-1`)
   - **Note:** Remember this region for your `.env` file

### 2.2 Create Users Table

1. **Click "Create table"**

2. **Table Settings:**

   - **Table name**: `Users` (exact name, case-sensitive)
   - **Partition key**:
     - Name: `PK`
     - Type: `String`
   - **Sort key**: Leave empty (no sort key needed)
   - **Table settings**: Choose "Default settings" (or customize if needed)
   - **Encryption**: Default encryption at rest is fine

3. **Click "Create table"**

4. **Wait for table creation** (usually takes 1-2 minutes)

### 2.3 Create TimeTable Table

1. **Click "Create table" again**

2. **Table Settings:**

   - **Table name**: `TimeTable` (exact name, case-sensitive)
   - **Partition key**:
     - Name: `PK`
     - Type: `String`
   - **Sort key**:
     - Name: `SK`
     - Type: `String`
   - **Table settings**: Choose "Default settings"
   - **Encryption**: Default encryption at rest is fine

3. **Click "Create table"**

4. **Wait for table creation** (usually takes 1-2 minutes)

### 2.4 Verify Tables

- You should now see both tables in the DynamoDB console:
  - ✅ `Users` (with PK only)
  - ✅ `TimeTable` (with PK and SK)

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Create .env File

1. **In your project root**, create a file named `.env`

2. **Add the following content:**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

### 3.2 Fill in the Values

1. **PORT**: Keep as `3000` or change if needed

2. **JWT_SECRET**:

   - Generate a random string (at least 32 characters)
   - You can use: `openssl rand -base64 32` in terminal
   - Or use an online generator
   - Example: `my_super_secret_jwt_key_1234567890abcdef`

3. **AWS_REGION**:

   - Use the same region where you created your tables
   - Common regions: `us-east-1`, `us-west-2`, `ap-south-1`, `eu-west-1`

4. **AWS_ACCESS_KEY_ID**:

   - Paste the Access Key ID from Step 1.2

5. **AWS_SECRET_ACCESS_KEY**:
   - Paste the Secret Access Key from Step 1.2

### 3.3 Example .env File

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## ✅ Step 4: Verify Setup

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Test Connection

1. **Start the server:**

   ```bash
   npm start
   ```

2. **Check health endpoint:**

   - Open browser: `http://localhost:3000/health`
   - Should return: `{"success":true,"message":"Server is running",...}`

3. **Test Database Connection:**
   - Try registering an admin user via Postman:
     ```
     POST http://localhost:3000/admin/register
     {
       "email": "test@test.com",
       "password": "test123",
       "name": "Test Admin"
     }
     ```
   - If successful, check DynamoDB console → Users table → Explore table items
   - You should see a new item with PK: `ADMIN#test@test.com`

---

## 🔍 Troubleshooting

### Issue: "Access Denied" or "Invalid credentials"

**Solution:**

- Verify Access Key ID and Secret Access Key are correct
- Check IAM user has `AmazonDynamoDBFullAccess` policy
- Ensure credentials are copied correctly (no extra spaces)

### Issue: "Table not found"

**Solution:**

- Verify table names are exactly: `Users` and `TimeTable` (case-sensitive)
- Check you're using the correct AWS region in `.env`
- Ensure tables are created in the same region as specified in `.env`

### Issue: "Region mismatch"

**Solution:**

- Check `AWS_REGION` in `.env` matches the region where tables are created
- Verify in DynamoDB console which region your tables are in

### Issue: "Cannot find module" errors

**Solution:**

```bash
npm install
```

### Issue: "JWT_SECRET is not defined"

**Solution:**

- Ensure `.env` file exists in project root
- Verify `JWT_SECRET` is set in `.env`
- Restart the server after creating/updating `.env`

---

## 📊 Table Structure Reference

### Users Table

- **Table Name**: `Users`
- **Partition Key (PK)**: String
  - Format: `ADMIN#email` or `STUDENT#usn`
  - Examples:
    - `ADMIN#admin@college.edu`
    - `STUDENT#1RI23IS050`

### TimeTable Table

- **Table Name**: `TimeTable`
- **Partition Key (PK)**: String
  - Format: `yearSection` (e.g., `5A`, `3B`, `1D`)
- **Sort Key (SK)**: String
  - Format: `DAY#slot` (e.g., `MONDAY#1`, `MONDAY#2`, `TUESDAY#3`)

---

## 🔒 Security Best Practices

1. **Never commit `.env` file to Git**

   - Already included in `.gitignore`

2. **Rotate Access Keys Regularly**

   - In IAM → Users → Security credentials → Access keys
   - Create new keys and update `.env`
   - Delete old keys after verification

3. **Use Least Privilege Principle**

   - Instead of `AmazonDynamoDBFullAccess`, create custom policy with only needed permissions:
     - `dynamodb:PutItem`
     - `dynamodb:GetItem`
     - `dynamodb:UpdateItem`
     - `dynamodb:DeleteItem`
     - `dynamodb:Query`
     - `dynamodb:Scan`

4. **Use Strong JWT Secret**
   - At least 32 characters
   - Random and unpredictable
   - Different for production vs development

---

## 📝 Quick Checklist

- [ ] AWS Account created
- [ ] IAM User created with DynamoDB permissions
- [ ] Access Key ID and Secret Access Key saved
- [ ] Users table created (PK: String, no sort key)
- [ ] TimeTable table created (PK: String, SK: String)
- [ ] `.env` file created with all credentials
- [ ] AWS_REGION matches table region
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors
- [ ] Test registration works

---

## 🎯 Next Steps

Once setup is complete:

1. Test all endpoints using Postman (see README.md for Postman guide)
2. Register an admin user
3. Register a student user
4. Add timetable slots
5. View timetables

---

## 💡 Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)

---

**Need Help?** Check the troubleshooting section above or verify each step was completed correctly.
