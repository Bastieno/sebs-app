# Seb's Hub Backend

A TypeScript-based Node.js backend API for Seb's Hub coworking space management system.

## 🚀 Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Express.js**: Fast, unopinionated web framework
- **Prisma**: Modern database toolkit with type-safe queries
- **Security**: Helmet for security headers, CORS configuration
- **Development**: Hot reload with ts-node and nodemon
- **Error Handling**: Comprehensive error handling with custom error types
- **Logging**: Morgan for HTTP request logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (optional for development)

## 🛠️ Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd seb-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Run with hot reload
npm run dev

# Run with nodemon and hot reload
npm run dev:watch
```

### Production Mode

```bash
# Build the TypeScript code
npm run build

# Start the production server
npm start
```

### Other Commands

```bash
# Type check without building
npm run type-check

# Clean build directory
npm run clean
```

## 📁 Project Structure

```text
src/
├── config/          # Configuration files
│   └── database.ts  # Database connection setup
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
│   └── index.ts     # Common types and interfaces
├── utils/           # Utility functions
└── server.ts        # Main application entry point
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/seb_hub"
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### TypeScript Configuration

The project uses a comprehensive TypeScript configuration with:

- Strict type checking
- Path mapping for clean imports
- ES2020 target
- CommonJS modules
- Source maps for debugging

## 🗄️ Database

This project uses Prisma as the ORM. The database configuration is in `src/config/database.ts`.

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation middleware
- **Error Handling**: Secure error responses

## 📡 API Endpoints

### Health Check

- `GET /health` - Application health status
- `GET /` - API information

### API Routes (Coming Soon)

- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/subscriptions` - Subscription management
- `/api/access` - Access control
- `/api/admin` - Admin operations

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Type Safety

- Define interfaces for all data structures
- Use custom error types
- Leverage TypeScript's type system for better code quality

### Error Handling

- Use the custom error interfaces in `src/types/index.ts`
- Implement proper error responses
- Log errors appropriately

## 🚀 Deployment

### Building for Production

```bash
npm run build
```

This creates a `dist/` directory with compiled JavaScript files.

### Environment Setup

- Set `NODE_ENV=production`
- Configure production database
- Set secure JWT secrets
- Configure CORS for production domains

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.
