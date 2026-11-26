# Meal Planner App UI Kit

A comprehensive UI component library built for the Meal Planner App, featuring a warm earth-tone design system with consistent components following the design patterns from the Meal Planner App UI Kit (Community).

## Design System

### Color Palette
- **Primary**: `#38240d` (Dark warm brown)
- **Secondary**: `#c05800` (Warm orange)
- **Tertiary**: `#5d4037` (Medium brown)
- **Surface**: `#fdfbd4` (Cream)
- **Surface White**: `#ffffff`
- **Subdued**: `#f5f2e0` (Light cream)
- **Container**: `#f0ece0` (Pale cream)
- **On Surface**: `#38240d`
- **On Surface Variant**: `#713600`
- **Dim**: `#a08a6a`

### Typography
- **Display Font**: Epilogue (headings, titles)
- **Body Font**: Manrope (body text, UI elements)

### Spacing & Radius
- **Border Radius**: 16px (cards), 20px (cards), 9999px (pills, badges)
- **Shadow**: Subtle warm shadows (`0 2px 12px rgba(56, 36, 13, 0.08)`)

## Components

### 1. Button (`Button.tsx`)
Versatile button component with multiple variants and sizes.

**Variants**: `primary`, `secondary`, `outline`, `ghost`, `destructive`
**Sizes**: `xs`, `sm`, `md`, `lg`, `icon`
**Features**: Loading state, left/right icons, full width, disabled state

```tsx
<Button variant="primary" size="md" leftIcon={<Plus />}>
  Add Item
</Button>
```

### 2. Card (`Card.tsx`)
Flexible card components with header, content, footer sections.

**Variants**: `default`, `white`, `elevated`, `outlined`
**Padding**: `none`, `sm`, `md`, `lg`, `xl`
**Features**: Hoverable, composable sub-components

```tsx
<Card variant="white" padding="lg" hoverable>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```

### 3. Input (`Input.tsx`)
Form inputs with labels, validation, icons, and helper text.

**Features**: Label, error state, helper text, left/right icons, multiple sizes

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  type="email"
  error="Invalid email"
  helperText="We'll never share your email"
  leftIcon={<Mail />}
/>
```

### 4. Modal (`Modal.tsx`)
Accessible modal dialogs with multiple variants.

**Components**: `Modal`, `ConfirmModal`, `AlertModal`
**Features**: Portal rendering, focus trap, escape key, overlay click, animations

```tsx
<Modal isOpen={open} onClose={close} title="Title" description="Description">
  Content
</Modal>
```

### 5. Chip (`Chip.tsx`)
Filter chips, selection chips, and removable tags.

**Variants**: `default`, `primary`, `secondary`, `success`, `warning`, `error`
**Sizes**: `xs`, `sm`, `md`
**Features**: Selection state, removable, icons, ChipGroup for radio behavior

```tsx
<ChipGroup
  options={[{ value: '1', label: 'Option 1' }]}
  value={selected}
  onChange={setSelected}
  variant="default"
/>
```

### 6. Badge (`Badge.tsx`)
Status indicators and labels.

**Variants**: `default`, `primary`, `secondary`, `success`, `warning`, `error`, `outline`
**Sizes**: `xs`, `sm`, `md`
**Features**: Dot indicator, icons

```tsx
<Badge variant="success" dot dotColor="#16a34a">Active</Badge>
```

### 7. Progress (`Progress.tsx`)
Linear, circular, and step progress indicators.

**Components**: `Progress`, `CircularProgress`, `StepProgress`
**Features**: Animated, striped, labeled, multiple variants

```tsx
<Progress value={65} showLabel variant="default" striped />
<CircularProgress value={75} size={80} showLabel />
<StepProgress steps={steps} currentStep={2} />
```

### 8. Tabs (`Tabs.tsx`)
Tabbed content navigation.

**Variants**: `default`, `underline`, `pill`
**Sizes**: `sm`, `md`, `lg`

```tsx
<Tabs value={tab} onValueChange={setTab} variant="default">
  <TabsList>
    <TabTrigger value="tab1">Tab 1</TabTrigger>
    <TabTrigger value="tab2">Tab 2</TabTrigger>
  </TabsList>
  <TabContent value="tab1">Content 1</TabContent>
  <TabContent value="tab2">Content 2</TabContent>
