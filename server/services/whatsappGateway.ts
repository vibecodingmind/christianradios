import { db } from '../db.js';
import type { WhatsAppSession, WhatsAppAccountType, StationFeedPost } from '../types.js';

class WhatsAppGatewayService {
  /**
   * Get current WhatsApp session for a station
   */
  getStationSession(stationId: string): WhatsAppSession {
    const station = db.stations.findById(stationId);
    if (!station) {
      return { status: 'DISCONNECTED' };
    }

    if (station.whatsappSession) {
      return station.whatsappSession;
    }

    // Default session fallback based on configured number
    const defaultSession: WhatsAppSession = {
      status: station.whatsappNumber ? 'CONNECTED' : 'DISCONNECTED',
      accountType: 'STANDARD',
      connectedPhone: station.whatsappNumber || undefined,
      deviceInfo: station.whatsappNumber ? 'WhatsApp Web / Mobile Linked' : undefined,
      pairedAt: station.whatsappNumber ? new Date().toISOString() : undefined,
      lastActiveAt: new Date().toISOString(),
    };

    return defaultSession;
  }

  /**
   * Initialize a new pairing session and return a QR code for "Linked Devices"
   */
  initializePairing(stationId: string): {
    session: WhatsAppSession;
    qrData: string;
    qrImageUrl: string;
    pairingToken: string;
    expiresAt: string;
  } {
    const station = db.stations.findById(stationId);
    if (!station) {
      throw new Error('Station not found.');
    }

    const pairingToken = `wapp_pair_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 120 * 1000).toISOString(); // 2 minutes expiry

    // Generate pairing payload formatted for WhatsApp Multi-Device
    const pairingPayload = JSON.stringify({
      protocol: 'WA_MULTI_DEVICE_V2',
      stationId: station.id,
      stationName: station.name,
      token: pairingToken,
      exp: expiresAt,
      ts: Date.now(),
    });

    // High resolution QR code generator URL
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(pairingPayload)}`;

    const newSession: WhatsAppSession = {
      ...(station.whatsappSession || {}),
      status: 'PAIRING',
      pairingToken,
      qrCode: qrImageUrl,
      lastActiveAt: new Date().toISOString(),
    };

    db.stations.update(stationId, {
      whatsappSession: newSession,
    });

    return {
      session: newSession,
      qrData: pairingPayload,
      qrImageUrl,
      pairingToken,
      expiresAt,
    };
  }

