  const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send OTP email
const sendOTPEmail = async (to, otp, name = 'User') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@propertymanagement.com',
      to: to,
      subject: 'Property Management System - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Property Management System!</h2>
          <p>Hello ${name},</p>
          <p>Your OTP for verification is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // Don't throw error - allow registration to continue even if email fails
    return false;
  }
};

// Send registration confirmation email
const sendConfirmationEmail = async (to, name = 'User', userType = 'user') => {
  try {
    const transporter = createTransporter();
    
    const roleText = userType === 'agent' ? 'Agent' : 'User';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@propertymanagement.com',
      to: to,
      subject: 'Registration Successful - PropertyHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">🎉 Welcome to PropertyHub!</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: #ffffff; margin: 0;">Registration Successful!</h2>
            </div>
            
            <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Your registration on <strong>PropertyHub</strong> has been <span style="color: #22c55e; font-weight: bold;">successfully completed</span>! 🎊
            </p>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-weight: 500;">Account Type: ${roleText}</p>
              <p style="margin: 5px 0 0 0; color: #1e40af;">Email: ${to}</p>
            </div>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You can now access all features of our platform:
            </p>
            
            <ul style="color: #555; line-height: 1.8;">
              <li>Browse properties</li>
              <li>Save your favorites</li>
              <li>Contact agents</li>
              <li>Manage your profile</li>
              ${userType === 'agent' ? '<li>List your properties</li>' : ''}
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background-color: #3b82f6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>PropertyHub Team</strong>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply to this message.<br>
              © ${new Date().getFullYear()} PropertyHub. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    // Don't throw error - allow verification to continue even if email fails
    return false;
  }
};

// Send property approval confirmation email
const sendPropertyApprovalEmail = async (to, name, propertyDetails) => {
  try {
    const transporter = createTransporter();
    
    const {
      title,
      propertyType,
      city,
      price,
      listingType,
      agentName,
      propertyId
    } = propertyDetails;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@propertymanagement.com',
      to: to,
      subject: '✅ Your Property Has Been Approved - PropertyHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0;">✅ Property Approved!</h1>
            </div>
            
            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: #ffffff; margin: 0;">Approval Confirmed</h2>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Your property listing has been approved</p>
            </div>
            
            <!-- Greeting -->
            <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
            
            <!-- Main Message -->
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Congratulations! You have successfully approved the property listing created by <strong>${agentName || 'your agent'}</strong>.
            </p>
            
            <!-- Property Details Card -->
            <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">📋 Property Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Property Title:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Type:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Location:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${city}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Listing Type:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${listingType === 'sale' ? 'For Sale' : 'For Rent'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Price:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">₹${new Intl.NumberFormat('en-IN').format(price)}</td>
                </tr>
              </table>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0;">⏳ What Happens Next?</h4>
              <p style="margin: 0; color: #78350f; line-height: 1.6;">
                Your property is now pending <strong>admin approval</strong>. Once the admin reviews and approves it, 
                your property will be published and visible to potential buyers/renters on our platform.
              </p>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/property/${propertyId}" 
                 style="background-color: #3b82f6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Property Details
              </a>
            </div>
            
            <!-- Support Section -->
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you have any questions or concerns about this property listing, please contact your agent 
              <strong>${agentName || ''}</strong> or reach out to our support team.
            </p>
            
            <!-- Footer -->
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>PropertyHub Team</strong>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply to this message.<br>
              © ${new Date().getFullYear()} PropertyHub. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Property approval email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending property approval email:', error);
    // Don't throw error - allow approval to continue even if email fails
    return false;
  }
};

// Send property rejection email
const sendPropertyRejectionEmail = async (to, name, propertyDetails, rejectionReason) => {
  try {
    const transporter = createTransporter();
    
    const {
      title,
      propertyType,
      city,
      agentName
    } = propertyDetails;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@propertymanagement.com',
      to: to,
      subject: '❌ Property Listing Declined - PropertyHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ef4444; margin: 0;">❌ Property Listing Declined</h1>
            </div>
            
            <!-- Rejection Banner -->
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: #ffffff; margin: 0;">Listing Not Approved</h2>
            </div>
            
            <!-- Greeting -->
            <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
            
            <!-- Main Message -->
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You have declined the property listing created by <strong>${agentName || 'your agent'}</strong> for the following property:
            </p>
            
            <!-- Property Details -->
            <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #991b1b; margin: 0 0 15px 0;">📋 Property Details</h3>
              <p style="margin: 5px 0; color: #374151;"><strong>Title:</strong> ${title}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Type:</strong> ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Location:</strong> ${city}</p>
            </div>
            
            <!-- Rejection Reason -->
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0;">📝 Reason for Declining:</h4>
              <p style="margin: 0; color: #78350f; line-height: 1.6;">
                ${rejectionReason || 'No reason provided'}
              </p>
            </div>
            
            <!-- Next Steps -->
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              The agent has been notified about your decision. If you have any questions or would like to discuss this further, 
              please contact <strong>${agentName || 'your agent'}</strong> directly.
            </p>
            
            <!-- Footer -->
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>PropertyHub Team</strong>
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply to this message.<br>
              © ${new Date().getFullYear()} PropertyHub. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Property rejection email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending property rejection email:', error);
    return false;
  }
};

// Send property live notification email
const sendPropertyLiveEmail = async (to, name, propertyDetails) => {
  try {
    const transporter = createTransporter();
    
    const {
      title,
      propertyType,
      city,
      price,
      listingType,
      propertyId
    } = propertyDetails;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@propertymanagement.com',
      to: to,
      subject: '🎉 Your Property is Now Live - PropertyHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8b5cf6; margin: 0;">🎉 Property is Live!</h1>
            </div>
            
            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: #ffffff; margin: 0;">Your Property is Now Available</h2>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Approved by admin and visible to buyers</p>
            </div>
            
            <!-- Greeting -->
            <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
            
            <!-- Main Message -->
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your property has been approved by our admin team and is now <strong style="color: #22c55e;">live and visible</strong> 
              to potential ${listingType === 'sale' ? 'buyers' : 'renters'} on PropertyHub! 🎊
            </p>
            
            <!-- Property Details Card -->
            <div style="background-color: #faf5ff; border: 2px solid #d8b4fe; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #6b21a8; margin: 0 0 15px 0; font-size: 18px;">📋 Property Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Property Title:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Type:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Location:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${city}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Listing Type:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${listingType === 'sale' ? 'For Sale' : 'For Rent'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Price:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">₹${new Intl.NumberFormat('en-IN').format(price)}</td>
                </tr>
              </table>
            </div>
            
            <!-- What's Next -->
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">✨ What's Next?</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; line-height: 1.8;">
                <li>Your property is now visible in search results</li>
                <li>Interested buyers/renters can view details and images</li>
                <li>You'll receive notifications when users inquire about your property</li>
                <li>Your agent will handle all communications and viewings</li>
              </ul>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/property/${propertyId}" 
                 style="background-color: #8b5cf6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">
                View Live Listing
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/user-dashboard/properties" 
                 style="background-color: #3b82f6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                My Properties
              </a>
            </div>
            
            <!-- Footer -->
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Thank you for choosing PropertyHub. We wish you a successful sale/rental!
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>PropertyHub Team</strong>
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply to this message.<br>
              © ${new Date().getFullYear()} PropertyHub. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Property live email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending property live email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendConfirmationEmail,
  sendPropertyApprovalEmail,
  sendPropertyRejectionEmail,
  sendPropertyLiveEmail
};
