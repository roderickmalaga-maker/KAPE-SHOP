# ARL Coffee Shop Management System

A complete, fully functional Coffee Shop Management System built with HTML5, CSS3, JavaScript, and IndexedDB.

## Features

- **Dashboard** - Real-time statistics and overview
- **Point of Sale (POS)** - Process orders quickly and efficiently
- **Product Management** - Add, edit, delete products with categories
- **Order Management** - Track and update order statuses
- **Billing & Receipts** - Generate and print receipts
- **Customer Management** - Manage customer information
- **Inventory Management** - Track stock with low-stock alerts
- **Sales Reports** - Daily, weekly, monthly reports
- **User Authentication** - Login/Register with role-based access
- **Account Management** - Admin can manage users

## Demo Accounts

**Administrator:**
- Email: ARL@COFFEESHOP.COM
- Password: ADMIN123

**Cashier:**
- Email: cashier@coffeeshop.com
- Password: cashier123

## How to Run

1. Extract all files to a folder
2. Open `login.html` in a modern web browser (Chrome, Firefox, Edge recommended)
3. Login with demo accounts or register a new cashier account
4. Start using the system

## Technical Requirements

- Modern web browser with IndexedDB support
- No server required - runs entirely in browser
- All data stored locally using IndexedDB

## Security Features

- Passwords hashed using PBKDF2 with Web Crypto API
- Role-based access control
- Session management
- Account status validation

## Browser Compatibility

Works on all modern browsers that support:
- ES6+ JavaScript
- IndexedDB
- Web Crypto API

## Notes

- Data persists in browser's IndexedDB
- Sample products and inventory are added on first run
- Public registration creates Cashier accounts only
- Administrators must be created by existing administrators
