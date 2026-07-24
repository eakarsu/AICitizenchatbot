require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('./db');
const bcrypt = require('bcryptjs');

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...\n');

    // ── Drop all tables ──────────────────────────────────────────────
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS chat_history CASCADE;
      DROP TABLE IF EXISTS ordinances CASCADE;
      DROP TABLE IF EXISTS permits CASCADE;
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS faqs CASCADE;
      DROP TABLE IF EXISTS services CASCADE;
      DROP TABLE IF EXISTS departments CASCADE;
      DROP TABLE IF EXISTS announcements CASCADE;
      DROP TABLE IF EXISTS meetings CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('All tables dropped.\n');

    // ── Create tables ────────────────────────────────────────────────
    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        email VARCHAR UNIQUE,
        password VARCHAR,
        role VARCHAR DEFAULT 'resident',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        description TEXT,
        category VARCHAR,
        file_type VARCHAR,
        department VARCHAR,
        status VARCHAR DEFAULT 'active',
        author VARCHAR,
        publish_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE meetings (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        description TEXT,
        meeting_type VARCHAR,
        location VARCHAR,
        meeting_date DATE,
        start_time VARCHAR,
        end_time VARCHAR,
        attendees VARCHAR,
        status VARCHAR DEFAULT 'scheduled',
        minutes_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        description TEXT,
        category VARCHAR,
        priority VARCHAR DEFAULT 'normal',
        author VARCHAR,
        publish_date DATE DEFAULT NOW(),
        expiry_date DATE,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        description TEXT,
        head VARCHAR,
        email VARCHAR,
        phone VARCHAR,
        location VARCHAR,
        hours VARCHAR,
        employee_count INTEGER,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        description TEXT,
        department VARCHAR,
        category VARCHAR,
        eligibility VARCHAR,
        fee VARCHAR,
        processing_time VARCHAR,
        status VARCHAR DEFAULT 'active',
        contact_info VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE faqs (
        id SERIAL PRIMARY KEY,
        question TEXT,
        answer TEXT,
        category VARCHAR,
        department VARCHAR,
        helpful_count INTEGER DEFAULT 0,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        description TEXT,
        event_type VARCHAR,
        location VARCHAR,
        event_date DATE,
        start_time VARCHAR,
        end_time VARCHAR,
        organizer VARCHAR,
        capacity INTEGER,
        registration_required BOOLEAN DEFAULT false,
        status VARCHAR DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        title VARCHAR,
        department VARCHAR,
        email VARCHAR,
        phone VARCHAR,
        office_location VARCHAR,
        office_hours VARCHAR,
        bio TEXT,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE permits (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        description TEXT,
        department VARCHAR,
        category VARCHAR,
        fee VARCHAR,
        processing_time VARCHAR,
        requirements TEXT,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE ordinances (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        description TEXT,
        ordinance_number VARCHAR,
        category VARCHAR,
        effective_date DATE,
        status VARCHAR DEFAULT 'active',
        adopted_date DATE,
        department VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        message TEXT,
        response TEXT,
        context_used TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('All tables created.\n');

    // ── Seed users ───────────────────────────────────────────────────
    console.log('Seeding users...');
    const adminHash = await bcrypt.hash(requireDemoPassword(), 10);
    await client.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('County Admin', 'admin@county.gov', $1, 'admin'),
        ('Jane Rodriguez', 'jrodriguez@county.gov', $1, 'staff'),
        ('Marcus Thompson', 'mthompson@county.gov', $1, 'staff'),
        ('Sarah Chen', 'schen@county.gov', $1, 'resident'),
        ('David Okafor', 'dokafor@county.gov', $1, 'resident')
    `, [adminHash]);
    console.log('Demo login users provisioned from the local environment.');

    // ── Seed documents ───────────────────────────────────────────────
    console.log('Seeding documents...');
    await client.query(`
      INSERT INTO documents (title, description, category, file_type, department, status, author, publish_date) VALUES
        ('FY2026 Annual County Budget', 'Comprehensive budget document for fiscal year 2026 including all departmental allocations and revenue projections.', 'Budget', 'PDF', 'Finance', 'active', 'Maria Gonzalez', '2026-01-15'),
        ('Comprehensive Land Use Plan 2026-2036', 'Ten-year land use plan outlining zoning changes, growth areas, and conservation priorities.', 'Planning', 'PDF', 'Planning & Zoning', 'active', 'Robert Kim', '2026-02-01'),
        ('County Emergency Operations Plan', 'Updated emergency operations plan covering natural disasters, public health emergencies, and critical infrastructure failures.', 'Public Safety', 'PDF', 'Emergency Management', 'active', 'James Wheeler', '2026-01-10'),
        ('Water Quality Annual Report', 'Annual assessment of drinking water quality across all county distribution systems.', 'Environment', 'PDF', 'Public Works', 'active', 'Linda Patel', '2026-03-01'),
        ('Employee Benefits Handbook 2026', 'Updated employee benefits guide including health insurance, retirement, and leave policies.', 'Human Resources', 'PDF', 'Human Resources', 'active', 'Nancy Liu', '2026-01-02'),
        ('Parks Master Plan', 'Strategic plan for county parks development, maintenance, and programming through 2030.', 'Recreation', 'PDF', 'Parks & Recreation', 'active', 'Tom Bradley', '2026-02-15'),
        ('Transportation Improvement Program', 'Five-year capital improvement program for roads, bridges, and transit infrastructure.', 'Infrastructure', 'PDF', 'Transportation', 'active', 'Ahmed Hassan', '2026-01-20'),
        ('Property Tax Assessment Guide', 'Resident guide to understanding property tax assessments, appeals, and exemptions.', 'Tax', 'PDF', 'Tax Assessor', 'active', 'Carol Nguyen', '2026-01-05'),
        ('Building Code Compliance Manual', 'Reference manual for residential and commercial building code requirements.', 'Building', 'PDF', 'Building & Codes', 'active', 'Steve Martinez', '2026-02-10'),
        ('Animal Control Ordinance Summary', 'Summary of county animal control ordinances including licensing, leash laws, and dangerous animal regulations.', 'Public Safety', 'PDF', 'Animal Services', 'active', 'Karen Davis', '2026-01-25'),
        ('Recycling Program Guidelines', 'Comprehensive guide to curbside recycling, hazardous waste disposal, and composting programs.', 'Environment', 'PDF', 'Public Works', 'active', 'Michael Brown', '2026-03-05'),
        ('Senior Services Resource Directory', 'Directory of county-provided and partner services available to residents aged 60 and older.', 'Social Services', 'PDF', 'Health & Human Services', 'active', 'Patricia Wilson', '2026-02-20'),
        ('Small Business Licensing Guide', 'Step-by-step guide for obtaining business licenses and permits in the county.', 'Business', 'PDF', 'Economic Development', 'active', 'Daniel Lee', '2026-01-18'),
        ('Stormwater Management Plan', 'County-wide stormwater management plan addressing flood mitigation and water quality.', 'Environment', 'PDF', 'Public Works', 'active', 'Jennifer Adams', '2026-02-28'),
        ('Voter Registration Procedures Manual', 'Procedures and requirements for voter registration, absentee voting, and election day operations.', 'Elections', 'PDF', 'Board of Elections', 'active', 'William Taylor', '2026-01-08')
    `);
    console.log('  -> 15 documents seeded');

    // ── Seed meetings ────────────────────────────────────────────────
    console.log('Seeding meetings...');
    await client.query(`
      INSERT INTO meetings (title, description, meeting_type, location, meeting_date, start_time, end_time, attendees, status, minutes_url) VALUES
        ('Board of Supervisors Regular Session', 'Monthly regular session of the Board of Supervisors to address county business, hear public comments, and vote on pending resolutions.', 'Board Meeting', 'County Administration Building, Room 201', '2026-04-07', '09:00', '12:00', 'Board of Supervisors, County Administrator, Department Heads', 'scheduled', NULL),
        ('Planning Commission Public Hearing', 'Public hearing on proposed rezoning application for the Oak Valley mixed-use development project.', 'Public Hearing', 'Planning Commission Chambers', '2026-04-14', '18:00', '20:00', 'Planning Commissioners, Applicant, Public', 'scheduled', NULL),
        ('Budget Committee Work Session', 'Review of departmental FY2027 budget requests and revenue projections.', 'Work Session', 'County Administration Building, Room 305', '2026-04-21', '14:00', '16:30', 'Budget Committee, Finance Director, Department Heads', 'scheduled', NULL),
        ('Parks & Recreation Advisory Board', 'Quarterly meeting to review park maintenance, upcoming programs, and capital improvement priorities.', 'Advisory Board', 'Community Center, Meeting Room A', '2026-04-09', '17:00', '18:30', 'Advisory Board Members, Parks Director', 'scheduled', NULL),
        ('Transportation Safety Committee', 'Discussion of traffic calming measures for residential neighborhoods and school zones.', 'Committee Meeting', 'Transportation Building, Conference Room', '2026-04-16', '10:00', '11:30', 'Committee Members, Transportation Director, Public Safety', 'scheduled', NULL),
        ('Board of Supervisors Regular Session - May', 'Monthly regular session covering second-quarter agenda items and public commentary period.', 'Board Meeting', 'County Administration Building, Room 201', '2026-05-05', '09:00', '12:00', 'Board of Supervisors, County Administrator', 'scheduled', NULL),
        ('Environmental Quality Commission', 'Review of air and water quality monitoring data and discussion of new environmental regulations.', 'Commission Meeting', 'Environmental Services Building, Room 102', '2026-04-22', '15:00', '17:00', 'Commission Members, Environmental Director', 'scheduled', NULL),
        ('School Board Joint Session', 'Joint session with county government to coordinate on school facility improvements and shared services.', 'Joint Meeting', 'School District Central Office', '2026-04-28', '13:00', '15:00', 'Board of Supervisors, School Board Members', 'scheduled', NULL),
        ('Public Safety Committee Review', 'Quarterly review of crime statistics, emergency response times, and community policing initiatives.', 'Committee Meeting', 'Public Safety Complex, Room 110', '2026-04-10', '09:00', '10:30', 'Committee Members, Sheriff, Fire Chief', 'scheduled', NULL),
        ('Historic Preservation Board', 'Review of applications for historic district designation and preservation grant awards.', 'Board Meeting', 'Historic Courthouse, Council Chamber', '2026-04-17', '16:00', '18:00', 'Preservation Board Members, Planning Staff', 'scheduled', NULL),
        ('Health Department Community Forum', 'Community forum on public health preparedness and vaccination program updates.', 'Public Forum', 'County Health Center, Auditorium', '2026-04-23', '18:30', '20:00', 'Health Director, Medical Staff, Public', 'scheduled', NULL),
        ('Economic Development Authority', 'Discussion of business incentive applications and workforce development strategy.', 'Authority Meeting', 'Economic Development Office, Board Room', '2026-05-01', '11:00', '13:00', 'EDA Board Members, Economic Development Director', 'scheduled', NULL),
        ('Board of Zoning Appeals', 'Hearing on variance requests for residential setback and commercial signage cases.', 'Appeal Hearing', 'Planning Commission Chambers', '2026-04-24', '14:00', '16:00', 'BZA Members, Zoning Staff, Appellants', 'scheduled', NULL),
        ('Library Board of Trustees', 'Monthly meeting to review circulation data, programming, and branch renovation plans.', 'Board Meeting', 'Central Library, Community Room', '2026-04-11', '10:00', '11:30', 'Library Board Members, Library Director', 'scheduled', NULL),
        ('Water & Sewer Authority', 'Review of infrastructure upgrade projects and rate adjustment proposals for FY2027.', 'Authority Meeting', 'Public Works Building, Conference Center', '2026-05-08', '09:30', '11:30', 'Authority Board Members, Utilities Director', 'scheduled', NULL)
    `);
    console.log('  -> 15 meetings seeded');

    // ── Seed announcements ───────────────────────────────────────────
    console.log('Seeding announcements...');
    await client.query(`
      INSERT INTO announcements (title, description, category, priority, author, publish_date, expiry_date, status) VALUES
        ('Property Tax Deadline Reminder', 'Reminder that second-half property tax payments are due by April 15, 2026. Late payments will incur a 5% penalty. Pay online, by mail, or in person at the Treasurer''s office.', 'Tax', 'high', 'County Treasurer', '2026-03-15', '2026-04-15', 'active'),
        ('Spring Curbside Leaf Collection Schedule', 'Curbside leaf collection begins April 1 and runs through April 30. Place leaves in biodegradable bags at the curb by 7:00 AM on your scheduled pickup day.', 'Public Works', 'normal', 'Public Works Department', '2026-03-20', '2026-04-30', 'active'),
        ('Road Closure: Main Street Bridge Repair', 'Main Street bridge between Oak Avenue and Elm Drive will be closed for structural repairs from April 6 through May 15. Detour via Route 7.', 'Transportation', 'high', 'Transportation Department', '2026-03-25', '2026-05-15', 'active'),
        ('New Online Permit Application System Launch', 'The county has launched a new online portal for building permit applications. Residents and contractors can now submit, track, and pay for permits online.', 'Services', 'normal', 'Building & Codes Department', '2026-03-10', '2026-06-10', 'active'),
        ('Summer Youth Employment Program Open', 'Applications are now open for the 2026 Summer Youth Employment Program for residents ages 16-21. Program runs June 15 through August 14.', 'Employment', 'normal', 'Human Resources', '2026-03-18', '2026-05-01', 'active'),
        ('County Offices Closed for Memorial Day', 'All county offices will be closed on Monday, May 25, 2026, in observance of Memorial Day. Emergency services will remain available.', 'General', 'normal', 'County Administrator', '2026-05-15', '2026-05-26', 'active'),
        ('Boil Water Advisory Lifted for District 4', 'The boil water advisory issued on March 10 for residents in Water District 4 has been lifted. Water quality testing has confirmed safe drinking water levels.', 'Public Health', 'high', 'Public Works Department', '2026-03-14', '2026-04-14', 'active'),
        ('Community Recycling Day - April 18', 'Free electronics and hazardous waste recycling event at the County Fairgrounds. Accepted items include computers, TVs, paint, batteries, and motor oil.', 'Environment', 'normal', 'Environmental Services', '2026-03-22', '2026-04-18', 'active'),
        ('Census Update: Redistricting Maps Available', 'Proposed redistricting maps for county supervisory districts are now available for public review on the county website. Public comment period ends April 30.', 'Government', 'normal', 'Board of Elections', '2026-03-28', '2026-04-30', 'active'),
        ('COVID-19 Booster Clinic Schedule', 'Updated COVID-19 booster clinics are available at three county health centers. Walk-ins welcome; appointments preferred. Visit the Health Department website for locations.', 'Public Health', 'normal', 'Health Department', '2026-03-05', '2026-06-30', 'active'),
        ('Animal Shelter Adoption Event', 'Reduced adoption fees this weekend at the County Animal Shelter. All dogs $50, all cats $25. Includes spay/neuter, vaccinations, and microchip.', 'Community', 'normal', 'Animal Services', '2026-04-03', '2026-04-05', 'active'),
        ('Public Comment Period: Zoning Ordinance Update', 'The Planning Department is accepting public comments on the proposed zoning ordinance update through May 15, 2026. Submit comments online or by mail.', 'Planning', 'normal', 'Planning & Zoning', '2026-03-30', '2026-05-15', 'active'),
        ('Library System Extended Hours', 'All county library branches will extend weekday hours to 9:00 PM beginning April 1, as part of a six-month pilot program.', 'Library', 'normal', 'Library Services', '2026-03-25', '2026-09-30', 'active'),
        ('Severe Weather Preparedness Week', 'April 6-12 is Severe Weather Preparedness Week. Visit the Emergency Management website for safety tips, shelter locations, and alert sign-up information.', 'Public Safety', 'high', 'Emergency Management', '2026-04-01', '2026-04-12', 'active'),
        ('Farmers Market Season Opening', 'The County Farmers Market opens for the 2026 season on Saturday, April 11, at the Downtown Pavilion. Open every Saturday 8:00 AM - 1:00 PM through October.', 'Community', 'normal', 'Parks & Recreation', '2026-04-01', '2026-10-31', 'active')
    `);
    console.log('  -> 15 announcements seeded');

    // ── Seed departments ─────────────────────────────────────────────
    console.log('Seeding departments...');
    await client.query(`
      INSERT INTO departments (name, description, head, email, phone, location, hours, employee_count, status) VALUES
        ('Public Works', 'Manages county roads, bridges, water and sewer systems, solid waste collection, and stormwater management.', 'Linda Patel', 'publicworks@county.gov', '(555) 234-5678', '450 Industrial Parkway', 'Mon-Fri 7:00 AM - 4:00 PM', 185, 'active'),
        ('Planning & Zoning', 'Administers land use regulations, zoning ordinances, subdivision review, and the comprehensive plan.', 'Robert Kim', 'planning@county.gov', '(555) 234-5679', '200 Government Center, 3rd Floor', 'Mon-Fri 8:00 AM - 5:00 PM', 42, 'active'),
        ('Finance', 'Manages county financial operations including budgeting, accounting, payroll, and procurement.', 'Maria Gonzalez', 'finance@county.gov', '(555) 234-5680', '200 Government Center, 2nd Floor', 'Mon-Fri 8:00 AM - 5:00 PM', 38, 'active'),
        ('Health & Human Services', 'Provides public health programs, social services, mental health support, and senior care resources.', 'Dr. Patricia Wilson', 'health@county.gov', '(555) 234-5681', '300 Health Services Drive', 'Mon-Fri 8:00 AM - 5:00 PM', 210, 'active'),
        ('Parks & Recreation', 'Maintains county parks, trails, and recreational facilities and provides community programming.', 'Tom Bradley', 'parks@county.gov', '(555) 234-5682', '100 Recreation Way', 'Mon-Fri 8:00 AM - 5:00 PM', 95, 'active'),
        ('Emergency Management', 'Coordinates disaster preparedness, emergency response, and community resilience programs.', 'James Wheeler', 'emergency@county.gov', '(555) 234-5683', '500 Public Safety Boulevard', 'Mon-Fri 8:00 AM - 5:00 PM (24/7 dispatch)', 65, 'active'),
        ('Transportation', 'Plans, designs, and maintains the county transportation network including roads, signals, and transit services.', 'Ahmed Hassan', 'transportation@county.gov', '(555) 234-5684', '475 Infrastructure Lane', 'Mon-Fri 7:30 AM - 4:30 PM', 120, 'active'),
        ('Building & Codes', 'Administers building permits, inspections, and code enforcement for residential and commercial properties.', 'Steve Martinez', 'building@county.gov', '(555) 234-5685', '200 Government Center, 1st Floor', 'Mon-Fri 8:00 AM - 4:30 PM', 34, 'active'),
        ('Human Resources', 'Manages county employment, benefits, training, labor relations, and workforce development.', 'Nancy Liu', 'hr@county.gov', '(555) 234-5686', '200 Government Center, 4th Floor', 'Mon-Fri 8:00 AM - 5:00 PM', 22, 'active'),
        ('Tax Assessor', 'Conducts property assessments, manages tax records, and administers tax exemption programs.', 'Carol Nguyen', 'taxassessor@county.gov', '(555) 234-5687', '200 Government Center, 1st Floor', 'Mon-Fri 8:00 AM - 4:30 PM', 28, 'active'),
        ('Animal Services', 'Operates the county animal shelter, enforces animal control ordinances, and runs adoption programs.', 'Karen Davis', 'animalservices@county.gov', '(555) 234-5688', '600 Shelter Road', 'Mon-Sat 9:00 AM - 5:00 PM', 30, 'active'),
        ('Library Services', 'Manages the county library system including branches, digital resources, and community programming.', 'Helen Foster', 'library@county.gov', '(555) 234-5689', '150 Library Lane', 'Mon-Sat 9:00 AM - 9:00 PM, Sun 1:00 PM - 5:00 PM', 78, 'active'),
        ('Economic Development', 'Promotes business growth, manages incentive programs, and supports workforce and tourism development.', 'Daniel Lee', 'econdev@county.gov', '(555) 234-5690', '200 Government Center, 5th Floor', 'Mon-Fri 8:30 AM - 5:00 PM', 18, 'active'),
        ('Board of Elections', 'Administers voter registration, conducts elections, and maintains electoral maps and records.', 'William Taylor', 'elections@county.gov', '(555) 234-5691', '250 Civic Center Drive', 'Mon-Fri 8:00 AM - 5:00 PM', 15, 'active'),
        ('Information Technology', 'Provides technology infrastructure, cybersecurity, GIS services, and digital platforms for county operations.', 'Kevin Zhao', 'it@county.gov', '(555) 234-5692', '200 Government Center, Basement Level', 'Mon-Fri 7:00 AM - 6:00 PM', 48, 'active')
    `);
    console.log('  -> 15 departments seeded');

    // ── Seed services ────────────────────────────────────────────────
    console.log('Seeding services...');
    await client.query(`
      INSERT INTO services (name, description, department, category, eligibility, fee, processing_time, status, contact_info) VALUES
        ('Property Tax Payment', 'Pay property taxes online, by mail, or in person. Includes real estate and personal property taxes.', 'Tax Assessor', 'Tax', 'All property owners', 'Varies by assessment', 'Immediate', 'active', 'taxassessor@county.gov | (555) 234-5687'),
        ('Building Permit Application', 'Apply for residential and commercial building permits for new construction, additions, and renovations.', 'Building & Codes', 'Permits', 'Property owners and licensed contractors', '$50 - $2,000', '5-15 business days', 'active', 'building@county.gov | (555) 234-5685'),
        ('Marriage License', 'Obtain a marriage license from the County Clerk. Both parties must appear in person with valid ID.', 'Finance', 'Vital Records', 'Couples meeting state marriage requirements', '$50', 'Same day', 'active', 'clerk@county.gov | (555) 234-5680'),
        ('Birth Certificate Request', 'Request certified copies of birth certificates for individuals born in the county.', 'Health & Human Services', 'Vital Records', 'Individuals or authorized family members', '$15 per copy', '3-5 business days', 'active', 'vitalrecords@county.gov | (555) 234-5681'),
        ('Voter Registration', 'Register to vote or update your voter registration information online or in person.', 'Board of Elections', 'Elections', 'U.S. citizens 18+ residing in the county', 'Free', '1-2 weeks', 'active', 'elections@county.gov | (555) 234-5691'),
        ('Dog License', 'License your dog with the county as required by ordinance. Proof of rabies vaccination required.', 'Animal Services', 'Animal Control', 'All dog owners in the county', '$15 (spayed/neutered), $25 (unaltered)', '1-3 business days', 'active', 'animalservices@county.gov | (555) 234-5688'),
        ('Trash & Recycling Pickup', 'Weekly curbside collection of household trash and recyclable materials.', 'Public Works', 'Utilities', 'Residential properties in the service area', 'Included in property tax', 'Weekly', 'active', 'publicworks@county.gov | (555) 234-5678'),
        ('Park Shelter Reservation', 'Reserve a picnic shelter, pavilion, or athletic field at any county park.', 'Parks & Recreation', 'Recreation', 'Any resident or organization', '$25 - $150', '2-3 business days', 'active', 'parks@county.gov | (555) 234-5682'),
        ('Business License Application', 'Apply for a county business license required for all commercial operations within county limits.', 'Economic Development', 'Business', 'Individuals and businesses operating in the county', '$75 - $500 annually', '5-10 business days', 'active', 'econdev@county.gov | (555) 234-5690'),
        ('Pothole Repair Request', 'Report potholes on county-maintained roads for repair. Requests can be submitted online or by phone.', 'Transportation', 'Road Maintenance', 'Any county resident or commuter', 'Free', '3-7 business days', 'active', 'transportation@county.gov | (555) 234-5684'),
        ('Library Card Registration', 'Register for a free library card to access books, digital resources, and programs at all branches.', 'Library Services', 'Library', 'County residents with proof of address', 'Free', 'Same day', 'active', 'library@county.gov | (555) 234-5689'),
        ('Food Handler Certification', 'Obtain food handler certification required for food service workers in the county.', 'Health & Human Services', 'Public Health', 'Food service employees', '$25', '1-2 business days', 'active', 'health@county.gov | (555) 234-5681'),
        ('Zoning Verification Letter', 'Request a letter verifying the zoning classification and permitted uses for a specific property.', 'Planning & Zoning', 'Planning', 'Property owners, prospective buyers, lenders', '$35', '3-5 business days', 'active', 'planning@county.gov | (555) 234-5679'),
        ('Emergency Alert Sign-Up', 'Register to receive emergency alerts via text, email, and phone for severe weather and public safety events.', 'Emergency Management', 'Public Safety', 'All county residents', 'Free', 'Immediate', 'active', 'emergency@county.gov | (555) 234-5683'),
        ('Senior Transportation Service', 'Door-to-door transportation service for residents aged 60 and older for medical appointments and essential errands.', 'Health & Human Services', 'Social Services', 'County residents aged 60+', '$2 per one-way trip', 'Schedule 48 hours in advance', 'active', 'seniortransit@county.gov | (555) 234-5681')
    `);
    console.log('  -> 15 services seeded');

    // ── Seed FAQs ────────────────────────────────────────────────────
    console.log('Seeding faqs...');
    await client.query(`
      INSERT INTO faqs (question, answer, category, department, helpful_count, status) VALUES
        ('How do I pay my property taxes?', 'Property taxes can be paid online through the county payment portal, by mail to the Treasurer''s Office at P.O. Box 1234, or in person at the Government Center, 1st Floor. First-half taxes are due March 1 and second-half taxes are due September 1.', 'Tax', 'Tax Assessor', 342, 'active'),
        ('When is trash pickup in my area?', 'Trash and recycling are collected weekly. Enter your address on the Public Works website to find your pickup day. Place bins at the curb by 7:00 AM. If your regular pickup day falls on a holiday, collection occurs the following day.', 'Public Works', 'Public Works', 287, 'active'),
        ('How do I apply for a building permit?', 'Building permit applications can be submitted online through the county permits portal or in person at the Building & Codes office. You will need your site plan, construction drawings, and contractor information. Fees vary based on project scope.', 'Permits', 'Building & Codes', 198, 'active'),
        ('Where can I register to vote?', 'You can register to vote online at the Board of Elections website, by mail using a voter registration form, or in person at the Board of Elections office at 250 Civic Center Drive. Registration must be completed at least 22 days before an election.', 'Elections', 'Board of Elections', 175, 'active'),
        ('How do I report a pothole?', 'Potholes on county roads can be reported online through the county website''s service request form, by calling (555) 234-5684, or through the county mobile app. Provide the location and a photo if possible. Repairs are typically completed within 3-7 business days.', 'Transportation', 'Transportation', 256, 'active'),
        ('What are the library hours?', 'County library branches are open Monday through Saturday, 9:00 AM to 9:00 PM, and Sunday, 1:00 PM to 5:00 PM. Holiday hours may vary; check the library website for specific branch schedules.', 'Library', 'Library Services', 145, 'active'),
        ('How do I get a copy of my birth certificate?', 'Certified copies of birth certificates can be requested online, by mail, or in person at the Health Department''s Vital Records office. You will need a valid photo ID and proof of relationship. The fee is $15 per copy.', 'Vital Records', 'Health & Human Services', 223, 'active'),
        ('Do I need a permit for a garage sale?', 'No permit is required for a residential garage sale in the county. However, sales are limited to three per year, each lasting no more than three consecutive days. Signs must be removed within 24 hours after the sale ends.', 'Permits', 'Planning & Zoning', 132, 'active'),
        ('How do I license my dog?', 'Dog licenses can be obtained online or at the Animal Services office. Bring proof of current rabies vaccination. Licenses cost $15 for spayed or neutered dogs and $25 for unaltered dogs. Licenses must be renewed annually.', 'Animal Control', 'Animal Services', 167, 'active'),
        ('What should I do during a severe weather warning?', 'During a severe weather warning, move to an interior room on the lowest floor, away from windows. Monitor the county emergency alert system and local news. If you need shelter, call (555) 234-5683 for the nearest emergency shelter location.', 'Emergency', 'Emergency Management', 189, 'active'),
        ('How do I apply for a county job?', 'County job openings are posted on the Human Resources website. Submit your application and resume online. Most positions require a background check and pre-employment physical. Contact HR at (555) 234-5686 for questions.', 'Employment', 'Human Resources', 211, 'active'),
        ('Can I reserve a park pavilion?', 'Park shelters and pavilions can be reserved online or by contacting the Parks & Recreation office. Reservations should be made at least two weeks in advance. Fees range from $25 to $150 depending on the facility.', 'Recreation', 'Parks & Recreation', 98, 'active'),
        ('How do I appeal my property assessment?', 'Property assessment appeals must be filed within 60 days of receiving your assessment notice. Submit an appeal form with supporting documentation to the Board of Equalization. You may also request an informal review by contacting the Assessor''s office.', 'Tax', 'Tax Assessor', 154, 'active'),
        ('Where do I dispose of hazardous waste?', 'Household hazardous waste including paint, batteries, pesticides, and motor oil can be dropped off at the County Hazardous Waste Facility at 700 Disposal Drive, open Tuesday through Saturday, 8:00 AM to 4:00 PM. The service is free for residents.', 'Environment', 'Public Works', 176, 'active'),
        ('How do I start a business in the county?', 'To start a business, you will need a county business license, appropriate zoning approval, and any industry-specific permits. Visit the Economic Development office or website for a start-up checklist and to schedule a free consultation.', 'Business', 'Economic Development', 143, 'active')
    `);
    console.log('  -> 15 faqs seeded');

    // ── Seed events ──────────────────────────────────────────────────
    console.log('Seeding events...');
    await client.query(`
      INSERT INTO events (title, description, event_type, location, event_date, start_time, end_time, organizer, capacity, registration_required, status) VALUES
        ('Community Clean-Up Day', 'Annual volunteer clean-up event across county parks and waterways. Supplies provided. Lunch included for all volunteers.', 'Volunteer', 'Multiple Locations', '2026-04-18', '08:00', '13:00', 'Parks & Recreation', 500, true, 'upcoming'),
        ('Spring Farmers Market Opening Day', 'Season opener for the Downtown Farmers Market featuring local produce, artisan goods, and live music.', 'Community', 'Downtown Pavilion', '2026-04-11', '08:00', '13:00', 'Economic Development', 0, false, 'upcoming'),
        ('County Job Fair', 'Annual job fair featuring county government positions and partner employers. Bring your resume.', 'Career', 'County Fairgrounds, Exhibition Hall', '2026-05-02', '10:00', '15:00', 'Human Resources', 300, false, 'upcoming'),
        ('Household Hazardous Waste Collection', 'Free drop-off event for electronics, paint, batteries, chemicals, and other hazardous household materials.', 'Environmental', 'County Fairgrounds, Lot B', '2026-04-25', '08:00', '14:00', 'Public Works', 0, false, 'upcoming'),
        ('Senior Health & Wellness Fair', 'Health screenings, wellness workshops, and resource information for residents aged 60 and older.', 'Health', 'Community Center', '2026-05-09', '09:00', '14:00', 'Health & Human Services', 250, true, 'upcoming'),
        ('Fourth of July Fireworks Celebration', 'Annual Independence Day celebration with food vendors, live music, kids activities, and fireworks at dusk.', 'Holiday', 'Lakeside Park', '2026-07-04', '16:00', '22:00', 'Parks & Recreation', 5000, false, 'upcoming'),
        ('Summer Reading Program Kick-Off', 'Launch event for the annual summer reading program with author visits, crafts, and prize drawings.', 'Education', 'Central Library', '2026-06-13', '10:00', '14:00', 'Library Services', 200, false, 'upcoming'),
        ('Public Safety Open House', 'Tour fire stations and the 911 center, meet first responders, and learn about emergency preparedness.', 'Public Safety', 'Fire Station 1 & Public Safety Complex', '2026-05-16', '10:00', '15:00', 'Emergency Management', 400, false, 'upcoming'),
        ('County Budget Public Forum', 'Open forum for residents to provide input on FY2027 budget priorities and proposed expenditures.', 'Government', 'County Administration Building, Room 201', '2026-05-20', '18:00', '20:00', 'Finance', 150, false, 'upcoming'),
        ('Adopt-a-Pet Weekend', 'Special adoption event with reduced fees. Meet cats and dogs available for adoption.', 'Community', 'County Animal Shelter', '2026-04-26', '09:00', '16:00', 'Animal Services', 0, false, 'upcoming'),
        ('Trail Run & 5K for Parks', 'Fundraiser 5K run/walk through the county trail system to support park maintenance and improvements.', 'Recreation', 'Greenway Trail, Main Entrance', '2026-06-07', '07:30', '11:00', 'Parks & Recreation', 300, true, 'upcoming'),
        ('Prescription Drug Take-Back Day', 'Safe disposal of unused and expired prescription medications. Drive-through drop-off, no questions asked.', 'Health', 'County Health Center Parking Lot', '2026-04-19', '10:00', '14:00', 'Health & Human Services', 0, false, 'upcoming'),
        ('Small Business Workshop Series', 'Free four-week workshop series covering business planning, financing, marketing, and legal requirements.', 'Education', 'Economic Development Office', '2026-05-06', '18:00', '20:00', 'Economic Development', 40, true, 'upcoming'),
        ('National Night Out Block Party', 'Community crime prevention event with neighborhood block parties, food, and activities.', 'Community', 'Multiple Neighborhoods', '2026-08-04', '17:00', '21:00', 'Public Safety', 0, false, 'upcoming'),
        ('Tree Planting Volunteer Day', 'Help plant 500 native trees along county stream buffers as part of the reforestation initiative.', 'Environmental', 'Creekside Conservation Area', '2026-04-22', '08:30', '12:30', 'Public Works', 100, true, 'upcoming')
    `);
    console.log('  -> 15 events seeded');

    // ── Seed contacts ────────────────────────────────────────────────
    console.log('Seeding contacts...');
    await client.query(`
      INSERT INTO contacts (name, title, department, email, phone, office_location, office_hours, bio, status) VALUES
        ('Margaret Sullivan', 'County Administrator', 'County Administration', 'msullivan@county.gov', '(555) 234-5670', '200 Government Center, Suite 500', 'Mon-Fri 8:00 AM - 5:00 PM', 'Margaret has served as County Administrator since 2020, overseeing all county departments and a $450 million annual budget.', 'active'),
        ('Linda Patel', 'Director of Public Works', 'Public Works', 'lpatel@county.gov', '(555) 234-5678', '450 Industrial Parkway, Office 101', 'Mon-Fri 7:00 AM - 4:00 PM', 'Linda manages county infrastructure including roads, water systems, and solid waste operations with 25 years of civil engineering experience.', 'active'),
        ('Robert Kim', 'Director of Planning & Zoning', 'Planning & Zoning', 'rkim@county.gov', '(555) 234-5679', '200 Government Center, Room 310', 'Mon-Fri 8:00 AM - 5:00 PM', 'Robert leads the county''s land use planning efforts and has a master''s degree in urban planning from Virginia Tech.', 'active'),
        ('Maria Gonzalez', 'Finance Director', 'Finance', 'mgonzalez@county.gov', '(555) 234-5680', '200 Government Center, Room 220', 'Mon-Fri 8:00 AM - 5:00 PM', 'Maria oversees county budgeting, accounting, and procurement with over 20 years of public finance experience.', 'active'),
        ('Dr. Patricia Wilson', 'Director of Health & Human Services', 'Health & Human Services', 'pwilson@county.gov', '(555) 234-5681', '300 Health Services Drive, Suite 100', 'Mon-Fri 8:00 AM - 5:00 PM', 'Dr. Wilson is a board-certified public health physician who joined the county in 2018.', 'active'),
        ('Tom Bradley', 'Director of Parks & Recreation', 'Parks & Recreation', 'tbradley@county.gov', '(555) 234-5682', '100 Recreation Way', 'Mon-Fri 8:00 AM - 5:00 PM', 'Tom oversees 35 county parks, 50 miles of trails, and year-round recreational programming.', 'active'),
        ('James Wheeler', 'Director of Emergency Management', 'Emergency Management', 'jwheeler@county.gov', '(555) 234-5683', '500 Public Safety Boulevard', 'Mon-Fri 8:00 AM - 5:00 PM', 'James is a retired Army colonel with extensive experience in emergency operations and disaster response coordination.', 'active'),
        ('Ahmed Hassan', 'Director of Transportation', 'Transportation', 'ahassan@county.gov', '(555) 234-5684', '475 Infrastructure Lane', 'Mon-Fri 7:30 AM - 4:30 PM', 'Ahmed manages the county''s 1,200-mile road network and public transit system.', 'active'),
        ('Steve Martinez', 'Director of Building & Codes', 'Building & Codes', 'smartinez@county.gov', '(555) 234-5685', '200 Government Center, Room 105', 'Mon-Fri 8:00 AM - 4:30 PM', 'Steve is a licensed professional engineer and certified building official with 18 years of experience.', 'active'),
        ('Nancy Liu', 'Director of Human Resources', 'Human Resources', 'nliu@county.gov', '(555) 234-5686', '200 Government Center, Room 420', 'Mon-Fri 8:00 AM - 5:00 PM', 'Nancy manages talent acquisition, employee relations, and benefits for the county''s 1,200 employees.', 'active'),
        ('Carol Nguyen', 'County Tax Assessor', 'Tax Assessor', 'cnguyen@county.gov', '(555) 234-5687', '200 Government Center, Room 110', 'Mon-Fri 8:00 AM - 4:30 PM', 'Carol has served as Tax Assessor since 2019 and holds a Certified Assessment Evaluator designation.', 'active'),
        ('Karen Davis', 'Director of Animal Services', 'Animal Services', 'kdavis@county.gov', '(555) 234-5688', '600 Shelter Road', 'Mon-Sat 9:00 AM - 5:00 PM', 'Karen is a licensed veterinary technician who leads the county shelter and animal control programs.', 'active'),
        ('Helen Foster', 'Director of Library Services', 'Library Services', 'hfoster@county.gov', '(555) 234-5689', '150 Library Lane', 'Mon-Sat 9:00 AM - 9:00 PM', 'Helen oversees six library branches and a bookmobile serving over 200,000 annual visitors.', 'active'),
        ('Daniel Lee', 'Director of Economic Development', 'Economic Development', 'dlee@county.gov', '(555) 234-5690', '200 Government Center, Room 510', 'Mon-Fri 8:30 AM - 5:00 PM', 'Daniel leads business recruitment, retention, and workforce development initiatives for the county.', 'active'),
        ('Kevin Zhao', 'Chief Information Officer', 'Information Technology', 'kzhao@county.gov', '(555) 234-5692', '200 Government Center, Lower Level', 'Mon-Fri 7:00 AM - 6:00 PM', 'Kevin oversees all county technology infrastructure, cybersecurity, and digital services modernization.', 'active')
    `);
    console.log('  -> 15 contacts seeded');

    // ── Seed permits ─────────────────────────────────────────────────
    console.log('Seeding permits...');
    await client.query(`
      INSERT INTO permits (name, description, department, category, fee, processing_time, requirements, status) VALUES
        ('Residential Building Permit', 'Required for new home construction, additions, and structural modifications to residential properties.', 'Building & Codes', 'Building', '$150 - $2,000', '10-15 business days', 'Site plan, construction drawings, contractor license, proof of insurance', 'active'),
        ('Commercial Building Permit', 'Required for new commercial construction, tenant fit-outs, and commercial renovations.', 'Building & Codes', 'Building', '$500 - $5,000', '15-20 business days', 'Architect-stamped plans, site plan, fire protection plan, ADA compliance documentation', 'active'),
        ('Electrical Permit', 'Required for new electrical installations, panel upgrades, and major wiring modifications.', 'Building & Codes', 'Electrical', '$75 - $300', '3-5 business days', 'Licensed electrician, scope of work description, load calculations', 'active'),
        ('Plumbing Permit', 'Required for new plumbing installations, water heater replacements, and sewer line work.', 'Building & Codes', 'Plumbing', '$75 - $250', '3-5 business days', 'Licensed plumber, scope of work description, fixture count', 'active'),
        ('Demolition Permit', 'Required for partial or full demolition of any structure within the county.', 'Building & Codes', 'Building', '$200 - $1,000', '10-15 business days', 'Asbestos inspection report, utility disconnection confirmation, site safety plan', 'active'),
        ('Driveway Permit', 'Required for new driveway construction or modifications to existing driveway aprons on county roads.', 'Transportation', 'Road Work', '$50', '5-7 business days', 'Property survey, driveway plan showing dimensions and materials, drainage plan', 'active'),
        ('Sign Permit', 'Required for installation of commercial signs, banners, and temporary advertising displays.', 'Planning & Zoning', 'Zoning', '$50 - $200', '5-10 business days', 'Sign design with dimensions, site plan showing placement, electrical plan if illuminated', 'active'),
        ('Special Event Permit', 'Required for events on public property or events exceeding 200 attendees on private property.', 'Parks & Recreation', 'Events', '$100 - $500', '15-20 business days', 'Event plan, site map, insurance certificate, security plan, noise mitigation plan', 'active'),
        ('Food Service Permit', 'Required for all permanent and temporary food service establishments within the county.', 'Health & Human Services', 'Health', '$150 - $400 annually', '10-15 business days', 'Health inspection, food handler certifications, menu, equipment list, floor plan', 'active'),
        ('Grading Permit', 'Required for any land-disturbing activity affecting more than 2,500 square feet.', 'Public Works', 'Environmental', '$200 - $1,500', '10-20 business days', 'Erosion control plan, stormwater management plan, site grading plan', 'active'),
        ('Home Occupation Permit', 'Required to operate a business from a residential property.', 'Planning & Zoning', 'Zoning', '$50', '5-7 business days', 'Business description, floor plan showing business area, parking plan, neighbor notification', 'active'),
        ('Well Permit', 'Required for drilling new wells or modifying existing wells on private property.', 'Health & Human Services', 'Environmental', '$100', '10-15 business days', 'Well site plan, property survey, soil report, water testing plan', 'active'),
        ('Fence Permit', 'Required for fences exceeding 6 feet in height or located in front yard setback areas.', 'Building & Codes', 'Building', '$40', '3-5 business days', 'Property survey, fence plan with dimensions and materials, neighbor notification if shared', 'active'),
        ('Tree Removal Permit', 'Required for removal of trees over 8 inches in diameter on developed properties.', 'Planning & Zoning', 'Environmental', '$25 per tree', '5-10 business days', 'Arborist report, tree survey, replanting plan, photos of trees to be removed', 'active'),
        ('Right-of-Way Permit', 'Required for any work within the county road right-of-way including utility installations.', 'Transportation', 'Road Work', '$100 - $500', '7-10 business days', 'Traffic control plan, scope of work, utility markings, restoration plan, insurance certificate', 'active')
    `);
    console.log('  -> 15 permits seeded');

    // ── Seed ordinances ──────────────────────────────────────────────
    console.log('Seeding ordinances...');
    await client.query(`
      INSERT INTO ordinances (title, description, ordinance_number, category, effective_date, status, adopted_date, department) VALUES
        ('Noise Ordinance', 'Regulates excessive noise levels in residential, commercial, and industrial zones. Sets quiet hours from 10:00 PM to 7:00 AM.', 'ORD-2024-012', 'Public Safety', '2024-07-01', 'active', '2024-06-15', 'Planning & Zoning'),
        ('Zoning Ordinance - Residential Districts', 'Establishes permitted uses, setback requirements, and density standards for all residential zoning districts.', 'ORD-2023-045', 'Zoning', '2023-10-01', 'active', '2023-09-15', 'Planning & Zoning'),
        ('Stormwater Management Ordinance', 'Requires stormwater management plans for all land-disturbing activities over 2,500 square feet.', 'ORD-2025-003', 'Environment', '2025-03-01', 'active', '2025-02-10', 'Public Works'),
        ('Animal Control Ordinance', 'Regulates animal ownership including licensing, leash requirements, dangerous animals, and livestock in residential areas.', 'ORD-2024-028', 'Animal Control', '2024-09-01', 'active', '2024-08-12', 'Animal Services'),
        ('Sign Ordinance', 'Governs the type, size, placement, and illumination of signs throughout the county.', 'ORD-2023-019', 'Zoning', '2023-06-01', 'active', '2023-05-20', 'Planning & Zoning'),
        ('Short-Term Rental Ordinance', 'Establishes registration, safety, and tax requirements for short-term rental properties.', 'ORD-2025-017', 'Business', '2025-07-01', 'active', '2025-06-05', 'Planning & Zoning'),
        ('Property Maintenance Code', 'Sets minimum standards for the maintenance of existing residential and commercial structures.', 'ORD-2024-006', 'Building', '2024-04-01', 'active', '2024-03-18', 'Building & Codes'),
        ('Erosion and Sediment Control Ordinance', 'Requires erosion control measures during construction and land-clearing activities.', 'ORD-2023-031', 'Environment', '2023-08-01', 'active', '2023-07-22', 'Public Works'),
        ('Food Truck Ordinance', 'Permits and regulates mobile food vending operations on public and private property.', 'ORD-2025-009', 'Business', '2025-05-01', 'active', '2025-04-14', 'Health & Human Services'),
        ('Tree Preservation Ordinance', 'Protects significant trees on developed properties and requires replacement plantings for removals.', 'ORD-2024-021', 'Environment', '2024-10-01', 'active', '2024-09-20', 'Planning & Zoning'),
        ('Floodplain Management Ordinance', 'Regulates development in flood-prone areas to protect public safety and property.', 'ORD-2023-015', 'Public Safety', '2023-05-01', 'active', '2023-04-10', 'Public Works'),
        ('Outdoor Lighting Ordinance', 'Controls outdoor lighting to reduce light pollution and preserve night sky visibility.', 'ORD-2025-022', 'Environment', '2026-01-01', 'active', '2025-11-18', 'Planning & Zoning'),
        ('Subdivision Ordinance', 'Governs the subdivision of land including lot size, road standards, and utility requirements.', 'ORD-2024-038', 'Zoning', '2024-12-01', 'active', '2024-11-15', 'Planning & Zoning'),
        ('Towing and Abandoned Vehicle Ordinance', 'Establishes procedures for towing illegally parked, abandoned, or inoperable vehicles.', 'ORD-2024-015', 'Public Safety', '2024-06-01', 'active', '2024-05-20', 'Transportation'),
        ('Solar Energy Systems Ordinance', 'Permits and regulates the installation of solar panels and solar energy systems on residential and commercial properties.', 'ORD-2026-001', 'Zoning', '2026-02-01', 'active', '2026-01-12', 'Planning & Zoning')
    `);
    console.log('  -> 15 ordinances seeded');

    console.log('\nDatabase seeding completed successfully!');
    console.log('Demo login users provisioned from the local environment.');

  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('Database connection closed.');
  }
}

seed();
