from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import io
from menu_optimization import MenuOptimizer

app = FastAPI(title="Menu Price Optimizer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

optimizer = MenuOptimizer()

@app.get("/")
async def root():
    return {"message": "Menu Price Optimizer API is running"}

@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload and process a CSV file with menu data"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    contents = await file.read()
    csv_file = io.StringIO(contents.decode('utf-8'))
    
    result = optimizer.load_data(csv_file)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@app.post("/api/optimize")
async def optimize_prices(
    menu_items: str = Form(...),
    settings: str = Form(...)
):
    """Optimize menu prices based on provided data and settings"""
    try:
        menu_items_data = json.loads(menu_items)
        settings_data = json.loads(settings)
        
        result = optimizer.optimize_prices(menu_items_data, settings_data)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 