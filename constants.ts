import { Event, UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Alex Rivera',
  email: 'alex.r@lumina.com',
  role: 'MANAGER',
  avatarUrl: 'https://picsum.photos/id/64/200/200'
};

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'TechSummit 2024 Global',
    description: 'Annual technology conference focusing on AI and Cloud Computing.',
    dateStart: '2024-10-15T09:00:00Z',
    dateEnd: '2024-10-17T18:00:00Z',
    location: 'Moscone Center, SF',
    status: 'IN_PROGRESS',
    imageUrl: 'https://picsum.photos/id/1/800/400',
    budgetTotal: 150000,
    budgetSpent: 89000,
    attendeesExpected: 2500,
    attendeesRegistered: 2100,
    team: [
      { ...MOCK_USER, roleInEvent: 'Lead' },
      { id: 'u2', name: 'Sarah Chen', email: 's.chen@lumina.com', role: 'MEMBER', roleInEvent: 'Logistics', avatarUrl: 'https://picsum.photos/id/65/200/200' }
    ],
    tasks: [
      { id: 't1', title: 'Finalize Keynote Speakers', status: 'DONE', priority: 'CRITICAL', dueDate: '2024-09-01', assignee: MOCK_USER },
      { id: 't2', title: 'Catering Menu Approval', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2024-10-01' },
      { id: 't3', title: 'Print Badges', status: 'TODO', priority: 'MEDIUM', dueDate: '2024-10-10' }
    ],
    categories: [
      { id: 'c1', name: 'Venue', allocated: 50000, spent: 50000 },
      { id: 'c2', name: 'Catering', allocated: 30000, spent: 12000 },
      { id: 'c3', name: 'Marketing', allocated: 20000, spent: 18000 }
    ]
  },
  {
    id: 'e2',
    title: 'Q3 Executive Retreat',
    description: 'Strategic planning session for Q4 and 2025 roadmap.',
    dateStart: '2024-11-05T09:00:00Z',
    dateEnd: '2024-11-07T17:00:00Z',
    location: 'Aspen, CO',
    status: 'PUBLISHED',
    imageUrl: 'https://picsum.photos/id/28/800/400',
    budgetTotal: 45000,
    budgetSpent: 5000,
    attendeesExpected: 25,
    attendeesRegistered: 25,
    team: [],
    tasks: [],
    categories: []
  },
  {
    id: 'e3',
    title: 'Product Launch: Horizon',
    description: 'Launch event for the new Horizon software suite.',
    dateStart: '2024-12-10T18:00:00Z',
    dateEnd: '2024-12-10T22:00:00Z',
    location: 'Virtual',
    status: 'DRAFT',
    imageUrl: 'https://picsum.photos/id/180/800/400',
    budgetTotal: 20000,
    budgetSpent: 0,
    attendeesExpected: 5000,
    attendeesRegistered: 120,
    team: [],
    tasks: [],
    categories: []
  }
];

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  PUBLISHED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-brand-50 text-brand-700 border-brand-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};