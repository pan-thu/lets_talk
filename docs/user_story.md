### Student User Stories

| **ID** | **User Story** | **Acceptance Criteria (Summary)** |
|--------|----------------|------------------------------------|
| S1  | As a student, I want to register and create an account so that I can access the platform's resources. | Registration form (email & Google OAuth), email verification, editable profile |
| S2  | As a student, I want to log in and log out so that I can securely access and exit the platform. | Login via email/password or Google; logout button |
| S3  | As a student, I want to recover my password so that I can regain access if I forget it. | “Forgot password” flow; reset email link; change password form |
| S4  | As a student, I want to update my profile (including profile picture) so that my personal information stays current. | Profile edit form; avatar upload; validation |
| S5  | As a student, I want to access a personalized dashboard showing today’s tasks, grades, and a “work calendar” so that I have a clear overview of my progress. | “Today’s tasks” list; grade summary; calendar heatmap like GitHub contributions |
| S6  | As a student, I want a persistent sidebar for navigation so that I can quickly jump to Dashboard, Courses, Announcements, Blog, Calendar, Privacy & Policies, About Us, and Settings. | Sidebar with working links/highlight on active page |
| S7  | As a student, I want to browse available courses (live vs. video) and see my enrolled courses so that I can decide what to join next. | Course catalog UI with tabs “Live”/“Video”; “Enrolled” vs. “Available” sections |
| S8  | As a student, I want to enroll in a course so that I can access its materials. | Enrollment button; confirmation modal; notification |
| S9  | As a student, I want to pay for course enrollment using bank transfer or wallet-to-wallet so that I can access paid content. | Payment gateway integration; transaction receipt; enrollment unlocked |
| S10 | As a student, I want to visit an individual course page so that I can see my progress, marks, and weekly breakdown. | Progress bar; current grade; “Week 1, 2…” accordion sections |
| S11 | As a student, I want video‑courses to show lesson & test items under each week so that I can work through content sequentially. | List of lessons/tests per week; completion checkbox |
| S12 | As a student, I want live‑courses to show a Join Zoom button and a recording link under each week so that I can attend and review live lectures. | “Join Live” button (time‑locked); recording URL after session |
| S13 | As a student, I want to view a lesson page with embedded video or resource, report an issue, download the video, and ask a question so that I can learn and get help. | Video embed; “Report” form; download link; Q&A textbox |
| S14 | As a student, I want to upload my test submissions (video) on a dedicated test page so that my teacher can grade me. | File upload widget; progress indicator; confirmation |
| S15 | As a student, I want to see announcements in a dedicated Announcements page so that I don’t miss important updates. | List of announcements sorted by date; read/unread marker |
| S16 | As a student, I want to browse the Blog page so that I can read articles and learning tips. | Blog list with title, excerpt, “Read more” links |
| S17 | As a student, I want to view the Privacy & Policies page so that I understand platform terms. | Scrollable policy text; “Agree” checkbox (if required) |
| S18 | As a student, I want to visit the About Us page so I can learn who’s behind this platform. | Static content with team/info section |
| S19 | As a student, I want to access a Settings page where I can change my account information so that I stay in control of my data. | Form to update email, password, notification prefs |


### Tutor User Stories

