import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../utils/database';
import { User } from '../../../models/User';
import { validateTelegramInitData } from '../../../middleware/telegramAuth'; // Use correct import

interface RegisterRequestBody {
  user: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  initData: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { user, initData } = req.body as RegisterRequestBody;

    // Validate Telegram init data more strictly
    if (!initData || !validateTelegramInitData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    if (!user || !user.id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    try {
      let existingUser = await User.findOne({ telegramId: user.id });

      if (!existingUser) {
        existingUser = new User({
          telegramId: user.id,
          username: user.username || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          coins: 1000,
          level: 1,
          experience: 0,
          referralCode: generateReferralCode(),
          referrals: 0,
          lastActive: new Date(),
        });

        await existingUser.save();

        return res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: existingUser.telegramId,
            username: existingUser.username,
            coins: existingUser.coins,
            level: existingUser.level,
            referralCode: existingUser.referralCode,
          },
        });
      }

      existingUser.lastActive = new Date();
      await existingUser.save();

      return res.status(200).json({
        message: 'User retrieved successfully',
        user: {
          id: existingUser.telegramId,
          username: existingUser.username,
          coins: existingUser.coins,
          level: existingUser.level,
          referralCode: existingUser.referralCode,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Database error', details: dbError });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function generateReferralCode(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2)
    .toUpperCase();
}
