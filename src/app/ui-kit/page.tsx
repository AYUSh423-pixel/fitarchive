'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Modal,
  ConfirmModal,
  AlertModal,
  Chip,
  ChipGroup,
  Badge,
  Progress,
  CircularProgress,
  StepProgress,
  Tabs,
  TabsList,
  TabTrigger,
  TabContent,
  Avatar,
  AvatarGroup,
  Dropdown,
  Select,
  ToastProvider,
  useToast,
  Tooltip,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonMealCard,
  SkeletonRecipeCard,
  Separator,
} from '@/components/ui';
import {
  Check,
  X,
  ChevronDown,
  Plus,
  Minus,
  Settings,
  User,
  Bell,
  Mail,
  Shield,
  Download,
  Upload,
  Trash2,
  LogOut,
  Key,
  Smartphone,
  Database,
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Menu,
  Sun,
  Moon,
  Star,
  Heart,
  Share2,
  MoreHorizontal,
  Search,
  Filter,
  Grid,
  List,
} from 'lucide-react';

const toastMessages = [
  { type: 'success' as const, title: 'Success!', description: 'Your changes have been saved successfully.' },
  { type: 'error' as const, title: 'Error!', description: 'Something went wrong. Please try again.' },
  { type: 'warning' as const, title: 'Warning!', description: 'This action cannot be undone.' },
  { type: 'info' as const, title: 'Information', description: 'New features are coming soon.' },
  { type: 'default' as const, title: 'Notification', description: 'You have a new message.' },
];

