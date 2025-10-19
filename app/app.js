//import React from "react"
//import ReactDOM from "react-dom"

//const { useState } = React
const socket = io('ws://localhost:8080');

//socket.on('message', text => {

    //const el = document.createElement('li');
    //el.innerHTML = text;
    //document.querySelector('ul').appendChild(el)

//});

/*document.querySelector('button').onclick = () => {

    const text = document.querySelector('input').value;
    socket.emit('message', text)
    
}*/

const state = {
  currentPage: "login",
  currentUser: null,
  currentClass: null,
  classes: JSON.parse(localStorage.getItem("classes")) || {},
}

// Utility functions
function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function saveToLocalStorage() {
  localStorage.setItem("classes", JSON.stringify(state.classes))
}

function navigateTo(page) {
  state.currentPage = page
  ClassPulse()
}

function ClassPulse() {
    const clList = document.getElementById("classList");
    const pageContent = document.getElementById("Content");

    clList.innerHTML = getClasses();

    switch (state.currentPage) {
        case "login":
        pageContent.innerHTML = renderLoginPage();
        attachLoginPageListeners();
        break
        case "home":
        pageContent.innerHTML = renderHomePage();
        attachHomePageListeners();
        break
        case "create-class":
        pageContent.innerHTML = renderCreateClassPage();
        attachCreateClassListeners();
        break
        case "class":
        pageContent.innerHTML = renderClassPage();
        attachClassPageListeners();
        break
        case "view-attendees":
        pageContent.innerHTML = renderViewAttendeesPage();
        attachViewAttendeesListeners();
        break
        default:
        pageContent.innerHTML = renderLoginPage();
        attachLoginPageListeners();
        break
    }
}

//Navigation Bar
function getClasses() {

}

//login page
function renderLoginPage() {
  return `
        <div class="card">
          <input 
              type="text" 
              id="UserNameInput" 
              placeholder="Enter user name"
              class="input"
          />
          <input 
              type="text" 
              id="PasswordInput" 
              placeholder="Enter password"
              class="input"
          />
          <button id="log-inBtn">
            Log-in
          </button>
        </div>
        `
}

//login page
function attachLoginPageListeners() {
  const lgInBtn = document.getElementById("log-inBtn").addEventListener("click", () => {
    navigateTo("home");
    //updateNav();
  });

}

// Home / Check-in Page
function renderHomePage() {
  return `
        <div class="container">
            <div class="page-header">
                <h1>Class Pulse</h1>
                <p class="subtitle">Check in to your class</p>
            </div>
            
            <div class="card">
                <button class="btn btn-primary btn-large" id="createClassBtn">
                    Create Class
                </button>
                
                <div class="divider">
                    <span>or join existing class</span>
                </div>
                
                <div class="form-group">
                    <label for="classCode">Class Code</label>
                    <input 
                        type="text" 
                        id="classCode" 
                        placeholder="Enter class code"
                        class="input"
                    />
                </div>
                
                <div class="form-group">
                    <label for="studentName">Student Name</label>
                    <input 
                        type="text" 
                        id="studentName" 
                        placeholder="Enter your name"
                        class="input"
                    />
                </div>
                
                <button class="btn btn-secondary btn-large" id="checkInBtn">
                    Check In
                </button>
                
                <div id="errorMessage" class="error-message"></div>
            </div>
        </div>
    `
}

function attachHomePageListeners() {
  document.getElementById("createClassBtn").addEventListener("click", () => {
    navigateTo("create-class")
  })

  document.getElementById("checkInBtn").addEventListener("click", () => {
    const classCode = document.getElementById("classCode").value.trim().toUpperCase()
    const studentName = document.getElementById("studentName").value.trim()
    const errorDiv = document.getElementById("errorMessage")

    if (!classCode || !studentName) {
      errorDiv.textContent = "Please enter both class code and your name"
      return
    }

    if (!state.classes[classCode]) {
      errorDiv.textContent = "Class not found. Please check the code."
      return
    }

    // Add student to class
    const classData = state.classes[classCode]
    if (!classData.students.find((s) => s.name === studentName)) {
      classData.students.push({
        name: studentName,
        participationScore: 0,
        joinedAt: new Date().toISOString(),
      })
      saveToLocalStorage()
    }

    state.currentUser = { name: studentName, isTeacher: false }
    state.currentClass = classCode
    navigateTo("class")
  })
}

