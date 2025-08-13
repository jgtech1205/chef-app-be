const { validationResult } = require('express-validator');
const User = require('../database/models/User');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const jwt = require('jsonwebtoken');
const Restaurant = require('../database/models/Restaurant'); // Added missing import

const userController = {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          email,
          _id: { $ne: user._id },
        });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      user.name = name || user.name;
      user.email = email || user.email;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const user = await User.findById(req.user.id);

      // Delete old avatar if exists
      if (user.avatar) {
        // Extract public_id from cloudinary URL if needed
        // await deleteImage(publicId);
      }

      // Upload new avatar
      const uploadResult = await uploadImage(req.file, 'avatars');

      user.avatar = uploadResult.secure_url;
      await user.save();

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete avatar
  async deleteAvatar(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (user.avatar) {
        // Delete from cloudinary if needed
        user.avatar = null;
        await user.save();
      }

      res.json({
        success: true,
        message: 'Avatar deleted successfully',
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update preferences
  async updatePreferences(req, res) {
    try {
      const { language, notifications } = req.body;
      const user = await User.findById(req.user.id);

      if (language) {
        user.preferences.language = language;
      }

      if (notifications) {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...notifications,
        };
      }

      await user.save();

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: user.preferences,
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get team members
  async getTeamMembers(req, res) {
    try {
      // Filter team members by the requesting user's organization
      const userOrganization = req.user.organization;
      
      const users = await User.find({ 
        isActive: true,
        organization: userOrganization
      })
        .select('-password')
        .sort({ role: 1, name: 1 });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Get team members error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Invite team member
  async inviteTeamMember(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, role, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: 'User with this email already exists' });
      }

      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const newUser = new User({
        email,
        password: tempPassword,
        name: name || email.split('@')[0],
        role,
      });

      await newUser.save();

      // In production, send invitation email with temporary password

      res.status(201).json({
        success: true,
        message: 'Team member invited successfully',
        data: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          tempPassword, // Remove this in production
        },
      });
    } catch (error) {
      console.error('Invite team member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update team member
  async updateTeamMember(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { role, isActive, status, permissions } = req.body;
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (role) user.role = role;
      if (typeof isActive === 'boolean') user.isActive = isActive;

      if (permissions) {
        user.permissions = { ...user.permissions, ...permissions };
      }

      const wasPending = user.status === 'pending';
      if (status) user.status = status;
      await user.save();

      // If user was just approved (status changed from pending to active), return login URL
      let loginUrl = null;
      if (wasPending && user.status === 'active') {
        loginUrl = `${process.env.FRONTEND_URL || 'https://app.chefenplace.com'}/login/${user.organization}`;
      }

      res.json({
        success: true,
        message: 'Team member updated successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          status: user.status,
        },
        loginUrl, // Include login URL if user was just approved
      });
    } catch (error) {
      console.error('Update team member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Remove team member
  async removeTeamMember(req, res) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Soft delete - deactivate user
      user.isActive = false;
      await user.save();

      res.json({
        success: true,
        message: 'Team member removed successfully',
      });
    } catch (error) {
      console.error('Remove team member error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Generate invite link for new chefs
  async generateInviteLink(req, res) {
    try {
      const token = jwt.sign(
        { headChefId: req.user.id },
        process.env.CHEF_INVITE_SECRET || 'chef-invite-secret',
        { expiresIn: '7d' },
      );

      const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chef-invite/${token}`;

      res.json({ success: true, url });
    } catch (error) {
      console.error('Generate invite link error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // List pending chefs for head chef
  async listPendingChefs(req, res) {
    try {
      // Filter by both headChef AND organization for extra security
      const chefs = await User.find({ 
        headChef: req.user.id, 
        organization: req.user.organization,
        role: 'user', 
        status: 'pending' 
      }).select('name status');
      res.json({ success: true, data: chefs });
    } catch (error) {
      console.error('List pending chefs error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Approve or reject pending chef
  async updatePendingChef(req, res) {
    try {
      const { status } = req.body;
      if (!['active', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const chef = await User.findOne({ 
        _id: req.params.id, 
        headChef: req.user.id, 
        organization: req.user.organization,
        role: 'user' 
      });
      if (!chef) {
        return res.status(404).json({ message: 'Chef not found' });
      }

      chef.status = status;
      await chef.save();

      res.json({ success: true, message: 'Chef status updated', data: { id: chef._id, status: chef.status } });
    } catch (error) {
      console.error('Update pending chef error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Request access to become a chef under a head chef
  async requestChefAccess(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: "Please fill in both first name and last name",
          error: "validation_error",
          errors: errors.array() 
        })
      }

      const { headChefId, firstName, lastName } = req.body

      // Validate required fields - 400 errors
      if (!headChefId || typeof headChefId !== 'string' || headChefId.trim().length === 0) {
        return res.status(400).json({ 
          message: "Invalid restaurant identifier",
          error: "invalid_head_chef_id"
        })
      }

      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ 
          message: "Please fill in both first name and last name",
          error: "invalid_first_name"
        })
      }

      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        return res.status(400).json({ 
          message: "Please fill in both first name and last name",
          error: "invalid_last_name"
        })
      }

      // Validate name length
      if (firstName.trim().length < 1 || firstName.trim().length > 50) {
        return res.status(400).json({ 
          message: "First name must be between 1 and 50 characters",
          error: "invalid_first_name_length"
        })
      }

      if (lastName.trim().length < 1 || lastName.trim().length > 50) {
        return res.status(400).json({ 
          message: "Last name must be between 1 and 50 characters",
          error: "invalid_last_name_length"
        })
      }

      // Find head chef - 404 error
      const headChef = await User.findOne({ _id: headChefId, role: 'head-chef' })
      if (!headChef) {
        return res.status(404).json({ 
          message: "Restaurant not found",
          error: "head_chef_not_found"
        })
      }

      // Check if head chef is active
      if (!headChef.isActive) {
        return res.status(403).json({ 
          message: "Restaurant access is currently suspended",
          error: "head_chef_inactive"
        })
      }

      // Check for name uniqueness within the same organization - 400 error
      const existingChef = await User.findOne({ 
        firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
        lastName: { $regex: new RegExp(`^${lastName}$`, 'i') },
        organization: headChef.organization,
        role: 'team-member',
        isActive: true
      })
      
      if (existingChef) {
        return res.status(400).json({ 
          message: "A team member with this name already exists in this restaurant. Please use a different name or contact the restaurant manager.",
          error: "duplicate_name"
        })
      }
      
      // Create username and password from first and last name
      const username = firstName.trim();
      const password = lastName.trim();
      
      // Hash the password
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(password, 12)

      const chef = new User({
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${headChef.organization}.local`, // Simple email format
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`, // Will be auto-generated by pre-save middleware
        role: 'team-member',
        headChef: headChefId,
        organization: headChef.organization, // Set organization from head chef
        status: 'pending', // Team members start as pending
        isActive: true,
        permissions: {
          // Default view permissions for team members
          canViewRecipes: true,
          canViewPlateups: true,
          canViewNotifications: true,
          canViewPanels: true,
          // All other permissions remain false by default
        },
      })

      await chef.save()

      // Return response with login credentials
      res.status(201).json({ 
        id: chef._id.toString(), 
        status: chef.status, 
        userId: chef._id.toString(),
        loginCredentials: {
          username: username,
          password: password,
          message: "Use your first name as username and last name as password to log in"
        }
      })
    } catch (error) {
      console.error('Request chef access error:', error)
      res.status(500).json({ 
        message: "Server error. Please try again later.",
        error: "server_error"
      })
    }
  },

  // Get user status by ID
  async getUserStatus(req, res) {
    try {
      const user = await User.findById(req.params.id).select('status');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ success: true, status: user.status });
    } catch (error) {
      console.error('Get user status error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get profile by user ID
  async getProfileById(req, res) {
    try {
      const user = await User.findById(req.params.id).select('name status');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ 
        data: { 
          id: user._id.toString(), 
          status: user.status, 
          name: user.name 
        } 
      });
    } catch (error) {
      console.error('Get profile by id error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get saved recipes for workstation
  async getSavedRecipes(req, res) {
    try {
      const user = await User.findById(req.user.id).populate('savedRecipes');
      res.json({ success: true, data: user.savedRecipes || [] });
    } catch (error) {
      console.error('Get saved recipes error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Generate team member login link for organization
  async generateTeamMemberLoginLink(req, res) {
    try {
      const { organizationId } = req.params;
      
      // Verify the head chef owns this organization
      const headChef = await User.findOne({ 
        _id: req.user.id,
        role: 'head-chef',
        organization: organizationId,
        isActive: true 
      });
      
      if (!headChef) {
        return res.status(403).json({ message: 'Access denied or organization not found' });
      }
      
      // Get all active team members for this organization
      const teamMembers = await User.find({ 
        organization: organizationId,
        role: 'user',
        status: 'active',
        isActive: true 
      }).select('_id name email status');
      
      // Generate the login link
      const baseUrl = process.env.FRONTEND_URL || 'https://chef-app-frontend.vercel.app';
      const loginLink = `${baseUrl}/restaurant/${organizationId}`;
      
      res.json({
        success: true,
        data: {
          organizationId: organizationId,
          organizationName: headChef.organization || 'Restaurant',
          loginLink: loginLink,
          qrCodeUrl: loginLink,
          teamMembers: teamMembers.map(member => ({
            id: member._id,
            name: member.name,
            email: member.email,
            status: member.status,
            loginUrl: `${baseUrl}/api/auth/login/${organizationId}/${member._id}`
          })),
          instructions: {
            qrCode: `Scan QR code or visit: ${loginLink}`,
            manualLogin: `Team members can login using: POST /api/auth/login/${organizationId}/{chefId}`,
            chefIds: teamMembers.map(member => `${member.name}: ${member._id}`)
          }
        }
      });
    } catch (error) {
      console.error('Generate team member login link error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all organizations for head chef with login links
  async getOrganizationsWithLoginLinks(req, res) {
    try {
      // Get all organizations where this user is the head chef
      const restaurants = await Restaurant.find({ 
        headChef: req.user.id,
        isActive: true 
      }).select('name organizationId status');
      
      const baseUrl = process.env.FRONTEND_URL || 'https://chef-app-frontend.vercel.app';
      
      const organizations = restaurants.map(restaurant => ({
        id: restaurant.organizationId,
        name: restaurant.name,
        status: restaurant.status,
        loginLink: `${baseUrl}/restaurant/${restaurant.organizationId}`,
        qrCodeUrl: `${baseUrl}/restaurant/${restaurant.organizationId}`,
        teamMemberLoginEndpoint: `/api/auth/login/${restaurant.organizationId}/{chefId}`
      }));
      
      res.json({
        success: true,
        data: organizations
      });
    } catch (error) {
      console.error('Get organizations with login links error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get team member folder with login information
  async getTeamMemberFolder(req, res) {
    try {
      // Get all team members for this head chef
      const teamMembers = await User.find({ 
        headChef: req.user.id,
        role: 'user',
        isActive: true 
      }).select('_id name email status organization permissions lastLogin');
      
      // Get organization information
      const restaurants = await Restaurant.find({ 
        headChef: req.user.id,
        isActive: true 
      }).select('name organizationId status');
      
      const baseUrl = process.env.FRONTEND_URL || 'https://chef-app-frontend.vercel.app';
      
      // Group team members by organization
      const organizationGroups = {};
      
      restaurants.forEach(restaurant => {
        organizationGroups[restaurant.organizationId] = {
          id: restaurant.organizationId,
          name: restaurant.name,
          status: restaurant.status,
          loginLink: `${baseUrl}/restaurant/${restaurant.organizationId}`,
          qrCodeUrl: `${baseUrl}/restaurant/${restaurant.organizationId}`,
          teamMemberLoginEndpoint: `/api/auth/login/${restaurant.organizationId}/{chefId}`,
          teamMembers: []
        };
      });
      
      // Add team members to their organizations
      teamMembers.forEach(member => {
        const orgId = member.organization;
        if (organizationGroups[orgId]) {
          organizationGroups[orgId].teamMembers.push({
            id: member._id,
            name: member.name,
            email: member.email,
            status: member.status,
            permissions: member.permissions,
            lastLogin: member.lastLogin,
            loginUrl: `${baseUrl}/api/auth/login/${orgId}/${member._id}`,
            loginInstructions: {
              qrCode: `Scan QR code: ${baseUrl}/restaurant/${orgId}`,
              manualLogin: `POST /api/auth/login/${orgId}/${member._id}`,
              chefId: member._id
            }
          });
        }
      });
      
      // Convert to array and add summary
      const organizations = Object.values(organizationGroups);
      
      const summary = {
        totalOrganizations: organizations.length,
        totalTeamMembers: teamMembers.length,
        activeTeamMembers: teamMembers.filter(m => m.status === 'active').length,
        pendingTeamMembers: teamMembers.filter(m => m.status === 'pending').length,
        rejectedTeamMembers: teamMembers.filter(m => m.status === 'rejected').length
      };
      
      res.json({
        success: true,
        data: {
          summary,
          organizations,
          instructions: {
            qrCodeUsage: "Team members can scan QR codes to access the restaurant",
            manualLoginUsage: "Use team member login endpoint with organization ID and chef ID",
            autoLoginInfo: "Team members are automatically logged in when approved"
          }
        }
      });
    } catch (error) {
      console.error('Get team member folder error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get specific team member details with login info
  async getTeamMemberDetails(req, res) {
    try {
      const { memberId } = req.params;
      
      const teamMember = await User.findOne({ 
        _id: memberId,
        headChef: req.user.id,
        role: 'user'
      }).select('_id name email status organization permissions lastLogin createdAt');
      
      if (!teamMember) {
        return res.status(404).json({ message: 'Team member not found' });
      }
      
      // Get organization info
      const restaurant = await Restaurant.findOne({ 
        organizationId: teamMember.organization,
        headChef: req.user.id
      }).select('name organizationId status');
      
      const baseUrl = process.env.FRONTEND_URL || 'https://chef-app-frontend.vercel.app';
      
      const loginInfo = {
        organizationId: teamMember.organization,
        organizationName: restaurant?.name || 'Unknown Restaurant',
        qrCodeUrl: `${baseUrl}/restaurant/${teamMember.organization}`,
        teamMemberLoginEndpoint: `/api/auth/login/${teamMember.organization}/${teamMember._id}`,
        directLoginUrl: `${baseUrl}/api/auth/login/${teamMember.organization}/${teamMember._id}`,
        instructions: {
          qrCode: `Scan QR code: ${baseUrl}/restaurant/${teamMember.organization}`,
          manualLogin: `POST /api/auth/login/${teamMember.organization}/${teamMember._id}`,
          chefId: teamMember._id
        }
      };
      
      res.json({
        success: true,
        data: {
          teamMember: {
            id: teamMember._id,
            name: teamMember.name,
            email: teamMember.email,
            status: teamMember.status,
            permissions: teamMember.permissions,
            lastLogin: teamMember.lastLogin,
            createdAt: teamMember.createdAt
          },
          loginInfo,
          organization: restaurant
        }
      });
    } catch (error) {
      console.error('Get team member details error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get team member reactivation links (for after 1-year token expires)
  async getTeamMemberReactivationLinks(req, res) {
    try {
      // Get all team members for this head chef
      const teamMembers = await User.find({ 
        headChef: req.user.id,
        role: 'user',
        isActive: true 
      }).select('_id name email status organization lastLogin');
      
      // Get organization information
      const restaurants = await Restaurant.find({ 
        headChef: req.user.id,
        isActive: true 
      }).select('name organizationId status');
      
      const baseUrl = process.env.FRONTEND_URL || 'https://chef-app-frontend.vercel.app';
      
      // Create reactivation links for each team member
      const reactivationLinks = teamMembers.map(member => {
        const restaurant = restaurants.find(r => r.organizationId === member.organization);
        
        return {
          teamMemberId: member._id,
          name: member.name,
          email: member.email,
          status: member.status,
          organizationId: member.organization,
          organizationName: restaurant?.name || 'Unknown Restaurant',
          lastLogin: member.lastLogin,
          reactivationLink: `${baseUrl}/api/auth/login/${member.organization}/${member._id}`,
          reactivationInstructions: {
            title: "Team Member Reactivation Link",
            description: "Use this link to reactivate login after 1-year token expires",
            method: "POST",
            url: `/api/auth/login/${member.organization}/${member._id}`,
            fullUrl: `${baseUrl}/api/auth/login/${member.organization}/${member._id}`,
            note: "No credentials needed - just POST to this URL to get new tokens"
          }
        };
      });
      
      // Group by organization for easier management
      const organizationGroups = {};
      reactivationLinks.forEach(link => {
        if (!organizationGroups[link.organizationId]) {
          organizationGroups[link.organizationId] = {
            organizationId: link.organizationId,
            organizationName: link.organizationName,
            teamMembers: []
          };
        }
        organizationGroups[link.organizationId].teamMembers.push(link);
      });
      
      res.json({
        success: true,
        data: {
          totalTeamMembers: teamMembers.length,
          activeTeamMembers: teamMembers.filter(m => m.status === 'active').length,
          reactivationLinks,
          organizationGroups: Object.values(organizationGroups),
          instructions: {
            title: "Team Member Reactivation After 1 Year",
            description: "When team member tokens expire after 1 year, they can use these links to reactivate their login",
            usage: "Team members can POST to their reactivation link to get new tokens without needing credentials",
            note: "These links work for active team members only"
          }
        }
      });
    } catch (error) {
      console.error('Get team member reactivation links error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get specific team member reactivation link
  async getTeamMemberReactivationLink(req, res) {
    try {
      const { memberId } = req.params;
      
      const teamMember = await User.findOne({ 
        _id: memberId,
        headChef: req.user.id,
        role: 'user',
        isActive: true
      }).select('_id name email status organization lastLogin');
      
      if (!teamMember) {
        return res.status(404).json({ message: 'Team member not found or inactive' });
      }
      
      // Get organization info
      const restaurant = await Restaurant.findOne({ 
        organizationId: teamMember.organization,
        headChef: req.user.id
      }).select('name organizationId status');
      
      const baseUrl = process.env.FRONTEND_URL || 'https://chef-app-frontend.vercel.app';
      
      const reactivationInfo = {
        teamMemberId: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        status: teamMember.status,
        organizationId: teamMember.organization,
        organizationName: restaurant?.name || 'Unknown Restaurant',
        lastLogin: teamMember.lastLogin,
        reactivationLink: `${baseUrl}/api/auth/login/${teamMember.organization}/${teamMember._id}`,
        reactivationEndpoint: `/api/auth/login/${teamMember.organization}/${teamMember._id}`,
        instructions: {
          title: "Team Member Reactivation Link",
          description: "Use this link to reactivate login after 1-year token expires",
          method: "POST",
          url: `/api/auth/login/${teamMember.organization}/${teamMember._id}`,
          fullUrl: `${baseUrl}/api/auth/login/${teamMember.organization}/${teamMember._id}`,
          note: "No credentials needed - just POST to this URL to get new tokens",
          curlExample: `curl -X POST ${baseUrl}/api/auth/login/${teamMember.organization}/${teamMember._id} -H "Content-Type: application/json"`
        }
      };
      
      res.json({
        success: true,
        data: reactivationInfo
      });
    } catch (error) {
      console.error('Get team member reactivation link error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

};

module.exports = userController;
