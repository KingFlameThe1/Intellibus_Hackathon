//import React from "react"
//import ReactDOM from "react-dom"

//const { useState } = React
// Import Socket.IO client
import { io } from "socket.io-client"

// Utility functions
function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function saveToLocalStorage() {
  localStorage.setItem("classes", JSON.stringify(state.classes))
}

function navigateTo(page) {
  state.currentPage = page
  render()
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar")

  if (state.currentPage === "login" || state.currentPage === "signup") {
    sidebar.classList.add("hidden")
    return
  }

  sidebar.classList.remove("hidden")

  const isTeacher = state.currentUser?.role === "teacher"

  sidebar.innerHTML = `
    <div class="sidebar-content">
      <button class="sidebar-btn profile-btn" id="profileBtn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
      
      <div class="sidebar-classes">
        ${state.registeredClasses
          .map(
            (cls, index) => `
          <button class="sidebar-btn class-btn ${state.currentClass?.id === cls.id ? "active" : ""}" 
                  data-class-id="${cls.id}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </button>
        `,
          )
          .join("")}
      </div>
      
      <button class="sidebar-btn add-btn" id="addClassBtn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  `

  attachSidebarListeners()
}

function attachSidebarListeners() {
  const profileBtn = document.getElementById("profileBtn")
  const addClassBtn = document.getElementById("addClassBtn")
  const classBtns = document.querySelectorAll(".class-btn")

  profileBtn.addEventListener("click", () => {
    navigateTo("home")
  })

  addClassBtn.addEventListener("click", () => {
    navigateTo("home")
  })

  classBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const classId = btn.dataset.classId
      const classData = state.registeredClasses.find((c) => c.id === classId)
      if (classData) {
        state.currentClass = classData
        navigateTo("class")
      }
    })
  })
}

function render() {
  renderSidebar()
  const mainContent = document.getElementById("main-content")

  switch (state.currentPage) {
    case "login":
      mainContent.innerHTML = renderLoginPage()
      attachLoginPageListeners()
      break
    case "signup":
      mainContent.innerHTML = renderSignupPage()
      attachSignupPageListeners()
      break
    case "home":
      mainContent.innerHTML = renderHomePage()
      attachHomePageListeners()
      break
    case "registered-classes":
      mainContent.innerHTML = renderRegisteredClassesPage()
      attachRegisteredClassesListeners()
      break
    case "class":
      mainContent.innerHTML = renderClassPage()
      attachClassPageListeners()
      break
    case "attendance":
      mainContent.innerHTML = renderAttendancePage()
      attachAttendancePageListeners()
      break
    default:
      mainContent.innerHTML = renderLoginPage()
      attachLoginPageListeners()
  }
}

// Login page
function renderLoginPage() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Log-In to Class Pulse</h1>
        
        <div class="form-group">
          <label class="input-label">Enter Email Address</label>
          <div class="input-wrapper">
            <input 
              type="email" 
              id="emailInput" 
              placeholder="Input"
              class="auth-input"
            />
            <button class="input-icon-btn" id="toggleEmailVisibility">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="input-label">Enter Password</label>
          <div class="input-wrapper">
            <input 
              type="password" 
              id="passwordInput" 
              placeholder="Input"
              class="auth-input"
            />
            <button class="input-icon-btn" id="togglePasswordVisibility">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
        
        <button class="auth-btn" id="loginBtn">Log In</button>
        
        <p class="auth-link">
          Don't have an account? <a href="#" id="signupLink">Sign up</a>
        </p>
        
        <div id="errorMessage" class="error-message"></div>
      </div>
    </div>
  `
}

function attachLoginPageListeners() {
  const loginBtn = document.getElementById("loginBtn")
  const signupLink = document.getElementById("signupLink")
  const togglePasswordBtn = document.getElementById("togglePasswordVisibility")
  const passwordInput = document.getElementById("passwordInput")

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("emailInput").value.trim()
    const password = document.getElementById("passwordInput").value.trim()
    const errorDiv = document.getElementById("errorMessage")

    if (!email || !password) {
      errorDiv.textContent = "Please enter both email and password"
      return
    }

    // Call API to authenticate user
    const response = await apiLogin(email, password)

    if (response.success) {
      state.currentUser = response.user
      // Fetch user's classes
      const classesResponse = await apiGetUserClasses(response.user.id)
      state.registeredClasses = classesResponse.classes
      navigateTo("home")
    } else {
      errorDiv.textContent = "Invalid credentials"
    }
  })

  signupLink.addEventListener("click", (e) => {
    e.preventDefault()
    navigateTo("signup")
  })

  togglePasswordBtn.addEventListener("click", () => {
    passwordInput.type = passwordInput.type === "password" ? "text" : "password"
  })
}

// Signup page
function renderSignupPage() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Sign-up to Class Pulse</h1>
        
        <div class="form-group">
          <label class="input-label">Role</label>
          <select id="roleSelect" class="auth-input">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="input-label">Enter First Name</label>
          <div class="input-wrapper">
            <input 
              type="text" 
              id="firstNameInput" 
              placeholder="Input"
              class="auth-input"
            />
            <button class="input-icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="input-label">Enter Last Name</label>
          <div class="input-wrapper">
            <input 
              type="text" 
              id="lastNameInput" 
              placeholder="Input"
              class="auth-input"
            />
            <button class="input-icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="input-label">Enter Email Address</label>
          <div class="input-wrapper">
            <input 
              type="email" 
              id="emailInput" 
              placeholder="Input"
              class="auth-input"
            />
            <button class="input-icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="input-label">Enter Password</label>
          <div class="input-wrapper">
            <input 
              type="password" 
              id="passwordInput" 
              placeholder="Input"
              class="auth-input"
            />
            <button class="input-icon-btn" id="togglePasswordVisibility">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
        
        <button class="auth-btn" id="signupBtn">Sign Up</button>
        
        <p class="auth-link">
          Already have an account? <a href="#" id="loginLink">Log in</a>
        </p>
        
        <div id="errorMessage" class="error-message"></div>
      </div>
    </div>
  `
}

