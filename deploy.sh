#!/bin/bash
# Smart E-Arsip API - Production Deployment Script
# Run this on production server after pushing code

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║      Smart E-Arsip API - Production Deployment           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/root/smart-e-arsip-api"
PM2_APP_NAME="smart-e-arsip-api"

echo -e "${YELLOW}📂 Navigating to project directory...${NC}"
cd $PROJECT_DIR || exit 1

echo -e "${YELLOW}📥 Pulling latest code from repository...${NC}"
git pull origin main
echo -e "${GREEN}✅ Code pulled successfully${NC}"
echo ""

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

echo -e "${YELLOW}🔄 Restarting PM2 application...${NC}"
pm2 restart $PM2_APP_NAME
echo -e "${GREEN}✅ Application restarted${NC}"
echo ""

echo -e "${YELLOW}📊 Checking application status...${NC}"
pm2 status $PM2_APP_NAME
echo ""

echo -e "${YELLOW}📝 Recent logs (last 30 lines):${NC}"
pm2 logs $PM2_APP_NAME --lines 30 --nostream
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║            ✅ DEPLOYMENT COMPLETED SUCCESSFULLY            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Verify .env file has correct production values"
echo "2. Test Swagger UI: https://api.smart-e-arsip.agribunker.id/api-docs"
echo "3. Clear browser cache before testing"
echo "4. Check Network tab (F12) - requests should go to production URL"
echo ""
echo -e "${YELLOW}Monitor logs:${NC}"
echo "  pm2 logs $PM2_APP_NAME"
echo ""
echo -e "${YELLOW}Check environment:${NC}"
echo "  pm2 env $PM2_APP_NAME | grep APP_URL"
echo ""
