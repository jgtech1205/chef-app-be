# Chef en Place - Full Stack Integration Guide

## 🚀 Post-Deployment Integration Checklist

### 1. Environment Variables Setup

**Backend (Vercel) Environment Variables:**
```bash
# Required
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/chef-en-place
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=production

# Optional but Recommended
FRONTEND_URL=https://your-frontend-domain.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

**Frontend Environment Variables:**
```bash
# Required
VITE_API_URL=https://your-backend-domain.vercel.app/api
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Optional
VITE_APP_NAME=Chef en Place
VITE_APP_VERSION=1.0.0
```

### 2. Database Setup

1. **Create Super Admin Account:**
   ```bash
   # Run this command locally or in Vercel Functions
   npm run create-super-admin
   ```

2. **Verify Database Connection:**
   ```bash
   curl https://your-backend-domain.vercel.app/api/health/detailed
   ```

### 3. Frontend-Backend Connection

**Update Frontend API Configuration:**
```javascript
// src/config/api.js or similar
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-domain.vercel.app/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

**Update CORS Configuration (if needed):**
```javascript
// In backend server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
```

### 4. Testing the Integration

**1. Health Check:**
```bash
curl https://your-backend-domain.vercel.app/api/health
```

**2. API Documentation:**
Visit: `https://your-backend-domain.vercel.app/api/docs`

**3. Test Authentication:**
```bash
# Test registration
curl -X POST https://your-backend-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test login
curl -X POST https://your-backend-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 5. Stripe Integration

**1. Configure Stripe Webhooks:**
- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://your-backend-domain.vercel.app/api/stripe/webhook`
- Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

**2. Test Stripe Integration:**
```bash
# Test checkout session
curl -X POST https://your-backend-domain.vercel.app/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Test Restaurant",
    "headChefEmail": "chef@test.com",
    "planType": "trial",
    "billingCycle": "monthly"
  }'
```

### 6. File Upload Setup (Cloudinary)

**1. Configure Cloudinary:**
- Set up Cloudinary account
- Add environment variables to backend
- Test image upload functionality

**2. Test File Upload:**
```bash
# Test recipe image upload
curl -X POST https://your-backend-domain.vercel.app/api/recipes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Test Recipe" \
  -F "description=Test description" \
  -F "image=@/path/to/image.jpg"
```

### 7. Production Checklist

**Backend:**
- [ ] Environment variables configured
- [ ] Database connected and seeded
- [ ] Super admin account created
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Health checks working

**Frontend:**
- [ ] API URL configured
- [ ] Environment variables set
- [ ] Authentication flow working
- [ ] Error handling implemented
- [ ] Loading states configured
- [ ] Responsive design tested
- [ ] PWA features working

**Integration:**
- [ ] Frontend can connect to backend
- [ ] Authentication tokens working
- [ ] File uploads functioning
- [ ] Stripe payments processing
- [ ] Real-time features working (if any)
- [ ] Error messages displaying properly

### 8. Monitoring and Maintenance

**1. Set up monitoring:**
- Vercel Analytics
- Error tracking (Sentry, LogRocket)
- Performance monitoring

**2. Regular maintenance:**
- Database backups
- Dependency updates
- Security patches
- Performance optimization

### 9. Troubleshooting Common Issues

**CORS Errors:**
- Check FRONTEND_URL environment variable
- Verify CORS configuration in backend
- Ensure frontend domain is allowed

**Authentication Issues:**
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure proper token storage in frontend

**Database Connection:**
- Verify MONGODB_URI is correct
- Check network access from Vercel
- Ensure database user has proper permissions

**File Upload Issues:**
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper file type validation

### 10. Security Considerations

**Production Security:**
- Use HTTPS everywhere
- Implement proper CORS policies
- Set secure JWT secrets
- Enable rate limiting
- Validate all inputs
- Use environment variables for secrets
- Regular security audits

**API Security:**
- Implement proper authentication
- Use role-based access control
- Validate request data
- Sanitize database inputs
- Monitor for suspicious activity

## 🎯 Next Steps

1. **Test all functionality** in production environment
2. **Set up monitoring** and error tracking
3. **Configure backups** for database
4. **Set up CI/CD** for automated deployments
5. **Document API** for frontend developers
6. **Plan scaling** strategy for growth

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Review error messages in browser console
5. Check database connection status

Your Chef en Place application is now ready for production use! 🚀 