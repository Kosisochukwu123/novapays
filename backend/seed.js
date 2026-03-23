import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const existing = await User.findOne({ email: 'admin@novapay.com' });
if (existing) {
  console.log('Admin already exists');
} else {
  await User.create({
    fullName: 'Super Admin',
    email:    'admin@novapay.com',
    phone:    '+1 000 0000',
    password: 'Admin@12345',
    role:     'admin',
    status:   'active',
    balance:  0,
  });
  console.log('✅ Admin created — admin@novapay.com / Admin@12345');
}

await mongoose.disconnect();