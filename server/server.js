const http = require("http").createServer()
const io = require("socket.io")(http, {
  cors: { origin: "*" },
})
const axios = require("axios")

// Python API base URL
const PYTHON_API_URL = "http://localhost:8000"

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("login", async (data) => {
    try {
      // TODO: Add authentication endpoint to app.py
      // For now, we'll validate user exists in database
      const response = await axios.get(`${PYTHON_API_URL}/user`, {
        params: { email: data.email },
      })

      socket.emit("login-response", {
        success: true,
        user: response.data,
      })
    } catch (error) {
      console.error("Login error:", error.message)
      socket.emit("login-response", {
        success: false,
        error: "Invalid credentials",
      })
    }
  })

  socket.on("signup", async (data) => {
    try {
      // TODO: Add user creation endpoint to app.py
      const response = await axios.post(`${PYTHON_API_URL}/user`, {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      })

      socket.emit("signup-response", {
        success: true,
        user: response.data,
      })
    } catch (error) {
      console.error("Signup error:", error.message)
      socket.emit("signup-response", {
        success: false,
        error: "Signup failed",
      })
    }
  })

  socket.on("get-user-classes", async (data) => {
    try {
      // TODO: Add endpoint to get user's classes from app.py
      const response = await axios.get(`${PYTHON_API_URL}/user-classes`, {
        params: { user_id: data.userId },
      })

      socket.emit("user-classes-response", {
        success: true,
        classes: response.data,
      })
    } catch (error) {
      console.error("Get classes error:", error.message)
      socket.emit("user-classes-response", {
        success: true,
        classes: [], // Return empty array if error
      })
    }
  })

  socket.on("join-class", async (data) => {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/class`, {
        params: { class_code: data.classCode },
      })

      // Join socket room for this class
      socket.join(`class_${data.classCode}`)

      socket.emit("join-class-response", {
        success: true,
        classData: response.data,
      })
    } catch (error) {
      console.error("Join class error:", error.message)
      socket.emit("join-class-response", {
        success: false,
        error: "Class not found",
      })
    }
  })

  socket.on("create-class", async (data) => {
    try {
      const response = await axios.post(`${PYTHON_API_URL}/class`, {
        class_name: data.className,
        class_code: data.classCode,
        teacher_name: data.teacherName,
      })

      socket.emit("create-class-response", {
        success: true,
        classData: response.data,
      })
    } catch (error) {
      console.error("Create class error:", error.message)
      socket.emit("create-class-response", {
        success: false,
        error: "Failed to create class",
      })
    }
  })

  socket.on("check-in", async (data) => {
    try {
      const response = await axios.post(`${PYTHON_API_URL}/check_in`, {
        email: data.email,
        class_code: data.classCode,
      })

      socket.emit("check-in-response", {
        success: true,
        data: response.data,
      })
    } catch (error) {
      console.error("Check-in error:", error.message)
      socket.emit("check-in-response", {
        success: false,
        error: "Check-in failed",
      })
    }
  })

  socket.on("chat-message", (data) => {
    console.log("Chat message received:", data)

    // Broadcast message to all users in the class room
    io.to(`class_${data.classCode}`).emit("chat-message", {
      id: data.id,
      text: data.text,
      sender: data.sender,
      senderName: data.senderName,
      timestamp: data.timestamp,
    })
  })

  socket.on("join-class-room", (data) => {
    socket.join(`class_${data.classCode}`)
    console.log(`User ${socket.id} joined class room: ${data.classCode}`)
  })

  socket.on("leave-class-room", (data) => {
    socket.leave(`class_${data.classCode}`)
    console.log(`User ${socket.id} left class room: ${data.classCode}`)
  })

  socket.on("get-attendance", async (data) => {
    try {
      // TODO: Add endpoint to get attendance from app.py
      const response = await axios.get(`${PYTHON_API_URL}/attendance`, {
        params: { class_code: data.classCode },
      })

      socket.emit("attendance-response", {
        success: true,
        students: response.data,
      })
    } catch (error) {
      console.error("Get attendance error:", error.message)
      socket.emit("attendance-response", {
        success: true,
        students: [], // Return empty array if error
      })
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

http.listen(8080, () => console.log("Socket.IO server listening on http://localhost:8080"))
