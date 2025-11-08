# Legia - AI-Powered Professional Services Marketplace

Legia is a comprehensive platform that connects clients with professionals through AI-powered matching, secure escrow payments, and integrated project management tools.

## 🚀 Features

- **AI-Powered Professional Matching**: Advanced AI assistant using Google Gemini for intelligent professional recommendations
- **Multi-Authentication System**: OAuth (Google, Apple) and email/password authentication
- **Indonesian Payment Gateways**: Integrated with Midtrans, Xendit, and Tripay
- **Secure Escrow System**: Milestone-based fund management with dispute resolution
- **E-commerce Flow**: Complete cart and checkout system
- **Project Management**: Dashboard for professionals and clients
- **Admin Panel**: Comprehensive CMS and analytics
- **Modern UI**: Built with shadcn/ui and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: NextAuth.js
- **AI**: Google Gemini API
- **Payments**: Midtrans, Xendit, Tripay
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **State Management**: Zustand

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/legiaio/legiafullstack.git
   cd legiafullstack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="file:./prisma/dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   APPLE_ID="your-apple-id"
   APPLE_SECRET="your-apple-secret"
   
   # AI
   GEMINI_API_KEY="your-gemini-api-key"
   
   # Payment Gateways
   MIDTRANS_SERVER_KEY="your-midtrans-server-key"
   MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
   XENDIT_SECRET_KEY="your-xendit-secret-key"
   TRIPAY_API_KEY="your-tripay-api-key"
   TRIPAY_PRIVATE_KEY="your-tripay-private-key"
   TRIPAY_MERCHANT_CODE="your-tripay-merchant-code"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables in Vercel dashboard**
   - Go to your project settings
   - Add all environment variables from `.env.local`

### Docker

1. **Build the Docker image**
   ```bash
   docker build -t legia .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

Use the deployment script:
```bash
./deploy.sh
```

## 📁 Project Structure

```
legiafullstack/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── lib/                 # Utilities and services
│   └── types/               # TypeScript types
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
├── docs/                    # Documentation
└── deployment/              # Deployment configurations
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up
- `GET /api/auth/session` - Get session

### Payments
- `POST /api/payments/create` - Create payment
- `GET /api/payments/status/:id` - Check payment status
- `POST /api/payments/webhook/*` - Payment webhooks

### Escrow
- `POST /api/escrow/create` - Create escrow account
- `GET /api/escrow/list` - List escrow accounts
- `POST /api/escrow/release-funds` - Release funds

### AI Assistant
- `POST /api/ai/match-professional` - Get professional recommendations
- `POST /api/ai/chat` - Chat with AI assistant

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📚 Documentation

- [Payment Integration Guide](./PAYMENT_INTEGRATION.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@legia.io or join our Discord community.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- All the open-source contributors
