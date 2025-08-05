# Seb's Hub QR Scanner Frontend - Next.js Implementation Plan

## Project Overview

A modern Next.js + TailwindCSS web application for the QR code scanner interface that integrates with the existing Seb's Hub backend API. This frontend provides real-time QR code scanning, access validation, and administrative features for coworking space access control.

## Technical Stack

- **Frontend Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS v4
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **QR Scanning**: @zxing/library
- **State Management**: @tanstack/react-query
- **Form Handling**: react-hook-form + zod
- **Icons**: lucide-react
- **Notifications**: sonner

## Project Structure

```
qr-scanner-frontend/
├── package.json                 # Next.js 15, TailwindCSS v4, TypeScript
├── next.config.ts              # Next.js config
├── tailwind.config.js          # TailwindCSS config
├── tsconfig.json               # TypeScript config
├── components.json             # shadcn/ui config
├── src/
│   ├── app/                    # App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home/Dashboard
│   │   ├── scanner/            # QR Scanner pages
│   │   │   ├── page.tsx        # Main scanner interface
│   │   │   └── admin/
│   │   │       └── page.tsx    # Admin scanner with extra features
│   │   ├── access-logs/
│   │   │   └── page.tsx        # Access logs viewing
│   │   └── capacity/
│   │       └── page.tsx        # Capacity monitoring
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── scanner/            # Scanner-specific components
│   │   │   ├── QRScanner.tsx   # Main QR scanner component
│   │   │   ├── CameraPreview.tsx # Camera interface
│   │   │   ├── ValidationResult.tsx # Validation feedback UI
│   │   │   ├── ActionToggle.tsx # Entry/Exit toggle
│   │   │   ├── UserDisplay.tsx  # User info display
│   │   │   └── AccessLogger.tsx # Recent access logs
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx   # Main app layout
│   │   │   └── ScannerLayout.tsx # Scanner-specific layout
│   │   └── admin/
│   │       ├── ManualEntry.tsx # Manual access entry
│   │       └── CapacityMonitor.tsx # Capacity dashboard
│   ├── hooks/
│   │   ├── useCamera.ts        # Camera access management
│   │   ├── useQRScanner.ts     # QR scanning logic
│   │   ├── useAccessValidation.ts # API integration
│   │   └── useAudioFeedback.ts # Sound notifications
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts       # API client setup
│   │   │   └── access.ts       # Access-related API calls
│   │   ├── qr/
│   │   │   ├── scanner.ts      # QR scanning utilities
│   │   │   └── validation.ts   # QR validation logic
│   │   ├── audio/
│   │   │   └── sounds.ts       # Audio feedback system
│   │   └── utils.ts            # Utility functions
│   ├── types/
│   │   ├── index.ts            # Shared types
│   │   ├── api.ts              # API response types
│   │   └── scanner.ts          # Scanner-specific types
│   └── context/
│       ├── ScannerProvider.tsx # Scanner state management
│       └── AudioProvider.tsx   # Audio settings context
```

## Complete User Flow Process

### Phase 1: User Preparation (Existing Backend)
1. **Registration & Subscription**
   - User registers via `/api/auth/register`
   - Selects plan via `/api/subscriptions/apply`
   - Uploads receipt via `/api/subscriptions/upload-receipt`
   - Admin approves via `/api/admin/approve-payment/:id`

2. **QR Code Generation**
   - User requests QR code via `/api/user/qr-code`
   - System returns QR image with unique token
   - User displays QR on mobile device

### Phase 2: Scanner Interface Usage (New Frontend)

#### Entry Process:
1. **Approach Scanner**
   - User arrives at Seb's Hub entrance
   - Scanner displays "Ready to Scan" interface
   - Current mode shown (ENTRY selected by default)

2. **QR Code Scanning**
   - User holds phone with QR code toward camera
   - Real-time camera preview with scanning overlay
   - System detects and extracts QR token

3. **Instant Validation**
   - Frontend calls `/api/access/validate-qr`
   - Backend validates:
     - ✅ Subscription status
     - ✅ Time restrictions (morning/afternoon/night)
     - ✅ Capacity limits
     - ✅ Grace period status

4. **Visual Feedback**
   - **SUCCESS**: 🟢 Green screen + "Welcome John!" + success sound
   - **DENIED**: 🔴 Red screen + "Access Denied" + error sound
   - **EXPIRED**: 🟠 Orange screen + "Subscription Expired" + warning
   - **INVALID_TIME**: 🟡 Yellow screen + "Outside allowed hours"
   - **CAPACITY_FULL**: 🔵 Blue screen + "Capacity reached"

5. **Access Logging**
   - System logs entry with timestamp
   - Updates capacity counters
   - Shows recent access attempts

#### Exit Process:
1. User approaches on leaving
2. Toggle to EXIT mode (manual or auto-detection)
3. Same scanning process with EXIT action
4. Capacity counter decremented
5. Visit duration logged

## Technical Implementation Details

