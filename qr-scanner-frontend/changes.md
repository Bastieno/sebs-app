# Current State Analysis

**Current Tabs:**

- Create User (form only)
- Create Subscription (form only)
- Lookup Access Code (by access code only)
- Notifications (display only)
- Manage Plans (already has table view with CRUD)

**Available Backend Endpoints:**
✅ User CRUD: `GET /users`, `POST /create-user`, `PUT /user-status/:userId`
✅ Subscription: `GET /subscriptions`, `POST /create-subscription`
✅ Plans: Full CRUD via plans controller
✅ Lookup: `GET /user-by-access-code/:accessCode`
✅ Notifications: `GET /notifications`, `PUT /notifications/:id/read`

**Missing Backend Endpoints:**
❌ Update user details (name, email, phone)
❌ Delete user
❌ Search user by name for subscription history
❌ Update/delete subscriptions

## Proposed New Menu Structure

### 1. **Users Menu**

- **Main View**: Data table with columns: Name, Email, Phone, Role, Status, Created Date
- **Actions**:
  - "Add User" button → Opens modal
  - Edit icon per row → Opens modal with user data
  - Delete icon per row → Confirmation dialog
  - Toggle active/inactive status
- **Modal Features**: Create/Edit user forms with validation

### 2. **Plans Menu**

- Keep existing `ManagePlans` component
- Ensure it handles both system plans (view/edit only) and custom plans (full CRUD)
- Show plan type badges (System/Custom)

### 3. **Subscriptions Menu**

- **Main View**: Data table with columns: User Name, Plan, Access Code, Status, Start Date, End Date, Time Slot
- **Filters**: Status (Active/Expired/In Grace Period), Plan Type, Date Range
- **Actions**:
  - "Create Subscription" button → Opens modal
  - View icon → Shows full subscription details
  - Edit icon (if needed)
- **Search**: Filter by user name, access code, or plan name

### 4. **Lookup Menu**

- **Two Search Options**:
  - Search by Access Code (existing functionality)
  - **NEW**: Search by User Name → Shows dropdown of matching users → Select user → Display all their subscriptions with access codes
- **Results Display**: Enhanced card showing user info + all subscription history

### 5. **Notifications Menu**

- Keep existing notification display
- Add filters: Read/Unread, Notification Type, Date Range
- Add "Mark All as Read" button

## Implementation Steps

### Phase 1: Backend Updates

1. Add user update endpoint: `PUT /admin/users/:userId`
2. Add user delete endpoint: `DELETE /admin/users/:userId`
3. Add search user by name endpoint: `GET /admin/search-users?name=...`
4. Add get user subscriptions endpoint: `GET /admin/users/:userId/subscriptions`

### Phase 2: UI Components

1. Create reusable components:
   - `UserTable.tsx` - Data table with CRUD modals
   - `UserModal.tsx` - Create/Edit user form
   - `SubscriptionTable.tsx` - Subscriptions data table
   - `SubscriptionModal.tsx` - Create subscription form
   - `LookupPanel.tsx` - Dual search (access code + user name)
   - `NotificationFilters.tsx` - Filter controls

### Phase 3: Refactor Admin Page

1. Update tab structure to match 5 new menus
2. Replace forms with table views + modals
3. Integrate new components
4. Add proper loading states and error handling
5. Improve responsive design for tables

### Phase 4: Additional Features

1. Add pagination for tables
2. Add export functionality (CSV/Excel)
3. Add bulk operations (e.g., delete multiple users)
4. Add sorting and filtering to all tables

## Technical Considerations

- **Use shadcn/ui Table component** for consistent table UI
- **Use Dialog component** for all modals
- **State management**: Keep using useState, but consider extracting data fetching to custom hooks
- **Search debouncing**: For user name search, debounce API calls
- **Confirmation dialogs**: For destructive actions (delete user/subscription)

Would you like me to proceed with this plan? Any changes or additions you'd like to make before we start implementation?
