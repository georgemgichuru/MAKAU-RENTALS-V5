# Backend Deployment Script - Step by Step
# Run this manually in PowerShell

Write-Host "🚀 MAKAU RENTALS BACKEND DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location "c:\Users\George Mwangi\Desktop\MAKAU-RENTALS-V5\Makau Rentals\app"

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 Starting Vercel deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "When prompted:" -ForegroundColor Green
Write-Host "  1. Set up and deploy? → yes" -ForegroundColor White
Write-Host "  2. Which scope? → George Mwangi's projects" -ForegroundColor White
Write-Host "  3. Link to existing project? → no" -ForegroundColor White
Write-Host "  4. Project name? → makau-rentals-backend" -ForegroundColor White
Write-Host "  5. Code directory? → ./" -ForegroundColor White
Write-Host "  6. Change settings? → no" -ForegroundColor White
Write-Host ""

# Deploy
vercel --prod

Write-Host ""
Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "1. Copy your backend URL from the output above" -ForegroundColor White
Write-Host "2. Go to Vercel Dashboard → makau-rentals-backend → Settings → Environment Variables" -ForegroundColor White
Write-Host "3. Add all variables from VERCEL_ENV_VARIABLES.txt" -ForegroundColor White
Write-Host "4. Update DATABASE_URL with your Supabase password" -ForegroundColor White
Write-Host "5. Redeploy: vercel --prod" -ForegroundColor White
Write-Host ""
