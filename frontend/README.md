# GrocerSmart AI - Frontend

A modern, professional React-based admin dashboard for retail management built with Material-UI (MUI).

## 🚀 Features

### Core Functionality
- **User Management**: Register, login, and manage users with role-based access (Admin/Cashier)
- **Inventory Management**: Track products, manage stock, and handle bulk-to-unit conversions
- **Credit Customers**: Manage customer accounts, credit limits, and payment tracking
- **Cheque Management**: Track cheques with status lifecycle (Pending → Deposited → Cleared/Bounced)
- **Orders**: Create, manage, and track sales orders with item-level details
- **Suppliers & Purchase Orders**: Manage suppliers and procurement workflow

### UI/UX Highlights
- **Professional Design System**: Production-grade MUI theme with comprehensive design tokens
- **Dark/Light Mode**: Persistent theme toggle with localStorage
- **Responsive Layout**: Mobile-first design with collapsible sidebar
- **Loading States**: Skeleton loaders for better perceived performance
- **Empty States**: Helpful messages and CTAs when no data exists
- **Form Validation**: Client-side validation with helpful error messages
- **Toast Notifications**: Real-time feedback for user actions
- **Breadcrumb Navigation**: Clear page hierarchy
- **Status Chips**: Color-coded status indicators with icons
- **Professional Charts**: Recharts integration for data visualization

## 📦 Tech Stack

- **React 19** with Vite
- **Material-UI (MUI) v7** - Component library
- **React Router v7** - Navigation
- **Axios** - HTTP client
- **Recharts** - Charts and data visualization
- **React Toastify** - Toast notifications
- **Date-fns** - Date utilities

## 🎨 Design System

