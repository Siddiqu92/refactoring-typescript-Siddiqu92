# Project Ko Run Karne Ke Liye Guide (हिंदी/Urdu)

## 🚀 Quick Start

### Option 1: Demo Script Run Karein (Recommended)

Project ko preview karne ke liye demo script run karein:

```bash
npm run demo
```

Ya phir:

```bash
npm start
```

Ye script aapko dikhayegi:
- ✅ Available clients
- ✅ Existing users
- ✅ New user creation
- ✅ Cache performance (fast retrieval)
- ✅ User updates
- ✅ Validation examples
- ✅ Credit limit calculations

### Option 2: Manual Test Runner

```bash
npm run test:manual
```

### Option 3: Unit Tests

```bash
npm test
```

## 📋 Requirements

Pehle dependencies install karein:

```bash
npm install
```

## 🎯 Demo Script Kya Dikhati Hai?

Demo script (`demo.ts`) aapko dikhayegi:

1. **Available Clients** - Database mein available clients
2. **Existing Users** - Pehle se existing users
3. **New User Creation** - Naya user kaise add karein
4. **Cache Performance** - Cache kaise kaam karta hai (fast retrieval)
5. **User Updates** - User information update karna
6. **Validation** - Input validation examples
7. **Credit Limits** - Different client types ke credit limits

## 📁 Project Structure

```
src/
├── services/          # Business logic
│   └── user-service.ts
├── repositories/      # Data access layer (with caching)
│   ├── user-repository.ts
│   └── client-repository.ts
├── types/            # Type definitions
│   └── user.interface.ts
└── lru-cache.ts      # LRU Cache (consumed, not implemented)
```

## 🔧 Development Commands

```bash
# Tests run karein
npm test

# Tests watch mode mein
npm run test:watch

# Demo script run karein
npm run demo

# Manual test runner
npm run test:manual
```

## 💡 Key Features

- ✅ **Repository Pattern** - Clean data access
- ✅ **Caching Layer** - Fast data retrieval
- ✅ **SOLID Principles** - Clean code architecture
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Validation** - Input validation
- ✅ **Business Logic** - Credit limit calculations

## 🎓 Example Usage

Agar aap apna code likhna chahte hain:

```typescript
import { UserService } from "./src/services/user-service.js";
import { UserRepository } from "./src/repositories/user-repository.js";
import { ClientRepository } from "./src/repositories/client-repository.js";

// Initialize
const userRepo = new UserRepository();
const clientRepo = new ClientRepository();
const userService = new UserService(userRepo, clientRepo);

// Add user
const result = await userService.addUser(
  "John",
  "Doe",
  "john@example.com",
  new Date("1990-01-01"),
  "client-id"
);

// Get user (cached!)
const user = await userService.getUserById(result.user!.id);
```

## 📝 Notes

- Database file: `db.json` (lowdb JSON database)
- Cache TTL: 5 minutes
- Cache size: 100 items for users, 10 for arrays
- Minimum age: 21 years

## ❓ Help

Agar koi problem ho to:
1. `npm install` dobara run karein
2. `db.json` file check karein (valid JSON hona chahiye)
3. Node.js version 20+ hona chahiye

