# CRUD Structure Guide

This document explains the reusable CRUD structure implemented in the Cronny frontend.

## Overview

The frontend uses a consistent pattern for listing, creating, and updating different types of objects (schedules, jobs, actions, etc.). This structure provides:

- **Type safety** with TypeScript interfaces
- **Reusable hooks** for data fetching and mutations
- **Generic components** for common UI patterns
- **Consistent API interaction** across all resources

## Directory Structure

```
cronui/src/
├── types/              # Type definitions for all entities
│   └── index.ts
├── lib/                # Utilities and API client
│   └── api-client.ts
├── hooks/              # Reusable hooks
│   └── useCrud.ts
├── components/         # Reusable components
│   └── crud/
│       ├── DataTable.tsx
│       ├── Modal.tsx
│       ├── PageLayout.tsx
│       └── index.ts
└── app/                # Pages
    ├── schedules/
    ├── actions/
    ├── jobs/
    └── ...
```

## Core Components

### 1. Type Definitions (`types/index.ts`)

Define TypeScript interfaces for all entities:

```typescript
export interface Schedule extends BaseModel {
  name: string;
  description?: string;
  // ... other fields
}
```

All entities extend `BaseModel` which includes common fields (id, created_at, updated_at, deleted_at).

### 2. API Client (`lib/api-client.ts`)

Centralized API client with generic CRUD methods:

```typescript
apiClient.list<T>(resource)      // GET /resource
apiClient.get<T>(resource, id)   // GET /resource/:id
apiClient.create<T>(resource, data) // POST /resource
apiClient.update<T>(resource, id, data) // PUT /resource/:id
apiClient.delete(resource, id)   // DELETE /resource/:id
```

Features:
- Automatic JWT token handling
- Consistent error handling
- TypeScript generics for type safety

### 3. useCrud Hook (`hooks/useCrud.ts`)

Reusable hook that provides CRUD operations for any resource:

```typescript
const { items, loading, error, create, update, remove, fetchList } =
  useCrud<Schedule>({ resource: 'schedules' });
```

Features:
- Automatic data fetching on mount
- Loading and error states
- Optimistic UI updates (refetches list after mutations)

### 4. Reusable Components

#### DataTable (`components/crud/DataTable.tsx`)
Generic table component for listing items:

```typescript
<DataTable
  data={items}
  columns={columns}
  onEdit={handleEdit}
  onDelete={handleDelete}
  loading={loading}
/>
```

Features:
- Column definitions with custom renderers
- Built-in edit/delete actions
- Loading state
- Dark mode support

#### Modal (`components/crud/Modal.tsx`)
Reusable modal for create/edit forms:

```typescript
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Create Schedule"
>
  {/* Your form content */}
</Modal>
```

Features:
- Backdrop overlay
- Escape key to close
- Accessible close button

#### PageLayout (`components/crud/PageLayout.tsx`)
Consistent page wrapper with navigation:

```typescript
<PageLayout
  title="Schedules"
  description="Manage your scheduled tasks"
>
  {/* Your page content */}
</PageLayout>
```

Features:
- Header with navigation
- Logout button
- Consistent styling

## Creating a New CRUD Page

Follow these steps to create a new CRUD page for any entity:

### Step 1: Define Types (if not already done)

Add your entity type to `types/index.ts`:

```typescript
export interface YourEntity extends BaseModel {
  name: string;
  // ... other fields
}
```

### Step 2: Create the Page

Create `app/your-entity/page.tsx` using this template:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authLib } from '@/lib/auth';
import { useCrud } from '@/hooks/useCrud';
import { DataTable, Modal, PageLayout, Column } from '@/components/crud';
import type { YourEntity } from '@/types';

export default function YourEntityPage() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<YourEntity | null>(null);
  const [formData, setFormData] = useState<Partial<YourEntity>>({
    name: '',
    // ... default values
  });
  const router = useRouter();

  const {
    items,
    loading: dataLoading,
    error,
    create,
    update,
    remove,
  } = useCrud<YourEntity>({ resource: 'your-resource-endpoint' });

  useEffect(() => {
    if (!authLib.isAuthenticated()) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  // Define table columns
  const columns: Column<YourEntity>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    // Add custom renderers if needed:
    {
      key: 'status',
      label: 'Status',
      render: (item) => <span>{item.status}</span>
    },
  ];

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '' /* defaults */ });
    setIsModalOpen(true);
  };

  const handleEdit = (item: YourEntity) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: YourEntity) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await remove(item.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await update(editingItem.id, formData);
    } else {
      await create(formData);
    }
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <PageLayout title="Your Entity" description="Description here">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          Error: {error.message}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button onClick={handleCreate} className="...">
          Create
        </button>
      </div>

      <div className="rounded-lg border">
        <DataTable
          data={items}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={dataLoading}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit' : 'Create'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Your form fields here */}

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit">
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
}
```

### Step 3: Add Navigation Link

Add a link to your new page in `components/crud/PageLayout.tsx`:

```typescript
<a href="/your-entity" className="...">
  Your Entity
</a>
```

## Examples

See the following pages for complete examples:
- `app/schedules/page.tsx` - Complex form with conditional fields
- `app/actions/page.tsx` - Simple form example

## Benefits of This Structure

1. **Consistency**: All CRUD pages follow the same pattern
2. **Type Safety**: Full TypeScript support with IntelliSense
3. **DRY**: Reusable components and hooks eliminate code duplication
4. **Maintainability**: Changes to API format or styling can be made in one place
5. **Scalability**: Easy to add new entities by following the template
6. **Testing**: Centralized logic makes unit testing easier

## API Requirements

Your backend API should follow this structure:

```
GET    /api/cronny/v1/{resource}      -> List all items
GET    /api/cronny/v1/{resource}/:id  -> Get single item
POST   /api/cronny/v1/{resource}      -> Create item
PUT    /api/cronny/v1/{resource}/:id  -> Update item
DELETE /api/cronny/v1/{resource}/:id  -> Delete item
```

Response format:
```json
{
  "data": { /* item or array */ },
  "message": "optional message"
}
```

Error format:
```json
{
  "error": "Error type",
  "message": "Human readable message",
  "status": 400
}
```

## Environment Variables

Set the API base URL in your environment:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8009/api/cronny/v1
```

If not set, it defaults to `http://127.0.0.1:8009/api/cronny/v1`.
