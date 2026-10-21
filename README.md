# Content Management System

A full-stack Content Management System (CMS) designed to provide a centralized platform for creating, managing, reviewing, discovering, and interacting with digital content.

The system includes article/blog management, quizzes, user management, admin verification, content management, search and browse functionality, quiz attempts and results, and notifications.

---

## 📌 Project Overview

The Content Management System is a collaborative full-stack web application developed using modern web technologies.

The application provides different functionalities for users, content creators, and administrators. Users can register and authenticate, browse content, read articles, participate in quizzes, view their results, and receive notifications.

Administrators can verify content and manage the overall platform.

---

## 🎯 Objectives

- Provide secure user registration and authentication.
- Enable users to create and manage articles/blogs.
- Provide an interactive quiz system.
- Allow administrators to verify and manage submitted content.
- Provide search and browse functionality.
- Track quiz attempts and results.
- Provide notifications for important activities.
- Maintain a scalable and modular project structure.
- Enable collaborative development using Git and GitHub.

---

## 🚀 Features

### 👤 User Management
- User registration
- User login and authentication
- Password security
- JWT-based authentication
- User profile management
- Role-based access where required

### 📝 Article / Blog Management
- Create articles
- Edit articles
- View articles
- Manage article content
- Article publishing workflow

### 🧠 Quiz Management
- Create quizzes
- Manage questions and answers
- Publish quizzes
- Allow users to participate in quizzes

### 🛡️ Admin Verification
- Review submitted content
- Verify or reject content
- Admin-level content control
- Content approval workflow

### 📚 Content Management
- Manage platform content
- Organize content
- Update and maintain published content

### 🔎 Search & Browse
- Search for articles and other content
- Browse available content
- Filter content based on available criteria

### 📊 Quiz Attempt & Result
- Attempt quizzes
- Store quiz attempts
- Calculate results
- View previous results
- Track user performance

### 🔔 Notification
- Notify users about important activities
- Support content-related notifications
- Support quiz-related notifications

---

## 🏗️ Project Modules

| Module | Assigned Member |
|---|---|
| User Management | Sadanand |
| Article / Blog | Sanika |
| Quiz | Shyam |
| Admin Verification | Poojitha |
| Content Management | Rakesh |
| Search & Browse | Unnati |
| Quiz Attempt & Result + Notification | Ashmitha |
| Final Integration | Aravind Kumar |

---

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MongoDB
- MongoDB Atlas

### Authentication
- JWT (JSON Web Token)
- Password hashing

### Development Tools
- Git
- GitHub
- Visual Studio Code
- Postman
- MongoDB Atlas

---

## 📂 Project Structure

```text
content-management-system/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
│
├── README.md
└── .gitignore
