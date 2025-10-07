# backend/main.py
from fastapi import FastAPI
from routers import registration, optimizer, crud, assistant, get_timetable, tier1
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SAT-YUG")

app.include_router(registration.router)
app.include_router(optimizer.router)
app.include_router(crud.router)
app.include_router(assistant.router)
app.include_router(get_timetable.router)
app.include_router(tier1.router)

@app.get("/")
def root():
    return {"message": "SAT-YUG running"}
