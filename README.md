# E-commerce Backend API

> **Note:** This project is currently under active development and is not yet complete. Some features might be missing or partially implemented.

A robust Node.js backend application providing essential endpoints for e-commerce operations, featuring Azure Blob Storage for product images and MySQL database for data persistence.

## 🚀 Features

- User authentication and authorization
- Product management with image handling
- Order processing
- Category management
- Azure Blob Storage integration for product images
- Comprehensive API documentation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Azure account with active subscription
- Azure Blob Storage account
- npm or yarn package manager

## 🛠️ Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Image Storage:** Azure Blob Storage
- **Deployment:** Azure App Service
- **Authentication:** JWT (JSON Web Tokens)

## 🗄️ Database Schema

The application uses a relational database model with MySQL. Below is the Entity-Relationship Diagram (ERD) showing the database structure:

[Database Schema Diagram]

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/EliasTamer/ecommerce_backend
   cd ecommerce-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in the following environment variables:
   ```
   # Server Configuration
   PORT=3001

   # Database Configuration
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-user
   DB_PASSWORD=your-mysql-password
   DB_NAME=ecom_backend

   # Azure Storage Configuration
   AZURE_STORAGE_CONNECTION_STRING=your-connection-string

   # JWT Configuration
   JWT_SECRET=your-jwt-secret

   # Mailing Configuration
   GMAIL_APP_PASSWORD=GMAIL-PASSWORD-HERE
   GMAIL_USER=GMAIL-USER-ACCOUNT
   ```

5. Start the server:
   ```bash
   npm run dev    # for development
   npm start      # for production
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/editUserInfo` - Edit user information
- `GET /api/auth/generateOtp` - Generate user OTP
- `POST /api/auth/validateOtp` - Validate user OTP
- `POST /api/auth/changePassword` - Change user password
- `POST /api/auth/deleteUserAccount` - Delete user account

### Users
- `GET /api/users/profile` - Get user profile
- `POST /api/users/profile` - Edit user profile

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove item from cart

### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## 📦 Azure Deployment

1. Create an Azure App Service:
   ```bash
   az webapp create --resource-group YourResourceGroup --plan YourAppServicePlan --name YourAppName --runtime "NODE:14-lts"
   ```

2. Configure deployment settings:
   ```bash
   az webapp config appsettings set --resource-group YourResourceGroup --name YourAppName --settings @azure-settings.json
   ```

3. Deploy the application:
   ```bash
   az webapp deployment source config --resource-group YourResourceGroup --name YourAppName --repo-url YourRepoURL --branch main
   ```

## 📈 Performance Monitoring

The application includes Azure Application Insights for monitoring and performance tracking. Access metrics through the Azure Portal.

## 🔒 Security Features

- JWT-based authentication
- Password hashing using bcrypt
- CORS configuration
- SQL injection prevention
