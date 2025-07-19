# Devotel

Job aggregation and API platform that fetches job data from multiple external providers, transforms it into a unified format, and provides a clean RESTful API for querying job offers.

## Features

- **Multi-Provider Data Integration**: Fetches job data from multiple external APIs
- **Data Transformation**: Normalizes job data into a unified structure
- **Automated Scheduling**: Fetches new job data every 30 minutes via cron jobs
- **PostgreSQL Storage**: Robust database with duplicate prevention and relationships
- **RESTful API**: Clean `/api/job-offers` endpoint with filtering and pagination
- **Swagger Documentation**: Auto-generated API documentation
- **Comprehensive Testing**: Unit tests with Jest
- **Docker Ready**: Full containerization with Docker Compose

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **API Documentation**: Swagger/OpenAPI
- **Scheduling**: NestJS Schedule (@nestjs/schedule)
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## API Endpoints

### Job Offers
- `GET /api/job-offers` - Retrieve job offers with filtering and pagination
  - Supports query parameters for filtering
  - Includes company and skills data
  - Paginated responses (max 15 items per page)
  - Available at: http://localhost:3000/api/job-offers

### Documentation
- `GET /swagger` - Interactive API documentation
  - Available at: http://localhost:3000/swagger

## Database Schema

The application uses a relational database structure:
- **Jobs**: Core job postings with title, description, salary, etc.
- **Companies**: Company information linked to jobs
- **Skills**: Required skills with many-to-many relationship to jobs
- **Provider Jobs**: Tracking table for external API data sources

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thinker-amir/devotel.git
   cd devotel
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Start services**
   ```bash
   docker compose up -d
   ```

4. **Install dependencies**
   ```bash
   docker compose exec nestjs pnpm install
   ```

5. **Run database migrations**
   ```bash
   docker compose exec nestjs npm run migration:run
   ```

🎉 **Ready!** Your application is now running:
- **API**: http://localhost:3000/api/job-offers
- **Swagger Docs**: http://localhost:3000/swagger

## 🧪 Testing & Development

### Available Scripts

```bash
# Testing
docker compose exec nestjs npm run test -- --verbose   # Run unit tests
docker compose exec nestjs npm run test:watch          # Run tests in watch mode
docker compose exec nestjs npm run test:cov            # Run tests with coverage

# Development
docker compose exec nestjs npm run start:dev           # Start in development mode
docker compose exec nestjs npm run start:debug         # Start with debugging
docker compose exec nestjs npm run build               # Build for production

# Database
docker compose exec nestjs npm run migration:generate  # Generate new migration
docker compose exec nestjs npm run migration:run       # Run migrations
docker compose exec nestjs npm run migration:revert    # Revert last migration

# Code Quality
docker compose exec nestjs npm run lint                # Lint code
docker compose exec nestjs npm run format              # Format code with Prettier
```

### Project Structure

```
devotel/
├── nestjs/                          # NestJS application
│   ├── src/
│   │   ├── database/
│   │   │   ├── entities/           # TypeORM entities
│   │   │   ├── migrations/         # Database migrations
│   │   │   └── config/             # Database configuration
│   │   └── modules/
│   │       └── job/                # Job module (services, controllers)
│   ├── test/                       # Test files
│   └── package.json
├── data/                           # Data storage volume
├── docker-compose.yml              # Docker services configuration
└── README.md
```
