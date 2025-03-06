import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from datetime import datetime, timedelta
import json

class InventoryForecaster:
    def __init__(self):
        self.models = {}
        self.seasonal_periods = 7  # Default to weekly seasonality
        
    def preprocess_data(self, sales_data, recipes):
        """Convert sales data to ingredient usage time series"""
        # Convert to DataFrame
        sales_df = pd.DataFrame(sales_data)
        
        # Ensure date is in datetime format
        sales_df['date'] = pd.to_datetime(sales_df['date'])
        
        # Create a mapping of menu items to their ingredients
        item_to_ingredients = {}
        for recipe in recipes:
            menu_item_id = recipe['menuItemId']
            if menu_item_id not in item_to_ingredients:
                item_to_ingredients[menu_item_id] = []
            
            item_to_ingredients[menu_item_id].append({
                'ingredientId': recipe['ingredientId'],
                'quantity': recipe['quantity']
            })
        
        # Calculate daily ingredient usage
        ingredient_usage = {}
        
        # Group sales by date and item
        daily_sales = sales_df.groupby([sales_df['date'].dt.date, 'itemName']).agg({
            'salesAmount': 'count'  # Count of sales for each item per day
        }).reset_index()
        
        # Map item names to IDs (in a real system, this would be from the database)
        # For this demo, we'll create a simple mapping
        item_name_to_id = {}
        for item_id in item_to_ingredients.keys():
            # Extract item name from the ID (assuming format like "item_1234567890")
            item_name = item_id.replace("item_", "")
            # In a real system, you'd have a proper mapping
            # For now, we'll just use the first few items in sales data
            if len(item_name_to_id) < len(daily_sales['itemName'].unique()):
                item_name = daily_sales['itemName'].unique()[len(item_name_to_id)]
                item_name_to_id[item_name] = item_id
        
        # Calculate ingredient usage for each day
        for _, row in daily_sales.iterrows():
            date = row['date']
            item_name = row['itemName']
            quantity_sold = row['salesAmount']
            
            # Skip if we don't have a mapping for this item
            if item_name not in item_name_to_id:
                continue
                
            item_id = item_name_to_id[item_name]
            
            # Skip if we don't have recipe data for this item
            if item_id not in item_to_ingredients:
                continue
            
            # Calculate ingredient usage
            for ingredient_data in item_to_ingredients[item_id]:
                ingredient_id = ingredient_data['ingredientId']
                ingredient_qty = ingredient_data['quantity']
                
                if ingredient_id not in ingredient_usage:
                    ingredient_usage[ingredient_id] = {}
                
                if date not in ingredient_usage[ingredient_id]:
                    ingredient_usage[ingredient_id][date] = 0
                
                ingredient_usage[ingredient_id][date] += quantity_sold * ingredient_qty
        
        # Convert to time series format
        ingredient_time_series = {}
        for ingredient_id, usage in ingredient_usage.items():
            # Convert to Series
            dates = sorted(usage.keys())
            values = [usage[date] for date in dates]
            ts = pd.Series(values, index=pd.DatetimeIndex(dates))
            
            # Resample to daily frequency, filling missing days with 0
            ts = ts.resample('D').sum().fillna(0)
            
            ingredient_time_series[ingredient_id] = ts
            
        return ingredient_time_series
    
    def train_models(self, sales_data, recipes, ingredients):
        """Train forecasting models for each ingredient"""
        # Preprocess data
        ingredient_time_series = self.preprocess_data(sales_data, recipes)
        
        # Create ingredient ID to name mapping
        ingredient_map = {ing['id']: ing['name'] for ing in ingredients}
        
        # Train a model for each ingredient
        for ingredient_id, ts in ingredient_time_series.items():
            # Skip if we don't have enough data
            if len(ts) < 14:  # Need at least 2 weeks of data
                continue
                
            try:
                # For ingredients with clear weekly patterns, use SARIMA
                if self._has_weekly_pattern(ts):
                    model = SARIMAX(
                        ts,
                        order=(1, 1, 1),
                        seasonal_order=(1, 1, 1, self.seasonal_periods)
                    )
                    fitted_model = model.fit(disp=False)
                else:
                    # Otherwise use simple ARIMA
                    model = ARIMA(ts, order=(1, 1, 1))
                    fitted_model = model.fit()
                
                self.models[ingredient_id] = {
                    'model': fitted_model,
                    'last_date': ts.index[-1],
                    'name': ingredient_map.get(ingredient_id, f"Ingredient {ingredient_id}")
                }
            except Exception as e:
                print(f"Error training model for ingredient {ingredient_id}: {e}")
                # Fallback to simple moving average if model training fails
                self.models[ingredient_id] = {
                    'model': 'moving_average',
                    'history': ts.values,
                    'last_date': ts.index[-1],
                    'name': ingredient_map.get(ingredient_id, f"Ingredient {ingredient_id}")
                }
        
        return len(self.models) > 0
    
    def _has_weekly_pattern(self, time_series):
        """Check if the time series has a weekly pattern"""
        if len(time_series) < 14:  # Need at least 2 weeks
            return False
            
        # Calculate autocorrelation at lag 7
        autocorr = time_series.autocorr(lag=7)
        return autocorr > 0.3  # Threshold for weekly pattern
    
    def forecast(self, days=7):
        """Generate forecasts for each ingredient"""
        if not self.models:
            return [], "No trained models available"
            
        forecasts = []
        today = datetime.now().date()
        
        for ingredient_id, model_data in self.models.items():
            try:
                if model_data['model'] == 'moving_average':
                    # Use simple moving average for fallback
                    history = model_data['history']
                    avg_usage = np.mean(history[-7:])  # Average of last week
                    
                    # Generate forecast
                    forecast_values = [avg_usage] * days
                else:
                    # Use trained statistical model
                    forecast = model_data['model'].forecast(steps=days)
                    forecast_values = forecast.values
                
                # Ensure no negative values
                forecast_values = np.maximum(forecast_values, 0)
                
                # Create date range for forecast
                last_date = model_data['last_date']
                if isinstance(last_date, str):
                    last_date = datetime.strptime(last_date, '%Y-%m-%d').date()
                
                start_date = max(today, last_date + timedelta(days=1))
                date_range = [start_date + timedelta(days=i) for i in range(days)]
                
                # Format forecast
                daily_forecasts = []
                for i, date in enumerate(date_range):
                    daily_forecasts.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'quantity': round(float(forecast_values[i]), 2)
                    })
                
                forecasts.append({
                    'ingredientId': ingredient_id,
                    'ingredientName': model_data['name'],
                    'forecast': daily_forecasts,
                    'totalForecast': round(float(sum(forecast_values)), 2)
                })
            except Exception as e:
                print(f"Error forecasting for ingredient {ingredient_id}: {e}")
        
        # Sort by total forecast amount (descending)
        forecasts.sort(key=lambda x: x['totalForecast'], reverse=True)
        
        return forecasts, "Forecast generated successfully"
    
    def get_low_stock_alerts(self, forecasts, current_stock):
        """Generate alerts for ingredients that may run out"""
        alerts = []
        
        for forecast in forecasts:
            ingredient_id = forecast['ingredientId']
            if ingredient_id not in current_stock:
                continue
                
            current_qty = current_stock[ingredient_id]
            forecast_qty = forecast['totalForecast']
            
            if forecast_qty > current_qty:
                days_until_empty = 0
                running_total = 0
                
                for day in forecast['forecast']:
                    running_total += day['quantity']
                    if running_total > current_qty:
                        break
                    days_until_empty += 1
                
                alerts.append({
                    'ingredientId': ingredient_id,
                    'ingredientName': forecast['ingredientName'],
                    'currentStock': current_qty,
                    'forecastUsage': forecast_qty,
                    'daysUntilEmpty': days_until_empty,
                    'deficit': forecast_qty - current_qty,
                    'status': 'critical' if days_until_empty <= 2 else 'warning'
                })
        
        # Sort by days until empty (ascending)
        alerts.sort(key=lambda x: x['daysUntilEmpty'])
        
        return alerts

    def load_data(self, csv_file):
        """Load and preprocess inventory data from CSV file"""
        try:
            # Read CSV file
            df = pd.read_csv(csv_file)
            
            # Standardize column names
            df.columns = [col.lower().strip() for col in df.columns]
            
            # Find required columns
            item_col = next((col for col in df.columns if any(keyword in col for keyword in ['item', 'product', 'name', 'ingredient'])), None)
            usage_col = next((col for col in df.columns if any(keyword in col for keyword in ['usage', 'quantity', 'amount', 'used'])), None)
            date_col = next((col for col in df.columns if any(keyword in col for keyword in ['date', 'time', 'day'])), None)
            
            if not item_col or not usage_col or not date_col:
                return {"error": "CSV must include columns for item name, usage amount, and date"}
            
            # Rename columns for consistency
            column_mapping = {
                item_col: 'item_name',
                usage_col: 'usage',
                date_col: 'date'
            }
            
            df = df.rename(columns=column_mapping)
            
            # Ensure usage is numeric
            df['usage'] = pd.to_numeric(df['usage'], errors='coerce')
            df = df.dropna(subset=['usage'])
            
            # Convert date to datetime
            try:
                df['date'] = pd.to_datetime(df['date'])
            except:
                return {"error": "Could not parse date column. Please ensure dates are in a standard format."}
            
            # Sort by date
            df = df.sort_values('date')
            
            # Group by item and date, summing usage
            daily_usage = df.groupby(['item_name', pd.Grouper(key='date', freq='D')])['usage'].sum().reset_index()
            
            # Pivot to get time series for each item
            pivot_df = daily_usage.pivot(index='date', columns='item_name', values='usage').fillna(0)
            
            # Store the data
            self.data = pivot_df
            
            # Return summary statistics
            items = df['item_name'].unique()
            date_range = (df['date'].min(), df['date'].max())
            total_days = (date_range[1] - date_range[0]).days + 1
            
            return {
                "success": True,
                "items": items.tolist(),
                "date_range": [date_range[0].strftime('%Y-%m-%d'), date_range[1].strftime('%Y-%m-%d')],
                "total_days": total_days,
                "total_records": len(df)
            }
            
        except Exception as e:
            return {"error": f"Error processing CSV: {str(e)}"}
    
    def forecast_item(self, item_name, days=14):
        """Generate forecast for a specific item"""
        if not hasattr(self, 'data'):
            return {"error": "No data loaded. Please load data first."}
        
        if item_name not in self.data.columns:
            return {"error": f"Item '{item_name}' not found in data"}
        
        try:
            # Get the time series for this item
            series = self.data[item_name]
            
            # Fit ARIMA model
            model = ARIMA(series, order=(5,1,0))
            model_fit = model.fit()
            
            # Generate forecast
            forecast = model_fit.forecast(steps=days)
            
            # Convert forecast to list
            forecast_values = forecast.tolist()
            
            # Generate dates for forecast
            last_date = self.data.index[-1]
            forecast_dates = [(last_date + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(days)]
            
            # Calculate statistics
            avg_daily_usage = series.mean()
            max_daily_usage = series.max()
            total_historical_usage = series.sum()
            
            # Store model for this item
            self.models[item_name] = model_fit
            
            return {
                "success": True,
                "item": item_name,
                "forecast_dates": forecast_dates,
                "forecast_values": forecast_values,
                "avg_daily_usage": float(avg_daily_usage),
                "max_daily_usage": float(max_daily_usage),
                "total_historical_usage": float(total_historical_usage)
            }
            
        except Exception as e:
            return {"error": f"Error forecasting for item '{item_name}': {str(e)}"}
    
    def forecast_all(self, days=14):
        """Generate forecasts for all items"""
        if not hasattr(self, 'data'):
            return {"error": "No data loaded. Please load data first."}
        
        results = []
        
        for item in self.data.columns:
            forecast = self.forecast_item(item, days)
            if "success" in forecast:
                results.append(forecast)
        
        return {
            "success": True,
            "forecasts": results
        } 