function attachSignupPageListeners() {
  const signupBtn = document.getElementById("signupBtn")
  const loginLink = document.getElementById("loginLink")
  const togglePasswordBtn = document.getElementById("togglePasswordVisibility")
  const passwordInput = document.getElementById("passwordInput")

  signupBtn.addEventListener("click", async () => {
    const role = document.getElementById("roleSelect").value
    const firstName = document.getElementById("firstNameInput").value.trim()
    const lastName = document.getElementById("lastNameInput").value.trim()
    const email = document.getElementById("emailInput").value.trim()
    const password = document.getElementById("passwordInput").value.trim()
    const errorDiv = document.getElementById("errorMessage")

    if (!firstName || !lastName || !email || !password) {
      errorDiv.textContent = "Please fill in all fields"
      return
    }

    const userData = {
      role,
      firstName,
      lastName,
      email,
      password,
    }

    const response = await apiSignup(userData)

    if (response.success) {
      state.currentUser = response.user
      navigateTo("home")
    } else {
      errorDiv.textContent = "Signup failed"
    }
  })

  loginLink.addEventListener("click", (e) => {
    e.preventDefault()
    navigateTo("login")
  })

  togglePasswordBtn.addEventListener("click", () => {
    passwordInput.type = passwordInput.type === "password" ? "text" : "password"
  })
}

// Home page
function renderHomePage() {
  const isTeacher = state.currentUser?.role === "teacher"

  return `
    <div class="page-container">
      <div class="page-card">
        <h1 class="page-title">Join a Class</h1>
        
        <div class="form-group">
          <label class="input-label">Class Code</label>
          <input 
            type="text" 
            id="classCodeInput" 
            placeholder="Enter class code"
            class="page-input"
          />
        </div>
        
        ${
          isTeacher
            ? `
          <button class="primary-btn" id="createClassBtn">Create New Class</button>
        `
            : ""
        }
        
        <button class="secondary-btn" id="joinClassBtn">Join Class</button>
        
        <button class="text-btn" id="viewClassesBtn">View My Classes</button>
        
        <div id="errorMessage" class="error-message"></div>
      </div>
    </div>
  `
}

function attachHomePageListeners() {
  const joinClassBtn = document.getElementById("joinClassBtn")
  const createClassBtn = document.getElementById("createClassBtn")
  const viewClassesBtn = document.getElementById("viewClassesBtn")

  joinClassBtn.addEventListener("click", async () => {
    const classCode = document.getElementById("classCodeInput").value.trim().toUpperCase()
    const errorDiv = document.getElementById("errorMessage")

    if (!classCode) {
      errorDiv.textContent = "Please enter a class code"
      return
    }

    const response = await apiJoinClass(classCode, state.currentUser.id)

    if (response.success) {
      state.currentClass = response.classData
      if (!state.registeredClasses.find((c) => c.id === response.classData.id)) {
        state.registeredClasses.push(response.classData)
      }
      navigateTo("class")
    } else {
      errorDiv.textContent = "Class not found"
    }
  })

  if (createClassBtn) {
    createClassBtn.addEventListener("click", () => {
      navigateTo("create-class")
    })
  }

  viewClassesBtn.addEventListener("click", () => {
    navigateTo("registered-classes")
  })
}