### Key Dependencies
```json
{
  "dependencies": {
    "next": "15.4.2",
    "react": "19.1.0",
    "tailwindcss": "^4",
    "@zxing/library": "^0.20.0",        // QR scanning
    "@tanstack/react-query": "^5.83.0", // API management
    "react-hook-form": "^7.60.0",       // Forms
    "zod": "^4.0.5",                    // Validation
    "lucide-react": "^0.525.0",         // Icons
    "sonner": "^2.0.6",                 // Notifications
    "date-fns": "^4.1.0",               // Date formatting
    "class-variance-authority": "^0.7.1", // CSS utilities
    "clsx": "^2.1.1",                   // Conditional classes
    "tailwind-merge": "^3.3.1"          // Tailwind class merging
  }
}
```

### Core Scanner Hook Implementation
```typescript
// hooks/useQRScanner.ts
export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const startScanning = useCallback(() => {
    // Initialize ZXing scanner
    // Setup camera stream  
    // Handle QR detection
  }, []);
  
  return { isScanning, result, startScanning };
};
```

### API Integration
```typescript
// lib/api/access.ts
export const validateAccess = async (
  qrToken: string, 
  action: 'ENTRY' | 'EXIT'
) => {
  const response = await fetch('/api/access/validate-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken, action })
  });
  return response.json();
};
```

## UI/UX Features

### Scanner Interface Design
- **Full-screen camera preview** with scanning guides
- **Large action buttons** for Entry/Exit toggle
- **Color-coded feedback** with clear status messages
- **User information display** showing name and plan
- **Recent access log** sidebar for monitoring
- **Audio feedback** with configurable volume

### Responsive Design
- **Mobile-first**: Optimized for phones/tablets
- **Kiosk mode**: Dedicated terminal interface  
- **Touch-friendly**: Large buttons and gestures
- **Accessibility**: Screen reader support
- **Dark/Light themes**: User preference based

### Admin Features
- **Manual entry override** for system failures
- **Real-time capacity monitoring** dashboard
- **Access logs viewing** with filters
- **Scanner settings** configuration panel
- **Daily/weekly reports** generation

## Implementation Phases

### Phase 1: Core Setup (Day 1-2)
- [x] Create Next.js project with TailwindCSS
- [x] Save implementation plan as task.md
- [ ] Set up shadcn/ui components
- [ ] Create basic layout and routing
- [ ] Implement camera access functionality

### Phase 2: Scanner Development (Day 2-3)  
- [ ] Integrate ZXing QR scanning library
- [ ] Build camera preview component
- [ ] Create validation result UI
- [ ] Implement audio feedback system

### Phase 3: API Integration (Day 3-4)
- [ ] Connect to existing `/api/access/validate-qr`
- [ ] Handle all validation scenarios
- [ ] Implement real-time logging
- [ ] Add error handling and retries

### Phase 4: Enhancement (Day 4-5)
- [ ] Add admin features and manual entry
- [ ] Implement capacity monitoring
- [ ] Create access logs viewing
- [ ] Add responsive design optimizations

### Phase 5: Testing & Deployment (Day 5-6)
- [ ] Cross-device testing
- [ ] Performance optimization
- [ ] Production build setup
- [ ] Integration testing with backend
- [ ] User acceptance testing

## Backend API Integration Points

### Existing Endpoints to Use
- `POST /api/access/validate-qr` - Main validation endpoint
- `GET /api/access/current-capacity` - Capacity monitoring
- `GET /api/access/logs` - Access logs (admin)
- `POST /api/access/manual-entry` - Manual entry (admin)

### Expected API Response Formats
```typescript
// Validation Response
interface ValidationResponse {
  success: boolean;
  validationResult: 'SUCCESS' | 'DENIED' | 'EXPIRED' | 'INVALID_TIME' | 'CAPACITY_FULL';
  user?: {
    name: string;
    plan: string;
  };
  message?: string;
}

// Capacity Response
interface CapacityResponse {
  success: boolean;
  data: {
    totalCapacity: number;
    totalCurrentOccupancy: number;
    breakdown: {
      id: string;
      name: string;
      maxCapacity: number;
      currentCapacity: number;
    }[];
  };
}
```

## Development Environment Setup

### Prerequisites
- Node.js 18+ (for Next.js 15)
- npm or yarn package manager
- Camera-enabled device for testing
- Access to Seb's Hub backend API

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SCANNER_MODE=development
NEXT_PUBLIC_AUDIO_ENABLED=true
```

## Deployment Considerations

### Build Configuration
- Static export capability for CDN deployment
- Service worker for offline functionality
- PWA configuration for mobile installation
- Docker containerization option

### Security Features
- HTTPS enforcement for camera access
- API endpoint validation
- Input sanitization
- Rate limiting integration

---

## Current Status: Project Initialized ✅

**Last Updated**: August 5, 2025  
**Next Step**: Initialize Next.js project and install dependencies  
**Estimated Completion**: 5-6 days for full implementation

This implementation plan provides a comprehensive roadmap for creating a modern, production-ready QR scanner frontend that seamlessly integrates with the existing Seb's Hub backend infrastructure.
