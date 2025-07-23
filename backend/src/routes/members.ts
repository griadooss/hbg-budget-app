import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import emailService from '../services/emailService';

const router = express.Router();
const prisma = new PrismaClient();

// Member signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, postcode, phone, newsletterOptIn } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !postcode) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'email', 'postcode']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Postcode validation (Australian format)
    const postcodeRegex = /^\d{4}$/;
    if (!postcodeRegex.test(postcode)) {
      return res.status(400).json({
        error: 'Invalid postcode format (must be 4 digits)'
      });
    }

    // Check if member already exists
    const existingMember = await prisma.member.findUnique({
      where: { email }
    });

    if (existingMember) {
      return res.status(409).json({
        error: 'Member with this email already exists'
      });
    }

    // Create new member
    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        postcode,
        phone: phone || null,
        newsletterOptIn: newsletterOptIn !== false, // Default to true
        signupSource: 'WEBSITE',
        signupDate: new Date(),
        lastActivity: new Date()
      }
    });

    // Create default newsletter subscription
    await prisma.memberSubscription.create({
      data: {
        memberId: member.id,
        type: 'NEWSLETTER',
        status: newsletterOptIn !== false ? 'ACTIVE' : 'INACTIVE'
      }
    });

    // Record signup activity
    await prisma.memberActivity.create({
      data: {
        memberId: member.id,
        type: 'SIGNUP',
        description: 'Member signed up via website',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    console.log(`✅ New member signed up: ${firstName} ${lastName} (${email})`);

    // Send email notifications (non-blocking)
    try {
      console.log('📧 Attempting to send admin notification...');
      // Send admin notification
      await emailService.sendAdminNotification(member);
      console.log('📧 Admin notification sent successfully');
      
      console.log('📧 Attempting to send welcome email...');
      // Send welcome email to member
      await emailService.sendWelcomeEmail(member);
      console.log('📧 Welcome email sent successfully');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('❌ Error details:', emailError.message);
      // Don't fail the signup if emails fail
    }

    res.status(201).json({
      message: 'Member signed up successfully',
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        postcode: member.postcode,
        signupDate: member.signupDate
      }
    });

  } catch (error) {
    console.error('Member signup error:', error);
    res.status(500).json({
      error: 'Failed to sign up member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all members (admin only)
router.get('/', async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        postcode: true,
        status: true,
        memberType: true,
        signupDate: true,
        lastActivity: true,
        newsletterOptIn: true,
        _count: {
          select: {
            activities: true,
            subscriptions: true
          }
        }
      },
      orderBy: {
        signupDate: 'desc'
      }
    });

    res.json({
      members,
      total: members.length
    });

  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      error: 'Failed to retrieve members',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get member statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalMembers,
      activeMembers,
      thisMonthSignups,
      newsletterSubscribers
    ] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({
        where: {
          signupDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.memberSubscription.count({
        where: {
          type: 'NEWSLETTER',
          status: 'ACTIVE'
        }
      })
    ]);

    res.json({
      totalMembers,
      activeMembers,
      thisMonthSignups,
      newsletterSubscribers,
      inactiveMembers: totalMembers - activeMembers
    });

  } catch (error) {
    console.error('Get member stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve member statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        subscriptions: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        error: 'Member not found'
      });
    }

    res.json({ member });

  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({
      error: 'Failed to retrieve member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.email; // Email should be updated separately
    delete updateData.signupDate;
    delete updateData.createdAt;

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Member updated successfully',
      member
    });

  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      error: 'Failed to update member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Unsubscribe member from newsletter
router.post('/:id/unsubscribe', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { type: 'NEWSLETTER' }
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        error: 'Member not found'
      });
    }

    // Update member preferences
    await prisma.member.update({
      where: { id },
      data: {
        newsletterOptIn: false,
        updatedAt: new Date()
      }
    });

    // Update subscription status
    if (member.subscriptions.length > 0) {
      await prisma.memberSubscription.update({
        where: { id: member.subscriptions[0].id },
        data: {
          status: 'UNSUBSCRIBED',
          unsubscribedAt: new Date(),
          unsubscribeReason: reason || 'Member requested unsubscribe'
        }
      });
    }

    // Record activity
    await prisma.memberActivity.create({
      data: {
        memberId: id,
        type: 'UNSUBSCRIBE',
        description: 'Member unsubscribed from newsletter',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Member unsubscribed successfully'
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({
        error: 'Member not found'
      });
    }

    // Delete related records first
    await prisma.memberActivity.deleteMany({
      where: { memberId: id }
    });

    await prisma.memberSubscription.deleteMany({
      where: { memberId: id }
    });

    // Delete the member
    await prisma.member.delete({
      where: { id }
    });

    console.log(`🗑️ Member deleted: ${member.firstName} ${member.lastName} (${member.email})`);

    res.json({
      message: 'Member deleted successfully'
    });

  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      error: 'Failed to delete member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 