// Registered Classes page
function renderRegisteredClassesPage() {
  return `
    <div class="page-container">
      <div class="page-card">
        <h1 class="page-title">My Classes</h1>
        
        <div class="classes-list">
          ${
            state.registeredClasses.length === 0
              ? `
            <p class="empty-message">No classes yet. Join or create a class to get started!</p>
          `
              : state.registeredClasses
                  .map(
                    (cls) => `
            <div class="class-item" data-class-id="${cls.id}">
              <div class="class-info">
                <h3>${cls.name}</h3>
                <p>Code: ${cls.code}</p>
                <p>Teacher: ${cls.teacher}</p>
              </div>
              <button class="small-btn" data-class-id="${cls.id}">Open</button>
            </div>
          `,
                  )
                  .join("")
          }
        </div>
        
        <button class="text-btn" id="backBtn">Back to Home</button>
      </div>
    </div>
  `
}

function attachRegisteredClassesListeners() {
  const backBtn = document.getElementById("backBtn")
  const classItems = document.querySelectorAll(".class-item button")

  backBtn.addEventListener("click", () => {
    navigateTo("home")
  })

  classItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const classId = btn.dataset.classId
      const classData = state.registeredClasses.find((c) => c.id === classId)
      if (classData) {
        state.currentClass = classData
        navigateTo("class")
      }
    })
  })
}

// Class page
function renderClassPage() {
  const isTeacher = state.currentUser?.role === "teacher"

  return `
    <div class="class-page">
      <div class="class-header">
        <div class="class-info-header">
          <div class="class-details">
            <h2>${state.currentClass?.name}</h2>
            <p>${state.currentClass?.teacher}</p>
          </div>
          <div class="class-code-badge">
            <span>${state.currentClass?.code}</span>
            <button class="check-in-btn" id="checkInBtn">Check-In</button>
          </div>
        </div>
        
        ${
          isTeacher
            ? `
          <div class="teacher-controls">
            <button class="control-btn" id="startClassBtn">Start Class</button>
            <button class="control-btn" id="attendanceBtn">Attendance</button>
          </div>
        `
            : ""
        }
      </div>
      
      <div class="chat-container">
        <div class="chat-messages" id="chatMessages">
          ${state.messages
            .map(
              (msg) => `
            <div class="message ${msg.sender === state.currentUser?.id ? "sent" : "received"}">
              <div class="message-bubble">${msg.text}</div>
            </div>
          `,
            )
            .join("")}
        </div>
        
        <div class="chat-input-container">
          <input 
            type="text" 
            id="messageInput" 
            placeholder="Write a message..."
            class="chat-input"
          />
          <button class="send-btn" id="sendMessageBtn">Send</button>
        </div>
      </div>
    </div>
  `
}

function attachClassPageListeners() {
  const checkInBtn = document.getElementById("checkInBtn")
  const startClassBtn = document.getElementById("startClassBtn")
  const attendanceBtn = document.getElementById("attendanceBtn")
  const sendMessageBtn = document.getElementById("sendMessageBtn")
  const messageInput = document.getElementById("messageInput")

  if (!socket || !socket.connected) {
    initializeSocket()
    socket.connect()
  }

  // Join class room for chat
  socket.emit("join-class-room", {
    classCode: state.currentClass?.code,
    userId: state.currentUser?.id,
  })

  if (checkInBtn) {
    checkInBtn.addEventListener("click", async () => {
      socket.emit("check-in", {
        email: state.currentUser?.email,
        classCode: state.currentClass?.code,
      })

      socket.once("check-in-response", (response) => {
        if (response.success) {
          alert("Check-in successful!")
        } else {
          alert("Check-in failed: " + response.error)
        }
      })
    })
  }

  if (startClassBtn) {
    startClassBtn.addEventListener("click", () => {
      // TODO: API call to start class
      console.log("[v0] Start class clicked")
    })
  }

  if (attendanceBtn) {
    attendanceBtn.addEventListener("click", () => {
      navigateTo("attendance")
    })
  }

  if (sendMessageBtn) {
    sendMessageBtn.addEventListener("click", () => {
      sendMessage()
    })
  }

  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    })
  }
}

