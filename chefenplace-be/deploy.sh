#!/bin/bash

echo "🚀 Deploying Chef en Place Backend with CORS Fix..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix CORS configuration for frontend integration"

# Push to trigger Vercel deployment
git push

echo "✅ Deployment triggered!"
echo "⏳ Wait 1-2 minutes for deployment to complete..."
echo ""
echo "🔍 Test your endpoints:"
echo "   Health: https://chef-app-be.vercel.app/api/health"
echo "   CORS Test: curl -H 'Origin: https://chef-app-frontend.vercel.app' -X OPTIONS https://chef-app-be.vercel.app/api/restaurant/signup"
echo ""
echo "🎯 Expected results:"
echo "   - Health endpoint returns JSON"
echo "   - CORS preflight returns 200"
echo "   - Frontend signup works without CORS errors" 