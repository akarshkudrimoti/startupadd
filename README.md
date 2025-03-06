# Restaurant Analytics Platform

A comprehensive analytics platform for restaurants to optimize menu pricing, forecast inventory, and visualize sales data.

## Setup Instructions

### Frontend Setup

1. Install Node.js dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

### Backend Setup

1. Create a Python virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -e backend/
   ```

4. Run the FastAPI server:
   ```
   cd backend
   uvicorn main:app --reload
   ```

## Features

- **Menu Price Optimization**: Analyze sales data to suggest optimal pricing
- **Inventory Forecasting**: Predict inventory needs based on historical usage
- **Sales Visualization**: Interactive charts and graphs for sales analysis
- **Data Upload**: Easy CSV upload for your restaurant data

## Technologies Used

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: FastAPI, pandas, scikit-learn, statsmodels
- **Data Visualization**: Custom React components
