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
      // Get all users and find matching email
      const response = await axios.get(`${PYTHON_API_URL}/user`)
      const users = response.data

      // Find user with matching email and password
      const user = users.find((u) => u.email === data.email && u.password === data.password)

      if (user) {
        socket.emit("login-response", {
          success: true,
          user: {
            //id: user._id || user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            //name: `${user.first_name} ${user.last_name}`,
            password: user.password,
            role: user.role,
          },
        })
      } else {
        socket.emit("login-response", {
          success: false,
          error: "Invalid credentials",
        })
      }
    } catch (error) {
      console.error("Login error:", error.message)
      socket.emit("login-response", {
        success: false,
        error: "Login failed",
      })
    }
  })

  socket.on("signup", async (data) => {
    try {
      const response = await axios.post(`${PYTHON_API_URL}/user`, {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      })

      const user = response.data
      socket.emit("signup-response", {
        success: true,
        user: {
          //id: user._id || user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          //name: `${user.first_name} ${user.last_name}`,
          password: user.password,
          role: user.role,
        },
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
      // Get all classes (in future, filter by user)
      const response = await axios.get(`${PYTHON_API_URL}/class`)
      const classes = response.data.map((cls) => ({
        //id: cls.class_code,
        code: cls.class_code,
        name: cls.class_name,
        teacher: cls.teacher_name,
      }))

      socket.emit("user-classes-response", {
        success: true,
        classes: classes,
      })
    } catch (error) {
      console.error("Get classes error:", error.message)
      socket.emit("user-classes-response", {
        success: true,
        classes: [],
      })
    }
  })

  socket.on("join-class", async (data) => {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/class/${data.classCode}`)
      const classData = response.data[0] // API returns array with single item

      // Join socket room for this class
      socket.join(`class_${data.classCode}`)

      socket.emit("join-class-response", {
        success: true,
        classData: {
          //id: classData.class_code,
          code: classData.class_code,
          name: classData.class_name,
          teacher: classData.teacher_name,
        },
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

      const classData = response.data
      socket.emit("create-class-response", {
        success: true,
        classData: {
          //id: classData.class_code,
          code: classData.class_code,
          name: classData.class_name,
          teacher: classData.teacher_name,
        },
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
        message: response.data.message,
        data: response.data.data,
      })
    } catch (error) {
      console.error("Check-in error:", error.response?.data || error.message)
      socket.emit("check-in-response", {
        success: false,
        error: error.response?.data?.detail || "Check-in failed",
      })
    }
  })

  socket.on("chat-message", (data) => {
    console.log("Chat message received:", data)

    // Broadcast message to all users in the class room
    io.to(`class_${data.classCode}`).emit("chat-message", {
      //id: data.id,
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
      const response = await axios.get(`${PYTHON_API_URL}/user/class/${data.classCode}`)
      const users = response.data.map((user) => ({
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        participationScore: 0, // TODO: Add participation tracking
      }))

      socket.emit("attendance-response", {
        success: true,
        students: users,
      })
    } catch (error) {
      console.error("Get attendance error:", error.message)
      socket.emit("attendance-response", {
        success: true,
        students: [],
      })
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

http.listen(8080, () => console.log("Socket.IO server listening on http://localhost:8080"))
