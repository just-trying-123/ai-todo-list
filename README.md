# 🚀 Smart Todo List - AI-Powered Task Management

<div align="center">

## 📺 YouTube Video Demo

**[🎬 Watch the Complete App Walkthrough](https://youtu.be/Z1BwOIPmlt0)**

**⭐ Click the link above to see the app in action! ⭐**

</div>


## ✨ What is Smart Todo List?

Smart Todo List is an intelligent task management application that leverages AI to enhance your productivity. Built with modern technologies including React, Next.js, Django, and Google's Generative AI, it provides a seamless experience for managing tasks with smart features like:

- 🤖 **AI-Powered Task Enhancement** - Automatically enhance task descriptions and suggest optimal deadlines
- 🎯 **Smart Prioritization** - AI calculates priority scores based on context and deadlines
- 📊 **Intelligent Recommendations** - Get AI-suggested tasks based on your patterns and context
- 🏷️ **Smart Categorization** - Automatic task categorization using AI analysis
- 📈 **Productivity Insights** - Track your progress with detailed analytics and statistics
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Next.js 15** with App Router
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for state management
- **Heroicons** for beautiful icons

### Backend
- **Django 5.0** with Django REST Framework
- **Google Generative AI** for AI features
- **PostgreSQL** database (with SQLite for development)
- **JWT Authentication** for secure user sessions
- **Celery** for background tasks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ai-todo-list
```

### 2. Environment Setup
You need to create two separate environment files:

#### Backend Environment (`.env` in backend directory)
Create a `.env` file in the `backend/` directory:

```env
# Google AI
GOOGLE_API_KEY=your-google-ai-api-key
```

#### Frontend Environment (`.env.local` in frontend directory)
Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## 📱 Screenshots

<div align="center">

### Landing Page
<img src="Screenshot%202025-07-05%20195846.png" alt="Landing Page" width="600" />

### Dashboard Overview
<img src="Screenshot%202025-07-05%20195917.png" alt="Dashboard" width="600" />

### Task Creation
<img src="Screenshot%202025-07-05%20195945.png" alt="Task Management" width="600" />

### Tasks Management
<img src="Screenshot%202025-07-05%20200022.png" alt="AI Features" width="600" />

### Card View
<img src="Screenshot%202025-07-05%20200035.png" alt="Authentication" width="600" />

### AI Features
<img src="Screenshot%202025-07-05%20200052.png" alt="Task Creation" width="600" />

### AI Completion 
<img src="Screenshot%202025-07-05%20200117.png" alt="AI Recommendations" width="600" />

</div>



## 🎯 Key Features

### AI-Powered Task Enhancement
- Automatically enhance task descriptions with AI
- Suggest optimal deadlines based on workload
- Calculate intelligent priority scores
- Provide context-aware task recommendations

### Smart Dashboard
- Real-time task statistics
- Today's tasks and overdue items
- AI-generated task recommendations
- Beautiful progress tracking

### User Experience
- Responsive design for all devices
- Smooth animations and transitions
- Intuitive task creation and editing
- Real-time updates and notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- Google Generative AI for AI capabilities
- Next.js team for the amazing framework
- Django team for the robust backend framework
- All contributors and users of this project

---

<div align="center">

**Made with ❤️ and AI**

[Watch Demo](https://youtu.be/Z1BwOIPmlt0)

</div>