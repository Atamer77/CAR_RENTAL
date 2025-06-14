#  Project Reset – Car Rental Web Application

This is a full-stack web application for a modern car rental service. It allows customers to browse available cars, make bookings, and securely process payments. Administrators can manage the car fleet, bookings, and user data.

## Project Structure

Project_reset-main/
├── backend/           # Node.js + Express backend  
│   ├── APP.js         # Main server file  
│   ├── db.js          # Database connection logic  
│   ├── car_rental.db  # SQLite database  
│   └── package.json   # Backend dependencies  
│  
├── frontend/          # React.js frontend  
│   ├── public/        # Static assets and HTML  
│   ├── src/           # React components and CSS  
│   └── package.json   # Frontend dependencies  
│  
├── .vscode/           # VS Code configuration  
├── .gitignore         # Git ignored files  

##  Features

###  Customer Features
- Register/Login  
- Browse cars  
- Book a car  
- Process payment  
- View booking history  

###  Admin Features
- Add, update, and delete cars  
- Manage bookings  
- Monitor payments  
- Generate reports  

##  Technologies Used

- Frontend: React.js, CSS  
- Backend: Node.js, Express.js  
- Database: SQLite3  
- Authentication: JWT, bcrypt  
- Security: CORS, cookie-parser  

## How to Run the App

### 1. Backend

cd backend  
npm install  
node APP.js  

### 2. Frontend

cd frontend  
npm install  
npm start  

##  Security Implemented

- Password hashing with bcrypt  
- JWT-based login/authentication  
- Secure HTTP headers and CORS  
- SQL injection protection using parameterized queries  

##  License

This project is for educational purposes only.

##  Credits

Developed by **Ahmed Tamer Mohamed Hassan**
