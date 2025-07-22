import express from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Database setup endpoint
router.post('/database', async (req, res) => {
  try {
    console.log('Starting database setup...');
    
    // Run Prisma migrations
    console.log('Running Prisma migrations...');
    await execAsync('npx prisma migrate deploy');
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    await execAsync('npx prisma generate');
    
    // Seed the database
    console.log('Seeding database...');
    await execAsync('npx ts-node prisma/seed.ts');
    
    console.log('Database setup completed successfully');
    res.json({ 
      message: 'Database setup completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    res.status(500).json({ 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 