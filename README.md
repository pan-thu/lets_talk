# Let's Talk - Education Platform

Let's Talk is an education platform built with Next.js, enabling students to enroll in courses, access learning resources, and attend live classes. It features a comprehensive system for teachers to manage content and for administrators to oversee the platform.

The project is architected as a **monolithic Next.js application** designed for deployment on a **Virtual Private Server (VPS)**. It uses **tRPC** for a type-safe API layer, **NextAuth.js** for authentication, and **Prisma** with a **MySQL** database for data persistence.

## Key Features

-   **Role-Based Access Control:** Distinct roles for Students, Teachers, and Admins.
-   **Course Catalog:** Browse and enroll in video or live courses.
-   **Manual Payment Flow:** A unique payment system where students submit proof of payment for admin verification.
-   **Video & Audio Exercises:** Integrated video lessons and audio recording exercises for interactive learning.
-   **Dynamic Content:** Built-in systems for Announcements and a public-facing Blog.

## Tech Stack

| Layer                     | Technology                                                                                                   |
| :------------------------ | :----------------------------------------------------------------------------------------------------------- |
| **Application Framework** | **Next.js 15 (App Router)**                                                                                  |
| **API Layer**             | **tRPC**                                                                                                     |
| **Database**              | **MySQL**                                                                                                    |
| **ORM**                   | **Prisma**                                                                                                   |
| **Authentication**        | **NextAuth.js v5** (Credentials Provider)                                                                    |
| **UI**                    | **React 19**, **Tailwind CSS**                                                                               |
| **Deployment**            | **VPS** (e.g., DigitalOcean, Linode) with **PM2** and **Nginx**                                                |
| **File Storage**          | Planned for Cloudflare R2 / S3-compatible service (for video assets, payment proofs, profile pictures)         |
| **Development**           | **TypeScript**, **ESLint**, **Prettier**                                                                     |

## Getting Started

### Prerequisites

-   Node.js (v18.x or later)
-   npm (or your preferred package manager)
-   Docker (or a local MySQL instance)
-   Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd lets_talk
```

### 2. Install Dependencies

```bash
npm install
```
   
### 3. Set Up Environment Variables

Copy the example environment file and fill in your local configuration.

```bash    
cp .env.example .env
```

You will need to set the following variables in the .env file:

    DATABASE_URL: Your MySQL connection string.

    AUTH_SECRET: A secret key for NextAuth.js. You can generate one with npx auth secret.
    
### 4. Set Up the Database

This project includes a helper script to start a local MySQL database using Docker.

Make the script executable:

```bash
chmod +x ./start-database.sh
```

Run the script to start the database container:

```bash      
./start-database.sh
```

This will create a MySQL container named lets_talk-mysql based on your DATABASE_URL.

5. Run Database Migrations

Apply the database schema and generate the Prisma client.

```bash      
npx prisma migrate dev
npx prisma generate
```

### 6. Seed the Database (Optional)

To populate the database with sample data (teachers, students, courses, etc.), run the seed script:

```bash      
npx prisma db seed
```

### 7. Run the Development Server

```bash      
npm run dev
```

The application will be available at http://localhost:3000.

---

## Project Structure

The project follows a T3-Stack-influenced structure:

    src/app/: Next.js App Router (frontend pages and components).

    src/server/: Backend logic.

        api/: tRPC routers and procedures.

        auth/: NextAuth.js configuration.

        db.ts: Prisma client instance.

    prisma/: Database schema (schema.prisma) and migrations.

    docs/: Detailed project documentation.

    public/: Static assets.

For more detailed information, please refer to the docs/ directory, especially architecture.md and technical.md.