// Create Class Page
function renderCreateClassPage() {
  const classCode = generateClassCode()

  return `
        <div class="container">
            <div class="page-header">
                <h1>Create New Class</h1>
            </div>
            
            <div class="card">
                <div class="class-code-display">
                    <label>Your Class Code</label>
                    <div class="code-box">${classCode}</div>
                    <p class="hint">Share this code with your students</p>
                </div>
                
                <div class="form-group">
                    <label for="className">Class Name</label>
                    <input 
                        type="text" 
                        id="className" 
                        placeholder="e.g., Math 101"
                        class="input"
                    />
                </div>
                
                <div class="form-group">
                    <label for="teacherName">Teacher Name</label>
                    <input 
                        type="text" 
                        id="teacherName" 
                        placeholder="Enter your name"
                        class="input"
                    />
                </div>
                
                <button class="btn btn-primary btn-large" id="createBtn">
                    Create
                </button>
                
                <button class="btn btn-text" id="backBtn">
                    Back to Home
                </button>
                
                <div id="errorMessage" class="error-message"></div>
            </div>
        </div>
    `
}

function attachCreateClassListeners() {
  const classCode = document.querySelector(".code-box").textContent

  document.getElementById("createBtn").addEventListener("click", () => {
    const className = document.getElementById("className").value.trim()
    const teacherName = document.getElementById("teacherName").value.trim()
    const errorDiv = document.getElementById("errorMessage")

    if (!className || !teacherName) {
      errorDiv.textContent = "Please fill in all fields"
      return
    }

    // Create new class
    state.classes[classCode] = {
      code: classCode,
      name: className,
      teacher: teacherName,
      students: [],
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    saveToLocalStorage()

    state.currentUser = { name: teacherName, isTeacher: true }
    state.currentClass = classCode
    navigateTo("class")
  })

  document.getElementById("backBtn").addEventListener("click", () => {
    navigateTo("home")
  })
}

// Class Page
function renderClassPage() {
  const classData = state.classes[state.currentClass]
  const isTeacher = state.currentUser.isTeacher

  return `
        <div class="container">
            <div class="page-header">
                <h1>${classData.name}</h1>
                <p class="subtitle">Code: ${classData.code}</p>
                <p class="teacher-name">Teacher: ${classData.teacher}</p>
            </div>
            
            <div class="card">
                <div class="welcome-message">
                    <h2>Welcome, ${state.currentUser.name}!</h2>
                    <p>${classData.students.length} student${classData.students.length !== 1 ? "s" : ""} checked in</p>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" id="viewAttendeesBtn">
                        👥 View Attendees
                    </button>
                    
                    <button class="btn btn-secondary" id="classChatBtn">
                        💬 Class Chat
                    </button>
                </div>
                
                ${
                  isTeacher
                    ? `
                    <div class="teacher-actions">
                        <button class="btn btn-destructive" id="closeClassBtn">
                            Close Class
                        </button>
                    </div>
                `
                    : ""
                }
                
                <button class="btn btn-text" id="leaveClassBtn">
                    Leave Class
                </button>
            </div>
        </div>
    `
}

function attachClassPageListeners() {
  document.getElementById("viewAttendeesBtn").addEventListener("click", () => {
    navigateTo("view-attendees")
  })

  document.getElementById("classChatBtn").addEventListener("click", () => {
    alert("Class Chat feature coming soon!")
  })

  const closeClassBtn = document.getElementById("closeClassBtn")
  if (closeClassBtn) {
    closeClassBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to close this class? This will end the session.")) {
        state.classes[state.currentClass].isActive = false
        saveToLocalStorage()
        state.currentUser = null
        state.currentClass = null
        navigateTo("home")
      }
    })
  }

  document.getElementById("leaveClassBtn").addEventListener("click", () => {
    state.currentUser = null
    state.currentClass = null
    navigateTo("home")
  })
}