function sendMessage() {
  const messageInput = document.getElementById("messageInput")
  const text = messageInput.value.trim()

  if (!text) return

  const message = {
    id: Date.now(),
    text,
    sender: state.currentUser?.id,
    senderName: state.currentUser?.name,
    classCode: state.currentClass?.code,
    timestamp: new Date().toISOString(),
  }

  if (socket && socket.connected) {
    socket.emit("chat-message", message)
  }

  // Add to local state
  state.messages.push(message)
  messageInput.value = ""

  // Re-render messages
  const chatMessages = document.getElementById("chatMessages")
  if (chatMessages) {
    chatMessages.innerHTML = state.messages
      .map(
        (msg) => `
      <div class="message ${msg.sender === state.currentUser?.id ? "sent" : "received"}">
        <div class="message-bubble">${msg.text}</div>
      </div>
    `,
      )
      .join("")
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

// Attendance page
function renderAttendancePage() {
  const isTeacher = state.currentUser?.role === "teacher"

  return `
    <div class="page-container">
      <div class="page-card">
        <div class="class-header-simple">
          <div>
            <h2>${state.currentClass?.name}</h2>
            <p>${state.currentClass?.code}</p>
          </div>
          ${
            isTeacher
              ? `
            <div class="header-controls">
              <button class="control-btn" id="startClassBtn">Start Class</button>
              <button class="control-btn" id="classChatBtn">Class Chat</button>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="attendance-table">
          <div class="table-header">
            <div class="table-cell">Student Name</div>
            <div class="table-cell">Participation Score</div>
          </div>
          <div class="table-body">
            <div class="table-row">
              <div class="table-cell">John Doe</div>
              <div class="table-cell">3</div>
            </div>
          </div>
        </div>
        
        <button class="text-btn" id="backBtn">Back to Class</button>
      </div>
    </div>
  `
}

function attachAttendancePageListeners() {
  const backBtn = document.getElementById("backBtn")
  const startClassBtn = document.getElementById("startClassBtn")
  const classChatBtn = document.getElementById("classChatBtn")

  backBtn.addEventListener("click", () => {
    navigateTo("class")
  })

  if (startClassBtn) {
    startClassBtn.addEventListener("click", () => {
      // TODO: API call to start class
      console.log("[v0] Start class clicked")
    })
  }

  if (classChatBtn) {
    classChatBtn.addEventListener("click", () => {
      navigateTo("class")
    })
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeSocket()
  socket.connect()
  render()
})

// Socket.IO connection (placeholder - will connect to backend server)
let socket = null

function initializeSocket() {
  socket = io("http://localhost:8080", {
    autoConnect: false,
  })

  socket.on("connect", () => {
    console.log("[v0] Socket connected:", socket.id)
  })

  socket.on("chat-message", (data) => {
    console.log("[v0] Received chat message:", data)
    handleIncomingMessage(data)
  })

  socket.on("disconnect", () => {
    console.log("[v0] Socket disconnected")
  })
}

// API Placeholder Functions
async function apiLogin(email, password) {
  console.log("[v0] API: Login attempt", { email })

  return new Promise((resolve) => {
    socket.emit("login", { email, password })

    socket.once("login-response", (response) => {
      resolve(response)
    })
  })
}

async function apiSignup(userData) {
  console.log("[v0] API: Signup attempt", userData)

  return new Promise((resolve) => {
    socket.emit("signup", userData)

    socket.once("signup-response", (response) => {
      resolve(response)
    })
  })
}

async function apiGetUserClasses(userId) {
  console.log("[v0] API: Fetching classes for user", userId)

  return new Promise((resolve) => {
    socket.emit("get-user-classes", { userId })

    socket.once("user-classes-response", (response) => {
      resolve(response)
    })
  })
}

async function apiJoinClass(classCode, userId) {
  console.log("[v0] API: Joining class", { classCode, userId })

  return new Promise((resolve) => {
    socket.emit("join-class", { classCode, userId })

    socket.once("join-class-response", (response) => {
      resolve(response)
    })
  })
}

async function apiCreateClass(classData) {
  console.log("[v0] API: Creating class", classData)

  return new Promise((resolve) => {
    socket.emit("create-class", classData)

    socket.once("create-class-response", (response) => {
      resolve(response)
    })
  })
}

async function apiGetClassDetails(classId) {
  console.log("[v0] API: Fetching class details", classId)

  return new Promise((resolve) => {
    socket.emit("get-class-details", { classId })

    socket.once("class-details-response", (response) => {
      resolve(response)
    })
  })
}

async function apiGetAttendance(classId) {
  console.log("[v0] API: Fetching attendance", classId)

  return new Promise((resolve) => {
    socket.emit("get-attendance", { classCode: state.currentClass?.code })

    socket.once("attendance-response", (response) => {
      resolve(response)
    })
  })
}

function handleIncomingMessage(message) {
  if (message.sender !== state.currentUser?.id) {
    state.messages.push(message)

    const chatMessages = document.getElementById("chatMessages")
    if (chatMessages) {
      chatMessages.innerHTML = state.messages
        .map(
          (msg) => `
        <div class="message ${msg.sender === state.currentUser?.id ? "sent" : "received"}">
          <div class="message-bubble">${msg.text}</div>
        </div>
      `,
        )
        .join("")
      chatMessages.scrollTop = chatMessages.scrollHeight
    }
  }
}

const state = {
  currentPage: "login",
  currentUser: null,
  currentClass: null,
  registeredClasses: [],
  messages: [],
}
