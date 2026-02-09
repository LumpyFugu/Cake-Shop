# Online Cake Shop

## Overview

A full-stack web application for an online cake shop, designed to provide a seamless shopping experience with modern web technologies.

This project demonstrates end-to-end system design including frontend UI development, backend API architecture, database modeling, and authentication.

---

## Objective

This project was built to simulate the development of a real-world production system.
The system emphasizes:

- Practice full-stack system design  
- Strengthen understanding of client-server architecture  
- Apply RESTful principles in API development  
- Gain hands-on experience with ORM-based database modeling  
- Develop a scalable and maintainable project structure 

---

## Key Features

- User authentication (signup / login)  
- Product browsing  
- Shopping cart functionality  
- Order management  
- RESTful API integration  
- Database schema design with Prisma  

---

## Tech Stack

**Frontend**  
- React  
- Vite  
- TypeScript / JavaScript
- Axios
- Modern CSS  

**Backend**  
- Node.js
- Express
- Prisma ORM
- RESTful API design

**Database**  
- SQLite  

---

## Architecture

Browser  
↓  
React Frontend  
↓ (HTTP / REST API)  
Node.js + Express Backend  
↓  
Prisma ORM  
↓  
Database  

---

## How to Run

### 1. Clone the repository
git clone https://github.com/LumpyFugu/Cake-Shop.git  
cd Cake-Shop  

### 2. Backend Setup
cd backend　　
npm install　　

(Create a .env file:)  
DATABASE_URL=  
JWT_SECRET=  

(Run migrations:)  
npx prisma migrate dev  

(Start the server:)  
npm run dev  

### 3. Frontend Setup
cd frontend  
npm install  
npm run dev   

---

## Live Demo
https://github.com/LumpyFugu/Cake-Shop/blob/main/demo.mp4

