import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  // Super admin
  const existing = await prisma.superAdmin.findUnique({ where: { email: process.env.SUPER_ADMIN_EMAIL ?? "admin@dn-sms.com" } });
  if (!existing) {
    const password = await Bun.password.hash(process.env.SUPER_ADMIN_PASSWORD ?? "changeme");
    await prisma.superAdmin.create({
      data: {
        email: process.env.SUPER_ADMIN_EMAIL ?? "admin@dn-sms.com",
        password,
        name: process.env.SUPER_ADMIN_NAME ?? "DN-SMS Admin",
      },
    });
    console.log("Created super admin:", process.env.SUPER_ADMIN_EMAIL ?? "admin@dn-sms.com");
  } else {
    console.log("Super admin already exists, skipping.");
  }

  // Plans
  const plans = [
    { name: "Free", slug: "free", price: 0, maxStudents: 50, maxTeachers: 5, maxStorageMB: 500, features: ["Basic attendance", "Fee collection", "Notices"] },
    { name: "Basic", slug: "basic", price: 1999, annualPrice: 19990, maxStudents: 200, maxTeachers: 20, maxStorageMB: 2048, features: ["Everything in Free", "Exam management", "Reports", "SMS notifications"] },
    { name: "Pro", slug: "pro", price: 4999, annualPrice: 49990, maxStudents: 1000, maxTeachers: 100, maxStorageMB: 10240, features: ["Everything in Basic", "Payroll", "Inventory", "Analytics", "Custom branding"] },
    { name: "Enterprise", slug: "enterprise", price: 9999, annualPrice: 99990, maxStudents: -1, maxTeachers: -1, maxStorageMB: -1, features: ["Everything in Pro", "Unlimited students", "Dedicated support", "API access", "Custom domain"] },
  ];

  for (const p of plans) {
    const exists = await prisma.plan.findUnique({ where: { slug: p.slug } });
    if (!exists) {
      await prisma.plan.create({ data: p });
      console.log("Created plan:", p.name);
    }
  }

  // Sample schools
  const proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });
  const basicPlan = await prisma.plan.findUnique({ where: { slug: "basic" } });
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });

  const sampleSchools = [
    { name: "Bagmati Secondary School", slug: "bagmati-secondary", district: "Kathmandu", province: "Bagmati", city: "Kathmandu", address: "Baneshwor, Kathmandu", phone: "01-4567890", email: "info@bagmati.edu.np", principalName: "Ram Prasad Sharma", schoolType: "SECONDARY" as const, status: "ACTIVE" as const, planSlug: "pro" },
    { name: "Gandaki Model College", slug: "gandaki-model", district: "Kaski", province: "Gandaki", city: "Pokhara", address: "Lakeside, Pokhara", phone: "061-123456", email: "info@gandaki.edu.np", principalName: "Sita Devi Thapa", schoolType: "COLLEGE" as const, status: "ACTIVE" as const, planSlug: "basic" },
    { name: "Lumbini Primary School", slug: "lumbini-primary", district: "Rupandehi", province: "Lumbini", city: "Bhairahawa", address: "Siddharthanagar", phone: "071-456789", email: "info@lumbini.edu.np", principalName: "Hari Bahadur KC", schoolType: "PRIMARY" as const, status: "TRIAL" as const, planSlug: "free" },
    { name: "Koshi Higher Secondary", slug: "koshi-higher", district: "Morang", province: "Koshi", city: "Biratnagar", address: "Traffic Chowk, Biratnagar", phone: "021-345678", email: "info@koshi.edu.np", principalName: "Sunita Rai", schoolType: "HIGHER_SECONDARY" as const, status: "ACTIVE" as const, planSlug: "pro" },
  ];

  const planMap: Record<string, string> = {
    pro: proPlan?.id ?? "",
    basic: basicPlan?.id ?? "",
    free: freePlan?.id ?? "",
  };

  for (const s of sampleSchools) {
    const exists = await prisma.school.findUnique({ where: { slug: s.slug } });
    if (!exists) {
      const { planSlug, ...schoolData } = s;
      const school = await prisma.school.create({ data: schoolData });
      const planId = planMap[planSlug];
      if (planId) {
        const now = new Date();
        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 1);
        await prisma.subscription.create({
          data: {
            schoolId: school.id,
            planId,
            status: school.status === "TRIAL" ? "TRIALING" : "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: end,
          },
        });
      }
      console.log("Created school:", school.name);
    }
  }

  // ── Seed school portal users for Bagmati Secondary School ─────────────────
  const bagmati = await prisma.school.findUnique({ where: { slug: "bagmati-secondary" } });
  if (bagmati) {
    const adminPass = await Bun.password.hash("admin123");
    const teacherPass = await Bun.password.hash("teacher123");
    const studentPass = await Bun.password.hash("student123");
    const parentPass = await Bun.password.hash("parent123");
    const staffPass = await Bun.password.hash("staff123");

    const usersToCreate = [
      { email: "admin@bagmati.edu.np", password: adminPass, role: "ADMIN" as const, profile: { firstName: "Ramesh", lastName: "Sharma", phone: "9801234567", gender: "MALE" as const } },
      { email: "sita@bagmati.edu.np", password: teacherPass, role: "TEACHER" as const, profile: { firstName: "Sita", lastName: "Thapa", phone: "9802345678", gender: "FEMALE" as const } },
      { email: "hari@bagmati.edu.np", password: teacherPass, role: "TEACHER" as const, profile: { firstName: "Hari", lastName: "KC", phone: "9803456789", gender: "MALE" as const } },
      { email: "staff@bagmati.edu.np", password: staffPass, role: "STAFF" as const, profile: { firstName: "Sunita", lastName: "Rai", phone: "9804567890", gender: "FEMALE" as const } },
      { email: "bibek@bagmati.edu.np", password: studentPass, role: "STUDENT" as const, profile: { firstName: "Bibek", lastName: "KC", phone: "9805678901", gender: "MALE" as const, dateOfBirth: new Date("2008-03-15") } },
      { email: "priya@bagmati.edu.np", password: studentPass, role: "STUDENT" as const, profile: { firstName: "Priya", lastName: "Sharma", phone: "9806789012", gender: "FEMALE" as const, dateOfBirth: new Date("2009-07-22") } },
      { email: "parent@bagmati.edu.np", password: parentPass, role: "PARENT" as const, profile: { firstName: "Kamala", lastName: "Devi", phone: "9807890123", gender: "FEMALE" as const } },
    ];

    const createdUsers: Record<string, any> = {};
    for (const u of usersToCreate) {
      const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: bagmati.id, email: u.email } } });
      if (!existing) {
        const user = await prisma.user.create({
          data: { schoolId: bagmati.id, email: u.email, password: u.password, role: u.role, profile: { create: u.profile } },
        });
        createdUsers[u.email] = user;
        console.log(`Created ${u.role}: ${u.email}`);
      } else {
        createdUsers[u.email] = existing;
      }
    }

    // Academic year
    let ay = await prisma.academicYear.findFirst({ where: { schoolId: bagmati.id, isActive: true } });
    if (!ay) {
      ay = await prisma.academicYear.create({ data: { schoolId: bagmati.id, name: "2081/82 BS", startDate: new Date("2024-04-14"), endDate: new Date("2025-04-13"), isActive: true } });
      console.log("Created academic year:", ay.name);
    }

    // Grades & Sections
    const gradeData = [
      { name: "Grade 9", gradeNumber: 9, sections: ["A", "B"] },
      { name: "Grade 10", gradeNumber: 10, sections: ["A", "B"] },
      { name: "Grade 11", gradeNumber: 11, sections: ["Science"] },
    ];

    const sectionMap: Record<string, string> = {};
    for (const g of gradeData) {
      let grade = await prisma.grade.findFirst({ where: { schoolId: bagmati.id, academicYearId: ay.id, gradeNumber: g.gradeNumber } });
      if (!grade) grade = await prisma.grade.create({ data: { schoolId: bagmati.id, academicYearId: ay.id, name: g.name, gradeNumber: g.gradeNumber } });
      for (const sName of g.sections) {
        let section = await prisma.section.findFirst({ where: { gradeId: grade.id, name: sName } });
        if (!section) section = await prisma.section.create({ data: { gradeId: grade.id, name: sName, capacity: 40 } });
        sectionMap[`${g.gradeNumber}${sName}`] = section.id;
      }
    }

    // Subjects
    const subjectData = [
      { code: "MATH", name: "Mathematics" }, { code: "ENG", name: "English" },
      { code: "NEP", name: "Nepali" }, { code: "SCI", name: "Science" },
      { code: "SOC", name: "Social Studies" }, { code: "CS", name: "Computer Science" },
    ];
    const subjectMap: Record<string, string> = {};
    for (const sub of subjectData) {
      let s = await prisma.subject.findUnique({ where: { schoolId_code: { schoolId: bagmati.id, code: sub.code } } });
      if (!s) s = await prisma.subject.create({ data: { schoolId: bagmati.id, ...sub } });
      subjectMap[sub.code] = s.id;
    }

    // Teachers
    const sitaUser = createdUsers["sita@bagmati.edu.np"];
    const hariUser = createdUsers["hari@bagmati.edu.np"];
    if (sitaUser) {
      const existing = await prisma.teacher.findUnique({ where: { userId: sitaUser.id } });
      if (!existing) {
        const teacher = await prisma.teacher.create({ data: { userId: sitaUser.id, employeeId: "EMP-001", qualification: "M.Sc. Mathematics", specialization: "Mathematics", experience: 8, joinDate: new Date("2016-04-14") } });
        if (subjectMap["MATH"]) await prisma.teacherSubjectAssignment.create({ data: { teacherId: teacher.id, subjectId: subjectMap["MATH"] } });
      }
    }
    if (hariUser) {
      const existing = await prisma.teacher.findUnique({ where: { userId: hariUser.id } });
      if (!existing) {
        const teacher = await prisma.teacher.create({ data: { userId: hariUser.id, employeeId: "EMP-002", qualification: "M.Sc. Physics", specialization: "Science", experience: 5, joinDate: new Date("2019-04-14") } });
        if (subjectMap["SCI"]) await prisma.teacherSubjectAssignment.create({ data: { teacherId: teacher.id, subjectId: subjectMap["SCI"] } });
      }
    }

    // Staff
    const staffUser = createdUsers["staff@bagmati.edu.np"];
    if (staffUser) {
      const existing = await prisma.staff.findUnique({ where: { userId: staffUser.id } });
      if (!existing) await prisma.staff.create({ data: { userId: staffUser.id, schoolId: bagmati.id, employeeId: "ST-001", designation: "Office Assistant", salary: 25000, joinDate: new Date("2020-04-14") } });
    }

    // Students & Enrollments
    const studentUsers = [
      { email: "bibek@bagmati.edu.np", admissionNo: "ADM-001", section: "10A" },
      { email: "priya@bagmati.edu.np", admissionNo: "ADM-002", section: "10A" },
    ];

    for (const su of studentUsers) {
      const user = createdUsers[su.email];
      if (!user) continue;
      let student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        student = await prisma.student.create({ data: { schoolId: bagmati.id, userId: user.id, admissionNo: su.admissionNo } });
      }
      const sid = sectionMap[su.section];
      if (sid) {
        const existingEnroll = await prisma.studentEnrollment.findFirst({ where: { studentId: student.id, academicYearId: ay.id } });
        if (!existingEnroll) {
          await prisma.studentEnrollment.create({ data: { studentId: student.id, sectionId: sid, academicYearId: ay.id, rollNo: su.admissionNo === "ADM-001" ? "1" : "2" } });
        }
      }
    }

    // Parent link
    const parentUser = createdUsers["parent@bagmati.edu.np"];
    if (parentUser) {
      let parent = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
      if (!parent) parent = await prisma.parent.create({ data: { userId: parentUser.id } });
      const bibek = createdUsers["bibek@bagmati.edu.np"];
      if (bibek) {
        const bibekStudent = await prisma.student.findUnique({ where: { userId: bibek.id } });
        if (bibekStudent) {
          const existing = await prisma.parentStudent.findFirst({ where: { parentId: parent.id, studentId: bibekStudent.id } });
          if (!existing) await prisma.parentStudent.create({ data: { parentId: parent.id, studentId: bibekStudent.id, relationship: "MOTHER" } });
        }
      }
    }

    // Fee types & collections
    const feeTypes = [
      { name: "Monthly Tuition", description: "Monthly school fee" },
      { name: "Admission Fee", description: "One-time admission fee" },
    ];
    const feeTypeMap: Record<string, string> = {};
    for (const ft of feeTypes) {
      let existing = await prisma.feeType.findFirst({ where: { schoolId: bagmati.id, name: ft.name } });
      if (!existing) existing = await prisma.feeType.create({ data: { schoolId: bagmati.id, ...ft } });
      feeTypeMap[ft.name] = existing.id;
    }

    // Sample fee collection for bibek
    const bibekUser = createdUsers["bibek@bagmati.edu.np"];
    if (bibekUser && feeTypeMap["Monthly Tuition"]) {
      const bibekStudent = await prisma.student.findUnique({ where: { userId: bibekUser.id } });
      if (bibekStudent) {
        const existingFee = await prisma.feeCollection.findFirst({ where: { studentId: bibekStudent.id } });
        if (!existingFee) {
          await prisma.feeCollection.create({ data: { studentId: bibekStudent.id, feeTypeId: feeTypeMap["Monthly Tuition"], amountDue: 1500, amountPaid: 1500, status: "PAID", dueDate: new Date("2024-05-15"), paidDate: new Date("2024-05-10"), paymentMethod: "Cash", receiptNo: "RCP-00001" } });
          await prisma.feeCollection.create({ data: { studentId: bibekStudent.id, feeTypeId: feeTypeMap["Monthly Tuition"], amountDue: 1500, amountPaid: 0, status: "PENDING", dueDate: new Date("2024-06-15"), receiptNo: "RCP-00002" } });
        }
      }
    }

    // Notices
    const adminUser = createdUsers["admin@bagmati.edu.np"];
    if (adminUser) {
      const existingNotice = await prisma.notice.findFirst({ where: { schoolId: bagmati.id } });
      if (!existingNotice) {
        await prisma.notice.createMany({ data: [
          { schoolId: bagmati.id, title: "Annual Sports Day", content: "Annual sports day will be held on Falgun 15, 2081. All students are required to participate.", isUrgent: false, publishedById: adminUser.id },
          { schoolId: bagmati.id, title: "Parent-Teacher Meeting", content: "Parent-teacher meeting scheduled for Falgun 10, 2081. All parents are requested to attend.", isUrgent: true, publishedById: adminUser.id },
          { schoolId: bagmati.id, title: "Final Exam Schedule", content: "Final examinations will begin from Chaitra 1, 2081. Detailed schedule is attached.", isUrgent: false, publishedById: adminUser.id },
        ] });
      }
    }

    // Sample attendance for bibek
    if (bibekUser) {
      const bibekStudent = await prisma.student.findUnique({ where: { userId: bibekUser.id } });
      const section10A = sectionMap["10A"];
      if (bibekStudent && section10A) {
        for (let i = 1; i <= 10; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const existing = await prisma.studentAttendance.findFirst({ where: { studentId: bibekStudent.id, date: new Date(d.toDateString()) } });
          if (!existing) {
            await prisma.studentAttendance.create({ data: { studentId: bibekStudent.id, sectionId: section10A, date: new Date(d.toDateString()), status: i % 7 === 0 ? "ABSENT" : "PRESENT" } });
          }
        }
      }
    }

    // Audit logs
    await prisma.auditLog.createMany({
      data: [
        { schoolId: bagmati.id, action: "school.created", entityType: "School", entityId: bagmati.id },
        { schoolId: bagmati.id, action: "subscription.activated", entityType: "Subscription", entityId: bagmati.id },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