// View Attendees Page
function renderViewAttendeesPage() {
  const classData = state.classes[state.currentClass]
  const isTeacher = state.currentUser.isTeacher
  const students = classData.students

  return `
        <div class="container">
            <div class="page-header">
                <h1>Attendees</h1>
                <p class="subtitle">${students.length} student${students.length !== 1 ? "s" : ""} present</p>
            </div>
            
            <div class="card">
                <div class="students-list">
                    ${
                      students.length === 0
                        ? '<p class="empty-state">No students have checked in yet</p>'
                        : students
                            .map(
                              (student, index) => `
                            <div class="student-item">
                                <div class="student-info">
                                    <span class="student-number">${index + 1}</span>
                                    <span class="student-name">${student.name}</span>
                                </div>
                                <div class="participation-score">
                                    <span class="score-label">Participation:</span>
                                    <span class="score-value">${student.participationScore}</span>
                                </div>
                            </div>
                        `,
                            )
                            .join("")
                    }
                </div>
                
                ${
                  isTeacher && students.length > 0
                    ? `
                    <div class="teacher-tools">
                        <h3>Teacher Tools</h3>
                        
                        <div class="form-group">
                            <label for="studentSelect">Select Student</label>
                            <select id="studentSelect" class="input">
                                <option value="">Choose a student...</option>
                                ${students
                                  .map(
                                    (student, index) => `
                                    <option value="${index}">${student.name}</option>
                                `,
                                  )
                                  .join("")}
                            </select>
                        </div>
                        
                        <button class="btn btn-primary" id="randomStudentBtn">
                            🎲 Select Random Student
                        </button>
                        
                        <button class="btn btn-secondary" id="downloadRegisterBtn">
                            📥 Download Register
                        </button>
                        
                        <div id="selectedStudent" class="selected-student"></div>
                    </div>
                `
                    : ""
                }
                
                <button class="btn btn-text" id="backToClassBtn">
                    Back to Class
                </button>
            </div>
        </div>
    `
}

function attachViewAttendeesListeners() {
  const classData = state.classes[state.currentClass]
  const isTeacher = state.currentUser.isTeacher

  document.getElementById("backToClassBtn").addEventListener("click", () => {
    navigateTo("class")
  })

  if (isTeacher) {
    const randomStudentBtn = document.getElementById("randomStudentBtn")
    const downloadRegisterBtn = document.getElementById("downloadRegisterBtn")
    const studentSelect = document.getElementById("studentSelect")
    const selectedStudentDiv = document.getElementById("selectedStudent")

    if (randomStudentBtn) {
      randomStudentBtn.addEventListener("click", () => {
        const students = classData.students
        if (students.length > 0) {
          const randomIndex = Math.floor(Math.random() * students.length)
          const randomStudent = students[randomIndex]
          selectedStudentDiv.innerHTML = `
                        <div class="highlight-box">
                            <strong>Selected:</strong> ${randomStudent.name}
                        </div>
                    `
        }
      })
    }

    if (studentSelect) {
      studentSelect.addEventListener("change", (e) => {
        const index = e.target.value
        if (index !== "") {
          const student = classData.students[index]
          selectedStudentDiv.innerHTML = `
                        <div class="highlight-box">
                            <strong>Selected:</strong> ${student.name}
                        </div>
                    `
        } else {
          selectedStudentDiv.innerHTML = ""
        }
      })
    }

    if (downloadRegisterBtn) {
      downloadRegisterBtn.addEventListener("click", () => {
        const registerData = {
          className: classData.name,
          classCode: classData.code,
          teacher: classData.teacher,
          date: new Date().toISOString(),
          students: classData.students,
        }

        // Download as JSON
        const dataStr = JSON.stringify(registerData, null, 2)
        const dataBlob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${classData.name.replace(/\s+/g, "_")}_register.json`
        link.click()
        URL.revokeObjectURL(url)
      })
    }
  }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  ClassPulse()
})