function UIShowcase() {
  const [chipValue, setChipValue] = useState('option1');
  const [tabValue, setTabValue] = useState('tab1');
  const [selectValue, setSelectValue] = useState('option1');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(65);
  const [circularValue, setCircularValue] = useState(75);
  const [stepValue, setStepValue] = useState(2);
  const { addToast } = useToast();

  type ToastType = typeof toastMessages[0]['type'];

  const handleShowToast = (type: ToastType) => {
    const msg = toastMessages.find((m) => m.type === type);
    if (msg) {
      addToast({
        type: msg.type,
        title: msg.title,
        description: msg.description,
        duration: 4000,
      });
    }
  };

  const steps = [
    { label: 'Setup', description: 'Configure your profile', icon: <User className="w-3.5 h-3.5" /> },
    { label: 'Plan', description: 'Create meal plan', icon: <Settings className="w-3.5 h-3.5" /> },
    { label: 'Track', description: 'Log your meals', icon: <Check className="w-3.5 h-3.5" /> },
    { label: 'Achieve', description: 'Reach your goals', icon: <Star className="w-3.5 h-3.5" /> },
  ];

  const dropdownItems = [
    { value: 'profile', label: 'Profile Settings', icon: <User className="w-4 h-4" /> },
    { value: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { value: 'privacy', label: 'Privacy & Security', icon: <Shield className="w-4 h-4" /> },
    { value: 'divider', label: '', divider: true },
    { value: 'logout', label: 'Sign Out', icon: <LogOut className="w-4 h-4" />, danger: true },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#fdfbd4] py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl font-bold text-[#38240d]">UI Component Library</h1>
            <p className="text-lg text-[#713600]">Meal Planner App UI Kit - Component Showcase</p>
          </div>

          {/* Buttons */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Various button styles and states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" leftIcon=<Plus className="w-4 h-4" /> size="sm">Primary</Button>
                <Button variant="secondary" leftIcon=<Plus className="w-4 h-4" /> size="sm">Secondary</Button>
                <Button variant="outline" leftIcon=<Plus className="w-4 h-4" /> size="sm">Outline</Button>
                <Button variant="ghost" leftIcon=<Plus className="w-4 h-4" /> size="sm">Ghost</Button>
                <Button variant="destructive" leftIcon=<Trash2 className="w-4 h-4" /> size="sm">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="xs">Extra Small</Button>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" isLoading size="sm">Loading</Button>
                <Button variant="primary" disabled size="sm">Disabled</Button>
                <Button variant="primary" fullWidth size="sm">Full Width</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" rightIcon=<ChevronDown className="w-4 h-4" /> size="sm">With Icon</Button>
                <Button variant="secondary" leftIcon=<Settings className="w-4 h-4" /> size="sm">Settings</Button>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>Flexible card components with header, content, footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card variant="default" padding="md" hoverable>
                  <CardHeader>
                    <CardTitle size="md">Default Card</CardTitle>
                    <CardDescription>Standard card with shadow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#713600]">This is a default card with hover effect.</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="xs">Action</Button>
                  </CardFooter>
                </Card>

                <Card variant="outlined" padding="md">
                  <CardHeader>
                    <CardTitle size="md">Outlined Card</CardTitle>
                    <CardDescription>Card with border, no shadow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#713600]">This card has a border instead of shadow.</p>
                  </CardContent>
                </Card>

                <Card variant="elevated" padding="md">
                  <CardHeader>
                    <CardTitle size="md">Elevated Card</CardTitle>
                    <CardDescription>Card with larger shadow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#713600]">This card has elevated shadow for emphasis.</p>
                  </CardContent>
                </Card>

                <Card variant="white" padding="md" className="bg-[#f5f2e0]">
                  <CardHeader>
                    <CardTitle size="md">Subdued Background</CardTitle>
                    <CardDescription>Card with warm background</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#713600]">This card uses the subdued warm background.</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Form Inputs */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
              <CardDescription>Input, Textarea with validation states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <Input
                label="Email Address"
                placeholder="you@example.com"
                type="email"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Password"
                placeholder="Enter password"
                type="password"
                leftIcon={<Shield className="w-4 h-4" />}
                error="Password must be at least 8 characters"
              />
              <Input
                label="Username (Success)"
                placeholder="johndoe"
                leftIcon={<User className="w-4 h-4" />}
                helperText="This username is available"
              />
              <Input
                label="Disabled Input"
                placeholder="Cannot edit"
                disabled
              />
              <Textarea
                label="Bio"
                placeholder="Tell us about yourself..."
                rows={3}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="First Name" placeholder="John" size="sm" />
                <Input label="Last Name" placeholder="Doe" size="sm" />
              </div>
            </CardContent>
          </Card>

          {/* Chips */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Chips</CardTitle>
              <CardDescription>Filter chips, selection chips, and chip groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-2">Chip Group (Radio)</label>
                <ChipGroup
                  options={[
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                    { value: 'option3', label: 'Option 3' },
                  ]}
                  value={chipValue}
                  onChange={setChipValue}
                  variant="default"
                  size="sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-2">Filter Chips</label>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="default" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>All</Chip>
                  <Chip variant="primary" size="sm">Breakfast</Chip>
                  <Chip variant="secondary" size="sm">Lunch</Chip>
                  <Chip variant="success" size="sm">Dinner</Chip>
                  <Chip variant="warning" size="sm">Snacks</Chip>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-2">Removable Chips</label>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="default" size="sm" removable onRemove={() => {}}>Tag 1</Chip>
                  <Chip variant="default" size="sm" removable onRemove={() => {}}>Tag 2</Chip>
                  <Chip variant="default" size="sm" removable onRemove={() => {}}>Tag 3</Chip>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" size="sm">Default</Badge>
                <Badge variant="primary" size="sm">Primary</Badge>
                <Badge variant="secondary" size="sm">Secondary</Badge>
                <Badge variant="success" size="sm">Success</Badge>
                <Badge variant="warning" size="sm">Warning</Badge>
                <Badge variant="error" size="sm">Error</Badge>
                <Badge variant="outline" size="sm">Outline</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" dot dotColor="#16a34a" size="sm">Active</Badge>
                <Badge variant="default" dot dotColor="#f59e0b" size="sm">Pending</Badge>
                <Badge variant="default" dot dotColor="#dc2626" size="sm">Error</Badge>
                <Badge variant="secondary" size="sm" leftIcon={<Star className="w-3 h-3" />}>Featured</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Progress Indicators</CardTitle>
              <CardDescription>Linear, circular, and step progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#713600]">Linear Progress</span>
                  <span className="text-xs font-bold text-[#c05800]">{progressValue}%</span>
                </div>
                <Progress value={progressValue} showLabel variant="default" size="md" striped />
                <div className="flex gap-2 mt-4">
                  <Button variant="ghost" size="xs" onClick={() => setProgressValue(Math.max(0, progressValue - 10))} leftIcon={<Minus className="w-3 h-3" />} />
                  <Button variant="ghost" size="xs" onClick={() => setProgressValue(Math.min(100, progressValue + 10))} leftIcon={<Plus className="w-3 h-3" />} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <CircularProgress value={circularValue} size={80} strokeWidth={6} variant="default" showLabel label={`${circularValue}%`} />
                  <div className="mt-2 flex gap-2 justify-center">
                    <Button variant="ghost" size="xs" onClick={() => setCircularValue(Math.max(0, circularValue - 10))} leftIcon={<Minus className="w-3 h-3" />} />
                    <Button variant="ghost" size="xs" onClick={() => setCircularValue(Math.min(100, circularValue + 10))} leftIcon={<Plus className="w-3 h-3" />} />
                  </div>
                </div>
                <div className="text-center">
                  <CircularProgress value={circularValue} size={80} strokeWidth={6} variant="primary" showLabel />
                  <p className="text-xs text-[#a08a6a] mt-2">Primary Variant</p>
                </div>
                <div className="text-center">
                  <CircularProgress value={circularValue} size={80} strokeWidth={6} variant="secondary" showLabel />
                  <p className="text-xs text-[#a08a6a] mt-2">Secondary Variant</p>
                </div>
              </div>
              <Separator />
              <div>
                <StepProgress steps={steps} currentStep={stepValue} variant="primary" orientation="horizontal" />
                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" size="xs" onClick={() => setStepValue(Math.max(0, stepValue - 1))} leftIcon={<ChevronDown className="w-3 h-3" />} disabled={stepValue === 0}>Previous</Button>
                  <Button variant="ghost" size="xs" onClick={() => setStepValue(Math.min(3, stepValue + 1))} leftIcon={<ChevronDown className="w-3 h-3" />} className="ml-auto" disabled={stepValue === 3}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>Tabbed content navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tabValue} onValueChange={setTabValue} variant="default">
                <TabsList variant="default">
                  <TabTrigger value="tab1">Dashboard</TabTrigger>
                  <TabTrigger value="tab2">Analytics</TabTrigger>
                  <TabTrigger value="tab3">Settings</TabTrigger>
                </TabsList>
                <TabContent value="tab1">
                  <div className="p-4 bg-[#f5f2e0] rounded-2xl">
                    <p className="text-sm text-[#713600]">Dashboard content goes here. Overview of your nutrition and fitness metrics.</p>
                  </div>
                </TabContent>
                <TabContent value="tab2">
                  <div className="p-4 bg-[#f5f2e0] rounded-2xl">
                    <p className="text-sm text-[#713600]">Analytics content. Detailed charts and insights about your progress.</p>
                  </div>
                </TabContent>
                <TabContent value="tab3">
                  <div className="p-4 bg-[#f5f2e0] rounded-2xl">
                    <p className="text-sm text-[#713600]">Settings content. Configure your preferences and account settings.</p>
                  </div>
                </TabContent>
              </Tabs>

              <div className="mt-6">
                <Tabs value={tabValue} onValueChange={setTabValue} variant="underline" size="sm">
                  <TabsList variant="underline">
                    <TabTrigger value="tab1" size="sm">Overview</TabTrigger>
                    <TabTrigger value="tab2" size="sm">Meals</TabTrigger>
                    <TabTrigger value="tab3" size="sm">Workouts</TabTrigger>
                    <TabTrigger value="tab4" size="sm">Progress</TabTrigger>
                  </TabsList>
                  <TabContent value="tab1">
                    <div className="p-4 bg-[#f5f2e0] rounded-2xl">
                      <p className="text-sm text-[#713600]">Underline variant tabs with smaller size.</p>
                    </div>
                  </TabContent>
                  <TabContent value="tab2">
                    <div className="p-4 bg-[#f5f2e0] rounded-2xl">
                      <p className="text-sm text-[#713600]">Meal tracking and planning content.</p>
                    </div>
                  </TabContent>
                  <TabContent value="tab3">
                    <div className="p-4 bg-[#f5f2e0] rounded-2xl">
                      <p className="text-sm text-[#713600]">Workout routines and logs.</p>
                    </div>
                  </TabContent>
                  <TabContent value="tab4">
                    <div className="p-4 bg-[#f5f2e0] rounded-2xl">
                      <p className="text-sm text-[#713600]">Progress photos and measurements.</p>
                    </div>
                  </TabContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Modals */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Modals</CardTitle>
              <CardDescription>Dialogs, confirmations, and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => setModalOpen(true)} leftIcon={<Settings className="w-4 h-4" />}>Open Modal</Button>
                <Button variant="secondary" onClick={() => setConfirmOpen(true)} leftIcon={<Trash2 className="w-4 h-4" />}>Confirm Dialog</Button>
                <Button variant="outline" onClick={() => setAlertOpen(true)} leftIcon={<Info className="w-4 h-4" />}>Alert Dialog</Button>
              </div>

              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Modal Title"
                description="This is a modal dialog with a description. You can put any content here."
                size="md"
                footer={
                  <div className="flex gap-2 justify-end w-full">
                    <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>Confirm</Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <p className="text-sm text-[#713600]">This modal can contain forms, settings, or any other content.</p>
                  <Input label="Example Input" placeholder="Enter something..." />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm">Save</Button>
                    <Button variant="ghost" size="sm">Cancel</Button>
                  </div>
                </div>
              </Modal>

              <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => setConfirmOpen(false)}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
              />

              <AlertModal
                isOpen={alertOpen}
                onClose={() => setAlertOpen(false)}
                title="Information"
                message="This is an alert dialog with an info icon. Use it to convey important messages to the user."
                icon="info"
              />
            </CardContent>
          </Card>

          {/* Avatars */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Avatars</CardTitle>
              <CardDescription>User avatars with fallbacks and groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar size="xs" fallback="JD" />
                <Avatar size="sm" fallback="JD" />
                <Avatar size="md" fallback="JD" />
                <Avatar size="lg" fallback="JD" />
                <Avatar size="xl" fallback="JD" />
                <Avatar size="2xl" fallback="JD" />
              </div>
              <div className="flex items-center gap-4">
                <Avatar size="md" fallback="AS" shape="square" />
                <Avatar size="md" fallback="RK" shape="square" />
                <Avatar size="md" fallback="PM" shape="square" />
              </div>
              <div className="flex items-center gap-2">
                <AvatarGroup max={4} size="md">
                  <Avatar fallback="JD" />
                  <Avatar fallback="AS" />
                  <Avatar fallback="RK" />
                  <Avatar fallback="PM" />
                  <Avatar fallback="SL" />
                  <Avatar fallback="TK" />
                </AvatarGroup>
              </div>
            </CardContent>
          </Card>

          {/* Dropdown & Select */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Dropdown & Select</CardTitle>
              <CardDescription>Dropdown menus and select components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <Dropdown
                trigger={<Button variant="ghost" rightIcon={<ChevronDown className="w-4 h-4" />}><Menu className="w-4 h-4" /></Button>}
                items={dropdownItems}
                onSelect={(value) => console.log('Selected:', value)}
              />
              <Select
                label="Select Option"
                value={selectValue}
                onChange={setSelectValue}
                items={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                  { value: 'option4', label: 'Option 4' },
                ]}
                placeholder="Choose an option"
              />
              <Select
                label="With Icons"
                value={selectValue}
                onChange={setSelectValue}
                items={[
                  { value: 'breakfast', label: 'Breakfast', icon: <Sun className="w-4 h-4" /> },
                  { value: 'lunch', label: 'Lunch', icon: <Sun className="w-4 h-4" /> },
                  { value: 'dinner', label: 'Dinner', icon: <Moon className="w-4 h-4" /> },
                  { value: 'snacks', label: 'Snacks', icon: <Star className="w-4 h-4" /> },
                ]}
                placeholder="Choose a meal"
              />
            </CardContent>
          </Card>

          {/* Tooltips */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Tooltips</CardTitle>
              <CardDescription>Hover or focus tooltips</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Tooltip content="This is a tooltip on top" position="top">
                <Button variant="ghost" size="sm">Hover me (top)</Button>
              </Tooltip>
              <Tooltip content="This is a tooltip on bottom" position="bottom">
                <Button variant="ghost" size="sm">Hover me (bottom)</Button>
              </Tooltip>
              <Tooltip content="This is a tooltip on left" position="left">
                <Button variant="ghost" size="sm">Hover me (left)</Button>
              </Tooltip>
              <Tooltip content="This is a tooltip on right" position="right">
                <Button variant="ghost" size="sm">Hover me (right)</Button>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Skeletons */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Skeleton Loaders</CardTitle>
              <CardDescription>Loading placeholders for content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-2">Text Skeleton</label>
                <SkeletonText lines={4} />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonMealCard />
              </div>
              <Separator />
              <SkeletonRecipeCard />
            </CardContent>
          </Card>

          {/* Toast Demo */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
              <CardDescription>Try the different toast types</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {toastMessages.map((msg) => (
                <Button
                  key={msg.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShowToast(msg.type)}
                  leftIcon={
                    msg.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> :
                    msg.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> :
                    msg.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                    <Info className="w-3.5 h-3.5" />
                  }
                >
                  {msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Separators */}
          <Card variant="white" padding="lg">
            <CardHeader>
              <CardTitle>Separators</CardTitle>
              <CardDescription>Visual dividers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#713600]">Before</span>
                <Separator />
                <span className="text-sm text-[#713600]">After</span>
              </div>
              <Separator variant="dashed" />
              <Separator variant="dotted" />
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#713600] flex-1">Left</span>
                <Separator orientation="vertical" className="h-8" />
                <span className="text-sm text-[#713600] flex-1">Right</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToastProvider>
  );
}

export default UIShowcase;