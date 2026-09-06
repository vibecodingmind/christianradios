import pg from 'pg';
import fs from 'fs';
import path from 'path';
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
        ssl:
          process.env.NODE_ENV === 'production' || connectionString.includes('railway')
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

  public getPool(): pg.Pool | null {
    return this.pool;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public async initSchemaAndSync(data: DatabaseSchema): Promise<void> {
    if (!this.pool) return;

    try {
      const client = await this.pool.connect();
      try {
        console.log('[PostgreSQL] Running migrations & creating relational tables...');

        const candidatePaths = [
          path.join(process.cwd(), 'server', 'migrations', '001_initial_schema.sql'),
          path.join(process.cwd(), 'dist', 'server', 'migrations', '001_initial_schema.sql'),
          typeof __dirname !== 'undefined' ? path.join(__dirname, 'migrations', '001_initial_schema.sql') : '',
          typeof __dirname !== 'undefined' ? path.join(__dirname, '..', 'server', 'migrations', '001_initial_schema.sql') : '',
        ].filter(Boolean);

        const migrationFile = candidatePaths.find((p) => fs.existsSync(p));
        if (migrationFile) {
          const sql = fs.readFileSync(migrationFile, 'utf-8');
          await client.query(sql);
        }

        this.isConnected = true;
        console.log('[PostgreSQL] Relational tables verified. Synchronizing initial seed...');

        // 1. Countries
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

        // 2. Categories
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

        // 3. Users
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
                u.name || (u as any).fullName || '',
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

        // 4. Subscription Plans
        if (Array.isArray(data.plans) && data.plans.length > 0) {
          for (const p of data.plans) {
            await client.query(
              `INSERT INTO subscription_plans (id, name, tier, price_tzs, price_usd, features, max_stations, bitrate_cap_kbps, is_active)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (id) DO UPDATE SET name = $2, tier = $3, price_tzs = $4, price_usd = $5, features = $6, max_stations = $7, bitrate_cap_kbps = $8, is_active = $9;`,
              [
                p.id,
                p.name,
                p.tier,
                (p as any).priceTzs || p.monthlyPriceTzs || 0,
                (p as any).priceUsd || p.monthlyPriceUsd || 0,
                JSON.stringify(p.featuresList || (p as any).features || []),
                p.maxStations || 1,
                (p as any).bitrateCapKbps || 128,
                p.isActive !== false,
              ]
            );
          }
        }

        // 5. Stations
        if (Array.isArray(data.stations) && data.stations.length > 0) {
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
                ) ON CONFLICT (id) DO UPDATE SET
                  name = $3,
                  slug = $4,
                  tagline = $5,
                  description = $6,
                  logo_url = $7,
                  stream_url = $19,
                  status = $24,
                  stream_status = $28;`,
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
            } catch {
              // Ignore conflicts
            }
          }
        }

        // 6. Platform Settings
        if (data.settings) {
          await client.query(
            `INSERT INTO platform_settings (id, data, updated_at) VALUES (1, $1, NOW())
             ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW();`,
            [JSON.stringify(data.settings)]
          );
        }

        console.log('[PostgreSQL] Initial synchronization verified successfully!');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[PostgreSQL] Schema initialization or synchronization error:', err);
    }
  }
}

export const pgSync = new PgDatabaseSync();
