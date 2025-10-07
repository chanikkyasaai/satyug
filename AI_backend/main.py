# backend/main.py
from fastapi import FastAPI
from routers import registration, optimizer, crud
from database import engine
import models
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SAT-YUG")

# CORS for frontend dev (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registration.router)
app.include_router(optimizer.router)
app.include_router(crud.router)

@app.get("/")
def root():
    return {"message": "SAT-YUG running"}
