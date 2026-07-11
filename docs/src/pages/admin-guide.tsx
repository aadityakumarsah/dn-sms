export function AdminGuide() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Portal Guide</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Complete reference manual for school administrators. Covers every feature, page, and workflow in the Admin Portal.
        </p>
      </div>

      <div className="space-y-10">

        {/* Section: Getting Started */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">1. Getting Started</h2>
          <p className="mb-4">
            The Admin Portal is the central hub for managing your school. Access it at <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin</code> after logging in with your school admin credentials.
          </p>
          <p className="mb-4">
            Your portal is organized into sections: Overview, People, Academics, Finance, Operations, Communication, and Administration. Each section contains related pages for managing different aspects of the school.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-1">First-time admin checklist:</p>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Complete your <strong>School Settings</strong> — set up academic year, grading system, and fee defaults</li>
              <li>Create <strong>Classes & Sections</strong> — define the grade structure</li>
              <li>Create <strong>Subjects</strong> — add all subjects offered</li>
              <li>Add <strong>Teachers</strong> and assign them to subjects and sections</li>
              <li>Add <strong>Students</strong> — enroll them in appropriate classes</li>
              <li>Set up <strong>Fee Structures</strong> — define fee types and amounts per class</li>
              <li>Configure <strong>Academic Year</strong> — set the current active year</li>
              <li>Create <strong>Exam Schedules</strong> and <strong>Timetables</strong></li>
            </ol>
          </div>
        </section>

        {/* Section: Dashboard */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">2. Dashboard</h2>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin</code></p>
          <p className="mb-4">
            The Dashboard gives you a real-time overview of your school with key performance indicators displayed as stat cards. Metrics shown include:
          </p>
          <ul className="list-disc ml-6 space-y-1 mb-4">
            <li><strong>Total Students</strong> — Active student count across all classes</li>
            <li><strong>Teachers</strong> — Number of teaching staff</li>
            <li><strong>Fees Collected</strong> — Running total of fee collections for the current period</li>
            <li><strong>Today's Attendance %</strong> — Percentage of students present today</li>
          </ul>
          <p>All metrics load from the server and update on page refresh.</p>
        </section>

        {/* Section: People Management */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">3. People Management</h2>

          <h3 className="text-xl font-medium mt-6 mb-2">3.1 Students</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/students</code></p>
          <p className="mb-4">The student management module lets you create, view, update, and delete student records.</p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-2">How to add a new student:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Click <strong>"Add Student"</strong> to open the creation form</li>
              <li>Fill in student details: first name, last name, date of birth, gender, address, phone</li>
              <li>Upload a profile photo using the image upload widget</li>
              <li>Select grade/class and section for enrollment</li>
              <li>Add guardian/parent information (name, phone, relation)</li>
              <li>Click <strong>Save</strong> — the system auto-generates login credentials (email & password)</li>
              <li>A credentials modal appears with <strong>copy-to-clipboard</strong> buttons — share these with the student</li>
            </ol>
          </div>
          <p className="mb-4"><strong>Additional features:</strong></p>
          <ul className="list-disc ml-6 space-y-1 mb-4">
            <li><strong>Search & filter</strong> — Find students by name, class, section, stream, or transport status</li>
            <li><strong>Edit</strong> — Update any student's details, photo, or enrollment</li>
            <li><strong>Allocate section</strong> — Assign or move a student to a different section</li>
            <li><strong>View detail</strong> — Click a student to see their full profile, fee status, and edit credentials</li>
            <li><strong>Delete</strong> — Remove a student record (with confirmation)</li>
            <li><strong>Credential management</strong> — Update student email/password from the detail page</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-2">3.2 Teachers</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/teachers</code></p>
          <p className="mb-4">Manage all teaching staff — create teacher profiles, assign subjects, manage credentials.</p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-2">How to add a new teacher:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Click <strong>"Add Teacher"</strong></li>
              <li>Enter personal details: name, email, phone, specialization, qualification</li>
              <li>Upload a profile photo</li>
              <li>Click <strong>Save</strong> — system generates login credentials automatically</li>
              <li>Copy credentials from the modal and share with the teacher</li>
            </ol>
          </div>
          <p className="mb-4"><strong>Additional features:</strong></p>
          <ul className="list-disc ml-6 space-y-1 mb-4">
            <li><strong>Teacher Assignments</strong> — Assign teachers to specific subjects and sections</li>
            <li><strong>Payroll</strong> — View and manage teacher payroll records from their detail page</li>
            <li><strong>Edit credentials</strong> — Update teacher login email/password anytime</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-2">3.3 Staff</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/staff-mgmt</code></p>
          <p>Manage non-teaching staff (accountants, librarians, cleaners, security guards, etc.). Includes designation assignment, employee ID tracking, salary management, and payroll processing through the detail page.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">3.4 User Management</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/user-management</code></p>
          <p>Centralized user directory showing all school users across all roles. Filter by role (teacher, staff, student, parent), search by name or email. Each user has an <strong>Edit Drawer</strong> for updating profile, email, status, and resetting passwords.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">3.5 Admissions</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/admissions</code></p>
          <p>Process new student applications. Track applications through statuses: <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-medium">PENDING</span> → <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium">UNDER REVIEW</span> → <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-medium">APPROVED</span> → <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-xs font-medium">ENROLLED</span>. Also supports rejecting or waitlisting applicants.</p>
          <div className="bg-muted p-4 rounded-lg mt-3">
            <h4 className="font-semibold text-sm mb-2">Enrollment workflow:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Application arrives with student info, desired grade, and department</li>
              <li>Review and approve the application</li>
              <li>Click <strong>"Enroll"</strong> to convert the application into a full student record</li>
              <li>Mark admission fee as paid if applicable</li>
              <li>Student is now active in the school system</li>
            </ol>
          </div>
        </section>

        {/* Section: Academics */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">4. Academics</h2>

          <h3 className="text-xl font-medium mt-6 mb-2">4.1 Classes & Sections</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/classes</code></p>
          <p className="mb-4">Define your school's grade structure. Create grades (e.g., Nursery, 1-10, +2 Science/Commerce) and organize them into sections (A, B, C).</p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-2">How to set up classes:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Click <strong>"Add Grade"</strong> — enter name (e.g., "Class 10")</li>
              <li>Within each grade, click <strong>"Add Section"</strong> — name it (e.g., "A", "B")</li>
              <li>Use <strong>GradeSubjectsPanel</strong> to assign which subjects are taught at each grade level</li>
              <li>You can apply a subject to all sections in a grade with one toggle</li>
            </ol>
          </div>

          <h3 className="text-xl font-medium mt-6 mb-2">4.2 Section Management</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/sections</code></p>
          <p>Overview of all sections across all grades. Shows performance ratings (Excellent/Good/Average/Below Average) and seat occupancy. Click any section to see its detail page.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.3 Section Detail</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/sections/:id</code></p>
          <p>A single section's dashboard showing enrolled students with fee status. Use <strong>"Add Students"</strong> to search and allocate additional students. You can also edit the section name and seat capacity, and update performance ratings.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.4 Subjects</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/subjects</code></p>
          <p>Create the master subject library. Each subject has a name, code, credit hours, and an optional elective flag. Subjects are then assigned to specific grades and sections from the Classes page.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.5 Subject Management (Scheduling)</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/subject-management</code></p>
          <p>Schedule subjects by assigning teachers, time slots, days, periods, rooms, and shifts to specific sections. The system checks teacher availability to avoid scheduling conflicts.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.6 Departments / Streams</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/departments</code></p>
          <p>Manage academic streams/departments (Science, Commerce, Humanities, Computer Science, Management, Other). Each department has a name, code, and optional description.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.7 Academic Year & Promotion</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/academic</code></p>
          <p>Manage academic years and promote students to the next grade at year-end.</p>
          <div className="bg-muted p-4 rounded-lg mt-3">
            <h4 className="font-semibold text-sm mb-2">Year-end promotion workflow:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Create the new academic year (e.g., "2082")</li>
              <li>Go to <strong>Academic Promotion</strong></li>
              <li>Select source year and target year</li>
              <li>Click <strong>"Preview"</strong> to see which students will be promoted</li>
              <li>Review the list and click <strong>"Promote Students"</strong> to execute</li>
              <li>Students are moved to the next grade with their sections</li>
            </ol>
          </div>

          <h3 className="text-xl font-medium mt-6 mb-2">4.8 Class Routine (Timetable)</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/routine</code></p>
          <p>Build and manage weekly class timetables. Add time slots with section, subject, teacher, day, period, time range, and room number. Each slot is displayed in a structured list organized by section.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.9 Attendance</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/attendance</code></p>
          <p>Mark and monitor student attendance. Two modes available:</p>
          <ul className="list-disc ml-6 space-y-1 mb-4">
            <li><strong>Daily Mode</strong> — Select a section and date, mark each student as <span className="text-green-600 font-medium">Present</span>, <span className="text-red-600 font-medium">Absent</span>, or <span className="text-yellow-600 font-medium">Late</span>. Use bulk toggle to mark all students at once.</li>
            <li><strong>Range Mode</strong> — View attendance summary over a date range for reporting</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-2">4.10 Examinations</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/exams</code></p>
          <p>Create and manage exams. Each exam has a name, type (Term, Mid-Term, Final, etc.), start/end dates, and status (Scheduled, Ongoing, Completed, Cancelled). Within each exam, define subjects, full marks, pass marks, and dates.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.11 Homework</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/homework</code></p>
          <p>Create homework assignments with title, description, due date, and max marks. Assign to a specific teacher who will manage it in their portal.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">4.12 Student Assessments (CAS)</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/assessments</code></p>
          <p>Record student assessments for Creativity, Activity, Service (CAS) and academic areas. Each assessment records term, area, grade, score, and remarks. Filterable by student.</p>
        </section>

        {/* Section: Finance */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">5. Finance</h2>

          <h3 className="text-xl font-medium mt-6 mb-2">5.1 Fee Management</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/fees</code></p>
          <p>Complete fee tracking system. View all fee records with status badges: <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-medium">PAID</span>, <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-medium">PENDING</span>, <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs font-medium">PARTIAL</span>, <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs font-medium">OVERDUE</span>.</p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-2">How to record a payment:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Find the student's fee record using search or filters</li>
              <li>Click <strong>"Pay"</strong> to open the payment modal</li>
              <li>Enter amount paid and payment method (cash, bank, online, etc.)</li>
              <li>Click <strong>Save</strong> — the fee status updates automatically</li>
            </ol>
          </div>
          <p>Filter fees by status, search by student name, and track who has paid and who hasn't. Overdue fees are highlighted for quick action.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">5.2 Fee Structures</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/fee-structures</code></p>
          <p>Define fee structures per class level, stream, and category. Fee categories include: Pre-Admission, Admission, Monthly, Tuition, Exam, Transport, Library, and more. Each structure specifies the amount for that category.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">5.3 Payroll</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/payroll</code></p>
          <p>Dual-tab interface for managing payroll of both staff and teachers. For each employee, create monthly payroll entries with basic salary, allowances, and deductions. View payroll history and manage payments.</p>
        </section>

        {/* Section: Operations */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">6. Operations</h2>

          <h3 className="text-xl font-medium mt-6 mb-2">6.1 Transport</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/transport</code></p>
          <p>Manage school buses and routes. Add buses with number plate, name, capacity, and driver details. For each bus, define routes with stops, pickup times, and drop-off times.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">6.2 Inventory</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/inventory</code></p>
          <p>Track school inventory items across categories: Furniture, Electronics, Stationery, Sports, and Other. Each item has quantity, unit, location, condition status (Good/Fair/Poor/Damaged/New), and unit price.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">6.3 Library</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/library</code></p>
          <p>Complete library management system.</p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-sm mb-2">Features:</h4>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li><strong>Book Catalog</strong> — Add books with title, author, ISBN, publisher, category, total copies, and shelf location</li>
              <li><strong>Search</strong> — Find books by title, author, or category</li>
              <li><strong>Issue Books</strong> — Issue books to students with due date tracking</li>
              <li><strong>Return & Track</strong> — Mark returns, track overdue items, flag lost books</li>
              <li><strong>Status</strong> — Each issue shows: <span className="text-green-600 font-medium">Returned</span>, <span className="text-orange-600 font-medium">Overdue</span>, or <span className="text-red-600 font-medium">Lost</span></li>
            </ul>
          </div>

          <h3 className="text-xl font-medium mt-6 mb-2">6.4 Canteen</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/canteen</code></p>
          <p>Manage canteen menu items categorized as Meal, Snack, Beverage, Dessert, or Combo. Each item has a price, day-of-week assignment, and availability toggle.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">6.5 Leaves</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/leaves</code></p>
          <p>Manage staff and teacher leave applications. Leave types include Sick, Casual, Emergency, Maternity, and Other. Track applications through statuses: Pending, Approved, Rejected. Uses Nepali date input for BS dates.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">6.6 ECA Activities</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/eca</code></p>
          <p>Manage extracurricular activities (Sports, Music, Dance, Art, Debate, etc.). Each activity has a name, category, description, assigned incharge, and schedule.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">6.7 Infirmary</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/infirmary</code></p>
          <p>Log and track health center visits. Record patient (student or visitor), symptoms, treatment given, temperature, and medication administered.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">6.8 Documents</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/documents</code></p>
          <p>Upload and organize school documents by category: General, Policy, Form, Circular, Report. Each document has a title, file URL, description, and category tag.</p>
        </section>

        {/* Section: Communication */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">7. Communication</h2>

          <h3 className="text-xl font-medium mt-6 mb-2">7.1 Notices</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/notices</code></p>
          <p>Create school-wide notices that appear in teacher, staff, student, and parent portals. Each notice has a title, content, target audience (which roles can see it), and an urgency flag (Info or Urgent).</p>
          <div className="bg-muted p-4 rounded-lg mt-3">
            <h4 className="font-semibold text-sm mb-2">How to post a notice:</h4>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Click <strong>"Add Notice"</strong></li>
              <li>Enter a clear title (e.g., "School Closed on Friday")</li>
              <li>Write the full notice content</li>
              <li>Select target role(s) — who should see this</li>
              <li>Mark as <strong>Urgent</strong> if it's time-sensitive (shows with a red indicator)</li>
              <li>Click <strong>Save</strong> — notice appears immediately in target portals</li>
            </ol>
          </div>

          <h3 className="text-xl font-medium mt-6 mb-2">7.2 Notifications</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/notifications</code></p>
          <p>Send in-app push notifications to specific roles. Choose type (info, success, warning) and target the notification to teachers, staff, students, or parents.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">7.3 Chat / Messages</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/chat</code></p>
          <p>Internal real-time messaging system. Chat with any user in the school — teachers, staff, or other admins. Start new conversations, view message history, and send messages with read tracking.</p>
        </section>

        {/* Section: Evaluation */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">8. Evaluation</h2>

          <h3 className="text-xl font-medium mt-6 mb-2">8.1 Teacher Evaluation</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/teacher-evaluation</code></p>
          <p>Evaluate teachers on multiple criteria using 1-5 star ratings: Teaching Quality, Punctuality, Student Feedback, and Collaboration. Each evaluation is period-based (e.g., "First Term 2081").</p>

          <h3 className="text-xl font-medium mt-6 mb-2">8.2 Surveys</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/surveys</code></p>
          <p>Create and manage surveys with dynamic questions. Question types include: text, rating (1-5), yes/no, and multiple choice. Target surveys to specific roles (teachers, staff, students, parents).</p>
        </section>

        {/* Section: Administration */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">9. Administration</h2>

          <h3 className="text-xl font-medium mt-6 mb-2">9.1 Reports</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/reports</code></p>
          <p>Reports dashboard with access to: Attendance Summary, Fee Collection Report, Student Progress Report, Teacher Performance, Class-wise Results, and Admission Register.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">9.2 School Settings</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/settings</code></p>
          <p>Tabbed settings page with four sections:</p>
          <ul className="list-disc ml-6 space-y-1 mb-4">
            <li><strong>General</strong> — School name, address, phone, email, website, logo</li>
            <li><strong>Academic</strong> — Grading system, passing marks, academic year configuration</li>
            <li><strong>Fees</strong> — Default fee settings, due dates, late fee rules</li>
            <li><strong>Notifications</strong> — Configure which notifications are sent and to whom</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-2">9.3 Support Tickets</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/support</code></p>
          <p>Create and manage support tickets. Track priority (Low/Normal/High/Urgent) and status (Open, In Progress, Resolved, Closed). Report technical issues or request assistance from the platform support team.</p>

          <h3 className="text-xl font-medium mt-6 mb-2">9.4 Calendar</h3>
          <p className="mb-2"><strong>Location:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">/admin/calendar</code></p>
          <p>Full Bikram Sambat (Nepali) calendar. Navigate through BS months and years (2078-2090). Displays both Nepali and English day names and dates. Useful for planning events and understanding BS dates used throughout the system.</p>
        </section>

        {/* Section: Quick Reference */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">10. Quick Reference Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-2 font-semibold">Task</th>
                  <th className="text-left p-2 font-semibold">Navigation</th>
                  <th className="text-left p-2 font-semibold">Key Steps</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="p-2">Add a new student</td><td className="p-2 font-mono text-xs">/admin/students</td><td className="p-2">Add Student → fill form → Save → copy credentials</td></tr>
                <tr className="border-b"><td className="p-2">Add a new teacher</td><td className="p-2 font-mono text-xs">/admin/teachers</td><td className="p-2">Add Teacher → fill details → Save → copy credentials</td></tr>
                <tr className="border-b"><td className="p-2">Create a class</td><td className="p-2 font-mono text-xs">/admin/classes</td><td className="p-2">Add Grade → Add Section → assign subjects</td></tr>
                <tr className="border-b"><td className="p-2">Set up fee structure</td><td className="p-2 font-mono text-xs">/admin/fee-structures</td><td className="p-2">Add Fee Structure → select level, category → set amount</td></tr>
                <tr className="border-b"><td className="p-2">Record fee payment</td><td className="p-2 font-mono text-xs">/admin/fees</td><td className="p-2">Find student → Pay → enter amount → Save</td></tr>
                <tr className="border-b"><td className="p-2">Mark attendance</td><td className="p-2 font-mono text-xs">/admin/attendance</td><td className="p-2">Select section → date → mark students → Save</td></tr>
                <tr className="border-b"><td className="p-2">Schedule an exam</td><td className="p-2 font-mono text-xs">/admin/exams</td><td className="p-2">Add Exam → name, type, dates → add subjects</td></tr>
                <tr className="border-b"><td className="p-2">Issue a library book</td><td className="p-2 font-mono text-xs">/admin/library</td><td className="p-2">Issue → select student → select book → set due date</td></tr>
                <tr className="border-b"><td className="p-2">Post a notice</td><td className="p-2 font-mono text-xs">/admin/notices</td><td className="p-2">Add Notice → title, content, target → Save</td></tr>
                <tr className="border-b"><td className="p-2">Process payroll</td><td className="p-2 font-mono text-xs">/admin/payroll</td><td className="p-2">Select staff/teacher tab → Add → salary, allowances → Save</td></tr>
                <tr className="border-b"><td className="p-2">Promote students</td><td className="p-2 font-mono text-xs">/admin/academic</td><td className="p-2">Academic Year tab → Promotion → Preview → Promote</td></tr>
                <tr className="border-b"><td className="p-2">Approve an admission</td><td className="p-2 font-mono text-xs">/admin/admissions</td><td className="p-2">Review → Approve → Enroll → student is active</td></tr>
                <tr className="border-b"><td className="p-2">Add bus & route</td><td className="p-2 font-mono text-xs">/admin/transport</td><td className="p-2">Add Bus → details → Add Route → stops & times</td></tr>
                <tr className="border-b"><td className="p-2">Reset user password</td><td className="p-2 font-mono text-xs">/admin/user-management</td><td className="p-2">Find user → Edit → set new password</td></tr>
                <tr className="border-b"><td className="p-2">Update school settings</td><td className="p-2 font-mono text-xs">/admin/settings</td><td className="p-2">Edit General/Academic/Fees/Notifications tab → Save</td></tr>
                <tr className="border-b"><td className="p-2">Build timetable</td><td className="p-2 font-mono text-xs">/admin/routine</td><td className="p-2">Add Slot → section, subject, teacher, day, period → Save</td></tr>
                <tr className="border-b"><td className="p-2">Send notification</td><td className="p-2 font-mono text-xs">/admin/notifications</td><td className="p-2">Create → type, message, target role → Send</td></tr>
                <tr className="border-b"><td className="p-2">Create a survey</td><td className="p-2 font-mono text-xs">/admin/surveys</td><td className="p-2">Add Survey → add questions → target role → Save</td></tr>
                <tr className="border-b"><td className="p-2">Evaluate a teacher</td><td className="p-2 font-mono text-xs">/admin/teacher-evaluation</td><td className="p-2">Add Evaluation → select teacher → rate criteria → Save</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Best Practices */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">11. Best Practices & Tips</h2>
          <ul className="space-y-2">
            <li><strong>Keep student data current</strong> — Regularly update contact information, parent details, and addresses. Accurate data ensures SMS and communications reach the right people.</li>
            <li><strong>Use fee structures early</strong> — Set up fee structures at the start of each academic year. This ensures fee records are automatically generated for students.</li>
            <li><strong>Post notices proactively</strong> — Use the notice system for all school communications. Teachers, students, and parents will see notices in their respective portals.</li>
            <li><strong>Mark attendance daily</strong> — Regular attendance tracking helps identify absent students quickly and maintains accurate records for reports.</li>
            <li><strong>Run promotions at year-end</strong> — Use the Academic Promotion feature rather than manually moving students. It's faster and prevents errors.</li>
            <li><strong>Issue library books with due dates</strong> — Always set a return date when issuing books. The system will automatically flag overdue items.</li>
            <li><strong>Generate reports regularly</strong> — Pull attendance and fee reports periodically to stay on top of school operations.</li>
            <li><strong>Secure credentials</strong> — When creating user accounts, copy the auto-generated credentials and share them securely. Users can change their passwords after first login.</li>
          </ul>
        </section>

        {/* Section: Getting Help */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">12. Getting Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mt-0">Technical Issues</h4>
              <p className="text-sm">For system errors, login problems, or feature not working, create a <strong>Support Ticket</strong> from the admin panel at <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">/admin/support</code>.</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mt-0">Feature Requests</h4>
              <p className="text-sm">Contact your platform administrator or submit feedback through the support system.</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mt-0">Training</h4>
              <p className="text-sm">New admin? Start with the onboarding checklist in the <strong>Getting Started</strong> section and work through each module one at a time.</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mt-0">Data Recovery</h4>
              <p className="text-sm">Deleted data cannot be recovered from the UI. Contact system support if you need to restore accidentally deleted records.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
