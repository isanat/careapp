import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';
import { generateId } from '@/lib/utils/id';

// Note: For production, you should use web-push library and VAPID keys
// This is a simplified version that stores subscriptions for later use
// To enable actual push, run: npm install web-push
// Generate VAPID keys: npx web-push generate-vapid-keys

// Get push subscription status
export async function GET() {
  // Return whether push is configured
  const pushEnabled = !!process.env.VAPID_PUBLIC_KEY;
  
  return NextResponse.json({
    pushEnabled,
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
    message: pushEnabled 
      ? 'Push notifications are enabled' 
      : 'Push notifications require VAPID keys configuration'
  });
}

// Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Store subscription in database via Notification table
    const subscriptionId = generateId("sub");
    const now = new Date().toISOString();
    const subscriptionJson = JSON.stringify(subscription);

    try {
      await db.execute({
        sql: `INSERT INTO Notification (id, userId, type, title, message, referenceType, referenceId, createdAt)
              VALUES (?, ?, 'push_subscription', 'Push Subscription', ?, 'subscription', ?, ?)`,
        args: [subscriptionId, session.user.id, subscriptionJson, subscription.endpoint, now]
      });
    } catch (e) {
      // If duplicate, ignore
      console.log('Subscription may already exist');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Inscrição de push registrada com sucesso' 
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Remove subscription
    await db.execute({
      sql: `DELETE FROM Notification WHERE userId = ? AND type = 'push_subscription' AND referenceId = ?`,
      args: [session.user.id, endpoint]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Inscrição removida com sucesso' 
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
