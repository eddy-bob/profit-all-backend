import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

export const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not found in environment variables');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });

      await admin.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}; 