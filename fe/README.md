# FinManage Frontend (Next.js 16)

This is the modern, highly interactive user interface for the FinManage application, designed with premium aesthetics and smooth animations.

## 🚀 Tech Stack & Techniques

- **Framework**: [Next.js 16.2.6](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: React 19
- **Styling**: Vanilla CSS with modern standard variables + [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/) (Responsive, customized SVG charts)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Design System & Aesthetics**:
  - **Premium Dark Mode**: Utilizing deep dark backgrounds (`#0a0a0f`), vibrant violet/purple gradient accents, and dynamic glowing blobs.
  - **Glassmorphism**: Cards and sidebars use `backdrop-filter: blur` with subtle translucent borders.
  - **Typography**: Google Inter font integrated natively via Next.js `next/font`.
  - **Micro-animations**: Hover scaling (`hover:scale-[1.02]`), pulse effects, and smooth layout transitions via Framer Motion.
- **Architecture**:
  - Route Groups: `(auth)` for public login/register and `(dashboard)` for authenticated application shell.
  - Component-based: Reusable UI primitives (`Button`, `Card`) and Layout components (`Sidebar`, `Header`).

## 📁 Project Structure

```text
src/
├── app/
│   ├── (auth)/             # Authentication pages (Login, Register)
│   ├── (dashboard)/        # Main app shell (Sidebar, Header, Main content)
│   ├── globals.css         # Core Design System, CSS Variables, Tailwind v4 imports
│   └── layout.tsx          # Root layout with Font definitions
├── components/
│   ├── layout/             # Sidebar, Header
│   └── ui/                 # Reusable atomic components (Button, Card)
└── lib/
    └── utils.ts            # Tailwind class merge utilities (clsx, tailwind-merge)
```

## 🛠️ Setup & Run

### 1. Prerequisites
- Node.js (v18+)

### 2. Installation
Navigate to the `fe` directory and install dependencies:
```bash
npm install
```

### 3. Start the Development Server
Run the Next.js development server (using Turbopack for extremely fast HMR):
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## 🎨 Design Highlights
- **Dashboard**: Features an Area chart for Savings Trends (with gradients) and a customized Bar chart for Monthly spending. It includes a Quick Stats widget and dynamic recent transactions list.
- **Auth Flow**: Full viewport dark theme with a radial gradient mesh background. Features password visibility toggles and glassmorphic cards.
- **Responsiveness**: The layout utilizes CSS Grid and Flexbox for seamless adaptation across various screen sizes.
