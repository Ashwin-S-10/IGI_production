#!/usr/bin/env pwsh
# Development startup script for IGI Contest Platform

Write-Host "🚀 Starting IGI Contest Platform..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the root directory
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the IGI root directory" -ForegroundColor Red
    exit 1
}

# Check for environment files
$backendEnv = Test-Path "backend\.env"
$frontendEnv = Test-Path "frontend\.env.local"

if (-not $backendEnv) {
    Write-Host "⚠️  Warning: backend\.env not found. Copy from backend\.env.example" -ForegroundColor Yellow
}

if (-not $frontendEnv) {
    Write-Host "⚠️  Warning: frontend\.env.local not found. Copy from frontend\.env.example" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan

# Install backend dependencies
Write-Host "  → Backend..." -ForegroundColor Gray
Push-Location backend
if (-not (Test-Path "node_modules")) {
    npm install --silent
}
Pop-Location

# Install frontend dependencies
Write-Host "  → Frontend..." -ForegroundColor Gray
Push-Location frontend
if (-not (Test-Path "node_modules")) {
    npm install --silent
}
Pop-Location

Write-Host ""
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Starting servers..." -ForegroundColor Cyan
Write-Host "  → Backend: http://localhost:4000" -ForegroundColor Gray
Write-Host "  → Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    npm run dev
}

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in foreground
Set-Location frontend
npm run dev

# Cleanup backend job when frontend stops
Stop-Job $backendJob
Remove-Job $backendJob
