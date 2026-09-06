import pg from 'pg';
import type { DatabaseSchema } from './db.js';

const { Pool } = pg;

export class PgDatabaseSync {
  private pool: pg.Pool | null = null;
  private isConnected = false;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      console.log('[PostgreSQL] DATABASE_URL detected. Initializing PostgreSQL pool...');
      this.pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' || connectionString.includes('railway')
          ? { rejectUnauthorized: false }
          : false,
      });

      this.pool.on('error', (err) => {
        console.error('[PostgreSQL] Unexpected pool error:', err);
      });
    } else {
      console.log('[PostgreSQL] No DATABASE_URL provided. Running in JSON persistence mode.');
    }
  }

  public async initSchemaAndSync(data: DatabaseSchema): Promise<void> {
    if (!this.pool) return;

    try {
      const client = await this.pool.connect();
      try {
        console.log('[PostgreSQL] Creating database tables if not existing...');

        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            name TEXT,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'LISTENER',
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            email_verified BOOLEAN DEFAULT FALSE,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            icon_name TEXT DEFAULT 'Radio',
            description TEXT,
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE
          );

          CREATE TABLE IF NOT EXISTS countries (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            flag_emoji TEXT,
            continent TEXT,
            is_featured BOOLEAN DEFAULT FALSE
          );

          CREATE TABLE IF NOT EXISTS stations (
            id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            tagline TEXT,
            description TEXT,
            logo_url TEXT NOT NULL,
            cover_url TEXT,
            country_code TEXT NOT NULL,
            region TEXT,
            city TEXT NOT NULL,
            language TEXT NOT NULL,
            genre TEXT NOT NULL,
            category_id TEXT NOT NULL,
            denomination TEXT,
            website_url TEXT,
            email TEXT,
            phone TEXT,
            stream_url TEXT NOT NULL,
            backup_stream_url TEXT,
            stream_type TEXT DEFAULT 'MP3',
            bitrate_kbps INT DEFAULT 128,
            timezone TEXT DEFAULT 'Africa/Dar_es_Salaam',
            status TEXT DEFAULT 'ACTIVE',
            verification_status TEXT DEFAULT 'VERIFIED',
            claim_status TEXT DEFAULT 'CLAIMED',
            is_featured BOOLEAN DEFAULT FALSE,
            stream_status TEXT DEFAULT 'ONLINE',
            play_count INT DEFAULT 0,
            favorite_count INT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS platform_settings (
            id INT PRIMARY KEY DEFAULT 1,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            action_url TEXT,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);

        this.isConnected = true;
        console.log('[PostgreSQL] Tables verified. Starting initial data sync...');

        // Sync Countries
        if (Array.isArray(data.countries) && data.countries.length > 0) {
          for (const c of data.countries) {
            await client.query(
              `INSERT INTO countries (code, name, flag_emoji, continent, is_featured)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (code) DO UPDATE SET name = $2, flag_emoji = $3, continent = $4, is_featured = $5;`,
              [c.code, c.name, c.flagEmoji || '', c.continent || '', !!c.isFeatured]
            );
          }
        }

        // Sync Categories
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          for (const cat of data.categories) {
            await client.query(
              `INSERT INTO categories (id, name, slug, icon_name, description, display_order, is_active)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3, icon_name = $4, description = $5, display_order = $6, is_active = $7;`,
              [cat.id, cat.name, cat.slug, cat.iconName || 'Radio', cat.description || '', cat.displayOrder || 0, cat.isActive !== false]
            );
          }
        }

        // Sync Users
        if (Array.isArray(data.users) && data.users.length > 0) {
          for (const u of data.users) {
            await client.query(
              `INSERT INTO users (id, email, password_hash, name, phone, role, status, email_verified, avatar_url, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (id) DO UPDATE SET email = $2, password_hash = $3, name = $4, phone = $5, role = $6, status = $7, email_verified = $8, avatar_url = $9, updated_at = $11;`,
              [
                u.id,
                u.email,
                u.passwordHash,
                u.name || u.fullName || '',
                u.phone || '',
                u.role || 'LISTENER',
                u.status || 'ACTIVE',
                !!u.emailVerified,
                u.avatarUrl || '',
                u.createdAt ? new Date(u.createdAt) : new Date(),
                u.updatedAt ? new Date(u.updatedAt) : new Date(),
              ]
            );
          }
        }

        // Sync Stations (all 1062 stations)
        if (Array.isArray(data.stations) && data.stations.length > 0) {
          console.log(`[PostgreSQL] Syncing ${data.stations.length} stations to PostgreSQL...`);
          for (const s of data.stations) {
            try {
              await client.query(
                `INSERT INTO stations (
                  id, owner_id, name, slug, tagline, description, logo_url, cover_url,
                  country_code, region, city, language, genre, category_id, denomination,
                  website_url, email, phone, stream_url, backup_stream_url, stream_type,
                  bitrate_kbps, timezone, status, verification_status, claim_status,
                  is_featured, stream_status, play_count, favorite_count, created_at, updated_at
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
                ) ON CONFLICT (id) DO NOTHING;`,
                [
                  s.id,
                  s.ownerId || 'usr_owner_01',
                  s.name,
                  s.slug,
                  s.tagline || '',
                  s.description || '',
                  s.logoUrl || '',
                  s.coverUrl || '',
                  s.countryCode || 'TZ',
                  s.region || '',
                  s.city || '',
                  s.language || 'English',
                  s.genre || 'Gospel',
                  s.categoryId || 'cat_gospel',
                  s.denomination || '',
                  s.websiteUrl || '',
                  s.email || '',
                  s.phone || '',
                  s.streamUrl,
                  s.backupStreamUrl || '',
                  s.streamType || 'MP3',
                  s.bitrateKbps || 128,
                  s.timezone || 'UTC',
                  s.status || 'ACTIVE',
                  s.verificationStatus || 'VERIFIED',
                  s.claimStatus || 'CLAIMED',
                  !!s.isFeatured,
                  s.streamStatus || 'ONLINE',
                  s.playCount || 0,
                  s.favoriteCount || 0,
                  s.createdAt ? new Date(s.createdAt) : new Date(),
                  s.updatedAt ? new Date(s.updatedAt) : new Date(),
                ]
              );
            } catch (err) {
              // Ignore individual row conflict or format errors
            }
          }
        }

        // Sync Settings
        if (data.settings) {
          await client.query(
            `INSERT INTO platform_settings (id, data, updated_at) VALUES (1, $1, NOW())
             ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW();`,
            [JSON.stringify(data.settings)]
          );
        }

        console.log('[PostgreSQL] Initial sync completed successfully!');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[PostgreSQL] Schema init or sync error:', err);
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const pgSync = new PgDatabaseSync();
