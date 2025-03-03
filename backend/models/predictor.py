import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
import pickle
import os
from typing import Dict, List

class InventoryPredictor:
    def __init__(self):
        self.model_path = "models/inventory_model.pkl"
        self.model = self._load_model()
    
    def _load_model(self):
        """Load existing model or create a new one"""
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                return pickle.load(f)
        else:
            # Create a basic model
            return RandomForestRegressor(n_estimators=100, random_state=42)
    
    def _save_model(self):
        """Save model to disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
    
    def _prepare_features(self, product: Dict, date: datetime) -> np.ndarray:
        """Convert product data to ML features"""
        return np.array([
            product["quantity"],
            product["price"],
            date.weekday(),  # Day of week (0-6)
            date.month,      # Month (1-12)
            product["minThreshold"]
        ]).reshape(1, -1)
    
    def _train_model(self, products: List[Dict], sales: List[Dict]):
        """Train model with available data"""
        if not sales or len(sales) < 5:
            return  # Not enough data
        
        features = []
        labels = []
        
        # Create dataset from sales history
        for sale in sales:
            product_id = sale["productId"]
            product = next((p for p in products if p["id"] == product_id), None)
            
            if product:
                sale_date = datetime.fromisoformat(sale["date"])
                X = self._prepare_features(product, sale_date)[0]
                y = sale["quantity"]
                
                features.append(X)
                labels.append(y)
        
        if features:
            X = np.array(features)
            y = np.array(labels)
            self.model.fit(X, y)
            self._save_model()
    
    def predict_inventory(self, product: Dict, sales: List[Dict]) -> Dict:
        """Generate inventory prediction for a product"""
        # Filter sales for this product
        product_sales = [s for s in sales if s["productId"] == product["id"]]
        
        # Get all products for training
        all_products = self._get_all_products()
        
        # Train model with latest data
        if len(product_sales) >= 5:
            self._train_model(all_products, sales)
        
        # Make prediction
        try:
            X = self._prepare_features(product, datetime.now())
            predicted_sales = self.model.predict(X)[0]
        except:
            # Fallback if model fails
            if product_sales:
                predicted_sales = sum(s["quantity"] for s in product_sales) / len(product_sales)
            else:
                predicted_sales = 0
        
        # Calculate reorder recommendation
        days_to_empty = 0
        if predicted_sales > 0:
            days_to_empty = max(0, product["quantity"] / predicted_sales * 7)
        
        reorder_needed = product["quantity"] <= product["minThreshold"]
        
        return {
            "predicted_weekly_sales": round(predicted_sales, 2),
            "days_until_empty": round(days_to_empty, 1),
            "reorder_needed": reorder_needed,
            "recommended_order": max(0, round(predicted_sales * 2 - product["quantity"]))
        }
    
    def _get_all_products(self) -> List[Dict]:
        """Helper to read products file"""
        products_file = "data/products.json"
        if os.path.exists(products_file):
            with open(products_file, "r") as f:
                import json
                return json.load(f)
        return [] 