</Tabs>
```

### 9. Avatar (`Avatar.tsx`)
User avatars with image fallbacks and groups.

**Sizes**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
**Shapes**: `circle`, `square`
**Features**: Auto-generated colors from name, image loading states

```tsx
<Avatar size="md" fallback="JD" src="/avatar.jpg" />
<AvatarGroup max={4} size="md">
  <Avatar fallback="JD" />
  <Avatar fallback="AS" />
</AvatarGroup>
```

### 10. Dropdown (`Dropdown.tsx`)
Dropdown menus and select components.

**Components**: `Dropdown`, `Select`
**Features**: Keyboard navigation, portal rendering, icons, descriptions, dividers

```tsx
<Dropdown
  trigger={<Button>Menu</Button>}
  items={[{ value: '1', label: 'Item 1', icon: <Icon /> }]}
  onSelect={handleSelect}
/>
```

### 11. Toast (`Toast.tsx`)
Toast notifications with provider pattern.

**Types**: `success`, `error`, `warning`, `info`, `default`
**Features**: Auto-dismiss, actions, dismissible, portal rendering

```tsx
const { addToast } = useToast();
addToast({ type: 'success', title: 'Saved!', description: 'Changes saved.' });
```

### 12. Tooltip (`Tooltip.tsx`)
Hover/focus tooltips with smart positioning.

**Positions**: `top`, `bottom`, `left`, `right`
**Features**: Delay, portal rendering, follows trigger

```tsx
<Tooltip content="Tooltip text" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

### 13. Skeleton (`Skeleton.tsx`)
Loading placeholders for content.

**Variants**: `text`, `circular`, `rectangular`, `rounded`
**Components**: `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonMealCard`, `SkeletonRecipeCard`
**Animations**: `pulse`, `wave`, `none`

```tsx
<SkeletonCard />
<SkeletonMealCard />
<SkeletonRecipeCard />
<SkeletonText lines={3} />
```

### 14. Separator (`Separator.tsx`)
Visual dividers.

**Orientations**: `horizontal`, `vertical`
**Variants**: `default`, `dashed`, `dotted`

```tsx
<Separator />
<Separator variant="dashed" />
<Separator orientation="vertical" className="h-8" />
```

## Updated Pages

### 1. Meal Planner (`/planner`)
- Modern card-based layout with skeleton loading states
- Chip-based plan type selector (Daily/7-Day/30-Day)
- Improved meal cards with badges for macros
- Modal-based food substitution with Chip components
- Toast notifications for actions

### 2. Recipe Details (`/recipes/[id]`)
- Card-based layout with consistent spacing
- Badge components for prep time, servings, difficulty
- Progress bars for macro visualization
- Improved ingredient checklist with checkboxes
- Better visual hierarchy for instructions

### 3. Settings (`/settings`)
- Card-based sections with consistent headers
- Chip group for AI provider selection
- Badge for AI status indicator
- Confirm modal for account deletion
- Improved form inputs with validation
- Consistent button styling

### 4. UI Kit Showcase (`/ui-kit`)
Comprehensive demo page showing all components in action.

## Usage

### Importing Components
```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Modal,
  Chip,
  Badge,
  Progress,
  Tabs,
  Avatar,
  Dropdown,
  ToastProvider,
  useToast,
  Tooltip,
  Skeleton,
  Separator,
} from '@/components/ui';
```

### Setting Up Toast Provider
Wrap your app or layout with `ToastProvider`:

```tsx
import { ToastProvider } from '@/components/ui';

export default function Layout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

## Design Principles

1. **Consistency**: All components follow the same color palette, spacing, and typography
2. **Accessibility**: ARIA attributes, keyboard navigation, focus management
3. **Flexibility**: Composable APIs with sensible defaults
4. **Performance**: Minimal re-renders, optimized animations
5. **Developer Experience**: TypeScript support, clear prop interfaces

## File Structure

```
src/components/ui/
├── index.ts              # Main exports
├── Button.tsx
├── Card.tsx
├── Input.tsx
├── Modal.tsx
├── Chip.tsx
├── Badge.tsx
├── Progress.tsx
├── Tabs.tsx
├── Avatar.tsx
├── Dropdown.tsx
├── Toast.tsx
├── Tooltip.tsx
├── Skeleton.tsx
├── Separator.tsx
└── utils.ts              # cn() helper (in src/lib/)
```

## Customization

Components can be customized via:
- `className` prop for additional styles
- CSS variables for theme colors
- Variant props for predefined styles
- Size props for responsive scaling

## Browser Support

Modern browsers with ES2020+ support. Uses CSS custom properties for theming.