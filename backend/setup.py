from setuptools import setup, find_packages

setup(
    name="restaurant-analytics",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "pandas==2.0.3",
        "numpy==1.24.3",
        "scikit-learn==1.3.0",
        "fastapi==0.100.0",
        "uvicorn==0.23.1",
        "python-multipart==0.0.6",
        "statsmodels==0.14.0"
    ],
) 