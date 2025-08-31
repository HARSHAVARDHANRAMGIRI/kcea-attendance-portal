import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create departments
  const cse = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      name: 'Computer Science & Engineering',
      code: 'CSE'
    }
  });

  const ece = await prisma.department.upsert({
    where: { code: 'ECE' },
    update: {},
    create: {
      name: 'Electronics & Communication Engineering',
      code: 'ECE'
    }
  });

  const mech = await prisma.department.upsert({
    where: { code: 'MECH' },
    update: {},
    create: {
      name: 'Mechanical Engineering',
      code: 'MECH'
    }
  });

  const civil = await prisma.department.upsert({
    where: { code: 'CIVIL' },
    update: {},
    create: {
      name: 'Civil Engineering',
      code: 'CIVIL'
    }
  });

  const eee = await prisma.department.upsert({
    where: { code: 'EEE' },
    update: {},
    create: {
      name: 'Electrical & Electronics Engineering',
      code: 'EEE'
    }
  });

  console.log('✅ Departments created');

  // Create programs
  const btechCSE = await prisma.program.upsert({
    where: { code: 'BTECH-CSE' },
    update: {},
    create: {
      name: 'Bachelor of Technology - Computer Science',
      code: 'BTECH-CSE',
      duration: 4,
      departmentId: cse.id
    }
  });

  const btechECE = await prisma.program.upsert({
    where: { code: 'BTECH-ECE' },
    update: {},
    create: {
      name: 'Bachelor of Technology - Electronics & Communication',
      code: 'BTECH-ECE',
      duration: 4,
      departmentId: ece.id
    }
  });

  console.log('✅ Programs created');

  // Create courses
  const courses = [
    {
      code: 'CS101',
      title: 'Programming Fundamentals',
      credits: 4,
      semester: 1,
      programId: btechCSE.id
    },
    {
      code: 'CS201',
      title: 'Data Structures & Algorithms',
      credits: 4,
      semester: 3,
      programId: btechCSE.id
    },
    {
      code: 'CS301',
      title: 'Database Management Systems',
      credits: 3,
      semester: 5,
      programId: btechCSE.id
    },
    {
      code: 'EC101',
      title: 'Basic Electronics',
      credits: 4,
      semester: 1,
      programId: btechECE.id
    },
    {
      code: 'EC201',
      title: 'Digital Electronics',
      credits: 4,
      semester: 3,
      programId: btechECE.id
    }
  ];

  for (const courseData of courses) {
    await prisma.course.upsert({
      where: { code: courseData.code },
      update: {},
      create: courseData
    });
  }

  console.log('✅ Courses created');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      name: 'KCEA Admin',
      phone: '+919876543210',
      email: 'admin@kcea.edu',
      role: Role.admin
    }
  });

  // Create faculty users
  const faculty1 = await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      name: 'Dr. Rajesh Kumar',
      phone: '+919876543211',
      email: 'rajesh.kumar@kcea.edu',
      role: Role.faculty,
      departmentId: cse.id
    }
  });

  const faculty2 = await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {},
    create: {
      name: 'Prof. Priya Sharma',
      phone: '+919876543212',
      email: 'priya.sharma@kcea.edu',
      role: Role.faculty,
      departmentId: ece.id
    }
  });

  // Create sample students
  const students = [
    {
      name: 'Arjun Reddy',
      phone: '+919876543213',
      email: 'arjun.reddy@student.kcea.edu',
      rollNumber: '20CS001',
      departmentId: cse.id
    },
    {
      name: 'Sneha Patel',
      phone: '+919876543214',
      email: 'sneha.patel@student.kcea.edu',
      rollNumber: '20CS002',
      departmentId: cse.id
    },
    {
      name: 'Vikram Singh',
      phone: '+919876543215',
      email: 'vikram.singh@student.kcea.edu',
      rollNumber: '20EC001',
      departmentId: ece.id
    }
  ];

  for (const studentData of students) {
    await prisma.user.upsert({
      where: { phone: studentData.phone },
      update: {},
      create: {
        ...studentData,
        role: Role.student
      }
    });
  }

  console.log('✅ Users created');

  // Create sections
  const cs101Section = await prisma.section.create({
    data: {
      name: 'A',
      courseId: (await prisma.course.findUnique({ where: { code: 'CS101' } }))!.id,
      facultyId: faculty1.id,
      academicYear: '2024-25',
      semester: 1,
      schedule: {
        days: ['monday', 'wednesday', 'friday'],
        startTime: '09:00',
        endTime: '10:00',
        room: 'CS-101'
      },
      settings: {
        geofenceEnabled: true,
        qrCodeEnabled: true,
        attendanceWindow: 15 // minutes
      }
    }
  });

  const ec101Section = await prisma.section.create({
    data: {
      name: 'A',
      courseId: (await prisma.course.findUnique({ where: { code: 'EC101' } }))!.id,
      facultyId: faculty2.id,
      academicYear: '2024-25',
      semester: 1,
      schedule: {
        days: ['tuesday', 'thursday'],
        startTime: '10:00',
        endTime: '11:30',
        room: 'EC-201'
      },
      settings: {
        geofenceEnabled: true,
        qrCodeEnabled: true,
        attendanceWindow: 10
      }
    }
  });

  console.log('✅ Sections created');

  // Create enrollments
  const cseStudents = await prisma.user.findMany({
    where: { 
      role: Role.student,
      departmentId: cse.id
    }
  });

  const eceStudents = await prisma.user.findMany({
    where: { 
      role: Role.student,
      departmentId: ece.id
    }
  });

  // Enroll CSE students in CS101
  for (const student of cseStudents) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: cs101Section.id
      }
    });
  }

  // Enroll ECE students in EC101
  for (const student of eceStudents) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: ec101Section.id
      }
    });
  }

  console.log('✅ Enrollments created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📱 Test Accounts:');
  console.log('Admin: +919876543210');
  console.log('Faculty 1: +919876543211 (Dr. Rajesh Kumar - CSE)');
  console.log('Faculty 2: +919876543212 (Prof. Priya Sharma - ECE)');
  console.log('Student 1: +919876543213 (Arjun Reddy - CSE)');
  console.log('Student 2: +919876543214 (Sneha Patel - CSE)');
  console.log('Student 3: +919876543215 (Vikram Singh - ECE)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
