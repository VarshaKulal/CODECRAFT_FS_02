### Employee Management System — CODECRAFT_FS_02

A  Employee Management System built with Node.js, Express.js, and MongoDB.
This project is part of the CodeCraft Full Stack Series (FS_02).


### Project Description

This project demonstrates CRUD (Create, Read, Update, Delete) operations for managing employee records.
It provides a role-based system where only admins can manage employee data after logging in securely.


### Features

👤 User authentication with Admin & User roles

➕ Add new employee records

📋 View all employees

✏ Update employee details

🗑 Delete employee records

🛡 Secure session handling with express-session & MongoDB store

### Tech Stack

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express.js

Database: MongoDB

### Project Structure

CODECRAFT_FS_02/
│── node_modules/
│── public/
│   ├── admin.html
│   ├── employees.js
│   ├── login.html
│   ├── register.html
│   ├── style.css
│
│── server.js
│── package.json
│── package-lock.json


### 🛠 Setup Instructions
### Backend
1. Go inside root folder CODECRAFT_FS_02  
   ```bash
   
   npm install
   node server.js

   In browser http://localhost:3000/admin.html
### MongoDB 
1. Database Name: employeeDB
2. Collection Name: employees
                    users



### Access the project

CRUD operation(Backend API) :http://localhost:3000/admin.html

Frontend: http://localhost:5500 (Live Server)



