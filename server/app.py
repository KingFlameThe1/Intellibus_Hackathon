import os
from datetime import datetime
from typing import List, Annotated
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, BeforeValidator
import motor.motor_asyncio  

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connection = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL")) 
db = connection.ClassPulse
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserData(BaseModel):
    id: PyObjectId | None = Field(default=PyObjectId, alias="_id")
    first_name: str
    last_name: str
    role: str
    email: str
    password: str

class ClassData(BaseModel):
    class_name: str
    class_code: str
    teacher_name: str
    check_in: datetime | None = Field(default_factory=datetime.now)

class Check_in(BaseModel):
    email: str
    class_code: str
    check_in: datetime | None = Field(default_factory=datetime.now)

# Routes
@app.get("/class", response_model=List[ClassData])
async def get_all_classes():
    classes_cursor = db["Class_Data"].find()
    classes = await classes_cursor.to_list(length=None)
    if not classes:
        raise HTTPException(status_code=404, detail="No classes found")
    return [ClassData(**cls) for cls in classes]

@app.get("/class/{class_code}", response_model=List[ClassData])
async def get_class(class_code: str):
    result = await db["Class_Data"].find_one({"class_code": class_code})
    if not result:
        raise HTTPException(status_code=404, detail=f"Class code '{class_code}' not found")
    return [ClassData(**result)] 

@app.post("/class")
async def add_class_data(data: ClassData):
    class_doc = data.model_dump()
    result = await db["Class_Data"].insert_one(class_doc)
    datum = await db["Class_Data"].find_one({"_id": result.inserted_id})
    return ClassData(**datum) 

@app.get("/user", response_model=List[UserData])
async def get_all_users():
    user_cursor = db["Class_Data"].find()
    users = await user_cursor.to_list(length=None)
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return [UserData(**cls) for cls in users]

@app.get("/user/class/{class_code}", response_model=List[UserData])
async def get_users_by_class(class_code: str):
    user_cursor = db["User_Data"].find({"class_code": class_code})
    users = await user_cursor.to_list(length=None)
    if not users:
        raise HTTPException(status_code=404, detail=f"No users found for class code '{class_code}'")
    return [UserData(**user) for user in users]

@app.post("/user")
async def add_user_data(data: UserData):
    user_doc = data.model_dump()
    result = await db["User_Data"].insert_one(user_doc)
    datum = await db["User_Data"].find_one({"_id": result.inserted_id})
    return UserData(**datum)

@app.post("/check_in")
async def check_in_time(data: Check_in):
    class_result = await db["Class_Data"].find_one({"class_code": data.class_code})
    if not class_result:
        raise HTTPException(status_code=404, detail=f"Class with code '{data.class_code}' not found")

    user_result = await db["User_Data"].find_one({"email": data.email})
    if not user_result:
        raise HTTPException(status_code=404, detail=f"User with email '{data.email}' not found")

    check_in_doc = data.model_dump(by_alias=True)
    result = await db["CheckIn_Data"].insert_one(check_in_doc)
    saved_record = await db["CheckIn_Data"].find_one({"_id": result.inserted_id})

    return {
        "message": "Check-in successful",
        "data": {
            "class_code": saved_record["class_code"],
            "email": saved_record["email"],
            "check_in": saved_record["check_in"]
        }
    }