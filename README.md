<div align="center">
  <img src="public/247care-logo.png" width="120" alt="247care Logo"/>
  <h1>247care - Digital Healthcare Platform</h1>
  <p>A comprehensive, modern full-stack telemedicine and healthcare management platform.</p>
</div>

![247care Platform Dashboard](public/image.png)

## 🚀 Overview

**247care** is an advanced telemedicine application built to bridge the gap between patients and healthcare professionals. Patients can find verified doctors, book appointments, attend live video consultations, and receive professionally formatted digital PDF prescriptions instantly. 

The application utilizes real-time database synchronization, AI-powered chatbots, and an integrated pharmacy locator to provide an all-in-one healthcare ecosystem.

## ✨ Key Features

### For Patients
* **Find Specialists**: Browse a categorized list of verified doctors and filter by specialty.
* **Instant Booking**: Pick available time slots and schedule appointments seamlessly.
* **Live Video Consultations**: Attend high-quality video calls directly within the platform.
* **AI Medical Assistant**: Ask basic health queries to a 24/7 AI-powered chatbot.
* **Digital Prescriptions**: View and download professional PDF prescriptions securely.
* **Pharmacy Locator**: Find nearby chemists and pharmacies using the interactive Mapbox integration.

### For Doctors
* **Profile Management**: Manage your availability, specialties, and professional profile.
* **Appointment Dashboard**: View scheduled, completed, and canceled appointments in real-time.
* **Prescription Generator**: Write clinical notes and automatically generate professional, watermarked PDF prescriptions for patients.
* **Earnings Tracking**: Track completed payouts and overall consultation earnings.

### For Administrators
* **Verification System**: Approve or reject pending doctor and chemist registrations.
* **Platform Oversight**: Monitor total users, doctors, chemists, and appointment metrics.

## 🛠️ Technology Stack

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
* **Database & Realtime**: [Convex](https://www.convex.dev/) (NoSQL Database, File Storage, & Serverless Functions)
* **Authentication**: [Clerk](https://clerk.com/) (with Role-Based Access Control)
* **Video Calling**: [Vonage Video API](https://www.vonage.com/)
* **AI Chatbot**: [Google Gemini API](https://deepmind.google/technologies/gemini/)
* **Maps**: [Mapbox API](https://www.mapbox.com/)
* **PDF Generation**: `jsPDF` & `html-to-image` (100% Client-Side Rendering)

## 💻 Running Locally

### Prerequisites
Make sure you have Node.js installed and an active internet connection. You will also need to create accounts on Clerk, Convex, Vonage, Mapbox, and Google AI Studio to get your API keys.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arijit3111w/247Care.git
   cd 247Care
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create `.env.local` and `.env` files in the root of your project and add your API keys:
   ```env
   # .env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   NEXT_PUBLIC_VONAGE_APPLICATION_ID=your_vonage_app_id
   VONAGE_APPLICATION_ID=your_vonage_app_id
   VONAGE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   
   # .env.local
   CONVEX_DEPLOYMENT=dev:your_convex_deployment
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   NEXT_PUBLIC_CONVEX_SITE_URL=your_convex_site_url
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Initialize Convex:**
   ```bash
   npx convex dev
   ```

5. **Run the development server:**
   In a new terminal window, run:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Deployment

This application is fully optimized for [Vercel](https://vercel.com).
To deploy:
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add all the environment variables from `.env` and `.env.local` into your Vercel project settings.
4. Click Deploy!