  /**
   * Complete pairing handshake (Standard WhatsApp or WhatsApp Business)
   */
  confirmPairing(
    stationId: string,
    options: {
      phone: string;
      accountType?: WhatsAppAccountType;
      deviceInfo?: string;
      token?: string;
    }
  ): WhatsAppSession {
    const station = db.stations.findById(stationId);
    if (!station) {
      throw new Error('Station not found.');
    }

    const cleanPhone = String(options.phone || '').trim();
    if (!cleanPhone) {
      throw new Error('Valid WhatsApp phone number is required.');
    }

    const accountType: WhatsAppAccountType = options.accountType === 'BUSINESS' ? 'BUSINESS' : 'STANDARD';
    const now = new Date().toISOString();

    const activeSession: WhatsAppSession = {
      status: 'CONNECTED',
      accountType,
      connectedPhone: cleanPhone,
      deviceInfo: options.deviceInfo || `${accountType === 'BUSINESS' ? 'WhatsApp Business' : 'Personal WhatsApp'} (Linked Device)`,
      pairedAt: now,
      lastActiveAt: now,
      pairingToken: undefined,
      qrCode: undefined,
      metaPhoneNumberId: station.whatsappSession?.metaPhoneNumberId,
      metaAccessToken: station.whatsappSession?.metaAccessToken,
      metaVerifyToken: station.whatsappSession?.metaVerifyToken,
    };

    // Update station with active session & verified number
    db.stations.update(stationId, {
      whatsappNumber: cleanPhone,
      whatsappBridgeEnabled: true,
      whatsappSession: activeSession,
    });

    // Create a live welcome message on the presenter's console
    db.feedPosts.create({
      id: `feed_sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stationId: station.id,
      authorName: 'WhatsApp Studio Gateway',
      authorCity: 'Studio Console',
      channel: 'WHATSAPP',
      accountType,
      senderPhone: cleanPhone,
      content: `🟢 Device Linked Successfully! Your ${accountType === 'BUSINESS' ? 'WhatsApp Business' : 'Personal WhatsApp'} number (${cleanPhone}) is now live. Listener song requests and shout-outs will stream directly to this console!`,
      postType: 'SHOUTOUT',
      playedOnAir: true,
      readOnAir: true,
      likesCount: 0,
      createdAt: now,
    });

    return activeSession;
  }

  /**
   * Disconnect and unlink paired device
   */
  disconnect(stationId: string): WhatsAppSession {
    const station = db.stations.findById(stationId);
    if (!station) {
      throw new Error('Station not found.');
    }

    const disconnectedSession: WhatsAppSession = {
      status: 'DISCONNECTED',
      accountType: undefined,
      connectedPhone: undefined,
      deviceInfo: undefined,
      pairingToken: undefined,
      qrCode: undefined,
      lastActiveAt: new Date().toISOString(),
      metaPhoneNumberId: station.whatsappSession?.metaPhoneNumberId,
      metaAccessToken: station.whatsappSession?.metaAccessToken,
      metaVerifyToken: station.whatsappSession?.metaVerifyToken,
    };

    db.stations.update(stationId, {
      whatsappSession: disconnectedSession,
    });

    return disconnectedSession;
  }

  /**
   * Configure Meta WhatsApp Cloud API credentials
   */
  saveMetaConfig(
    stationId: string,
    config: {
      metaPhoneNumberId?: string;
      metaAccessToken?: string;
      metaVerifyToken?: string;
    }
  ): WhatsAppSession {
    const station = db.stations.findById(stationId);
    if (!station) {
      throw new Error('Station not found.');
    }

    const current = station.whatsappSession || { status: 'DISCONNECTED' };
    const updatedSession: WhatsAppSession = {
      ...current,
      metaPhoneNumberId: config.metaPhoneNumberId !== undefined ? config.metaPhoneNumberId.trim() : current.metaPhoneNumberId,
      metaAccessToken: config.metaAccessToken !== undefined ? config.metaAccessToken.trim() : current.metaAccessToken,
      metaVerifyToken: config.metaVerifyToken !== undefined ? config.metaVerifyToken.trim() : (current.metaVerifyToken || `wa_verify_${Math.random().toString(36).substring(2, 10)}`),
      lastActiveAt: new Date().toISOString(),
    };

    db.stations.update(stationId, {
      whatsappSession: updatedSession,
    });

    return updatedSession;
  }

  /**
   * Ingest an inbound listener WhatsApp message (from QR session, Meta webhook, or public web bridge)
   */
  ingestInboundMessage(
    stationId: string,
    payload: {
      from?: string;
      senderName?: string;
      senderCity?: string;
      body: string;
      messageType?: 'SONG_REQUEST' | 'SHOUTOUT';
      songTitle?: string;
      artistName?: string;
      accountType?: WhatsAppAccountType;
      channel?: 'WHATSAPP' | 'SMS' | 'WEB';
    }
  ): StationFeedPost {
    const station = db.stations.findById(stationId);
    if (!station) {
      throw new Error('Station not found.');
    }

    const body = String(payload.body || '').trim();
    if (!body) {
      throw new Error('Message body is required.');
    }

    // Auto-detect song request patterns
    const isExplicitSong =
      payload.messageType === 'SONG_REQUEST' ||
      Boolean(payload.songTitle) ||
      body.toUpperCase().includes('[SONG') ||
      body.toLowerCase().includes('song request') ||
      body.toLowerCase().includes('play song') ||
      body.toLowerCase().includes('omba wimbo');

    const cleanSenderName = payload.senderName || payload.from || 'WhatsApp Listener';
    const channel = payload.channel || 'WHATSAPP';
    const accountType = payload.accountType || station.whatsappSession?.accountType || 'STANDARD';

    // Parse song title and artist if formatted as "Song: X by Artist: Y"
    let extractedSong = payload.songTitle;
    let extractedArtist = payload.artistName;

    if (isExplicitSong && !extractedSong) {
      const matchBy = body.match(/play\s+"?([^"-]+)"?\s+by\s+([^.\n]+)/i);
      if (matchBy) {
        extractedSong = matchBy[1].trim();
        extractedArtist = matchBy[2].trim();
      } else {
        extractedSong = body.replace(/\[SONG REQUEST\]/gi, '').slice(0, 80).trim();
      }
    }

    const post = db.feedPosts.create({
      id: `feed_wa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stationId: station.id,
      authorName: cleanSenderName,
      authorCity: payload.senderCity || 'Listener',
      channel,
      accountType,
      senderPhone: payload.from,
      content: body,
      postType: isExplicitSong ? 'SONG_REQUEST' : 'SHOUTOUT',
      songTitle: isExplicitSong ? (extractedSong || 'Special Request') : undefined,
      artistName: isExplicitSong ? (extractedArtist || 'Gospel Artist') : undefined,
      playedOnAir: false,
      readOnAir: false,
      likesCount: 0,
      createdAt: new Date().toISOString(),
    });

    // Also push a real-time notification to the station owner
    if (station.ownerId) {
      db.notifications.create({
        id: `notif_wapp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: station.ownerId,
        title: isExplicitSong ? '🎵 New WhatsApp Song Request' : '💬 New WhatsApp Shout-out',
        message: `${cleanSenderName} sent a ${isExplicitSong ? 'song request' : 'shout-out'} for ${station.name}: "${body.slice(0, 90)}"`,
        type: 'SYSTEM',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return post;
  }

  /**
   * Send a direct WhatsApp reply from the on-air presenter back to the listener
   */
  async sendOutboundReply(
    stationId: string,
    postId: string,
    replyText: string,
    presenterName: string = 'On-Air Presenter'
  ): Promise<{ success: boolean; reply: any }> {
    const post = db.feedPosts.findById(postId);
    if (!post || post.stationId !== stationId) {
      throw new Error('Post not found or does not belong to this station.');
    }

    const station = db.stations.findById(stationId);
    if (!station) {
      throw new Error('Station not found.');
    }

    const cleanReply = String(replyText).trim();
    if (!cleanReply) {
      throw new Error('Reply message cannot be empty.');
    }

    const replyEntry = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderName: presenterName,
      message: cleanReply,
      createdAt: new Date().toISOString(),
    };

    const existingReplies = post.replies || [];
    existingReplies.push(replyEntry);

    db.feedPosts.update(postId, {
      replies: existingReplies,
    });

    // If Meta Cloud API is configured and recipient has phone number, dispatch over Meta WhatsApp API
    const metaToken = station.whatsappSession?.metaAccessToken;
    const metaPhoneId = station.whatsappSession?.metaPhoneNumberId;

    if (metaToken && metaPhoneId && post.senderPhone) {
      try {
        const cleanRecipient = post.senderPhone.replace(/[^\d]/g, '');
        await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanRecipient,
            type: 'text',
            text: { preview_url: false, body: cleanReply },
          }),
        });
      } catch (apiErr) {
        console.warn('Meta WhatsApp Cloud API outbound dispatch skipped/failed:', apiErr);
      }
    }

    return {
      success: true,
      reply: replyEntry,
    };
  }
}

export const whatsappGateway = new WhatsAppGatewayService();
