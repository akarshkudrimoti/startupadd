import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import json
from datetime import datetime

class MenuOptimizer:
    def __init__(self):
        self.price_elasticity_model = None
        self.scaler = StandardScaler()
        
    def load_data(self, csv_file):
        """Load and preprocess menu data from CSV file"""
        try:
            # Read CSV file
            df = pd.read_csv(csv_file)
            
            # Standardize column names
            df.columns = [col.lower().strip() for col in df.columns]
            
            # Find required columns
            food_col = next((col for col in df.columns if any(keyword in col for keyword in ['food', 'item', 'name', 'dish'])), None)
            cost_col = next((col for col in df.columns if 'cost' in col), None)
            date_col = next((col for col in df.columns if any(keyword in col for keyword in ['date', 'time', 'day'])), None)
            
            if not food_col or not cost_col:
                return {"error": "CSV must include columns for food name and cost"}
            
            # Rename columns for consistency
            column_mapping = {
                food_col: 'food_name',
                cost_col: 'cost'
            }
            
            if date_col:
                column_mapping[date_col] = 'date'
                
            df = df.rename(columns=column_mapping)
            
            # Ensure cost is numeric
            df['cost'] = pd.to_numeric(df['cost'], errors='coerce')
            df = df.dropna(subset=['cost'])
            
            # Calculate sales volume by counting occurrences
            sales_volume = df['food_name'].value_counts().reset_index()
            sales_volume.columns = ['food_name', 'sales_volume']
            
            # Get the most recent cost for each item
            if 'date' in df.columns:
                try:
                    df['date'] = pd.to_datetime(df['date'])
                    latest_costs = df.sort_values('date').drop_duplicates('food_name', keep='last')[['food_name', 'cost']]
                except:
                    latest_costs = df.drop_duplicates('food_name', keep='last')[['food_name', 'cost']]
            else:
                latest_costs = df.drop_duplicates('food_name', keep='last')[['food_name', 'cost']]
            
            # Merge sales volume with costs
            menu_data = pd.merge(sales_volume, latest_costs, on='food_name')
            
            # Calculate current price based on default margin
            default_margin = 0.6  # 60% margin
            menu_data['current_price'] = menu_data['cost'] / (1 - default_margin)
            menu_data['current_price'] = menu_data['current_price'].round(2)
            
            # Calculate profit margin
            menu_data['profit_margin'] = ((menu_data['current_price'] - menu_data['cost']) / menu_data['current_price']) * 100
            
            # Add unique IDs
            menu_data['id'] = [f"item-{i}" for i in range(len(menu_data))]
            
            return {
                "success": True,
                "data": menu_data.to_dict(orient='records')
            }
            
        except Exception as e:
            return {"error": f"Error processing CSV: {str(e)}"}
    
    def optimize_prices(self, menu_items, settings):
        """Optimize menu prices based on sales volume and target margins"""
        try:
            df = pd.DataFrame(menu_items)
            
            # Calculate sales thresholds for popularity
            sales_median = df['sales_volume'].median()
            sales_std = df['sales_volume'].std()
            
            high_threshold = sales_median + (sales_std * 0.5)
            low_threshold = sales_median - (sales_std * 0.5)
            
            # Apply optimization logic
            results = []
            
            for _, item in df.iterrows():
                # Determine item popularity
                popularity = 'Medium'
                if item['sales_volume'] <= low_threshold:
                    popularity = 'Low'
                if item['sales_volume'] >= high_threshold:
                    popularity = 'High'
                
                # Adjust target margin based on popularity
                adjusted_margin = settings['targetMargin']
                
                if popularity == 'High':
                    adjusted_margin += settings['highVolumeBonus']
                elif popularity == 'Low':
                    adjusted_margin -= settings['lowVolumeDiscount']
                
                # Calculate suggested price based on adjusted margin
                suggested_price = item['cost'] / (1 - (adjusted_margin / 100))
                
                # Apply price change constraints
                max_price = item['current_price'] * (1 + (settings['maxPriceIncrease'] / 100))
                min_price = item['current_price'] * (1 - (settings['minPriceDecrease'] / 100))
                
                suggested_price = min(suggested_price, max_price)
                suggested_price = max(suggested_price, min_price)
                
                # Round to nearest $0.25
                suggested_price = round(suggested_price * 4) / 4
                
                # Calculate actual margin achieved
                actual_margin = ((suggested_price - item['cost']) / suggested_price) * 100
                
                # Add to results
                item_result = item.to_dict()
                item_result['suggested_price'] = suggested_price
                item_result['suggested_margin'] = actual_margin
                item_result['popularity'] = popularity
                
                results.append(item_result)
            
            # Calculate summary statistics
            current_revenue = sum(item['current_price'] * item['sales_volume'] for item in results)
            current_cost = sum(item['cost'] * item['sales_volume'] for item in results)
            current_profit = current_revenue - current_cost
            current_margin = (current_profit / current_revenue) * 100 if current_revenue > 0 else 0
            
            suggested_revenue = sum(item['suggested_price'] * item['sales_volume'] for item in results)
            suggested_cost = sum(item['cost'] * item['sales_volume'] for item in results)
            suggested_profit = suggested_revenue - suggested_cost
            suggested_margin = (suggested_profit / suggested_revenue) * 100 if suggested_revenue > 0 else 0
            
            profit_increase = suggested_profit - current_profit
            profit_increase_percentage = (profit_increase / current_profit) * 100 if current_profit > 0 else 0
            
            summary = {
                "currentProfit": current_profit,
                "currentMargin": current_margin,
                "suggestedProfit": suggested_profit,
                "suggestedMargin": suggested_margin,
                "profitIncrease": profit_increase,
                "profitIncreasePercentage": profit_increase_percentage
            }
            
            return {
                "success": True,
                "data": results,
                "summary": summary
            }
            
        except Exception as e:
            return {"error": f"Error optimizing prices: {str(e)}"} 