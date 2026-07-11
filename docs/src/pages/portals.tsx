export function Portals() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Portal Guide</h1>
      <p>Each role has a dedicated portal with role-specific navigation and pages.</p>

      <h2>Super Admin Portal</h2>
      <p><strong>Route:</strong> <code>/super-admin/*</code></p>
      <p><strong>Access:</strong> Platform-wide management across all schools.</p>
      <h4>Pages:</h4>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Page</th><th className="text-left p-2">File</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2">Dashboard</td><td className="p-2 font-mono">Dashboard.tsx</td><td className="p-2">Platform overview, stats, charts (194 lines)</td></tr>
          <tr className="border-b"><td className="p-2">Schools</td><td className="p-2 font-mono">Schools.tsx</td><td className="p-2">CRUD schools, search, filter, delete with cascade (948 lines)</td></tr>
          <tr className="border-b"><td className="p-2">Users</td><td className="p-2 font-mono">Users.tsx</td><td className="p-2">Platform user management</td></tr>
          <tr className="border-b"><td className="p-2">Plans</td><td className="p-2 font-mono">Plans.tsx</td><td className="p-2">Subscription plans & billing (680 lines)</td></tr>
          <tr className="border-b"><td className="p-2">Analytics</td><td className="p-2 font-mono">Analytics.tsx</td><td className="p-2">Platform analytics & metrics</td></tr>
          <tr className="border-b"><td className="p-2">Announcements</td><td className="p-2 font-mono">Announcements.tsx</td><td className="p-2">Platform-wide announcements</td></tr>
          <tr className="border-b"><td className="p-2">Activity</td><td className="p-2 font-mono">Activity.tsx</td><td className="p-2">Audit log viewer</td></tr>
          <tr className="border-b"><td className="p-2">Settings</td><td className="p-2 font-mono">Settings.tsx</td><td className="p-2">Platform settings</td></tr>
        </tbody>
      </table>

      <h2>Admin Portal</h2>
      <p><strong>Route:</strong> <code>/admin/*</code></p>
      <p><strong>Access:</strong> Full school-level management. Largest portal with 43 pages.</p>
      <h4>Pages include:</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          "Dashboard", "Calendar", "Notifications", "Admissions", "Students",
          "StudentDetail", "Teachers", "TeacherDetail", "StaffMgmt", "StaffDetail",
          "Classes", "Sections", "SectionDetail", "Departments", "Subjects",
          "SubjectManagement", "Routine", "Attendance", "Exams", "Assessments",
          "Fees", "FeeStructures", "Payroll", "Library", "Transport",
          "Canteen", "Inventory", "Hostel", "Homework", "Leaves",
          "Notices", "Chat", "Documents", "Reports", "Settings",
          "UserManagement", "Support", "Surveys", "Eca", "Infirmary",
          "TeacherEvaluation", "Messages"
        ].sort().map(p => <div key={p} className="text-sm font-mono bg-muted px-2 py-1 rounded">{p}</div>)}
      </div>

      <h2>Teacher Portal</h2>
      <p><strong>Route:</strong> <code>/teacher/*</code></p>
      <p><strong>Access:</strong> Classes, attendance, assignments, exams, marks.</p>
      <h4>Pages:</h4>
      <div className="flex flex-wrap gap-2">
        {["Dashboard", "Notices", "Classes", "Routine", "Attendance", "Assignments", "Exams", "Marks", "Messages", "Settings"].map(p =>
          <span key={p} className="font-mono bg-muted px-2 py-1 rounded text-sm">{p}</span>
        )}
      </div>

      <h2>Staff Portal</h2>
      <p><strong>Route:</strong> <code>/staff/*</code></p>
      <p><strong>Access:</strong> Administrative tasks — inventory, discipline, payroll.</p>
      <h4>Pages:</h4>
      <div className="flex flex-wrap gap-2">
        {["Dashboard", "Notices", "Members", "Attendance", "Payroll", "Inventory", "ScheduleBuilder", "DisciplineManager"].map(p =>
          <span key={p} className="font-mono bg-muted px-2 py-1 rounded text-sm">{p}</span>
        )}
      </div>

      <h2>Student Portal</h2>
      <p><strong>Route:</strong> <code>/student/*</code></p>
      <p><strong>Access:</strong> Own profile, attendance, timetable, exams, results.</p>
      <h4>Pages:</h4>
      <div className="flex flex-wrap gap-2">
        {["Dashboard", "MyProfile", "Subjects", "Timetable", "Attendance", "Exams", "Results", "Notices", "Settings"].map(p =>
          <span key={p} className="font-mono bg-muted px-2 py-1 rounded text-sm">{p}</span>
        )}
      </div>

      <h2>Parent Portal</h2>
      <p><strong>Route:</strong> <code>/parent/*</code></p>
      <p><strong>Access:</strong> View children's data — attendance, results, fees, notices.</p>
      <h4>Pages:</h4>
      <div className="flex flex-wrap gap-2">
        {["Dashboard", "Routine", "Attendance", "Results", "Fees", "Notices", "Messages", "Settings"].map(p =>
          <span key={p} className="font-mono bg-muted px-2 py-1 rounded text-sm">{p}</span>
        )}
      </div>

      <h2>Navigation System</h2>
      <p>Each portal's navigation is defined in <code>src/portales/&lt;role&gt;/layout/nav.ts</code>. It exports an array of <code>NavSection</code> objects:</p>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`interface NavSection {
  title: string;           // Section header
  items: NavItem[];        // Navigation items
}

interface NavItem {
  label: string;           // Display name
  href: string;            // Route path
  icon: LucideIcon;        // Lucide icon component
  feature?: string;        // Plan feature key (for gating)
  badge?: string;          // Optional badge text
}`}</pre>

      <h2>Plan-Based Feature Gating</h2>
      <p>Navigation items with a <code>feature</code> key are conditionally shown based on the school's subscription plan. If the plan doesn't include the feature, it shows an "Upgrade" badge.</p>

      <h2>Portal Layout</h2>
      <p>The shared <code>PortalLayout</code> component (<code>src/components/common/PortalLayout.tsx</code>) provides:</p>
      <ul>
        <li>Responsive sidebar with navigation</li>
        <li>Top bar with user info and logout</li>
        <li>Sidebar search/filter</li>
        <li>Plan feature gating</li>
        <li>Dark theme support (super admin only)</li>
      </ul>
    </div>
  );
}