### Theme
- **Typography**: Inter font family with comprehensive scale (h1-h6, body1-2, etc.)
- **Colors**: 
  - Primary: Blue (#2563eb)
  - Secondary: Purple (#8b5cf6)
  - Success, Warning, Error, Info variants
  - Optimized for both light and dark modes
- **Spacing**: Consistent 8px grid system
- **Shadows**: 5-level elevation system
- **Border Radius**: 12px default with component-specific overrides

### Components
- `PageHeader` - Consistent page titles with breadcrumbs
- `KpiCard` - Dashboard metrics with icons and trends
- `SectionCard` - Reusable card wrapper for page sections
- `DataTable` - Feature-rich table with search, pagination, and actions
- `StatusChip` - Color-coded status indicators
- `EmptyState` - Helpful empty state messages
- `FormDialog` - Standardized create/edit dialogs
- `ConfirmDialog` - Confirmation prompts for destructive actions

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:8080/api`

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🔐 Authentication Flow

### Register-First Behavior
1. On app startup, the system checks if any users exist (`GET /api/users`)
2. **If no users exist**: Automatically redirects to `/register` to create the first admin account
3. **If users exist**: Shows login page

### Login
- Username/password authentication
- Stores auth state in localStorage
- Fetches user role for permission-based navigation

### Role-Based Access
- **ADMIN**: Full access to all modules
- **CASHIER**: Limited access (Dashboard, Products, Orders, Credit Customers, Cheques)

## 📱 Pages & Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/login` | Login page | Public |
| `/register` | Registration (first-time setup) | Public |
| `/dashboard` | Analytics dashboard with KPIs and charts | Protected |
| `/users` | User management | Admin only |
| `/products` | Product catalog | All |
| `/inventory/convert` | Stock conversion (bulk → unit) | All |
| `/credit-customers` | Customer account management | All |
| `/cheques` | Cheque lifecycle tracking | All |
| `/orders` | Sales order management | All |
| `/orders/:id/items` | Order details and items | All |
| `/suppliers` | Supplier directory | Admin only |
| `/purchase-orders` | Purchase order management | Admin only |
| `/purchase-orders/:id/items` | PO details and receiving | Admin only |

## 🎯 Key Features

### Dashboard
- **KPI Cards**: Products, Customers, Pending Cheques, Orders
- **Order Trends Chart**: Bar chart showing last 7 days of orders
- **Cheque Status Chart**: Pie chart showing distribution of cheque statuses
- **Responsive Grid**: Adapts to screen size

### Data Tables
- **Search**: Filter by key column
- **Pagination**: Configurable rows per page (5, 10, 25, 50)
- **Loading Skeletons**: Smooth loading experience
- **Empty States**: Helpful messages when no data
- **Row Actions**: Edit, Delete, View details
- **Sticky Headers**: For better scrolling experience

### Forms
- **Two-Column Layout**: Efficient use of space on larger screens
- **Validation**: Real-time validation with helper text
- **Password Toggle**: Show/hide password fields
- **Loading States**: Disabled inputs during submission
- **Error Handling**: Displays backend validation errors

## 🎨 Theme Toggle

The theme toggle persists user preference in localStorage:
- Click the sun/moon icon in the top-right corner
- Preference is saved and restored on next visit
- Optimized color palettes for both modes

## 📂 Project Structure

```
src/
├── api/                    # API integration layer
│   ├── axios.js           # Axios instance with interceptors
│   ├── usersApi.js        # User endpoints
│   ├── productsApi.js     # Product endpoints
│   └── ...                # Other API modules
├── components/            # Reusable components
│   ├── DataTable.jsx      # Feature-rich table
│   ├── PageHeader.jsx     # Page title with breadcrumbs
│   ├── KpiCard.jsx        # Dashboard metric cards
│   ├── StatusChip.jsx     # Status indicators
│   ├── SectionCard.jsx    # Card wrapper
│   ├── EmptyState.jsx     # Empty state messages
│   ├── FormDialog.jsx     # Form modal
│   └── ConfirmDialog.jsx  # Confirmation dialog
├── layouts/               # Layout components
│   └── DashboardLayout.jsx # Main dashboard layout
├── pages/                 # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Users.jsx
│   ├── Products.jsx
│   └── ...                # Other pages
├── theme/                 # Theme configuration
│   ├── theme.js           # MUI theme definition
│   └── ThemeProvider.jsx  # Theme context provider
├── utils/                 # Utility functions
├── config.js              # API base URL configuration
├── App.jsx                # Root component with routing
└── main.jsx               # Entry point
```

## 🔧 Configuration

### API Base URL
Update `src/config.js` to change the backend URL:

```javascript
export const API_BASE_URL = "http://localhost:8080/api";
```

### Theme Customization
Modify `src/theme/theme.js` to customize:
- Colors (primary, secondary, etc.)
- Typography (fonts, sizes, weights)
- Spacing and border radius
- Component overrides

## 🐛 Troubleshooting

### CORS Issues
Ensure backend allows `http://localhost:5173` in CORS configuration.

### Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port.

### Theme Not Persisting
Check browser localStorage is enabled and not cleared on exit.

## 📝 Development Guidelines

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation item in `src/layouts/DashboardLayout.jsx`
4. Use existing components (`PageHeader`, `DataTable`, etc.)

### Creating a New API Module
1. Create file in `src/api/` (e.g., `newModuleApi.js`)
2. Import and use the `api` instance from `axios.js`
3. Export functions for each endpoint

### Styling Best Practices
- Use theme values instead of hardcoded colors
- Leverage MUI's `sx` prop for styling
- Follow the 8px spacing grid
- Maintain consistent border radius (12px default)

## 🚀 Performance Optimizations

- **Code Splitting**: React Router handles automatic code splitting
- **Lazy Loading**: Components loaded on-demand
- **Memoization**: React.memo used for expensive components
- **Optimized Re-renders**: Proper state management to minimize re-renders

## 📄 License

This project is proprietary software for GrocerSmart AI.

## 👥 Support

For issues or questions, contact the development team.

---

**Built with ❤️ using React + Material-UI**
