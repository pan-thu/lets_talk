// prisma/seed.ts
import {
  PrismaClient,
  Role,
  CourseStatus,
  CourseType,
  PostStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { env } from "~/env";

// Instantiate Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // --- Create Default Admin User ---
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file to create a default admin user.",
    );
  } else {
    console.log("Upserting default admin user...");
    const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

    const adminUser = await prisma.user.upsert({
      where: { email: env.ADMIN_EMAIL },
      update: {}, // Do nothing if admin already exists
      create: {
        email: env.ADMIN_EMAIL,
        name: "Admin",
        password: hashedPassword,
        role: Role.ADMIN,
        emailVerified: new Date(), // Admin-created accounts can be pre-verified
      },
    });
    console.log("Default admin user created/verified:", adminUser.email);
  }

  // --- Create Teachers ---
  console.log("Upserting teachers...");
  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher.jane@example.com" },
    update: {},
    create: {
      email: "teacher.jane@example.com",
      name: "Jane Doe (Teacher)",
      role: Role.TEACHER,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher.john@example.com" },
    update: {},
    create: {
      email: "teacher.john@example.com",
      name: "John Smith (Teacher)",
      role: Role.TEACHER,
      image: "https://via.placeholder.com/150/771796",
    },
  });
  console.log("Teachers upserted:", teacher1.email, teacher2.email);

  // --- Create Courses ---
  console.log("Creating courses...");

  // Create courses first
  const webDevCourse = await prisma.course.create({
    data: {
      title: "Introduction to Web Development",
      description: "Learn the fundamentals of HTML, CSS, and JavaScript.",
      price: 49.99,
      status: CourseStatus.PUBLISHED,
      type: CourseType.VIDEO,
      coverImageUrl:
        "https://via.placeholder.com/600x400/DDDDDD/808080?text=Web+Dev",
      teacher: { connect: { id: teacher1.id } },
    },
  });

  const reactCourse = await prisma.course.create({
    data: {
      title: "Advanced React Patterns",
      description:
        "Deep dive into hooks, context, and performance optimization.",
      price: 99.0,
      status: CourseStatus.PUBLISHED,
      type: CourseType.LIVE,
      coverImageUrl:
        "https://via.placeholder.com/600x400/A0BBE9/000000?text=React",
      teacher: { connect: { id: teacher2.id } },
    },
  });

  const pythonCourse = await prisma.course.create({
    data: {
      title: "Data Structures in Python",
      description: "Understand lists, dictionaries, trees, and more in Python.",
      price: 0,
      status: CourseStatus.PUBLISHED,
      type: CourseType.VIDEO,
      teacher: { connect: { id: teacher1.id } },
    },
  });

  const cloudCourse = await prisma.course.create({
    data: {
      title: "Draft Course: Cloud Computing Basics",
      description: "An upcoming course on AWS, Azure, and GCP.",
      price: 75.0,
      status: CourseStatus.DRAFT,
      type: CourseType.VIDEO,
      coverImageUrl:
        "https://via.placeholder.com/600x400/CCCCCC/808080?text=Cloud+Draft",
      teacher: { connect: { id: teacher2.id } },
    },
  });

  const designCourse = await prisma.course.create({
    data: {
      title: "Introduction to Graphic Design",
      description: "Learn the basics of visual design principles.",
      price: 30.0,
      status: CourseStatus.PUBLISHED,
      type: CourseType.VIDEO,
      coverImageUrl:
        "https://via.placeholder.com/600x400/E9A0A0/000000?text=Design",
    },
  });

  // Create a Language Learning Course with Audio Exercises
  const languageCourse = await prisma.course.create({
    data: {
      title: "English Pronunciation Mastery",
      description:
        "Improve your English pronunciation with interactive audio exercises and native speaker examples.",
      price: 45.0,
      status: CourseStatus.PUBLISHED,
      type: CourseType.VIDEO,
      coverImageUrl:
        "https://via.placeholder.com/600x400/90EE90/000000?text=English+Pronunciation",
      teacher: { connect: { id: teacher1.id } },
    },
  });

  console.log("Courses created.");

  // --- Create Resources (Lessons) for Courses ---
  console.log("Creating resources...");

  // Create resources for Web Development Course
  const webDevLessons = [
    // Week 1 - HTML Fundamentals
    { title: "Introduction to HTML", week: 1, order: 1 },
    { title: "HTML Document Structure", week: 1, order: 2 },
    { title: "HTML Elements and Tags", week: 1, order: 3 },
    { title: "Forms and Input Elements", week: 1, order: 4 },
    // Week 2 - CSS Styling
    { title: "CSS Basics and Selectors", week: 2, order: 1 },
    { title: "CSS Box Model", week: 2, order: 2 },
    { title: "CSS Flexbox Layout", week: 2, order: 3 },
    { title: "CSS Grid System", week: 2, order: 4 },
    // Week 3 - JavaScript Fundamentals
    { title: "JavaScript Variables and Data Types", week: 3, order: 1 },
    { title: "Functions and Scope", week: 3, order: 2 },
    { title: "DOM Manipulation", week: 3, order: 3 },
    { title: "Event Handling", week: 3, order: 4 },
  ];

  for (const lesson of webDevLessons) {
    // Generate release dates based on week and order
    const today = new Date();
    const releaseDate = new Date(today);
    // Schedule lessons: Week 1 starting today, subsequent weeks 7 days apart
    releaseDate.setDate(
      today.getDate() + (lesson.week - 1) * 7 + (lesson.order - 1),
    );

    await prisma.resource.create({
      data: {
        title: lesson.title,
        type: "VIDEO",
        url: `https://example.com/webdev/${lesson.title.toLowerCase().replace(/\s+/g, "-")}`,
        content: `Web development lesson content for: ${lesson.title}`,
        week: lesson.week,
        order: lesson.order,
        releaseDate: releaseDate,
        courseId: webDevCourse.id,
      },
    });
  }

  // Add audio exercises to Web Development Course
  const webDevExercises = [
    {
      title: "Exercise 1: HTML Pronunciation Practice",
      week: 1,
      order: 5,
      content:
        "Practice pronouncing HTML terms and concepts. Record yourself saying common HTML tags and terminology.",
      audioUrl: "https://example.com/audio/html-pronunciation.mp3",
    },
    {
      title: "Exercise 2: CSS Terminology Practice",
      week: 2,
      order: 5,
      content:
        "Practice CSS-related vocabulary and technical terms. Focus on clear pronunciation of technical concepts.",
      audioUrl: "https://example.com/audio/css-terminology.mp3",
    },
    {
      title: "Exercise 3: JavaScript Concepts Discussion",
      week: 3,
      order: 5,
      content:
        "Explain JavaScript concepts in your own words. Record a 2-minute explanation of functions and variables.",
      audioUrl: "https://example.com/audio/javascript-concepts.mp3",
    },
  ];

  for (const exercise of webDevExercises) {
    await prisma.resource.create({
      data: {
        title: exercise.title,
        type: "AUDIO_EXERCISE",
        url: exercise.audioUrl,
        content: exercise.content,
        week: exercise.week,
        order: exercise.order,
        courseId: webDevCourse.id,
      },
    });
  }

  // Create resources for React Course
  const reactLessons = [
    // Week 1 - React Fundamentals
    { title: "React Components and JSX", week: 1, order: 1 },
    { title: "Props and State Management", week: 1, order: 2 },
    { title: "Event Handling in React", week: 1, order: 3 },
    // Week 2 - Advanced React Hooks
    { title: "useState and useEffect Hooks", week: 2, order: 1 },
    { title: "useContext and useReducer", week: 2, order: 2 },
    { title: "Custom Hooks Development", week: 2, order: 3 },
    // Week 3 - Performance Optimization
    { title: "React.memo and useMemo", week: 3, order: 1 },
    { title: "useCallback and Optimization", week: 3, order: 2 },
    { title: "Code Splitting and Lazy Loading", week: 3, order: 3 },
    // Week 4 - State Management
    { title: "Context API Patterns", week: 4, order: 1 },
    { title: "Redux Integration", week: 4, order: 2 },
    { title: "Testing React Components", week: 4, order: 3 },
  ];

  for (const lesson of reactLessons) {
    // Generate release dates for React course
    const today = new Date();
    const releaseDate = new Date(today);
    // Schedule lessons starting a week after web dev course
    releaseDate.setDate(
      today.getDate() + 30 + (lesson.week - 1) * 7 + (lesson.order - 1),
    );

    await prisma.resource.create({
      data: {
        title: lesson.title,
        type: "VIDEO",
        url: `https://example.com/react/${lesson.title.toLowerCase().replace(/\s+/g, "-")}`,
        content: `React lesson content for: ${lesson.title}`,
        week: lesson.week,
        order: lesson.order,
        releaseDate: releaseDate,
        courseId: reactCourse.id,
      },
    });
  }

  // Add audio exercises to React Course
  const reactExercises = [
    {
      title: "Exercise 1: React Concepts Explanation",
      week: 1,
      order: 4,
      content:
        "Explain React components and JSX in your own words. Record a clear explanation of the concept.",
      audioUrl: "https://example.com/audio/react-components.mp3",
    },
    {
      title: "Exercise 2: Hooks Discussion",
      week: 2,
      order: 4,
      content:
        "Discuss React hooks and their usage. Practice explaining useState and useEffect clearly.",
      audioUrl: "https://example.com/audio/react-hooks.mp3",
    },
    {
      title: "Exercise 3: Performance Optimization Talk",
      week: 3,
      order: 4,
      content:
        "Record yourself explaining React performance optimization techniques and best practices.",
      audioUrl: "https://example.com/audio/react-performance.mp3",
    },
  ];

  for (const exercise of reactExercises) {
    await prisma.resource.create({
      data: {
        title: exercise.title,
        type: "AUDIO_EXERCISE",
        url: exercise.audioUrl,
        content: exercise.content,
        week: exercise.week,
        order: exercise.order,
        courseId: reactCourse.id,
      },
    });
  }

  // Create resources for Python Course
  const pythonLessons = [
    // Week 1 - Basic Data Structures
    { title: "Introduction to Data Structures", week: 1, order: 1 },
    { title: "Lists and Tuples", week: 1, order: 2 },
    { title: "Working with Dictionaries", week: 1, order: 3 },
    { title: "Sets and Their Applications", week: 1, order: 4 },
    // Week 2 - Linear Data Structures
    { title: "Understanding Stacks", week: 2, order: 1 },
    { title: "Queue Implementation", week: 2, order: 2 },
    { title: "Linked Lists Basics", week: 2, order: 3 },
    { title: "Doubly Linked Lists", week: 2, order: 4 },
    // Week 3 - Tree Data Structures
    { title: "Binary Trees Introduction", week: 3, order: 1 },
    { title: "Tree Traversal Algorithms", week: 3, order: 2 },
    { title: "Binary Search Trees", week: 3, order: 3 },
    { title: "Balanced Trees (AVL)", week: 3, order: 4 },
    // Week 4 - Advanced Topics
    { title: "Hash Tables and Hashing", week: 4, order: 1 },
    { title: "Graph Data Structures", week: 4, order: 2 },
    { title: "Algorithm Complexity", week: 4, order: 3 },
  ];

  for (const lesson of pythonLessons) {
    await prisma.resource.create({
      data: {
        title: lesson.title,
        type: "VIDEO",
        url: `https://example.com/python/${lesson.title.toLowerCase().replace(/\s+/g, "-")}`,
        content: `Python lesson content for: ${lesson.title}`,
        week: lesson.week,
        order: lesson.order,
        courseId: pythonCourse.id,
      },
    });
  }

  // Create resources for Design Course
  const designLessons = [
    // Week 1 - Design Fundamentals
    { title: "Introduction to Design Principles", week: 1, order: 1 },
    { title: "Understanding Color Theory", week: 1, order: 2 },
    { title: "Typography Fundamentals", week: 1, order: 3 },
    { title: "Design Psychology", week: 1, order: 4 },
    // Week 2 - Layout and Composition
    { title: "Layout and Composition", week: 2, order: 1 },
    { title: "Working with White Space", week: 2, order: 2 },
    { title: "Grid Systems", week: 2, order: 3 },
    { title: "Visual Hierarchy", week: 2, order: 4 },
    // Week 3 - Brand Design
    { title: "Brand Identity Design", week: 3, order: 1 },
    { title: "Logo Design Basics", week: 3, order: 2 },
    { title: "Color Palettes for Brands", week: 3, order: 3 },
    { title: "Brand Style Guides", week: 3, order: 4 },
    // Week 4 - Digital Design
    { title: "Digital vs Print Design", week: 4, order: 1 },
    { title: "Design Software Overview", week: 4, order: 2 },
    { title: "Web Design Principles", week: 4, order: 3 },
    { title: "Mobile Design Considerations", week: 4, order: 4 },
  ];

  for (const lesson of designLessons) {
    await prisma.resource.create({
      data: {
        title: lesson.title,
        type: "VIDEO",
        url: `https://example.com/design/${lesson.title.toLowerCase().replace(/\s+/g, "-")}`,
        content: `Design lesson content for: ${lesson.title}`,
        week: lesson.week,
        order: lesson.order,
        courseId: designCourse.id,
      },
    });
  }

  // Create resources for Cloud Computing Course (even though it's draft)
  const cloudLessons = [
    // Week 1 - Cloud Fundamentals
    { title: "Introduction to Cloud Computing", week: 1, order: 1 },
    { title: "Cloud Service Models (IaaS, PaaS, SaaS)", week: 1, order: 2 },
    { title: "Public vs Private vs Hybrid Cloud", week: 1, order: 3 },
    // Week 2 - AWS Basics
    { title: "Getting Started with AWS", week: 2, order: 1 },
    { title: "EC2 Instances and Management", week: 2, order: 2 },
    { title: "S3 Storage Solutions", week: 2, order: 3 },
    { title: "VPC and Networking", week: 2, order: 4 },
    // Week 3 - Azure Fundamentals
    { title: "Microsoft Azure Overview", week: 3, order: 1 },
    { title: "Azure Virtual Machines", week: 3, order: 2 },
    { title: "Azure Storage Services", week: 3, order: 3 },
    // Week 4 - Google Cloud Platform
    { title: "GCP Introduction", week: 4, order: 1 },
    { title: "Compute Engine and App Engine", week: 4, order: 2 },
    { title: "Cloud Storage and Databases", week: 4, order: 3 },
    { title: "Multi-Cloud Strategy", week: 4, order: 4 },
  ];

  for (const lesson of cloudLessons) {
    await prisma.resource.create({
      data: {
        title: lesson.title,
        type: "VIDEO",
        url: `https://example.com/cloud/${lesson.title.toLowerCase().replace(/\s+/g, "-")}`,
        content: `Cloud computing lesson content for: ${lesson.title}`,
        week: lesson.week,
        order: lesson.order,
        courseId: cloudCourse.id,
      },
    });
  }

  // Create audio exercises for Language Course
  const languageExercises = [
    // Week 1 - Basic Pronunciation
    {
      title: "Exercise 1: Pronunciation Practice",
      week: 1,
      order: 5,
      content:
        "Listen to the following audio and then record your response. Focus on matching the intonation and pronunciation of the native speaker.",
      audioUrl: "https://example.com/audio/basic-pronunciation-1.mp3",
    },
    {
      title: "Exercise 2: Vowel Sounds Practice",
      week: 1,
      order: 6,
      content:
        "Practice the short and long vowel sounds. Pay attention to the mouth position and tongue placement.",
      audioUrl: "https://example.com/audio/vowel-sounds-1.mp3",
    },
    // Week 2 - Consonant Sounds
    {
      title: "Exercise 3: Consonant Clusters",
      week: 2,
      order: 5,
      content:
        "Practice difficult consonant combinations like 'th', 'ch', and 'sh'. Record yourself repeating the examples.",
      audioUrl: "https://example.com/audio/consonant-clusters-1.mp3",
    },
    {
      title: "Exercise 4: Word Stress Patterns",
      week: 2,
      order: 6,
      content:
        "Learn proper stress patterns in multi-syllable words. Listen and mimic the stress placement.",
      audioUrl: "https://example.com/audio/word-stress-1.mp3",
    },
    // Week 3 - Sentence Rhythm
    {
      title: "Exercise 5: Sentence Rhythm and Flow",
      week: 3,
      order: 5,
      content:
        "Practice natural sentence rhythm and intonation patterns in connected speech.",
      audioUrl: "https://example.com/audio/sentence-rhythm-1.mp3",
    },
    {
      title: "Exercise 6: Question Intonation",
      week: 3,
      order: 6,
      content:
        "Master the rising and falling intonation patterns for different types of questions.",
      audioUrl: "https://example.com/audio/question-intonation-1.mp3",
    },
  ];

  for (const exercise of languageExercises) {
    await prisma.resource.create({
      data: {
        title: exercise.title,
        type: "AUDIO_EXERCISE",
        url: exercise.audioUrl,
        content: exercise.content,
        week: exercise.week,
        order: exercise.order,
        courseId: languageCourse.id,
      },
    });
  }

  console.log("Resources created for all courses.");

  // --- Create Students ---
  console.log("Creating students...");

  const student1 = await prisma.user.upsert({
    where: { email: "student.alice@example.com" },
    update: {},
    create: {
      email: "student.alice@example.com",
      name: "Alice Johnson",
      role: Role.STUDENT,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student.bob@example.com" },
    update: {},
    create: {
      email: "student.bob@example.com",
      name: "Bob Williams",
      role: Role.STUDENT,
      image: "https://via.placeholder.com/150/0000FF",
    },
  });

  console.log("Students created:", student1.email, student2.email);

  // --- Create Enrollments ---
  console.log("Creating enrollments...");

  const enrollment1 = await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: designCourse.id,
      paid: true,
      status: "ACTIVE",
      progress: 30.0,
      grade: 85.5,
      lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: pythonCourse.id,
      paid: true,
      status: "ACTIVE",
      progress: 60.0,
      grade: 92.0,
      lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  const enrollment3 = await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: pythonCourse.id,
      paid: true,
      status: "ACTIVE",
      progress: 12.5,
      lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  const enrollment4 = await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: webDevCourse.id,
      paid: true,
      status: "ACTIVE",
      progress: 75.0,
      grade: 90.0,
      lastAccessedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
  });

  const enrollment5 = await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: reactCourse.id,
      paid: true,
      status: "ACTIVE",
      progress: 50.0,
      grade: 88.0,
      lastAccessedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
  });

  // Add enrollment for language course
  const enrollment6 = await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: languageCourse.id,
      paid: true,
      status: "ACTIVE",
      progress: 25.0,
    },
  });

  // Add enrollment for student2 to language course
  const enrollment7 = await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: languageCourse.id,
      paid: true,
      status: "ACTIVE",
      progress: 15.0,
    },
  });

  console.log(
    "Enrollments created:",
    enrollment1.id,
    enrollment2.id,
    enrollment3.id,
    enrollment4.id,
    enrollment5.id,
    enrollment6.id,
    enrollment7.id,
  );

  // --- Create Some Lesson Completions ---
  console.log("Creating lesson completions...");

  // Get resources for different courses
  const designResources = await prisma.resource.findMany({
    where: { courseId: designCourse.id },
    take: 5, // First 5 lessons (about 30% of 16)
    orderBy: [{ week: "asc" }, { order: "asc" }],
  });

  const pythonResources = await prisma.resource.findMany({
    where: { courseId: pythonCourse.id },
    take: 9, // First 9 lessons (about 60% of 15)
    orderBy: [{ week: "asc" }, { order: "asc" }],
  });

  const webDevResources = await prisma.resource.findMany({
    where: { courseId: webDevCourse.id },
    take: 9, // First 9 lessons (75% of 12)
    orderBy: [{ week: "asc" }, { order: "asc" }],
  });

  const reactResources = await prisma.resource.findMany({
    where: { courseId: reactCourse.id },
    take: 6, // First 6 lessons (50% of 12)
    orderBy: [{ week: "asc" }, { order: "asc" }],
  });

  // Mark lessons as completed for student1 in design course (30% progress)
  for (const resource of designResources) {
    await prisma.userLessonCompletion.create({
      data: {
        userId: student1.id,
        lessonId: resource.id,
        enrollmentId: enrollment1.id,
      },
    });
  }

  // Mark lessons as completed for student2 in python course (60% progress)
  for (const resource of pythonResources) {
    await prisma.userLessonCompletion.create({
      data: {
        userId: student2.id,
        lessonId: resource.id,
        enrollmentId: enrollment2.id,
      },
    });
  }

  // Mark 2 lessons as completed for student1 in python course (12.5% progress)
  if (pythonResources.length > 0) {
    await prisma.userLessonCompletion.create({
      data: {
        userId: student1.id,
        lessonId: pythonResources[0]!.id,
        enrollmentId: enrollment3.id,
      },
    });

    // Add one more to get closer to 12.5%
    if (pythonResources.length > 1) {
      await prisma.userLessonCompletion.create({
        data: {
          userId: student1.id,
          lessonId: pythonResources[1]!.id,
          enrollmentId: enrollment3.id,
        },
      });
    }
  }

  // Mark lessons as completed for student2 in web dev course (75% progress)
  for (const resource of webDevResources) {
    await prisma.userLessonCompletion.create({
      data: {
        userId: student2.id,
        lessonId: resource.id,
        enrollmentId: enrollment4.id,
      },
    });
  }

  // Mark lessons as completed for student1 in react course (50% progress)
  for (const resource of reactResources) {
    await prisma.userLessonCompletion.create({
      data: {
        userId: student1.id,
        lessonId: resource.id,
        enrollmentId: enrollment5.id,
      },
    });
  }

  console.log("Lesson completions created.");

  // --- Create Announcements ---
  console.log("Creating announcements...");

  const announcement1 = await prisma.announcement.create({
    data: {
      title: "Platform Update 1.2.1 - Talk First, Grammar Later",
      content: JSON.stringify([
        {
          sectionTitle: "New Feature Release",
          sectionContent: [
            "Conversation Mode 2.0 launched with improved speech recognition",
            "Practice dialogues with native speakers in our new virtual environment",
          ],
        },
        {
          sectionTitle: "Weekly Lessons Update",
          sectionContent: [
            "How to Politely Complain in a Café",
            "Small Talk That Doesn't Feel Awkward",
          ],
        },
        {
          sectionTitle: "Progress Tracking",
          sectionContent:
            "We've added a new progress bar feature to help you visualize your learning journey.",
        },
        {
          sectionTitle: "Bug Fixes & Improvements",
          sectionContent: [
            "Fixed lesson completion notification bug",
            "UI improvements for mobile devices",
            "Performance optimizations for video playback",
          ],
        },
      ]),
      isGlobal: true,
      author: { connect: { id: teacher1.id } },
    },
  });

  const announcement2 = await prisma.announcement.create({
    data: {
      title: "Scheduled Maintenance Notice",
      content: JSON.stringify([
        {
          sectionTitle: "Maintenance Schedule",
          sectionContent:
            "We will be performing scheduled maintenance on Tuesday, July 15, 2025 from 2:00 AM to 4:00 AM UTC. The platform may experience brief periods of downtime during this window.",
        },
        {
          sectionTitle: "What to Expect",
          sectionContent: [
            "Temporary unavailability (1-2 hours maximum)",
            "Automatic saving of your progress",
            "Brief interruption to ongoing sessions",
          ],
        },
        {
          sectionTitle: "Why This Matters",
          sectionContent:
            "This maintenance will improve platform stability and prepare our infrastructure for upcoming feature releases.",
        },
      ]),
      isGlobal: true,
      author: { connect: { id: teacher2.id } },
    },
  });

  const announcement3 = await prisma.announcement.create({
    data: {
      title: "Web Development Course Resources Update",
      content: JSON.stringify([
        {
          sectionTitle: "New Resources Added",
          sectionContent:
            "We've added new learning materials to the Web Development course, including interactive coding exercises and project templates.",
        },
        {
          sectionTitle: "Updated Schedule",
          sectionContent: [
            "Live Q&A session: Friday, July 18 at 3:00 PM UTC",
            "Assignment deadline extended to July 25",
          ],
        },
      ]),
      isGlobal: false,
      course: { connect: { id: webDevCourse.id } },
      author: { connect: { id: teacher1.id } },
    },
  });

  console.log(
    "Announcements created:",
    announcement1.id,
    announcement2.id,
    announcement3.id,
  );

  // --- Create Blog Posts ---
  console.log("Creating blog posts...");

  const blogPost1 = await prisma.blogPost.create({
    data: {
      title: "The Future of Language Learning",
      slug: "future-of-language-learning",
      content: `<p>Language learning has come a long way from traditional classroom settings. With advancements in technology, the way we approach language acquisition has fundamentally changed.</p>
      
      <h2>AI-Powered Conversation Practice</h2>
      <p>One of the most exciting developments is the integration of AI language models that can simulate conversations with learners. These systems provide immediate feedback and adapt to the learner's proficiency level, creating a personalized learning experience.</p>
      
      <h2>Mobile-First Learning</h2>
      <p>With smartphones becoming ubiquitous, language learning apps have revolutionized how we practice and retain language skills. Short, daily practice sessions have proven more effective than lengthy, infrequent study periods.</p>
      
      <h2>Immersive Virtual Environments</h2>
      <p>Virtual reality and augmented reality technologies are creating immersive environments where learners can practice language skills in simulated real-world scenarios without the stress of actual social interactions.</p>`,
      excerpt:
        "Exploring how technology is revolutionizing the way we learn languages, from AI conversation partners to immersive virtual reality environments.",
      imageUrl:
        "https://via.placeholder.com/800x400/90EE90/000000?text=Language+Learning",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(2025, 4, 15), // May 15, 2025
      author: { connect: { id: teacher1.id } },
    },
  });

  const blogPost2 = await prisma.blogPost.create({
    data: {
      title: "5 Effective Techniques for Mastering a New Language",
      slug: "5-effective-techniques-mastering-new-language",
      content: `<p>Learning a new language can be challenging, but with the right techniques, you can accelerate your progress and achieve fluency faster.</p>
      
      <h2>1. Spaced Repetition</h2>
      <p>Spaced repetition is a learning technique that involves reviewing information at increasing intervals. This method is particularly effective for vocabulary acquisition. By revisiting words just as you're about to forget them, you strengthen your memory of them.</p>
      
      <h2>2. Comprehensible Input</h2>
      <p>Expose yourself to content that is slightly above your current level of understanding. This "i+1" approach, as linguist Stephen Krashen calls it, challenges you without overwhelming you.</p>
      
      <h2>3. Active Recall</h2>
      <p>Instead of passively reviewing material, actively try to recall information from memory. This strengthens neural connections and improves long-term retention.</p>
      
      <h2>4. Immersive Environment</h2>
      <p>Surround yourself with the language as much as possible. Change your phone settings, watch shows, listen to music, and read news in your target language.</p>
      
      <h2>5. Regular Speaking Practice</h2>
      <p>Find language exchange partners or tutors to practice speaking regularly. Speaking is often the most challenging skill and requires consistent practice to develop fluency.</p>`,
      excerpt:
        "Discover the most research-backed methods to efficiently learn a new language, from spaced repetition to immersive environments.",
      imageUrl:
        "https://via.placeholder.com/800x400/FFD700/000000?text=Learning+Techniques",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(2025, 4, 10), // May 10, 2025
      author: { connect: { id: teacher2.id } },
    },
  });

  const blogPost3 = await prisma.blogPost.create({
    data: {
      title: "How Languages Shape Our Thinking",
      slug: "how-languages-shape-thinking",
      content: `<p>The languages we speak influence how we perceive and interpret the world around us. This concept, known as linguistic relativity or the Sapir-Whorf hypothesis, suggests that language affects our cognitive processes.</p>
      
      <h2>Color Perception</h2>
      <p>Different languages divide the color spectrum in various ways. For example, Russian makes an obligatory distinction between lighter blue (goluboy) and darker blue (siniy), while English speakers use modifiers with a single blue term. Research has shown that this linguistic difference affects how quickly Russian speakers can distinguish between blue hues.</p>
      
      <h2>Spatial Orientation</h2>
      <p>Some languages, like Kuuk Thaayorre spoken in Australia, use absolute directions (north, south, east, west) rather than relative terms (left, right). Speakers of these languages have been shown to have an exceptional sense of direction and spatial awareness.</p>
      
      <h2>Gendered Languages</h2>
      <p>Languages that assign gender to nouns (like Spanish, German, or French) may influence how speakers perceive objects. Studies have found that speakers tend to attribute gender-stereotypical qualities to objects based on their grammatical gender.</p>`,
      excerpt:
        "Explore the fascinating ways different languages influence our perception, thinking patterns, and worldview.",
      imageUrl:
        "https://via.placeholder.com/800x400/87CEEB/000000?text=Language+and+Thought",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(2025, 4, 5), // May 5, 2025
      author: { connect: { id: teacher1.id } },
    },
  });

  const blogPost4 = await prisma.blogPost.create({
    data: {
      title: "Learning Multiple Languages Simultaneously",
      slug: "learning-multiple-languages",
      content: `<p>Is it possible to learn several languages at once? Many language enthusiasts attempt this challenge, and while it comes with unique difficulties, it can be done effectively with the right approach.</p>
      
      <h2>The Challenges</h2>
      <p>Learning multiple languages simultaneously increases the risk of interference, where vocabulary and grammar rules from one language bleed into another. This is especially true for closely related languages like Spanish and Portuguese.</p>
      
      <h2>Effective Strategies</h2>
      <p>Choose languages from different language families to minimize interference. For example, combining a Romance language (like French) with a Germanic language (like German) and a non-Indo-European language (like Japanese) reduces confusion.</p>
      
      <p>Create separate contexts for each language. Study Spanish in the morning, German in the afternoon, and Japanese in the evening. Or associate each language with different activities or locations.</p>
      
      <h2>Benefits</h2>
      <p>Despite the challenges, learning multiple languages simultaneously has benefits. It can help you recognize patterns in language learning, making each subsequent language easier to acquire. It also exercises your brain in unique ways, potentially improving cognitive flexibility.</p>`,
      excerpt:
        "Is learning multiple languages at once possible? Discover the challenges, strategies, and surprising benefits of tackling several languages simultaneously.",
      imageUrl:
        "https://via.placeholder.com/800x400/FFA07A/000000?text=Multiple+Languages",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(2025, 3, 28), // April 28, 2025
      author: { connect: { id: teacher2.id } },
    },
  });

  const blogPost5 = await prisma.blogPost.create({
    data: {
      title: "The Role of Music in Language Learning",
      slug: "role-music-language-learning",
      content: `<p>Music can be a powerful tool in language acquisition, offering numerous cognitive and motivational benefits for learners of all ages.</p>
      
      <h2>Memory Enhancement</h2>
      <p>Songs provide a melodic and rhythmic framework that helps learners remember vocabulary and phrases more effectively. The combination of music and language activates multiple areas of the brain, creating stronger neural connections.</p>
      
      <h2>Natural Pronunciation and Intonation</h2>
      <p>Music showcases the natural rhythm, stress patterns, and intonation of a language. By singing along, learners can improve their pronunciation and develop a more native-like accent.</p>
      
      <h2>Cultural Insights</h2>
      <p>Songs often reflect cultural values, historical events, and social issues. They provide authentic contexts for language use and offer insights into the target culture that textbooks might not capture.</p>
      
      <h2>Emotional Engagement</h2>
      <p>Learning through music is enjoyable and reduces anxiety, creating a positive emotional association with the language learning process. This emotional engagement enhances motivation and can lead to more consistent practice.</p>`,
      excerpt:
        "Discover how music enhances memory, improves pronunciation, and provides cultural context when learning a new language.",
      imageUrl:
        "https://via.placeholder.com/800x400/DDA0DD/000000?text=Music+and+Language",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(2025, 3, 20), // April 20, 2025
      author: { connect: { id: teacher1.id } },
    },
  });

  const blogPost6 = await prisma.blogPost.create({
    data: {
      title: "Language Learning for Different Age Groups",
      slug: "language-learning-different-age-groups",
      content: `<p>While children are often considered natural language learners, adults and seniors have unique advantages that can lead to successful language acquisition at any age.</p>
      
      <h2>Children (Ages 3-12)</h2>
      <p>Young children learn languages implicitly, without conscious analysis of grammar rules. They typically develop excellent pronunciation and intuitive grammar understanding. However, they require consistent exposure and may lack the metacognitive skills to apply learning strategies.</p>
      
      <h2>Teenagers (Ages 13-17)</h2>
      <p>Adolescents combine some of the neuroplasticity of childhood with increasingly sophisticated cognitive abilities. They can benefit from both implicit acquisition and explicit instruction. Social motivation plays a key role in their language learning success.</p>
      
      <h2>Adults (Ages 18-60)</h2>
      <p>Adult learners have advanced analytical skills, allowing them to understand complex grammar concepts quickly. Their extensive vocabulary knowledge in their native language facilitates connections with new vocabulary. Adults benefit from explicit instruction and can apply effective learning strategies.</p>
      
      <h2>Seniors (Ages 60+)</h2>
      <p>Contrary to common assumptions, seniors can be successful language learners. Language learning provides cognitive benefits that may help maintain brain health. While vocabulary acquisition may take longer, life experience and wisdom can enhance comprehension of culturally rich content.</p>`,
      excerpt:
        "From children to seniors, each age group brings unique strengths to language learning. Explore the most effective approaches for different life stages.",
      imageUrl:
        "https://via.placeholder.com/800x400/B0C4DE/000000?text=Age+and+Language",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(2025, 3, 15), // April 15, 2025
      author: { connect: { id: teacher2.id } },
    },
  });

  const blogPost7 = await prisma.blogPost.create({
    data: {
      title: "The Benefits of Bilingualism",
      slug: "benefits-of-bilingualism",
      content: `<p>Speaking two or more languages offers cognitive, social, and economic advantages that extend far beyond communication skills.</p>
      
      <h2>Cognitive Advantages</h2>
      <p>Bilingual individuals typically demonstrate enhanced executive functions, including better attention control, cognitive flexibility, and working memory. The constant mental juggling between languages serves as a form of cognitive exercise.</p>
      
      <h2>Delayed Onset of Dementia</h2>
      <p>Research suggests that bilingualism may delay the onset of dementia symptoms by 4-5 years. The cognitive reserve built through language switching provides some protection against age-related cognitive decline.</p>
      
      <h2>Cultural Empathy</h2>
      <p>Speaking multiple languages opens windows into different cultures, fostering greater cross-cultural understanding and empathy. Bilinguals often develop a more nuanced perspective on cultural differences.</p>
      
      <h2>Career Opportunities</h2>
      <p>In our globalized economy, bilingualism is increasingly valued by employers. Bilingual individuals have access to more job opportunities and often command higher salaries in certain industries.</p>`,
      excerpt:
        "From enhanced cognitive abilities to better career prospects, discover the many advantages of speaking multiple languages.",
      imageUrl:
        "https://via.placeholder.com/800x400/20B2AA/000000?text=Bilingualism",
      status: PostStatus.DRAFT,
      author: { connect: { id: teacher1.id } },
    },
  });

  console.log(
    "Blog posts created:",
    blogPost1.id,
    blogPost2.id,
    blogPost3.id,
    blogPost4.id,
    blogPost5.id,
    blogPost6.id,
    blogPost7.id,
  );

  // --- Create Lesson Comments ---
  console.log("Creating lesson comments...");

  // Get some resources to comment on
  const firstDesignLesson = await prisma.resource.findFirst({
    where: { courseId: designCourse.id },
    orderBy: [{ week: "asc" }, { order: "asc" }],
  });

  const firstWebDevLesson = await prisma.resource.findFirst({
    where: { courseId: webDevCourse.id },
    orderBy: [{ week: "asc" }, { order: "asc" }],
  });

  const firstReactLesson = await prisma.resource.findFirst({
    where: { courseId: reactCourse.id },
    orderBy: [{ week: "asc" }, { order: "asc" }],
  });

  if (firstDesignLesson) {
    // Create top-level comments
    const comment1 = await prisma.lessonComment.create({
      data: {
        content:
          "This was a great introduction! Very helpful and well explained. I especially liked the part about the design principles.",
        userId: student1.id,
        lessonId: firstDesignLesson.id,
      },
    });

    const comment2 = await prisma.lessonComment.create({
      data: {
        content:
          "I have a question about the concept mentioned at 1:32 in the video. Can someone clarify how this applies to real-world projects?",
        userId: student2.id,
        lessonId: firstDesignLesson.id,
      },
    });

    // Create level 1 replies to comment2
    const reply1Level1 = await prisma.lessonComment.create({
      data: {
        content:
          "@Bob Williams Great question! In real-world projects, this concept helps with maintaining consistency across different design elements. I've used this approach in several client projects.",
        userId: teacher1.id,
        lessonId: firstDesignLesson.id,
        parentId: comment2.id,
      },
    });

    const reply2Level1 = await prisma.lessonComment.create({
      data: {
        content:
          "I agree with Jane! I've also found this principle very useful when working on branding projects. It really helps create a cohesive visual identity.",
        userId: student1.id,
        lessonId: firstDesignLesson.id,
        parentId: comment2.id,
      },
    });

    // Create level 2 replies (replies to replies)
    const reply1Level2 = await prisma.lessonComment.create({
      data: {
        content:
          "@Jane Doe Could you share some specific examples? I'm working on a client project right now and this would be super helpful!",
        userId: student2.id,
        lessonId: firstDesignLesson.id,
        parentId: reply1Level1.id,
      },
    });

    const reply2Level2 = await prisma.lessonComment.create({
      data: {
        content:
          "@Alice Johnson Absolutely! For branding, I use this to ensure logos, business cards, and website elements all feel connected. The key is establishing clear visual rules early on.",
        userId: student1.id,
        lessonId: firstDesignLesson.id,
        parentId: reply2Level1.id,
      },
    });

    // Create level 3 replies (deepest level)
    await prisma.lessonComment.create({
      data: {
        content:
          "@Bob Williams Sure! For example, if your primary brand uses rounded corners with 8px radius, apply that same radius to buttons, cards, and image frames throughout the design system.",
        userId: teacher1.id,
        lessonId: firstDesignLesson.id,
        parentId: reply1Level2.id,
      },
    });

    await prisma.lessonComment.create({
      data: {
        content:
          "@Alice Johnson That makes perfect sense! I never thought about consistency at that level of detail. Thanks for the insight!",
        userId: student2.id,
        lessonId: firstDesignLesson.id,
        parentId: reply2Level2.id,
      },
    });

    // Create a third comment with multiple layers of replies
    const comment3 = await prisma.lessonComment.create({
      data: {
        content:
          "Could someone explain the difference between serif and sans-serif fonts? I'm still confused about when to use each one.",
        userId: student1.id,
        lessonId: firstDesignLesson.id,
      },
    });

    const serif1 = await prisma.lessonComment.create({
      data: {
        content:
          "Serif fonts have small decorative strokes (like Times New Roman) and are traditionally used for print materials. Sans-serif fonts are cleaner (like Arial) and work better for digital screens.",
        userId: teacher1.id,
        lessonId: firstDesignLesson.id,
        parentId: comment3.id,
      },
    });

    const serif2 = await prisma.lessonComment.create({
      data: {
        content:
          "To add to that - serif fonts are often seen as more traditional and formal, while sans-serif fonts feel more modern and casual. Choose based on your brand personality!",
        userId: student2.id,
        lessonId: firstDesignLesson.id,
        parentId: comment3.id,
      },
    });

    // Level 2 replies for font discussion
    const serifReply1 = await prisma.lessonComment.create({
      data: {
        content:
          "What about script fonts or display fonts? When would those be appropriate?",
        userId: student1.id,
        lessonId: firstDesignLesson.id,
        parentId: serif1.id,
      },
    });

    const serifReply2 = await prisma.lessonComment.create({
      data: {
        content:
          "Great point about brand personality! I'm working on a tech startup brand - would you recommend sans-serif then?",
        userId: student1.id,
        lessonId: firstDesignLesson.id,
        parentId: serif2.id,
      },
    });

    // Level 3 replies (final layer)
    await prisma.lessonComment.create({
      data: {
        content:
          "Script fonts are great for invitations or luxury brands, but use sparingly. Display fonts work well for headlines but avoid them for body text - readability is key!",
        userId: teacher1.id,
        lessonId: firstDesignLesson.id,
        parentId: serifReply1.id,
      },
    });

    await prisma.lessonComment.create({
      data: {
        content:
          "For tech startups, definitely go with sans-serif! It conveys innovation and accessibility. Consider fonts like Inter, Roboto, or Open Sans.",
        userId: teacher1.id,
        lessonId: firstDesignLesson.id,
        parentId: serifReply2.id,
      },
    });

    console.log("Comments created for design lesson with 3-level nesting.");
  }

  if (firstWebDevLesson) {
    const webComment1 = await prisma.lessonComment.create({
      data: {
        content:
          "Perfect starting point for beginners! The examples are clear and easy to follow.",
        userId: student2.id,
        lessonId: firstWebDevLesson.id,
      },
    });

    const webComment2 = await prisma.lessonComment.create({
      data: {
        content:
          "Could you provide more examples of semantic HTML elements? I'd love to see more practical applications.",
        userId: student1.id,
        lessonId: firstWebDevLesson.id,
      },
    });

    // Add nested replies for web dev
    const webReply1 = await prisma.lessonComment.create({
      data: {
        content:
          "Great question! Semantic elements like <article>, <section>, <nav>, and <aside> help both browsers and screen readers understand your content structure.",
        userId: teacher1.id,
        lessonId: firstWebDevLesson.id,
        parentId: webComment2.id,
      },
    });

    await prisma.lessonComment.create({
      data: {
        content:
          "That's really helpful! Are there any tools to check if I'm using semantic HTML correctly?",
        userId: student1.id,
        lessonId: firstWebDevLesson.id,
        parentId: webReply1.id,
      },
    });

    console.log("Comments created for web dev lesson.");
  }

  if (firstReactLesson) {
    const reactComment = await prisma.lessonComment.create({
      data: {
        content:
          "The JSX syntax is confusing at first. Any tips for getting used to it?",
        userId: student1.id,
        lessonId: firstReactLesson.id,
      },
    });

    // Reply from teacher
    const reactReply1 = await prisma.lessonComment.create({
      data: {
        content:
          "Great question! JSX becomes more natural with practice. Try thinking of it as HTML with JavaScript superpowers. The key is to remember that it's just syntactic sugar for React.createElement calls.",
        userId: teacher2.id,
        lessonId: firstReactLesson.id,
        parentId: reactComment.id,
      },
    });

    // Student follow-up
    const reactReply2 = await prisma.lessonComment.create({
      data: {
        content:
          "That helps! What about the curly braces? When do I use them vs regular HTML attributes?",
        userId: student1.id,
        lessonId: firstReactLesson.id,
        parentId: reactReply1.id,
      },
    });

    // Teacher's detailed explanation
    await prisma.lessonComment.create({
      data: {
        content:
          "Curly braces {} are for JavaScript expressions! Use them for dynamic values: <div className={isActive ? 'active' : 'inactive'}> vs static: <div className=\"static-class\">",
        userId: teacher2.id,
        lessonId: firstReactLesson.id,
        parentId: reactReply2.id,
      },
    });

    console.log("Comments created for React lesson with nested replies.");
  }

  // --- Create Error Reports ---
  console.log("Creating error reports...");

  if (firstDesignLesson) {
    await prisma.errorReport.create({
      data: {
        description:
          "The video stops playing at around 3:45 and shows a loading spinner. I've tried refreshing multiple times but the issue persists.",
        userId: student1.id,
        lessonId: firstDesignLesson.id,
      },
    });
  }

  if (firstWebDevLesson) {
    await prisma.errorReport.create({
      data: {
        description:
          "Audio quality is poor in this lesson - there's a lot of background noise that makes it hard to understand the instructor.",
        userId: student2.id,
        lessonId: firstWebDevLesson.id,
        status: "IN_PROGRESS",
      },
    });
  }

  if (firstReactLesson) {
    await prisma.errorReport.create({
      data: {
        description:
          "The code examples shown in the video don't match the downloadable resources. The video shows version 18 syntax but the files use version 16.",
        userId: student1.id,
        lessonId: firstReactLesson.id,
        status: "RESOLVED",
      },
    });
  }

  console.log("Error reports created.");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
