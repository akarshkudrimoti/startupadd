from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional
import json
import os
from .predictor import InventoryPredictor

app = FastAPI()

# Setup CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
predictor = InventoryPredictor()

# Data models
class Product(BaseModel):
    id: Optional[int] = None
    name: str
    quantity: int
    price: float
    minThreshold: int
    lastUpdated: str

class SaleRecord(BaseModel):
    productId: int
    quantity: int
    date: Optional[str] = None

# File paths for data storage
PRODUCTS_FILE = "data/products.json"
SALES_FILE = "data/sales.json"

# Ensure data directory exists
os.makedirs(os.path.dirname(PRODUCTS_FILE), exist_ok=True)

# Helper functions to read/write data
def read_products():
    if not os.path.exists(PRODUCTS_FILE):
        return []
    with open(PRODUCTS_FILE, "r") as f:
        return json.load(f)

def write_products(products):
    with open(PRODUCTS_FILE, "w") as f:
        json.dump(products, f)

def read_sales():
    if not os.path.exists(SALES_FILE):
        return []
    with open(SALES_FILE, "r") as f:
        return json.load(f)

def write_sales(sales):
    with open(SALES_FILE, "w") as f:
        json.dump(sales, f)

# API endpoints
@app.get("/")
def read_root():
    return {"message": "AI Inventory Management API"}

@app.get("/products")
def get_products():
    return read_products()

@app.post("/products")
def create_product(product: Product):
    products = read_products()
    
    # Generate ID if not provided
    if product.id is None:
        product.id = 1
        if products:
            product.id = max(p["id"] for p in products) + 1
    
    # Convert to dict and add
    product_dict = product.dict()
    products.append(product_dict)
    write_products(products)
    
    return product_dict

@app.post("/sales")
def record_sale(sale: SaleRecord):
    # Set date if not provided
    if sale.date is None:
        sale.date = datetime.now().isoformat()
    
    # Update product quantity
    products = read_products()
    for i, product in enumerate(products):
        if product["id"] == sale.productId:
            products[i]["quantity"] -= sale.quantity
            products[i]["lastUpdated"] = datetime.now().isoformat()
            break
    else:
        raise HTTPException(status_code=404, detail="Product not found")
    
    write_products(products)
    
    # Record sale
    sales = read_sales()
    sale_dict = sale.dict()
    sales.append(sale_dict)
    write_sales(sales)
    
    # Generate prediction
    product = next((p for p in products if p["id"] == sale.productId), None)
    prediction = predictor.predict_inventory(product, sales)
    
    return {
        "sale": sale_dict,
        "prediction": prediction
    }

@app.get("/predictions/{product_id}")
def get_prediction(product_id: int):
    products = read_products()
    product = next((p for p in products if p["id"] == product_id), None)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    sales = read_sales()
    prediction = predictor.predict_inventory(product, sales)
    
    return {
        "product_id": product_id,
        "prediction": prediction
    } 