| **ID** | **User Story** | **Acceptance Criteria (Summary)** |
|--------|----------------|------------------------------------|
| T1     | As a tutor, I want to log in and log out so that I can securely access the platform. | Login/logout via email/password or Google OAuth; session management |
| T2     | As a tutor, I want to recover and change my password so that I can manage my account securely. | “Forgot password” flow with email reset; change password form |
| T3     | As a tutor, I want to update my profile (including profile picture) so that my information stays current. | Profile edit form; avatar upload; data validation |
| T4     | As a tutor, I want to access a personalized dashboard showing upcoming sessions, pending grading tasks, recent activity, and a calendar so that I can prioritize my work. | Widgets for upcoming sessions, pending submissions, recent forum posts, calendar heatmap |
| T5     | As a tutor, I want a persistent sidebar with links to Dashboard, Courses, Announcements, Blog, Calendar, Privacy & Policies, About Us, and Settings so that I can navigate the platform easily. | Sidebar highlighting active page; working links to each section |
| T6     | As a tutor, I want to view my assigned courses on a Courses page so that I can select which course to manage. | List of assigned courses; search/filter |
| T7     | As a tutor, I want to visit an individual course page to see and manage its structure and content. | Course title, description, progress summary, management options |
| T8     | As a tutor, I want to manage course structure by adding weeks, lessons, and tests (with marks) so that the content remains organized. | “Add Week” button; week/lesson/test creation forms; mark settings |
| T9     | As a tutor, I want to upload and organize course materials (slides, videos, links) so that students can access resources easily. | File upload tool; drag-and-drop ordering; version history |
| T10    | As a tutor, I want to schedule live sessions with Zoom/meeting links and upload recordings so that students can join and review lectures. | Session scheduler; automated reminders; recording upload |
| T11    | As a tutor, I want to access student submissions, download or view them, and provide grades and feedback so that students understand their performance. | Submission list; file viewer/download; grade input with comments |
| T12   | As a tutor, I want to see each enrolled student’s progress bars on individual course page so that I can identify who needs help. | progress bars per student; sorting/filtering |
| T14    | As a tutor, I want to answer student questions so that I can clarify doubts and support learning. | Q&A interface with threaded replies; notifications when questions are posted |
| T15    | As a tutor, I want to view the Blog page so that I can stay informed about platform news and articles. | List of blog posts with search and “Read more” |
| T16    | As a tutor, I want to view the Announcements page so that I can see all platform‑wide announcements. | Announcement list; date sorting; read/unread status |
| T17    | As a tutor, I want to view the Privacy & Policies and About Us pages so that I understand platform terms and team info. | Static content pages; scrollable text |
| T18    | As a tutor, I want to access the Settings page so that I can update my account information and notification preferences. | Settings form; toggle notifications; save confirmation |


### Admin User Stories

| **ID** | **User Story** | **Acceptance Criteria (Summary)** |
|--------|----------------|------------------------------------|
| A1     | As an admin, I want to log in and log out so that I can securely access the platform. | Login/logout via email/password or Google OAuth; session management |
| A2     | As an admin, I want to recover and change my password so that I can manage my account securely. | “Forgot password” flow with email reset; change password form |
| A3     | As an admin, I want to update my profile (including profile picture) so that my information stays current. | Profile edit form; avatar upload; validation |
| A4     | As an admin, I want a persistent sidebar with links to Dashboard, Users, Courses, Payments, Analytics, Support, Announcements, Blog, Calendar, Privacy & Policies, About Us, and Settings so that I can navigate the platform easily. | Sidebar highlighting active page; working links |
| A5     | As an admin, I want to access a personalized dashboard showing user & course stats, revenue, system health, and support tickets so that I can monitor and prioritize administration tasks. | Widgets for total users, active courses, total revenue, server status, open tickets |
| A6     | As an admin, I want to manage user accounts so that I can create, update, suspend or delete users as needed. | User list with search/filter; create/edit/suspend/delete actions; audit logs |
| A7     | As an admin, I want to assign and update user roles (Student, Tutor, Admin) so that permissions are enforced correctly. | Role dropdown on user edit; bulk role assignment; change history |
| A8     | As an admin, I want to create, edit, archive and delete courses so that the catalog remains accurate. | Course form (title, description, price, status); archive/delete buttons; version history |
| A9     | As an admin, I want to assign courses to tutors so that each course has a responsible instructor. | Tutor assignment dropdown on course page; notification to tutor |
| A10    | As an admin, I want to view and manage all payment transactions so that I can reconcile revenue and resolve payment issues. | Transaction list with filter by date/status; refund/capture actions; export CSV |
| A11    | As an admin, I want to monitor platform usage and performance metrics so that I can ensure uptime and speed. | Real‑time charts for CPU/DB load, API response times, error rates |
| A12    | As an admin, I want to handle support tickets and user inquiries so that user issues are addressed promptly. | Ticketing interface; assign to support staff; status updates; SLA tracking |
| A13    | As an admin, I want to manage global announcements and blog posts so that I can communicate platform news. | Create/edit/delete announcements/blog; scheduling; rich‑text editor |
| A14    | As an admin, I want to view the Privacy & Policies and About Us pages so that I can ensure legal compliance and accurate team info. | Static content editor; version history; publish/unpublish |
