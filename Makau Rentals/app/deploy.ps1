# Quick Deployment Script for Windows PowerShell

Write-Host "🚀 Makau Rentals Backend Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking for Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI is installed (version: $vercelVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "📋 Pre-Deployment Checklist:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Checklist
$checklist = @(
    "✓ Created PostgreSQL database",
    "✓ Configured environment variables in Vercel dashboard",
    "✓ Updated ALLOWED_HOSTS in settings.py",
    "✓ Set DEBUG=False in production",
    "✓ Generated strong SECRET_KEY"
)

foreach ($item in $checklist) {
    Write-Host "  $item" -ForegroundColor White
}

Write-Host ""
$continue = Read-Host "Have you completed the above steps? (yes/no)"

if ($continue -ne "yes" -and $continue -ne "y") {
    Write-Host ""
    Write-Host "⚠️  Please complete the checklist before deploying." -ForegroundColor Yellow
    Write-Host "   Read VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Yellow
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "🔑 Logging in to Vercel..." -ForegroundColor Yellow
vercel login

Write-Host ""
Write-Host "🚀 Starting deployment..." -ForegroundColor Yellow
Write-Host ""

# Deploy to production
vercel --prod

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "1. Copy your backend URL from the output above" -ForegroundColor White
Write-Host "2. Update your frontend API configuration with this URL" -ForegroundColor White
Write-Host "3. Test your API endpoints" -ForegroundColor White
Write-Host "4. Run migrations on your production database" -ForegroundColor White
Write-Host ""
Write-Host "📊 View logs: vercel logs" -ForegroundColor Yellow
Write-Host "🌐 Open dashboard: vercel dashboard" -ForegroundColor Yellow
Write-Host ""
