export function TeacherGuide() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Teacher Portal Guide</h1>
      <p className="lead text-xl text-muted-foreground">
        Complete walkthrough of all features available in the Teacher Portal.
        Access it at <code>/teacher</code> after logging in with your teacher account.
      </p>

      <h2>Getting Started</h2>
      <p>
        When you first log in, you'll land on the <strong>Dashboard</strong>. Your school admin
        will have assigned you to classes and provided your login credentials. The dashboard
        gives you a quick overview of your teaching workload.
      </p>

      <hr />

      <h2>1. Dashboard</h2>
      <p><strong>Location:</strong> <code>/teacher</code></p>
      <p>The dashboard shows four key metrics at a glance:</p>
      <div className="grid grid-cols-2 gap-4 my-4">
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="mt-0 text-sm font-semibold text-green-600">My Classes</h4>
          <p className="text-sm">Total number of classes/sections assigned to you this academic year.</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="mt-0 text-sm font-semibold text-blue-600">Total Students</h4>
          <p className="text-sm">Combined student count across all your assigned classes.</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="mt-0 text-sm font-semibold text-orange-600">Pending Assignments</h4>
          <p className="text-sm">Assignments you've posted that haven't been fully graded yet.</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <h4 className="mt-0 text-sm font-semibold text-teal-600">Notices</h4>
          <p className="text-sm">Recent school-wide notices and announcements.</p>
        </div>
      </div>

      <p>The dashboard also shows:</p>
      <ul>
        <li><strong>My Classes</strong> panel — list of classes with student counts</li>
        <li><strong>Recent Notices</strong> panel — latest notices (urgent ones highlighted with a red dot)</li>
        <li><strong>Profile section</strong> at top with your name, avatar, and specialization</li>
      </ul>

      <hr />

      <h2>2. Notices</h2>
      <p><strong>Location:</strong> <code>/teacher/notices</code></p>
      <p>View all school notices and announcements. Notices are posted by the school admin
      and can include:</p>
      <ul>
        <li>General announcements (holidays, events, meetings)</li>
        <li>Urgent notices (marked with a red indicator)</li>
        <li>Department-specific updates</li>
      </ul>
      <p>Notices are sorted with the most recent at the top. Urgent notices are visually
      highlighted so you don't miss important information.</p>

      <hr />

      <h2>3. My Classes</h2>
      <p><strong>Location:</strong> <code>/teacher/classes</code></p>
      <p>This page lists all classes and sections assigned to you. For each class you can see:</p>
      <ul>
        <li>Class name and section (e.g., "Class 10 - A")</li>
        <li>Subject you teach for that class</li>
        <li>Number of students enrolled</li>
        <li>Quick actions to take attendance, view marks, or post assignments</li>
      </ul>

      <h4>How to use:</h4>
      <ol>
        <li>Browse your assigned classes from the list</li>
        <li>Click on a class to see detailed information</li>
        <li>Use the action buttons to jump to attendance, marks, or assignments for that specific class</li>
      </ol>

      <hr />

      <h2>4. My Routine</h2>
      <p><strong>Location:</strong> <code>/teacher/routine</code></p>
      <p>View your weekly teaching timetable. The routine shows:</p>
      <ul>
        <li>Days of the week (Sunday to Friday, as per Nepali school calendar)</li>
        <li>Time slots with subject, class, and section</li>
        <li>Any free periods or breaks</li>
      </ul>

      <h4>How to use:</h4>
      <ol>
        <li>The timetable is displayed as a weekly grid</li>
        <li>Each cell shows the class, section, and subject for that time slot</li>
        <li>Empty cells indicate free periods</li>
        <li>Your routine is set by the school admin — contact them for changes</li>
      </ol>

      <hr />

      <h2>5. Attendance</h2>
      <p><strong>Location:</strong> <code>/teacher/attendance</code></p>
      <p>Mark daily attendance for your classes. This is one of the most frequently used features.</p>

      <h4>Step-by-step:</h4>
      <ol>
        <li><strong>Select a class</strong> — Choose from the dropdown of your assigned sections</li>
        <li><strong>Select date</strong> — Defaults to today. You can select past dates to edit previous attendance</li>
        <li><strong>Student list loads</strong> — All students in that section appear with their current attendance status</li>
        <li><strong>Mark attendance</strong> — Click on a student's status to cycle through:
          <ul>
            <li><span className="text-green-600 font-medium">Present</span> — Student attended</li>
            <li><span className="text-red-600 font-medium">Absent</span> — Student was absent</li>
            <li><span className="text-yellow-600 font-medium">Late</span> — Student arrived late</li>
          </ul>
        </li>
        <li><strong>Bulk actions</strong> — Use "Mark All Present" to quickly set all students as present, then change individual ones as needed</li>
        <li><strong>Save</strong> — Click the save button to submit attendance</li>
      </ol>

      <div className="bg-muted p-4 rounded-lg my-4">
        <p className="text-sm font-medium mb-2">💡 Tips:</p>
        <ul className="text-sm">
          <li>Attendance can be edited for past dates — useful for corrections</li>
          <li>A summary bar shows counts: Present / Absent / Late / Total</li>
          <li>Once saved, a timestamp confirms your data is recorded</li>
        </ul>
      </div>

      <hr />

      <h2>6. Assignments</h2>
      <p><strong>Location:</strong> <code>/teacher/assignments</code></p>
      <p>Create and manage homework assignments for your classes.</p>

      <h4>How to create an assignment:</h4>
      <ol>
        <li>Click <strong>"Create Assignment"</strong></li>
        <li>Fill in:
          <ul>
            <li><strong>Title</strong> — Brief name (e.g., "Chapter 5 Homework")</li>
            <li><strong>Description</strong> — Detailed instructions for students</li>
            <li><strong>Class/Section</strong> — Which class this is for</li>
            <li><strong>Subject</strong> — Auto-filled based on your assignment</li>
            <li><strong>Due Date</strong> — Submission deadline</li>
            <li><strong>Attachment</strong> (optional) — Upload any reference files</li>
          </ul>
        </li>
        <li>Click <strong>Post</strong> — Students will see it in their portal</li>
      </ol>

      <h4>Managing assignments:</h4>
      <ul>
        <li><strong>View submissions</strong> — See which students have submitted and which haven't</li>
        <li><strong>Grade</strong> — Add marks and feedback to each submission</li>
        <li><strong>Edit</strong> — Update assignment details if needed</li>
        <li><strong>Delete</strong> — Remove the assignment (only if no submissions yet)</li>
      </ul>

      <p>Assignments with pending grading are counted on the dashboard as "Pending Assignments."</p>

      <hr />

      <h2>7. Exam Schedule</h2>
      <p><strong>Location:</strong> <code>/teacher/exams</code></p>
      <p>View upcoming exams and their schedules. This page shows:</p>
      <ul>
        <li>Exam name and type (Term, Mid-Term, Final, etc.)</li>
        <li>Date and time for each exam</li>
        <li>Class and section</li>
        <li>Subjects included</li>
      </ul>

      <h4>How to use:</h4>
      <ol>
        <li>Browse the exam list sorted by date (soonest first)</li>
        <li>Click on an exam for details including subject-wise schedule</li>
        <li>Use the calendar view to see exams by month</li>
      </ol>

      <hr />

      <h2>8. Marks Entry</h2>
      <p><strong>Location:</strong> <code>/teacher/marks</code></p>
      <p>Enter and manage student marks for exams and assessments.</p>

      <h4>Step-by-step:</h4>
      <ol>
        <li><strong>Select an exam</strong> — Choose from the list of exams</li>
        <li><strong>Select class/section</strong> — Choose your class</li>
        <li><strong>Select subject</strong> — Choose the subject you teach</li>
        <li><strong>Student list loads</strong> — All students with fields for marks</li>
        <li><strong>Enter marks</strong> — Type marks for each student</li>
        <li><strong>Auto-calculations</strong> — Percentage and grade are computed automatically</li>
        <li><strong>Save</strong> — Submit all marks at once</li>
      </ol>

      <div className="bg-muted p-4 rounded-lg my-4">
        <p className="text-sm font-medium mb-2">💡 Tips:</p>
        <ul className="text-sm">
          <li>Marks can be entered as numbers (out of full marks) which auto-calculate percentages</li>
          <li>Grades are assigned based on the school's grade scheme</li>
          <li>You can save partially and come back later</li>
          <li>Students and parents can see results once published</li>
        </ul>
      </div>

      <hr />

      <h2>9. Messages</h2>
      <p><strong>Location:</strong> <code>/teacher/messages</code></p>
      <p>Communicate with other teachers, school admin, and staff through the internal messaging system.</p>

      <h4>Features:</h4>
      <ul>
        <li><strong>Inbox</strong> — Messages received from others</li>
        <li><strong>Sent</strong> — Messages you've sent</li>
        <li><strong>Compose</strong> — Send a new message to any user in the school</li>
        <li><strong>Notifications</strong> — Badge count on the Messages nav item shows unread messages</li>
      </ul>

      <h4>How to send a message:</h4>
      <ol>
        <li>Click <strong>"Compose"</strong></li>
        <li>Select recipient(s) from the school directory (teachers, admin, staff)</li>
        <li>Type your subject and message</li>
        <li>Click <strong>Send</strong></li>
      </ol>

      <hr />

      <h2>10. Settings</h2>
      <p><strong>Location:</strong> <code>/teacher/settings</code></p>
      <p>Manage your profile and account preferences:</p>
      <ul>
        <li><strong>Profile</strong> — Update your name, phone number, and specialization</li>
        <li><strong>Password</strong> — Change your login password</li>
        <li><strong>Avatar</strong> — Upload or change your profile photo via Cloudinary</li>
        <li><strong>Notifications</strong> — Configure which notifications you receive</li>
      </ul>

      <hr />

      <h2>Quick Reference: Common Tasks</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Task</th>
            <th className="text-left p-2">Navigation</th>
            <th className="text-left p-2">Steps</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2 font-medium">Mark today's attendance</td>
            <td className="p-2 font-mono">/teacher/attendance</td>
            <td className="p-2">Select class → date defaults to today → mark students → save</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">Post homework</td>
            <td className="p-2 font-mono">/teacher/assignments</td>
            <td className="p-2">Create Assignment → fill details → set due date → Post</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">Enter exam marks</td>
            <td className="p-2 font-mono">/teacher/marks</td>
            <td className="p-2">Select exam → select class → enter marks → save</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">View your timetable</td>
            <td className="p-2 font-mono">/teacher/routine</td>
            <td className="p-2">Weekly grid showing your scheduled classes</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">Check school notices</td>
            <td className="p-2 font-mono">/teacher/notices</td>
            <td className="p-2">Scroll through the notice list</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">Message another teacher</td>
            <td className="p-2 font-mono">/teacher/messages</td>
            <td className="p-2">Compose → select recipient → send</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">Grade submissions</td>
            <td className="p-2 font-mono">/teacher/assignments</td>
            <td className="p-2">Click assignment → view submissions → add marks → save</td>
          </tr>
          <tr className="border-b">
            <td className="p-2 font-medium">Change password</td>
            <td className="p-2 font-mono">/teacher/settings</td>
            <td className="p-2">Password tab → old password → new password → save</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2>Need Help?</h2>
      <ul>
        <li><strong>For class assignments or timetable changes</strong> — Contact your school admin</li>
        <li><strong>For technical issues (can't log in, page errors)</strong> — Contact the school admin or IT support</li>
        <li><strong>For student data issues</strong> — Contact the admin who manages student records</li>
      </ul>

      <div className="bg-muted p-4 rounded-lg mt-6">
        <p className="text-sm font-medium mb-1">📋 Teacher Portal Summary</p>
        <p className="text-sm text-muted-foreground">
          The teacher portal gives you everything you need to manage your teaching workflow:
          attendance tracking, assignment posting and grading, exam mark entry, timetable viewing,
          school notices, and internal messaging. All in one place.
        </p>
      </div>
    </div>
  );
}
