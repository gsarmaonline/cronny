# Frontend Structure Overview

## Quick Start

This frontend implements a reusable CRUD pattern for managing different entity types (Schedules, Actions, Jobs, etc.).

### Key Files

- **`CRUD_STRUCTURE.md`** - Detailed guide on the CRUD structure and how to use it
- **`src/types/index.ts`** - TypeScript type definitions for all entities
- **`src/lib/api-client.ts`** - Centralized API client for all HTTP requests
- **`src/hooks/useCrud.ts`** - Reusable hook for CRUD operations
- **`src/components/crud/`** - Generic, reusable UI components

### Example Pages

- **`src/app/schedules/page.tsx`** - Complete example with complex form
- **`src/app/actions/page.tsx`** - Simpler example
- **`src/app/dashboard/page.tsx`** - Dashboard using PageLayout

## Adding a New Entity Page

To add a new CRUD page (e.g., for Jobs):

1. **Add type definition** (if not exists) in `src/types/index.ts`
2. **Copy template** from `src/app/actions/page.tsx`
3. **Customize**:
   - Change the resource name: `useCrud<Job>({ resource: 'jobs' })`
   - Update form fields
   - Customize table columns
4. **Add navigation link** in `src/components/crud/PageLayout.tsx`

That's it! The structure handles:
- Data fetching and caching
- Loading and error states
- Create, update, delete operations
- Consistent styling and layout
- Type safety

## Architecture Benefits

- **DRY**: Reusable components eliminate code duplication
- **Type Safety**: Full TypeScript support
- **Consistency**: All pages follow the same pattern
- **Maintainability**: Changes in one place affect all pages
- **Scalability**: Easy to add new entities

## See Also

- **CRUD_STRUCTURE.md** - Complete documentation with step-by-step guide
- **API Requirements** - Backend API format requirements (in CRUD_STRUCTURE.md)
