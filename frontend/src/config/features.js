const features = [
  {
    key: 'documents',
    name: 'Documents',
    icon: '\uD83D\uDCC4',
    description: 'Manage official county documents, policies, and records',
    endpoint: '/api/documents',
    color: '#2b6cb0',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['Policy', 'Report', 'Form', 'Guide', 'Resolution', 'Other'] },
      { name: 'file_type', label: 'File Type', type: 'select', options: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT', 'Other'] },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'author', label: 'Author', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'archived', 'inactive'] }
    ],
    tableColumns: ['title', 'category', 'department', 'file_type', 'status']
  },
  {
    key: 'meetings',
    name: 'Meetings',
    icon: '\uD83D\uDCC5',
    description: 'Schedule and manage county government meetings',
    endpoint: '/api/meetings',
    color: '#2c7a7b',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'meeting_type', label: 'Meeting Type', type: 'select', options: ['Board Meeting', 'Committee Meeting', 'Public Hearing', 'Workshop', 'Special Session', 'Other'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'meeting_date', label: 'Meeting Date', type: 'date' },
      { name: 'start_time', label: 'Start Time', type: 'time' },
      { name: 'end_time', label: 'End Time', type: 'time' },
      { name: 'attendees', label: 'Attendees', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in_progress', 'completed', 'cancelled'] }
    ],
    tableColumns: ['title', 'meeting_type', 'meeting_date', 'location', 'status']
  },
  {
    key: 'announcements',
    name: 'Announcements',
    icon: '\uD83D\uDCE2',
    description: 'Post and manage public announcements and notices',
    endpoint: '/api/announcements',
    color: '#c05621',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'select', options: ['General', 'Emergency', 'Event', 'Policy', 'Service', 'Other'] },
      { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
      { name: 'author', label: 'Author', type: 'text' },
      { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'expired', 'inactive'] }
    ],
    tableColumns: ['title', 'category', 'priority', 'author', 'status']
  },
  {
    key: 'departments',
    name: 'Departments',
    icon: '\uD83C\uDFDB\uFE0F',
    description: 'County government departments and divisions',
    endpoint: '/api/departments',
    color: '#553c9a',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'head', label: 'Department Head', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'hours', label: 'Office Hours', type: 'text' },
      { name: 'employee_count', label: 'Employee Count', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
    ],
    tableColumns: ['name', 'head', 'email', 'phone', 'status']
  },
  {
    key: 'services',
    name: 'Services',
    icon: '\u2699\uFE0F',
    description: 'Public services offered by the county',
    endpoint: '/api/services',
    color: '#276749',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Administrative', 'Health', 'Public Safety', 'Infrastructure', 'Education', 'Social Services', 'Other'] },
      { name: 'eligibility', label: 'Eligibility', type: 'text' },
      { name: 'fee', label: 'Fee', type: 'text' },
      { name: 'processing_time', label: 'Processing Time', type: 'text' },
      { name: 'contact_info', label: 'Contact Info', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended'] }
    ],
    tableColumns: ['name', 'department', 'category', 'fee', 'status']
  },
  {
    key: 'faqs',
    name: 'FAQs',
    icon: '\u2753',
    description: 'Frequently asked questions and answers',
    endpoint: '/api/faqs',
    color: '#9b2c2c',
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['General', 'Services', 'Permits', 'Taxes', 'Elections', 'Public Safety', 'Other'] },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'inactive'] }
    ],
    tableColumns: ['question', 'category', 'department', 'status']
  },
  {
    key: 'events',
    name: 'Events',
    icon: '\uD83C\uDF89',
    description: 'Community events and activities',
    endpoint: '/api/events',
    color: '#b7791f',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'event_type', label: 'Event Type', type: 'select', options: ['Community', 'Government', 'Cultural', 'Sports', 'Educational', 'Other'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'event_date', label: 'Event Date', type: 'date' },
      { name: 'start_time', label: 'Start Time', type: 'time' },
      { name: 'end_time', label: 'End Time', type: 'time' },
      { name: 'organizer', label: 'Organizer', type: 'text' },
      { name: 'capacity', label: 'Capacity', type: 'number' },
      { name: 'registration_required', label: 'Registration Required', type: 'select', options: ['true', 'false'] },
      { name: 'status', label: 'Status', type: 'select', options: ['upcoming', 'ongoing', 'completed', 'cancelled'] }
    ],
    tableColumns: ['title', 'event_type', 'event_date', 'location', 'status']
  },
  {
    key: 'contacts',
    name: 'Contacts',
    icon: '\uD83D\uDC64',
    description: 'County government staff directory',
    endpoint: '/api/contacts',
    color: '#2a4365',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'title', label: 'Job Title', type: 'text' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'office_location', label: 'Office Location', type: 'text' },
      { name: 'office_hours', label: 'Office Hours', type: 'text' },
      { name: 'bio', label: 'Bio', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'on_leave'] }
    ],
    tableColumns: ['name', 'title', 'department', 'email', 'status']
  },
  {
    key: 'permits',
    name: 'Permits',
    icon: '\uD83D\uDCDD',
    description: 'Permits and licensing information',
    endpoint: '/api/permits',
    color: '#744210',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Building', 'Business', 'Environmental', 'Health', 'Zoning', 'Special Use', 'Other'] },
      { name: 'fee', label: 'Fee', type: 'text' },
      { name: 'processing_time', label: 'Processing Time', type: 'text' },
      { name: 'requirements', label: 'Requirements', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended'] }
    ],
    tableColumns: ['name', 'category', 'department', 'fee', 'status']
  },
  {
    key: 'ordinances',
    name: 'Ordinances',
    icon: '\uD83D\uDCDC',
    description: 'County ordinances and local laws',
    endpoint: '/api/ordinances',
    color: '#702459',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'ordinance_number', label: 'Ordinance Number', type: 'text' },
      { name: 'category', label: 'Category', type: 'select', options: ['Zoning', 'Public Safety', 'Health', 'Environmental', 'Building', 'Business', 'Traffic', 'Other'] },
      { name: 'effective_date', label: 'Effective Date', type: 'date' },
      { name: 'adopted_date', label: 'Adopted Date', type: 'date' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'repealed', 'amended'] }
    ],
    tableColumns: ['title', 'ordinance_number', 'category', 'effective_date', 'status']
  }
];

export default features;
