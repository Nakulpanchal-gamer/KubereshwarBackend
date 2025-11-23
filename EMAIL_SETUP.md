# Email Setup Guide - Resend API

## Problem
Render and most cloud platforms **block SMTP ports** (25, 587, 465), which prevents direct SMTP connections from working. This is why your email wasn't working.

## Solution
We've switched from SMTP (nodemailer) to **Resend API**, which uses HTTP/HTTPS and works perfectly on Render and other cloud platforms.

---

## Setup Instructions

### Step 1: Create a Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

### Step 2: Get Your API Key
1. After logging in, go to **API Keys** section
2. Click **Create API Key**
3. Give it a name (e.g., "Kubereshwar Production")
4. Copy the API key (starts with `re_`)

### Step 3: Verify Your Domain (Recommended) or Use Test Email
**Option A: Use Your Own Domain (Recommended for Production)**
1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `kubereshwarpress.com`)
4. Add the DNS records Resend provides to your domain's DNS settings
5. Wait for verification (usually a few minutes)
6. Once verified, you can use emails like `noreply@kubereshwarpress.com`

**Option B: Use Resend Test Email (Quick Start)**
- For testing, you can use `onboarding@resend.dev` (already set as fallback)
- This works immediately but emails will come from Resend's domain

### Step 4: Configure Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add/Update these variables:

```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=your-admin@example.com
MAIL_FROM_NAME=Kubereshwar Website
EMAIL_DEBUG=false
```

**Important Notes:**
- `RESEND_API_KEY`: Your Resend API key (starts with `re_`)
- `RESEND_FROM_EMAIL`: The verified email address you want to send from
  - If using your domain: `noreply@kubereshwarpress.com`
  - If testing: `onboarding@resend.dev`
- `ADMIN_EMAIL`: Where enquiry emails should be delivered
- `EMAIL_DEBUG`: Set to `true` to see detailed email logs

### Step 5: Install Dependencies
The code has been updated to use Resend. You need to:

1. **On Render**: The next deployment will automatically install the new `resend` package
2. **Locally** (if testing): Run `npm install` in your backend folder

### Step 6: Deploy
1. Commit and push your changes
2. Render will automatically redeploy
3. Check the logs to ensure Resend is configured correctly

---

## Testing

### Enable Debug Mode
Set `EMAIL_DEBUG=true` in your Render environment variables to see detailed logs.

### Test Email Sending
1. Submit a contact form enquiry from your website
2. Check Render logs for email sending status
3. Check your `ADMIN_EMAIL` inbox for the enquiry email

---

## Troubleshooting

### Email Not Sending?
1. **Check API Key**: Ensure `RESEND_API_KEY` is set correctly in Render
2. **Check From Email**: Ensure `RESEND_FROM_EMAIL` is verified in Resend dashboard
3. **Check Logs**: Enable `EMAIL_DEBUG=true` and check Render logs
4. **Check Resend Dashboard**: Go to Resend dashboard → Logs to see delivery status

### Common Errors

**Error: "Invalid API key"**
- Verify your `RESEND_API_KEY` is correct
- Make sure there are no extra spaces

**Error: "Domain not verified"**
- If using custom domain, ensure DNS records are added correctly
- Use `onboarding@resend.dev` for testing

**Error: "Rate limit exceeded"**
- Free tier: 100 emails/day
- Upgrade to paid plan if needed

---

## Why Resend Instead of Other Platforms?

✅ **Works on Render** - No port blocking issues  
✅ **Easy Setup** - Simple API, no complex SMTP config  
✅ **Free Tier** - 100 emails/day free  
✅ **Reliable** - Modern email infrastructure  
✅ **Good Deliverability** - Emails reach inbox, not spam  

### Alternative Options (if needed):
- **SendGrid** - Similar API, also works well
- **Mailgun** - More complex but powerful
- **AWS SES** - Cheapest but more setup required

---

## Environment Variables Summary

**Required:**
- `RESEND_API_KEY` - Your Resend API key
- `ADMIN_EMAIL` - Where to send enquiry emails

**Optional:**
- `RESEND_FROM_EMAIL` - From email address (defaults to `onboarding@resend.dev`)
- `MAIL_FROM_NAME` - Display name (defaults to "Kubereshwar Website")
- `EMAIL_DEBUG` - Enable debug logging (`true`/`false`)

**No Longer Needed (can be removed):**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `SMTP_DEBUG`

---

## Need Help?

1. Check Resend documentation: https://resend.com/docs
2. Check Render logs for error messages
3. Enable `EMAIL_DEBUG=true` for detailed logging


