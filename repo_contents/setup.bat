@echo off
SET PYTHON_PATH=C:\Python311\python.exe
%PYTHON_PATH% -m venv .venv
call .venv\Scripts\activate
pip install -r requirements.txt