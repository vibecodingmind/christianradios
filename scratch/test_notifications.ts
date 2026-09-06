import { db } from '../server/db.js';
import { signSessionToken } from '../server/auth.js';

async function runNotificationTests() {
  console.log('=== STARTING NOTIFICATION SYSTEM AUTOMATED TESTS ===\n');

  // Test 1: Direct DB Engine Tests
  console.log('Test 1: Testing db.notifications engine methods...');
  const testUserId = `usr_test_${Date.now()}`;

  // Verify initial unread count is 0
  const initialUnread = db.notifications.getUnreadCount(testUserId);
  if (initialUnread !== 0) throw new Error(`Expected 0 unread, got ${initialUnread}`);

  // Create 3 notifications
  const n1 = db.notifications.create({
    id: `notif_t1_${Date.now()}`,
    userId: testUserId,
    title: 'Song Request Received',
    message: 'Listener requested song',
    type: 'SONG_REQUEST',
    read: false,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    actionUrl: '/owner',
  });

  const n2 = db.notifications.create({
    id: `notif_t2_${Date.now()}`,
    userId: testUserId,
    title: 'Someone Prayed For You',
    message: 'Brother John prayed',
    type: 'PRAYER_REQUEST',
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/prayer-wall',
  });

  const n3 = db.notifications.create({
    id: `notif_t3_${Date.now()}`,
    userId: testUserId,
    title: 'Payment Successful',
    message: 'Subscription renewed',
    type: 'PAYMENT_SUCCESS',
    read: true,
    createdAt: new Date(Date.now() - 120000).toISOString(),
  });

  const countAfterCreate = db.notifications.getUnreadCount(testUserId);
  console.log(`✓ Unread count after 2 unread + 1 read: ${countAfterCreate} (expected: 2)`);
  if (countAfterCreate !== 2) throw new Error(`Expected 2 unread, got ${countAfterCreate}`);

  // Test filter
  const songNotifs = db.notifications.getByUserId(testUserId, { type: 'SONG_REQUEST' });
  console.log(`✓ Filter by SONG_REQUEST: found ${songNotifs.length} items`);
  if (songNotifs.length !== 1 || songNotifs[0].id !== n1.id) {
    throw new Error('Filter by SONG_REQUEST failed');
  }

  // Test markRead
  const markRes = db.notifications.markRead(n1.id, testUserId);
  console.log(`✓ Mark notification ${n1.id} as read: ${markRes}`);
  const countAfterMarkOne = db.notifications.getUnreadCount(testUserId);
  if (countAfterMarkOne !== 1) throw new Error(`Expected 1 unread, got ${countAfterMarkOne}`);

  // Test markAllRead
  const markedCount = db.notifications.markAllRead(testUserId);
  console.log(`✓ Mark all read returned count: ${markedCount}`);
  const countAfterMarkAll = db.notifications.getUnreadCount(testUserId);
  if (countAfterMarkAll !== 0) throw new Error(`Expected 0 unread, got ${countAfterMarkAll}`);

  // Test delete single
  const delRes = db.notifications.delete(n3.id, testUserId);
  console.log(`✓ Delete notification ${n3.id}: ${delRes}`);
  const remaining = db.notifications.getByUserId(testUserId);
  if (remaining.length !== 2) throw new Error(`Expected 2 remaining, got ${remaining.length}`);

  // Test clearAll
  const clearCount = db.notifications.clearAll(testUserId);
  console.log(`✓ Clear all returned count: ${clearCount}`);
  const afterClear = db.notifications.getByUserId(testUserId);
  if (afterClear.length !== 0) throw new Error(`Expected 0 after clearAll, got ${afterClear.length}`);

  console.log('\nTest 2: Testing notificationsRouter handlers directly in-memory...');
  const testUser = db.users.findByEmail('listener@christianradios.org') || db.users.getAll()[0];
  if (!testUser) throw new Error('No user found in database');

  const { notificationsRouter } = await import('../server/routes/notifications.js');

  // Helper to simulate request/response
  function createMockReqRes(method: string, path: string, params: any = {}, query: any = {}, body: any = {}) {
    let statusCode = 200;
    let responseData: any = null;

    const req: any = {
      method,
      path,
      params,
      query,
      body,
      headers: {},
      user: testUser,
    };

    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      },
    };

    return { req, res, getStatus: () => statusCode, getData: () => responseData };
  }

  // Create test notification
  const httpNotif = db.notifications.create({
    id: `notif_mem_${Date.now()}`,
    userId: testUser.id,
    title: 'In-Memory API Test Notification',
    message: 'Testing router directly',
    type: 'SYSTEM',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Test GET /
  const getMock = createMockReqRes('GET', '/');
  // Find matching layer in router
  const getHandler = notificationsRouter.stack.find(
    (layer: any) => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  if (!getHandler) throw new Error('GET / route not found in notificationsRouter');
  // Execute route handler (last in stack is the handler after requireAuth)
  const dummyNext = () => {};
  const getFn = getHandler.route.stack[getHandler.route.stack.length - 1].handle;
  getFn(getMock.req, getMock.res, dummyNext);
  console.log(`✓ GET / status: ${getMock.getStatus()}, total: ${getMock.getData()?.total}`);
  if (!getMock.getData()?.success) throw new Error('GET / handler failed');

  // Test GET /unread-count
  const unreadMock = createMockReqRes('GET', '/unread-count');
  const unreadHandler = notificationsRouter.stack.find(
    (layer: any) => layer.route && layer.route.path === '/unread-count' && layer.route.methods.get
  );
  const unreadFn = unreadHandler.route.stack[unreadHandler.route.stack.length - 1].handle;
  unreadFn(unreadMock.req, unreadMock.res, dummyNext);
  console.log(`✓ GET /unread-count status: ${unreadMock.getStatus()}, unreadCount: ${unreadMock.getData()?.unreadCount}`);
  if (!unreadMock.getData()?.success) throw new Error('GET /unread-count handler failed');

  // Test POST /:id/read
  const readMock = createMockReqRes('POST', `/${httpNotif.id}/read`, { id: httpNotif.id });
  const readHandler = notificationsRouter.stack.find(
    (layer: any) => layer.route && layer.route.path === '/:id/read' && layer.route.methods.post
  );
  const readFn = readHandler.route.stack[readHandler.route.stack.length - 1].handle;
  readFn(readMock.req, readMock.res, dummyNext);
  console.log(`✓ POST /:id/read status: ${readMock.getStatus()}, success: ${readMock.getData()?.success}`);
  if (!readMock.getData()?.success) throw new Error('POST /:id/read handler failed');

  // Test POST /mark-all-read
  const markAllMock = createMockReqRes('POST', '/mark-all-read');
  const markAllHandler = notificationsRouter.stack.find(
    (layer: any) => layer.route && layer.route.path === '/mark-all-read' && layer.route.methods.post
  );
  const markAllFn = markAllHandler.route.stack[markAllHandler.route.stack.length - 1].handle;
  markAllFn(markAllMock.req, markAllMock.res, dummyNext);
  console.log(`✓ POST /mark-all-read status: ${markAllMock.getStatus()}, markedCount: ${markAllMock.getData()?.markedCount}`);
  if (!markAllMock.getData()?.success) throw new Error('POST /mark-all-read handler failed');

  // Test DELETE /:id
  const delMock = createMockReqRes('DELETE', `/${httpNotif.id}`, { id: httpNotif.id });
  const delHandler = notificationsRouter.stack.find(
    (layer: any) => layer.route && layer.route.path === '/:id' && layer.route.methods.delete
  );
  const delFn = delHandler.route.stack[delHandler.route.stack.length - 1].handle;
  delFn(delMock.req, delMock.res, dummyNext);
  console.log(`✓ DELETE /:id status: ${delMock.getStatus()}, success: ${delMock.getData()?.success}`);
  if (!delMock.getData()?.success) throw new Error('DELETE /:id handler failed');

  console.log('\n=== ALL NOTIFICATION SYSTEM TESTS PASSED SUCCESSFULLY! ===');
}

runNotificationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
